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
        const toMove = clients.filter(c => c.pipelineStage !== body.pipelineStage);
        if (toMove.length > 0) {
          // Health scores differ per client — compute and batch via transaction
          const updates = toMove.map(client => {
            const { score, status } = computeHealthScore({
              lastContactAt: client.lastContactAt,
              pipelineStage: body.pipelineStage as string,
              dealValue: client.dealValue,
              createdAt: client.createdAt,
            });
            return prisma.client.updateMany({
              where: { id: client.id, userId: user.id },
              data: { pipelineStage: body.pipelineStage as string, healthScore: score, healthStatus: status },
            });
          });
          const activityInserts = toMove.map(client =>
            prisma.clientActivity.create({
              data: {
                clientId: client.id,
                type: "stage_change",
                content: `Bulk moved from ${client.pipelineStage} to ${body.pipelineStage}`,
                metadata: { from: client.pipelineStage, to: body.pipelineStage, bulk: true },
                createdBy: user.id,
              },
            })
          );
          await prisma.$transaction([...updates, ...activityInserts]);
          affected = toMove.length;
        }
        break;
      }

      case "add_tags": {
        if (!body.tags?.length) {
          return NextResponse.json({ ok: false, error: "tags are required" }, { status: 400 });
        }
        const tagUpdates = clients
          .map(client => {
            const existingTags = (client.tags as string[]) ?? [];
            const newTags = [...new Set([...existingTags, ...body.tags!])];
            if (newTags.length === existingTags.length) return null;
            return prisma.client.updateMany({ where: { id: client.id, userId: user.id }, data: { tags: newTags } });
          })
          .filter(Boolean);
        if (tagUpdates.length > 0) {
          await prisma.$transaction(tagUpdates as Parameters<typeof prisma.$transaction>[0]);
          affected = tagUpdates.length;
        }
        break;
      }

      case "remove_tags": {
        if (!body.tags?.length) {
          return NextResponse.json({ ok: false, error: "tags are required" }, { status: 400 });
        }
        const tagsToRemove = new Set(body.tags);
        const removeUpdates = clients
          .map(client => {
            const existingTags = (client.tags as string[]) ?? [];
            const newTags = existingTags.filter(t => !tagsToRemove.has(t));
            if (newTags.length === existingTags.length) return null;
            return prisma.client.updateMany({ where: { id: client.id, userId: user.id }, data: { tags: newTags } });
          })
          .filter(Boolean);
        if (removeUpdates.length > 0) {
          await prisma.$transaction(removeUpdates as Parameters<typeof prisma.$transaction>[0]);
          affected = removeUpdates.length;
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
        const healthUpdates = clients
          .map(client => {
            const { score, status } = computeHealthScore({
              lastContactAt: client.lastContactAt,
              pipelineStage: client.pipelineStage,
              dealValue: client.dealValue,
              createdAt: client.createdAt,
            });
            if (score === client.healthScore && status === client.healthStatus) return null;
            return prisma.client.updateMany({
              where: { id: client.id, userId: user.id },
              data: { healthScore: score, healthStatus: status },
            });
          })
          .filter(Boolean);
        if (healthUpdates.length > 0) {
          await prisma.$transaction(healthUpdates as Parameters<typeof prisma.$transaction>[0]);
          affected = healthUpdates.length;
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
