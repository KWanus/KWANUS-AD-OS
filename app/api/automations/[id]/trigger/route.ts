/**
 * POST /api/automations/[id]/trigger
 *
 * Manually trigger an automation to run.
 * Records the run and increments stats.
 *
 * For automations with email nodes, sends emails to the specified contacts.
 * Body: { contactIds?: string[]; email?: string; metadata?: Record<string,unknown> }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { sendEmail, markdownToHtml } from "@/lib/email/send";

type AutomationNode = {
  id: string;
  type?: string;
  data?: {
    label?: string;
    subject?: string;
    body?: string;
    delayValue?: number;
    delayUnit?: string;
    tag?: string;
    tagAction?: "add" | "remove";
  };
};

type AutomationEdge = {
  id: string;
  source: string;
  target: string;
};

function getNodeOrder(nodes: AutomationNode[], edges: AutomationEdge[], startId: string): AutomationNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const nextMap = new Map<string, string>();
  for (const e of edges) nextMap.set(e.source, e.target);

  const ordered: AutomationNode[] = [];
  const seen = new Set<string>();
  let cur = startId;
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    const n = nodeMap.get(cur);
    if (n) ordered.push(n);
    cur = nextMap.get(cur) ?? "";
  }
  return ordered;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const automation = await prisma.automation.findFirst({ where: { id, userId: user.id } });
    if (!automation) return NextResponse.json({ ok: false, error: "Automation not found" }, { status: 404 });

    if (automation.status !== "active" && automation.trigger !== "manual") {
      return NextResponse.json({ ok: false, error: "Automation is not active" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({})) as {
      contactIds?: string[];
      email?: string;
      metadata?: Record<string, unknown>;
    };

    const nodes = (automation.nodes as AutomationNode[]) ?? [];
    const edges = (automation.edges as AutomationEdge[]) ?? [];

    // Find start node (trigger or first node)
    const startNode = nodes.find((n) => n.type === "trigger") ?? nodes[0];
    if (!startNode) {
      await prisma.automation.update({
        where: { id },
        data: { runsTotal: { increment: 1 }, runsFailed: { increment: 1 }, lastRunAt: new Date() },
      });
      return NextResponse.json({ ok: false, error: "No nodes in automation" }, { status: 400 });
    }

    const ordered = getNodeOrder(nodes, edges, startNode.id);

    // Resolve contact list for email sends
    const contacts: { email: string; firstName: string | null; lastName: string | null }[] = [];
    if (body.contactIds?.length) {
      const found = await prisma.emailContact.findMany({
        where: { id: { in: body.contactIds }, userId: user.id },
        select: { email: true, firstName: true, lastName: true },
      });
      contacts.push(...found);
    } else if (body.email) {
      contacts.push({ email: body.email, firstName: null, lastName: null });
    }

    let emailsSent = 0;
    let stoppedAt: string | undefined;

    for (const node of ordered) {
      if (node.type === "trigger") continue;

      if (node.type === "email" && contacts.length > 0) {
        for (const contact of contacts) {
          const subject = (node.data?.subject ?? node.data?.label ?? "(no subject)")
            .replace(/\{\{first_name\}\}/gi, contact.firstName ?? "there")
            .replace(/\{\{email\}\}/gi, contact.email);

          const bodyRaw = (node.data?.body ?? "")
            .replace(/\{\{first_name\}\}/gi, contact.firstName ?? "there")
            .replace(/\{\{email\}\}/gi, contact.email);

          const html = markdownToHtml(bodyRaw) || `<p>${bodyRaw}</p>`;

          const result = await sendEmail({
            to: contact.email,
            subject,
            html,
            fromName: user.sendingFromName ?? "Himalaya",
            fromEmail: user.sendingFromEmail ?? undefined,
            apiKey: user.resendApiKey ?? undefined,
          });

          if (result.ok) emailsSent++;
        }
        continue;
      }

      if (node.type === "tag" && contacts.length > 0) {
        const tag = node.data?.tag;
        const action = node.data?.tagAction ?? "add";
        if (tag) {
          for (const contact of contacts) {
            const existing = await prisma.emailContact.findFirst({
              where: { userId: user.id, email: contact.email },
              select: { id: true, tags: true },
            });
            if (existing) {
              const newTags = action === "add"
                ? [...new Set([...existing.tags, tag])]
                : existing.tags.filter((t) => t !== tag);
              await prisma.emailContact.update({
                where: { id: existing.id },
                data: { tags: newTags },
              });
            }
          }
        }
        continue;
      }

      if (node.type === "delay" || node.type === "condition") {
        stoppedAt = node.id;
        break;
      }
    }

    // Update automation stats
    await prisma.automation.update({
      where: { id },
      data: {
        runsTotal: { increment: 1 },
        runsSuccess: { increment: 1 },
        lastRunAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      automationId: id,
      contactsProcessed: contacts.length,
      emailsSent,
      stoppedAt,
    });
  } catch (err) {
    console.error("Automation trigger error:", err);
    // Try to increment failed count
    const { id } = await params;
    await prisma.automation.update({
      where: { id },
      data: { runsTotal: { increment: 1 }, runsFailed: { increment: 1 }, lastRunAt: new Date() },
    }).catch(() => {});
    return NextResponse.json({ ok: false, error: "Failed to trigger automation" }, { status: 500 });
  }
}
