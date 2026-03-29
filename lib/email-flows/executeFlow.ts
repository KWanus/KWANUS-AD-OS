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
  stoppedAt?: string; // node id where we stopped (delay/condition)
};

/**
 * Build an ordered list of nodes following the edge graph from a start node.
 */
function getOrderedNodes(nodes: FlowNode[], edges: FlowEdge[], startId: string): FlowNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const edgeMap = new Map<string, string[]>();
  for (const e of edges) {
    if (!edgeMap.has(e.source)) edgeMap.set(e.source, []);
    edgeMap.get(e.source)!.push(e.target);
  }

  const ordered: FlowNode[] = [];
  const visited = new Set<string>();
  let current = startId;

  while (current && !visited.has(current)) {
    visited.add(current);
    const node = nodeMap.get(current);
    if (node) ordered.push(node);
    const next = edgeMap.get(current)?.[0]; // follow first edge
    current = next ?? "";
  }

  return ordered;
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
 * Sends all email nodes in sequence until a delay or condition node is hit.
 * Returns when no more immediately-sendable nodes remain.
 */
export async function executeFlowForContact(
  flowId: string,
  contact: FlowContact,
  user: FlowUser
): Promise<FlowExecuteResult> {
  const flow = await prisma.emailFlow.findUnique({ where: { id: flowId } });
  if (!flow) return { ok: false, emailsSent: 0, errors: ["Flow not found"] };
  if (flow.status !== "active") return { ok: false, emailsSent: 0, errors: ["Flow is not active"] };

  const nodes = (flow.nodes as FlowNode[]) ?? [];
  const edges = (flow.edges as FlowEdge[]) ?? [];

  // Find trigger node(s)
  const triggerNode = nodes.find((n) => n.type === "trigger");
  if (!triggerNode) return { ok: false, emailsSent: 0, errors: ["No trigger node found in flow"] };

  const ordered = getOrderedNodes(nodes, edges, triggerNode.id);

  let emailsSent = 0;
  const errors: string[] = [];
  let stoppedAt: string | undefined;

  for (const node of ordered) {
    const type = node.type;

    if (type === "trigger") continue;

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
      continue;
    }

    if (type === "tag") {
      // Tag operations are fire-and-forget in sync mode; no email action
      continue;
    }

    if (type === "delay") {
      // Stop here — delay nodes require async scheduling
      stoppedAt = node.id;
      break;
    }

    if (type === "condition") {
      // Stop here — conditions require runtime evaluation
      stoppedAt = node.id;
      break;
    }
  }

  // Update flow stats
  await prisma.emailFlow.update({
    where: { id: flowId },
    data: {
      enrolled: { increment: 1 },
      sent: { increment: emailsSent },
    },
  });

  return { ok: true, emailsSent, errors, stoppedAt };
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
