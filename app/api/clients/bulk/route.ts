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
        for (const client of clients) {
          if (client.pipelineStage === body.pipelineStage) continue;

          const { score, status } = computeHealthScore({
            lastContactAt: client.lastContactAt,
            pipelineStage: body.pipelineStage,
            dealValue: client.dealValue,
            createdAt: client.createdAt,
          });

          await prisma.client.update({
            where: { id: client.id },
            data: { pipelineStage: body.pipelineStage, healthScore: score, healthStatus: status },
          });

          await prisma.clientActivity.create({
            data: {
              clientId: client.id,
              type: "stage_change",
              content: `Bulk moved from ${client.pipelineStage} to ${body.pipelineStage}`,
              metadata: { from: client.pipelineStage, to: body.pipelineStage, bulk: true },
              createdBy: user.id,
            },
          });
          affected++;
        }
        break;
      }

      case "add_tags": {
        if (!body.tags?.length) {
          return NextResponse.json({ ok: false, error: "tags are required" }, { status: 400 });
        }
        for (const client of clients) {
          const existingTags = (client.tags as string[]) ?? [];
          const newTags = [...new Set([...existingTags, ...body.tags])];
          if (newTags.length !== existingTags.length) {
            await prisma.client.update({ where: { id: client.id }, data: { tags: newTags } });
            affected++;
          }
        }
        break;
      }

      case "remove_tags": {
        if (!body.tags?.length) {
          return NextResponse.json({ ok: false, error: "tags are required" }, { status: 400 });
        }
        const tagsToRemove = new Set(body.tags);
        for (const client of clients) {
          const existingTags = (client.tags as string[]) ?? [];
          const newTags = existingTags.filter(t => !tagsToRemove.has(t));
          if (newTags.length !== existingTags.length) {
            await prisma.client.update({ where: { id: client.id }, data: { tags: newTags } });
            affected++;
          }
        }
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
        for (const client of clients) {
          const { score, status } = computeHealthScore({
            lastContactAt: client.lastContactAt,
            pipelineStage: client.pipelineStage,
            dealValue: client.dealValue,
            createdAt: client.createdAt,
          });
          if (score !== client.healthScore || status !== client.healthStatus) {
            await prisma.client.update({
              where: { id: client.id },
              data: { healthScore: score, healthStatus: status },
            });
            affected++;
          }
        }
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
