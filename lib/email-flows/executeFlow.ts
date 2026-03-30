/**
 * Email flow execution engine.
 * Processes ReactFlow node graphs and sends emails in sequence.
 *
 * Node types supported:
 *   trigger  — entry point (does not send)
 *   email    — sends an email to the contact
 *   delay    — metadata only (future: schedule via queue)
 *   condition — branching (future: evaluate and pick path)
 *   tag      — add/remove tag on contact
 */

import { prisma } from "@/lib/prisma";
import { sendEmail, markdownToHtml } from "@/lib/email/send";

type FlowNode = {
  id: string;
  type?: string;
  data?: {
    label?: string;
    subject?: string;
    body?: string;
    previewText?: string;
    delayValue?: number;
    delayUnit?: "minutes" | "hours" | "days";
    tag?: string;
    tagAction?: "add" | "remove";
    condition?: string;
  };
};

type FlowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
};

type FlowContact = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

type FlowUser = {
  resendApiKey?: string | null;
  sendingFromEmail?: string | null;
  sendingFromName?: string | null;
};

export type FlowExecuteResult = {
  ok: boolean;
  emailsSent: number;
  errors: string[];
  stoppedAt?: string; // node id where we stopped (delay)
  resumeAfter?: Date;
  enrollmentId?: string;
};

/**
 * Build edge adjacency: source -> { default, yes, no } targets.
 */
function buildEdgeMap(edges: FlowEdge[]) {
  const map = new Map<string, { default?: string; yes?: string; no?: string }>();
  for (const e of edges) {
    const entry = map.get(e.source) ?? {};
    const handle = e.sourceHandle ?? "default";
    if (handle === "yes") entry.yes = e.target;
    else if (handle === "no") entry.no = e.target;
    else entry.default = e.target;
    map.set(e.source, entry);
  }
  return map;
}

/**
 * Evaluate a condition against a contact's tags.
 * Supported: "has_tag:<tag>", "no_tag:<tag>", or fallback to yes.
 */
function evaluateCondition(condition: string | undefined, contactTags: string[]): boolean {
  if (!condition) return true;
  const lower = condition.toLowerCase().trim();
  if (lower.startsWith("has_tag:")) {
    return contactTags.some((t) => t.toLowerCase() === lower.slice(8).trim());
  }
  if (lower.startsWith("no_tag:")) {
    return !contactTags.some((t) => t.toLowerCase() === lower.slice(7).trim());
  }
  return true;
}

/**
 * Personalize email content by replacing merge tags.
 */
function personalize(text: string, contact: FlowContact): string {
  return text
    .replace(/\{\{first_name\}\}/gi, contact.firstName ?? "there")
    .replace(/\{\{last_name\}\}/gi, contact.lastName ?? "")
    .replace(/\{\{email\}\}/gi, contact.email);
}

/**
 * Execute a flow for a single contact.
 * Walks the node graph, sends emails, updates tags, evaluates conditions,
 * and pauses at delay nodes. Returns when done or paused.
 */
