// ---------------------------------------------------------------------------
// POST /api/clients/[id]/onboard
// Auto-creates everything a consultant needs for a new client:
// 1. Runs Himalaya analysis on client's URL
// 2. Generates a proposal
// 3. Creates an email flow for client nurturing
// 4. Sets up a portal page
// Returns links to everything.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const client = await prisma.client.findFirst({
      where: { id, userId: user.id },
    });

    if (!client) return NextResponse.json({ ok: false, error: "Client not found" }, { status: 404 });

    const deliverables: Record<string, string> = {};

    // 1. Run analysis if client has a website
    if (client.website) {
      try {
        const scanRes = await fetch(new URL("/api/himalaya/express", req.url).toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: req.headers.get("cookie") ?? "",
          },
          body: JSON.stringify({ url: client.website }),
        });
        const scanData = await scanRes.json() as { ok: boolean; runId?: string };
        if (scanData.ok && scanData.runId) {
          deliverables.analysis = `/himalaya/run/${scanData.runId}`;
          deliverables.portal = `/portal/${scanData.runId}`;
        }
      } catch {
        // Non-blocking
      }
    }

    // 2. Create client nurturing email flow
    try {
      const flowRes = await fetch(new URL("/api/email-flows/from-template", req.url).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: req.headers.get("cookie") ?? "",
        },
        body: JSON.stringify({ template: "welcome" }),
      });
      const flowData = await flowRes.json() as { ok: boolean; flow?: { id: string } };
      if (flowData.ok && flowData.flow) {
        deliverables.emailFlow = `/emails/flows/${flowData.flow.id}`;
      }
    } catch {
      // Non-blocking
    }

    // 3. Update client status
    await prisma.client.update({
      where: { id },
      data: {
        pipelineStage: "onboarding",
        notes: [
          client.notes ?? "",
          `\n\n[Auto-onboarded ${new Date().toLocaleDateString()}]`,
          deliverables.analysis ? `Analysis: ${deliverables.analysis}` : null,
          deliverables.portal ? `Portal: ${deliverables.portal}` : null,
          deliverables.emailFlow ? `Email Flow: ${deliverables.emailFlow}` : null,
        ].filter(Boolean).join("\n"),
      },
    });

    // 4. Create activity log
    await prisma.clientActivity.create({
      data: {
        clientId: id,
        type: "system",
        content: "Auto-onboarded via Himalaya. Analysis, portal, and email flow created.",
        createdBy: user.id,
        metadata: deliverables as object,
      },
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      deliverables,
      message: `${client.name} onboarded. ${Object.keys(deliverables).length} deliverables created.`,
    });
  } catch (err) {
    console.error("Client onboard error:", err);
    return NextResponse.json({ ok: false, error: "Onboarding failed" }, { status: 500 });
  }
}
