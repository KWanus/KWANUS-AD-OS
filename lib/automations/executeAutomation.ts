/**
 * Automation execution engine.
 *
 * Walks the node graph from the trigger, executes each node type,
 * tracks every step in AutomationRunStep, and pauses at delay nodes
 * by writing a resumeAfter timestamp so a cron job can pick it up.
 *
 * Condition nodes evaluate simple rules and follow the correct branch.
 */

import { prisma } from "@/lib/prisma";
import { sendEmail, markdownToHtml } from "@/lib/email/send";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AutomationNode = {
  id: string;
  type?: string;
  data?: {
    label?: string;
    subject?: string;
    body?: string;
    delayValue?: number;
    delayUnit?: "minutes" | "hours" | "days";
    tag?: string;
    tagAction?: "add" | "remove";
    condition?: string; // e.g. "has_tag:vip", "opened_email", "clicked"
    stats?: string;
  };
};

export type AutomationEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string; // "yes" | "no" for condition nodes
};

type Contact = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  tags?: string[];
};

type UserCreds = {
  resendApiKey?: string | null;
  sendingFromEmail?: string | null;
  sendingFromName?: string | null;
};

export type ExecuteResult = {
  ok: boolean;
  runId: string;
  emailsSent: number;
  stepsCompleted: number;
  errors: string[];
  status: "completed" | "paused" | "failed";
  stoppedAtNode?: string;
  resumeAfter?: Date;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build adjacency: source -> target(s) keyed by sourceHandle */
function buildEdgeMap(edges: AutomationEdge[]) {
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

function personalize(text: string, contact: Contact): string {
  return text
    .replace(/\{\{first_name\}\}/gi, contact.firstName ?? "there")
    .replace(/\{\{last_name\}\}/gi, contact.lastName ?? "")
    .replace(/\{\{email\}\}/gi, contact.email);
}

function computeResumeTime(value: number, unit: string): Date {
  const now = new Date();
  switch (unit) {
    case "minutes":
      return new Date(now.getTime() + value * 60_000);
    case "hours":
      return new Date(now.getTime() + value * 3_600_000);
    case "days":
      return new Date(now.getTime() + value * 86_400_000);
    default:
      // Fallback: treat as minutes
      return new Date(now.getTime() + value * 60_000);
  }
}

/** Parse delay from label like "Wait 45 minutes" if delayValue not set */
function parseDelayFromLabel(label?: string): { value: number; unit: string } {
  if (!label) return { value: 60, unit: "minutes" };
  const match = label.match(/(\d+)\s*(minute|hour|day)/i);
  if (match) {
    return { value: parseInt(match[1], 10), unit: match[2].toLowerCase() + "s" };
  }
  return { value: 60, unit: "minutes" };
}

/**
 * Evaluate a condition against a contact.
 * Returns true (yes branch) or false (no branch).
 *
 * Supported condition formats:
 *   "has_tag:<tag>"      — contact has the given tag
 *   "no_tag:<tag>"       — contact does NOT have the given tag
 *   "opened_email"       — placeholder, defaults true (future: check open tracking)
 *   "clicked"            — placeholder, defaults false (future: check click tracking)
 *   anything else        — defaults to true (yes branch)
 */
function evaluateCondition(condition: string | undefined, contact: Contact): boolean {
  if (!condition) return true;
  const lower = condition.toLowerCase().trim();

  if (lower.startsWith("has_tag:")) {
    const tag = lower.slice(8).trim();
    return (contact.tags ?? []).some((t) => t.toLowerCase() === tag);
  }
  if (lower.startsWith("no_tag:")) {
    const tag = lower.slice(7).trim();
    return !(contact.tags ?? []).some((t) => t.toLowerCase() === tag);
  }
  if (lower === "opened_email") return true; // Placeholder
  if (lower === "clicked") return false; // Placeholder — conservative default

  // For labels like "Clicked but did not purchase?" default to yes branch
  return true;
}

// ---------------------------------------------------------------------------
// Main execution
// ---------------------------------------------------------------------------

export async function executeAutomation(opts: {
  automationId: string;
  userId: string;
  contacts: Contact[];
  userCreds: UserCreds;
  trigger?: string;
  metadata?: Record<string, unknown>;
  /** If resuming a paused run, pass the run ID and starting node */
  resumeRunId?: string;
  resumeFromNode?: string;
}): Promise<ExecuteResult> {
  const {
    automationId,
    userId,
    contacts,
    userCreds,
    trigger = "manual",
    metadata,
    resumeRunId,
    resumeFromNode,
  } = opts;

  const automation = await prisma.automation.findFirst({
    where: { id: automationId, userId },
  });

  if (!automation) {
    return { ok: false, runId: "", emailsSent: 0, stepsCompleted: 0, errors: ["Automation not found"], status: "failed" };
  }

  const nodes = (automation.nodes as AutomationNode[]) ?? [];
  const edges = (automation.edges as AutomationEdge[]) ?? [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const edgeMap = buildEdgeMap(edges);

  // Create or resume a run record
  let run;
  if (resumeRunId) {
    run = await prisma.automationRun.findUnique({ where: { id: resumeRunId } });
    if (!run) {
      return { ok: false, runId: "", emailsSent: 0, stepsCompleted: 0, errors: ["Run not found"], status: "failed" };
    }
    await prisma.automationRun.update({
      where: { id: run.id },
      data: { status: "running", resumeAfter: null, stoppedAtNode: null },
    });
  } else {
    run = await prisma.automationRun.create({
      data: {
        automationId,
        userId,
        trigger,
        contactsCount: contacts.length,
        metadata: metadata as object ?? undefined,
        status: "running",
      },
    });
  }

  // Determine the start node
  let startNodeId: string;
  if (resumeFromNode) {
    // Resume: find the next node after the delay we paused at
    const nextEntry = edgeMap.get(resumeFromNode);
    startNodeId = nextEntry?.default ?? "";
    if (!startNodeId) {
      await prisma.automationRun.update({
        where: { id: run.id },
        data: { status: "completed", completedAt: new Date() },
      });
      return { ok: true, runId: run.id, emailsSent: 0, stepsCompleted: 0, errors: [], status: "completed" };
    }
  } else {
    const triggerNode = nodes.find((n) => n.type === "trigger");
    startNodeId = triggerNode?.id ?? nodes[0]?.id ?? "";
  }

  if (!startNodeId) {
    await prisma.automationRun.update({
      where: { id: run.id },
      data: { status: "failed", completedAt: new Date() },
    });
    return { ok: false, runId: run.id, emailsSent: 0, stepsCompleted: 0, errors: ["No start node"], status: "failed" };
  }

  let emailsSent = 0;
  let stepsCompleted = 0;
  const errors: string[] = [];
  let currentNodeId: string | undefined = startNodeId;
  const visited = new Set<string>();

  while (currentNodeId && !visited.has(currentNodeId)) {
    visited.add(currentNodeId);
    const node = nodeMap.get(currentNodeId);
    if (!node) break;

    const type = node.type ?? "unknown";

    // Skip trigger node
    if (type === "trigger") {
      const next = edgeMap.get(currentNodeId);
      currentNodeId = next?.default;
      continue;
    }

    // Record step start
    const step = await prisma.automationRunStep.create({
      data: { runId: run.id, nodeId: node.id, nodeType: type, status: "running", startedAt: new Date() },
    });

    try {
      // ---- EMAIL NODE ----
      if (type === "email") {
        let nodeSent = 0;
        for (const contact of contacts) {
          const subject = personalize(node.data?.subject ?? node.data?.label ?? "(no subject)", contact);
          const bodyRaw = personalize(node.data?.body ?? "", contact);
          const html = markdownToHtml(bodyRaw) || `<p>${bodyRaw}</p>`;

          const result = await sendEmail({
            to: contact.email,
            subject,
            html,
            fromName: userCreds.sendingFromName ?? "Himalaya",
            fromEmail: userCreds.sendingFromEmail ?? undefined,
            apiKey: userCreds.resendApiKey ?? undefined,
          });

          if (result.ok) {
            nodeSent++;
            emailsSent++;
          } else {
            errors.push(`Node ${node.id} → ${contact.email}: ${result.error ?? "send failed"}`);
          }
        }

        await prisma.automationRunStep.update({
          where: { id: step.id },
          data: {
            status: "completed",
            endedAt: new Date(),
            output: { emailsSent: nodeSent, contactsCount: contacts.length },
          },
        });
        stepsCompleted++;

        const next = edgeMap.get(currentNodeId);
        currentNodeId = next?.default;
        continue;
      }

      // ---- TAG NODE ----
      if (type === "tag") {
        const tag = node.data?.tag;
        const action = node.data?.tagAction ?? "add";
        if (tag) {
          for (const contact of contacts) {
            const existing = await prisma.emailContact.findFirst({
              where: { userId, email: contact.email },
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
              // Update in-memory contact tags for downstream condition evaluation
              contact.tags = newTags;
            }
          }
        }

        await prisma.automationRunStep.update({
          where: { id: step.id },
          data: { status: "completed", endedAt: new Date(), output: { tag, action, contacts: contacts.length } },
        });
        stepsCompleted++;

        const next = edgeMap.get(currentNodeId);
        currentNodeId = next?.default;
        continue;
      }

      // ---- DELAY NODE ----
      if (type === "delay") {
        const delayValue = node.data?.delayValue;
        const delayUnit = node.data?.delayUnit;
        let resumeAt: Date;

        if (delayValue && delayUnit) {
          resumeAt = computeResumeTime(delayValue, delayUnit);
        } else {
          const parsed = parseDelayFromLabel(node.data?.label);
          resumeAt = computeResumeTime(parsed.value, parsed.unit);
        }

        await prisma.automationRunStep.update({
          where: { id: step.id },
          data: { status: "completed", endedAt: new Date(), output: { resumeAfter: resumeAt.toISOString() } },
        });

        // Pause the run — a cron job will resume it
        await prisma.automationRun.update({
          where: { id: run.id },
          data: {
            status: "paused",
            stoppedAtNode: node.id,
            resumeAfter: resumeAt,
            emailsSent,
          },
        });

        return {
          ok: true,
          runId: run.id,
          emailsSent,
          stepsCompleted,
          errors,
          status: "paused",
          stoppedAtNode: node.id,
          resumeAfter: resumeAt,
        };
      }

      // ---- CONDITION NODE ----
      if (type === "condition") {
        // Evaluate for each contact (use first contact for path decision in batch mode)
        const primaryContact = contacts[0];
        let result = true;

        if (primaryContact) {
          // Refresh tags from DB for accurate evaluation
          const freshContact = await prisma.emailContact.findFirst({
            where: { userId, email: primaryContact.email },
            select: { tags: true },
          });
          const contactWithTags: Contact = {
            ...primaryContact,
            tags: freshContact?.tags ?? primaryContact.tags ?? [],
          };
          result = evaluateCondition(node.data?.condition, contactWithTags);
        }

        await prisma.automationRunStep.update({
          where: { id: step.id },
          data: {
            status: "completed",
            endedAt: new Date(),
            output: { conditionResult: result, condition: node.data?.condition ?? node.data?.label },
          },
        });
        stepsCompleted++;

        const next = edgeMap.get(currentNodeId as string);
        currentNodeId = result ? (next?.yes ?? next?.default) : (next?.no ?? undefined);
        continue;
      }

      // ---- UNKNOWN NODE TYPE ----
      await prisma.automationRunStep.update({
        where: { id: step.id },
        data: { status: "skipped", endedAt: new Date(), output: { reason: `Unknown node type: ${type}` } },
      });

      const next = edgeMap.get(currentNodeId as string);
      currentNodeId = next?.default;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      errors.push(`Node ${node.id} (${type}): ${msg}`);
      await prisma.automationRunStep.update({
        where: { id: step.id },
        data: { status: "failed", endedAt: new Date(), error: msg },
      });

      const next = edgeMap.get(currentNodeId as string);
      currentNodeId = next?.default;
    }
  }

  // Run completed
  const finalStatus = errors.length > 0 && emailsSent === 0 ? "failed" : "completed";
  await prisma.automationRun.update({
    where: { id: run.id },
    data: {
      status: finalStatus,
      completedAt: new Date(),
      emailsSent,
      errorCount: errors.length,
    },
  });

  // Update automation-level stats
  await prisma.automation.update({
    where: { id: automationId },
    data: {
      runsTotal: { increment: resumeRunId ? 0 : 1 },
      runsSuccess: { increment: finalStatus === "completed" ? (resumeRunId ? 0 : 1) : 0 },
      runsFailed: { increment: finalStatus === "failed" ? (resumeRunId ? 0 : 1) : 0 },
      lastRunAt: new Date(),
    },
  });

  return { ok: true, runId: run.id, emailsSent, stepsCompleted, errors, status: finalStatus as "completed" | "failed" };
}