export async function executeFlowForContact(
  flowId: string,
  contact: FlowContact,
  user: FlowUser,
  opts?: { resumeFromNode?: string; enrollmentId?: string }
): Promise<FlowExecuteResult> {
  const flow = await prisma.emailFlow.findUnique({ where: { id: flowId } });
  if (!flow) return { ok: false, emailsSent: 0, errors: ["Flow not found"] };
  if (flow.status !== "active") return { ok: false, emailsSent: 0, errors: ["Flow is not active"] };

  const nodes = (flow.nodes as FlowNode[]) ?? [];
  const edges = (flow.edges as FlowEdge[]) ?? [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const edgeMap = buildEdgeMap(edges);

  const triggerNode = nodes.find((n) => n.type === "trigger");
  if (!triggerNode) return { ok: false, emailsSent: 0, errors: ["No trigger node found in flow"] };

  let emailsSent = 0;
  const errors: string[] = [];
  let stoppedAt: string | undefined;
  let resumeAfter: Date | undefined;
  let enrollmentId = opts?.enrollmentId;
  const visited = new Set<string>();

  // If resuming from a delay node, start at the next node after it
  let currentId: string | undefined;
  if (opts?.resumeFromNode) {
    const next = edgeMap.get(opts.resumeFromNode);
    currentId = next?.default;
    if (!currentId) {
      return { ok: true, emailsSent: 0, errors: [], stoppedAt: undefined };
    }
  } else {
    currentId = triggerNode.id;
  }

  // Track contact tags in-memory so condition nodes see tag updates from earlier nodes
  let contactTags: string[] = [];
  if (flow.userId) {
    const dbContact = await prisma.emailContact.findFirst({
      where: { userId: flow.userId, email: contact.email },
      select: { tags: true },
    });
    contactTags = dbContact?.tags ?? [];
  }

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const node = nodeMap.get(currentId);
    if (!node) break;
    const type = node.type;

    if (type === "trigger") {
      const next = edgeMap.get(currentId);
      currentId = next?.default;
      continue;
    }

    if (type === "email") {
      const subject = personalize(node.data?.subject ?? node.data?.label ?? "(no subject)", contact);
      const bodyRaw = personalize(node.data?.body ?? "", contact);
      const html = markdownToHtml(bodyRaw) || `<p>${bodyRaw}</p>`;

      const result = await sendEmail({
        to: contact.email,
        subject,
        html,
        fromName: user.sendingFromName ?? "Himalaya",
        fromEmail: user.sendingFromEmail ?? undefined,
        apiKey: user.resendApiKey ?? undefined,
      });

      if (result.ok) {
        emailsSent++;
      } else {
        errors.push(`Node ${node.id}: ${result.error ?? "send failed"}`);
      }

      const next = edgeMap.get(currentId);
      currentId = next?.default;
      continue;
    }

    if (type === "tag") {
      const tag = node.data?.tag;
      const action = node.data?.tagAction ?? "add";
      if (tag && flow.userId) {
        const existing = await prisma.emailContact.findFirst({
          where: { userId: flow.userId, email: contact.email },
          select: { id: true, tags: true },
        });
        if (existing) {
          const newTags =
            action === "add"
              ? [...new Set([...existing.tags, tag])]
              : existing.tags.filter((t) => t !== tag);
          await prisma.emailContact.update({
            where: { id: existing.id },
            data: { tags: newTags },
          });
          contactTags = newTags;
        }
      }

      const next = edgeMap.get(currentId);
      currentId = next?.default;
      continue;
    }

    if (type === "condition") {
      const result = evaluateCondition(node.data?.condition, contactTags);
      const next = edgeMap.get(currentId);
      currentId = result ? (next?.yes ?? next?.default) : (next?.no ?? undefined);
      continue;
    }

    if (type === "delay") {
      // Compute when to resume
      const delayValue = node.data?.delayValue;
      const delayUnit = node.data?.delayUnit;
      let delayMs: number;

      if (delayValue && delayUnit) {
        const multiplier = delayUnit === "days" ? 86_400_000 : delayUnit === "hours" ? 3_600_000 : 60_000;
        delayMs = delayValue * multiplier;
      } else {
        // Parse from label like "Wait 45 minutes"
        const match = node.data?.label?.match(/(\d+)\s*(minute|hour|day)/i);
        if (match) {
          const unit = match[2].toLowerCase();
          const multiplier = unit.startsWith("day") ? 86_400_000 : unit.startsWith("hour") ? 3_600_000 : 60_000;
          delayMs = parseInt(match[1], 10) * multiplier;
        } else {
          delayMs = 3_600_000; // default 1 hour
        }
      }

      resumeAfter = new Date(Date.now() + delayMs);
      stoppedAt = node.id;

      // Upsert enrollment so the cron processor can resume this contact
      if (flow.userId) {
        const enrollment = await prisma.emailFlowEnrollment.upsert({
          where: { flowId_contactEmail: { flowId, contactEmail: contact.email } },
          create: {
            flowId,
            contactEmail: contact.email,
            userId: flow.userId,
            status: "paused",
            currentNodeId: node.id,
            resumeAfter,
            emailsSent,
          },
          update: {
            status: "paused",
            currentNodeId: node.id,
            resumeAfter,
            emailsSent: { increment: emailsSent },
          },
        });
        enrollmentId = enrollment.id;
      }

      break;
    }

    // Unknown node type — skip
    const next = edgeMap.get(currentId);
    currentId = next?.default;
  }

  // Update flow stats
  const isNewEnrollment = !opts?.resumeFromNode;
  await prisma.emailFlow.update({
    where: { id: flowId },
    data: {
      ...(isNewEnrollment ? { enrolled: { increment: 1 } } : {}),
      sent: { increment: emailsSent },
    },
  });

  // If we finished the graph without pausing, mark enrollment completed
  if (!stoppedAt && flow.userId) {
    await prisma.emailFlowEnrollment.upsert({
      where: { flowId_contactEmail: { flowId, contactEmail: contact.email } },
      create: {
        flowId,
        contactEmail: contact.email,
        userId: flow.userId,
        status: "completed",
        emailsSent,
      },
      update: {
        status: "completed",
        currentNodeId: null,
        resumeAfter: null,
        emailsSent: { increment: emailsSent },
      },
    }).catch(() => {}); // non-critical
  }

  return { ok: true, emailsSent, errors, stoppedAt, resumeAfter, enrollmentId };
}

/**
 * Trigger all active flows that match a given tag for a user's contact.
 * Called when a contact opts in to a form with matching tags.
 */
export async function triggerFlowsByTag(
  userId: string,
  contactEmail: string,
  tags: string[]
): Promise<{ flowsTriggered: number; emailsSent: number }> {
  if (!tags.length) return { flowsTriggered: 0, emailsSent: 0 };

  const flows = await prisma.emailFlow.findMany({
    where: {
      userId,
      status: "active",
      trigger: "signup",
    },
  });

  const contact = await prisma.emailContact.findFirst({
    where: { userId, email: contactEmail },
    select: { email: true, firstName: true, lastName: true },
  });

  if (!contact) return { flowsTriggered: 0, emailsSent: 0 };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { resendApiKey: true, sendingFromEmail: true, sendingFromName: true },
  });

  if (!user) return { flowsTriggered: 0, emailsSent: 0 };

  // Match flows whose tags overlap with contact tags, or flows with no tag filters
  const matchingFlows = flows.filter((f) => {
    const flowTags = f.tags ?? [];
    if (flowTags.length === 0) return true; // no filter = catch-all
    return tags.some((t) => flowTags.includes(t));
  });

  let flowsTriggered = 0;
  let totalEmailsSent = 0;

  for (const flow of matchingFlows) {
    try {
      const result = await executeFlowForContact(flow.id, contact, user);
      if (result.ok) {
        flowsTriggered++;
        totalEmailsSent += result.emailsSent;
      }
    } catch (err) {
      console.error(`triggerFlowsByTag flow ${flow.id}:`, err);
    }
  }

  return { flowsTriggered, emailsSent: totalEmailsSent };
}
