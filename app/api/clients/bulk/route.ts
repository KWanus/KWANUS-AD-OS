import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { computeHealthScore } from "@/lib/clients/healthScore";

/**
 * POST /api/clients/bulk
 * Bulk operations on multiple clients.
 *
 * Actions:
 * - stage_change: Move multiple clients to a new pipeline stage
 * - add_tags: Add tags to multiple clients
 * - remove_tags: Remove tags from multiple clients
 * - delete: Delete multiple clients
 * - recalculate_health: Recalculate health scores
 */

type BulkAction = "stage_change" | "add_tags" | "remove_tags" | "delete" | "recalculate_health";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      action: BulkAction;
      clientIds: string[];
      pipelineStage?: string;
      tags?: string[];
    };

    if (!body.action || !body.clientIds?.length) {
      return NextResponse.json({ ok: false, error: "Action and clientIds are required" }, { status: 400 });
    }

    // Verify all clients belong to this user
    const clients = await prisma.client.findMany({
      where: { id: { in: body.clientIds }, userId: user.id },
      select: { id: true, name: true, pipelineStage: true, tags: true, lastContactAt: true, dealValue: true, createdAt: true, healthScore: true, healthStatus: true },
    });

    if (clients.length === 0) {
      return NextResponse.json({ ok: false, error: "No matching clients found" }, { status: 404 });
    }

    let affected = 0;

    switch (body.action) {
      case "stage_change": {
        if (!body.pipelineStage) {
          return NextResponse.json({ ok: false, error: "pipelineStage is required" }, { status: 400 });
        }
        // Batch all updates + activity logs in a single transaction
        const stageOps = clients
          .filter(c => c.pipelineStage !== body.pipelineStage)
          .flatMap(client => {
            const { score, status } = computeHealthScore({
              lastContactAt: client.lastContactAt,
              pipelineStage: body.pipelineStage!,
              dealValue: client.dealValue,
              createdAt: client.createdAt,
            });
            return [
              prisma.client.update({
                where: { id: client.id },
                data: { pipelineStage: body.pipelineStage!, healthScore: score, healthStatus: status },
              }),
              prisma.clientActivity.create({
                data: {
                  clientId: client.id,
                  type: "stage_change",
                  content: `Bulk moved from ${client.pipelineStage} to ${body.pipelineStage}`,
                  metadata: { from: client.pipelineStage, to: body.pipelineStage, bulk: true },
                  createdBy: user.id,
                },
              }),
            ];
          });
        if (stageOps.length > 0) await prisma.$transaction(stageOps);
        affected = stageOps.length / 2;
        break;
      }

      case "add_tags": {
        if (!body.tags?.length) {
          return NextResponse.json({ ok: false, error: "tags are required" }, { status: 400 });
        }
        const addOps = clients
          .filter(client => {
            const existing = (client.tags as string[]) ?? [];
            return body.tags!.some(t => !existing.includes(t));
          })
          .map(client => {
            const newTags = [...new Set([...(client.tags as string[] ?? []), ...body.tags!])];
            return prisma.client.update({ where: { id: client.id }, data: { tags: newTags } });
          });
        if (addOps.length > 0) await prisma.$transaction(addOps);
        affected = addOps.length;
        break;
      }

      case "remove_tags": {
        if (!body.tags?.length) {
          return NextResponse.json({ ok: false, error: "tags are required" }, { status: 400 });
        }
        const tagsToRemove = new Set(body.tags);
        const removeOps = clients
          .filter(client => {
            const existing = (client.tags as string[]) ?? [];
            return existing.some(t => tagsToRemove.has(t));
          })
          .map(client => {
            const newTags = ((client.tags as string[]) ?? []).filter(t => !tagsToRemove.has(t));
            return prisma.client.update({ where: { id: client.id }, data: { tags: newTags } });
          });
        if (removeOps.length > 0) await prisma.$transaction(removeOps);
        affected = removeOps.length;
        break;
      }

      case "delete": {
        await prisma.client.deleteMany({
          where: { id: { in: clients.map(c => c.id) }, userId: user.id },
        });
        affected = clients.length;
        break;
      }

      case "recalculate_health": {
        const healthOps = clients
          .map(client => {
            const { score, status } = computeHealthScore({
              lastContactAt: client.lastContactAt,
              pipelineStage: client.pipelineStage,
              dealValue: client.dealValue,
              createdAt: client.createdAt,
            });
            return { client, score, status };
          })
          .filter(({ client, score, status }) => score !== client.healthScore || status !== client.healthStatus)
          .map(({ client, score, status }) =>
            prisma.client.update({
              where: { id: client.id },
              data: { healthScore: score, healthStatus: status },
            })
          );
        if (healthOps.length > 0) await prisma.$transaction(healthOps);
        affected = healthOps.length;
        break;
      }

      default:
        return NextResponse.json({ ok: false, error: `Unknown action: ${body.action}` }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      action: body.action,
      total: clients.length,
      affected,
    });
  } catch (err) {
    console.error("Bulk client error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
