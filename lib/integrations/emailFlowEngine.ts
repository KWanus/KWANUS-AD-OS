// ---------------------------------------------------------------------------
// Email Flow Execution Engine — actually sends emails on schedule
// Processes EmailFlow nodes, sends via Resend, tracks enrollment progress
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { sendEmailUnified as sendEmail, getFromAddressUnified as getFromAddress } from "./emailSender";
import { sendSMS, personalizeSMS, hasSMSConfigured } from "./smsClient";

type EmailNode = {
  id: string;
  type: "trigger" | "email" | "delay" | "condition" | "sms";
  data: {
    subject?: string;
    previewText?: string;
    body?: string;
    smsBody?: string;
    label?: string;
    delayValue?: number;
    delayUnit?: "minutes" | "hours" | "days";
  };
};

type FlowEdge = {
  id: string;
  source: string;
  target: string;
};

/** Enroll a contact into an email flow */
export async function enrollContact(input: {
  flowId: string;
  contactEmail: string;
  userId: string;
  contactName?: string;
}): Promise<{
  ok: boolean;
  enrollmentId?: string;
  error?: string;
  status?: "active" | "paused" | "completed" | "failed";
  warning?: string;
}> {
  try {
    const flow = await prisma.emailFlow.findUnique({ where: { id: input.flowId } });
    if (!flow) return { ok: false, error: "Flow not found" };
    if (flow.status !== "active" && flow.status !== "draft") {
      return { ok: false, error: `Flow is ${flow.status}` };
    }

    // Find the first node (trigger node)
    const nodes = flow.nodes as EmailNode[];
    const edges = flow.edges as FlowEdge[];
    const triggerNode = nodes.find((n) => n.type === "trigger");
    if (!triggerNode) return { ok: false, error: "No trigger node in flow" };

    // Find first email/delay after trigger
    const firstEdge = edges.find((e) => e.source === triggerNode.id);
    const firstNodeId = firstEdge?.target ?? triggerNode.id;

    // Create enrollment (upsert to prevent duplicates)
    const enrollment = await prisma.emailFlowEnrollment.upsert({
      where: {
        flowId_contactEmail: {
          flowId: input.flowId,
          contactEmail: input.contactEmail,
        },
      },
      update: {
        status: "active",
        currentNodeId: firstNodeId,
        emailsSent: 0,
        errors: [],
        resumeAfter: null,
      },
      create: {
        flowId: input.flowId,
        contactEmail: input.contactEmail,
        userId: input.userId,
        status: "active",
        currentNodeId: firstNodeId,
      },
    });

    // Increment enrolled count
    await prisma.emailFlow.update({
      where: { id: input.flowId },
      data: { enrolled: { increment: 1 } },
    });

    // Also ensure contact exists in EmailContact
    await prisma.emailContact.upsert({
      where: {
        userId_email: {
          userId: input.userId,
          email: input.contactEmail,
        },
      },
      update: { status: "subscribed" },
      create: {
        userId: input.userId,
        email: input.contactEmail,
        firstName: input.contactName ?? null,
        source: `flow:${input.flowId}`,
        tags: ["himalaya-auto-enroll"],
      },
    });

    // Process immediately (send first email if the next node is an email)
    await processEnrollment(enrollment.id);

    const updatedEnrollment = await prisma.emailFlowEnrollment.findUnique({
      where: { id: enrollment.id },
      select: { status: true, errors: true },
    });

    const latestError = Array.isArray(updatedEnrollment?.errors)
      ? updatedEnrollment.errors[updatedEnrollment.errors.length - 1]
      : undefined;

    return {
      ok: true,
      enrollmentId: enrollment.id,
      status: (updatedEnrollment?.status as "active" | "paused" | "completed" | "failed" | undefined) ?? "active",
      warning: typeof latestError === "string" && updatedEnrollment?.status === "failed"
        ? latestError
        : undefined,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Enrollment failed" };
  }
}

/** Process a single enrollment — advance through flow nodes */
export async function processEnrollment(enrollmentId: string): Promise<void> {
  const enrollment = await prisma.emailFlowEnrollment.findUnique({
    where: { id: enrollmentId },
    include: { flow: true },
  });

  if (!enrollment || (enrollment.status !== "active" && enrollment.status !== "paused")) {
    return;
  }

  const flow = enrollment.flow;
  const nodes = flow.nodes as EmailNode[];
  const edges = flow.edges as FlowEdge[];
  const currentNode = nodes.find((n) => n.id === enrollment.currentNodeId);

  if (!currentNode) {
    // No more nodes — mark complete
    await prisma.emailFlowEnrollment.update({
      where: { id: enrollmentId },
      data: { status: "completed" },
    });
    return;
  }

  // Get user for sending config
  const user = flow.userId
    ? await prisma.user.findUnique({ where: { id: flow.userId } })
    : null;

  if (currentNode.type === "email" && currentNode.data.subject && currentNode.data.body) {
    // Send the email
    const fromAddress = getFromAddress(user ?? undefined);
    const personalizedBody = personalizeEmail(currentNode.data.body, enrollment.contactEmail);

    const result = await sendEmail({
      from: fromAddress,
      to: enrollment.contactEmail,
      subject: currentNode.data.subject,
      html: wrapEmailHtml(personalizedBody, currentNode.data.previewText),
      tags: [
        { name: "flowId", value: flow.id },
        { name: "nodeId", value: currentNode.id },
        { name: "enrollmentId", value: enrollment.id },
      ],
    });

    if (result.ok) {
      // Update flow metrics
      await prisma.emailFlow.update({
        where: { id: flow.id },
        data: { sent: { increment: 1 } },
      });

      await prisma.emailFlowEnrollment.update({
        where: { id: enrollmentId },
        data: {
          status: "active",
          emailsSent: { increment: 1 },
          errors: [],
          resumeAfter: null,
        },
      });
    } else {
      // Stop progression on delivery failure so the enrollment reflects reality.
      const errors = (enrollment.errors as string[]) ?? [];
      const errorMessage = `${new Date().toISOString()}: ${result.error ?? "Send failed"}`;
      errors.push(errorMessage);
      const failureState = classifySendFailure(result.error);
      await prisma.emailFlowEnrollment.update({
        where: { id: enrollmentId },
        data: {
          status: failureState.status,
          errors: errors.slice(-10),
          resumeAfter: failureState.resumeAfter,
          currentNodeId: currentNode.id,
        },
      });
      return;
    }

    // Find next node
    const nextEdge = edges.find((e) => e.source === currentNode.id);
    if (!nextEdge) {
      await prisma.emailFlowEnrollment.update({
        where: { id: enrollmentId },
        data: { status: "completed", currentNodeId: null },
      });
      // Fire completion triggers
      onFlowCompleted(flow.id, enrollment.contactEmail, flow.userId ?? "").catch(() => {});
      return;
    }

    const nextNode = nodes.find((n) => n.id === nextEdge.target);
    if (!nextNode) {
      await prisma.emailFlowEnrollment.update({
        where: { id: enrollmentId },
        data: { status: "completed", currentNodeId: null },
      });
      onFlowCompleted(flow.id, enrollment.contactEmail, flow.userId ?? "").catch(() => {});
      return;
    }

    // If next node is a delay, schedule resume
    if (nextNode.type === "delay") {
      const delayMs = getDelayMs(nextNode.data.delayValue ?? 1, nextNode.data.delayUnit ?? "days");
      const resumeAfter = new Date(Date.now() + delayMs);

      // Find the node after the delay
      const afterDelayEdge = edges.find((e) => e.source === nextNode.id);

      await prisma.emailFlowEnrollment.update({
        where: { id: enrollmentId },
        data: {
          currentNodeId: afterDelayEdge?.target ?? null,
          resumeAfter,
        },
      });
    } else {
      // Move to next node immediately
      await prisma.emailFlowEnrollment.update({
        where: { id: enrollmentId },
        data: { currentNodeId: nextNode.id },
      });
      // Process next node immediately
      await processEnrollment(enrollmentId);
    }
  } else if (currentNode.type === "delay") {
    // Check if delay has passed
    if (enrollment.resumeAfter && new Date() < enrollment.resumeAfter) {
      return; // Not yet time
    }

    const nextEdge = edges.find((e) => e.source === currentNode.id);
    if (nextEdge) {
      await prisma.emailFlowEnrollment.update({
        where: { id: enrollmentId },
        data: { currentNodeId: nextEdge.target, resumeAfter: null },
      });
      await processEnrollment(enrollmentId);
    } else {
      await prisma.emailFlowEnrollment.update({
        where: { id: enrollmentId },
        data: { status: "completed" },
      });
    }
  } else if (currentNode.type === "sms" && currentNode.data.smsBody && hasSMSConfigured()) {
    // Send SMS
    const contact = await prisma.emailContact.findFirst({
      where: { email: enrollment.contactEmail },
      select: { properties: true, firstName: true },
    });
    const props = (contact?.properties ?? {}) as Record<string, string>;
    const phone = props.phone;

    if (phone) {
      const smsBody = personalizeSMS(currentNode.data.smsBody, {
        firstName: contact?.firstName ?? undefined,
        email: enrollment.contactEmail,
      });

      const smsResult = await sendSMS({ to: phone, body: smsBody });

      if (smsResult.ok) {
        await prisma.emailFlow.update({
          where: { id: flow.id },
          data: { sent: { increment: 1 } },
        });
      }
    }

    // Move to next node
    const nextEdge = edges.find((e) => e.source === currentNode.id);
    if (nextEdge) {
      await prisma.emailFlowEnrollment.update({
        where: { id: enrollmentId },
        data: { currentNodeId: nextEdge.target },
      });
      await processEnrollment(enrollmentId);
    } else {
      await prisma.emailFlowEnrollment.update({
        where: { id: enrollmentId },
        data: { status: "completed" },
      });
    }
  } else if (currentNode.type === "trigger") {
    // Skip trigger, move to next
    const nextEdge = edges.find((e) => e.source === currentNode.id);
    if (nextEdge) {
      await prisma.emailFlowEnrollment.update({
        where: { id: enrollmentId },
        data: { currentNodeId: nextEdge.target },
      });
      await processEnrollment(enrollmentId);
    }
  }
}

/** Process all pending enrollments (called by cron/scheduler) */
export async function processAllPendingEnrollments(): Promise<{ processed: number; errors: number }> {
  const now = new Date();
  let processed = 0;
  let errors = 0;

  // Find enrollments that are ready to run now.
  const pendingEnrollments = await prisma.emailFlowEnrollment.findMany({
    where: {
      OR: [
        {
          status: "active",
          OR: [
            { resumeAfter: null },
            { resumeAfter: { lte: now } },
          ],
        },
        {
          status: "paused",
          resumeAfter: { lte: now },
        },
      ],
    },
    take: 100, // Process in batches
  });

  for (const enrollment of pendingEnrollments) {
    try {
      await processEnrollment(enrollment.id);
      processed++;
    } catch {
      errors++;
    }
  }

  return { processed, errors };
}

export async function retryFailedEnrollmentsForFlow(input: {
  flowId: string;
  userId: string;
  limit?: number;
}): Promise<{ retried: number; remainingFailed: number }> {
  const failedEnrollments = await prisma.emailFlowEnrollment.findMany({
    where: {
      flowId: input.flowId,
      userId: input.userId,
      status: "failed",
    },
    orderBy: { updatedAt: "asc" },
    take: input.limit ?? 25,
    select: { id: true },
  });

  let retried = 0;

  for (const enrollment of failedEnrollments) {
    await prisma.emailFlowEnrollment.update({
      where: { id: enrollment.id },
      data: {
        status: "active",
        resumeAfter: null,
      },
    });

    try {
      await processEnrollment(enrollment.id);
      retried++;
    } catch {
      // Keep going so one bad enrollment does not block the rest.
    }
  }

  const remainingFailed = await prisma.emailFlowEnrollment.count({
    where: {
      flowId: input.flowId,
      userId: input.userId,
      status: "failed",
    },
  });

  return { retried, remainingFailed };
}

export async function retrySingleEnrollment(input: {
  enrollmentId: string;
  flowId: string;
  userId: string;
}): Promise<{ ok: boolean; status?: string }> {
  const enrollment = await prisma.emailFlowEnrollment.findFirst({
    where: {
      id: input.enrollmentId,
      flowId: input.flowId,
      userId: input.userId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!enrollment) {
    return { ok: false };
  }

  await prisma.emailFlowEnrollment.update({
    where: { id: enrollment.id },
    data: {
      status: "active",
      resumeAfter: null,
    },
  });

  try {
    await processEnrollment(enrollment.id);
  } catch {
    // Let the persisted enrollment state tell the truth about the retry result.
  }

  const updatedEnrollment = await prisma.emailFlowEnrollment.findUnique({
    where: { id: enrollment.id },
    select: { status: true },
  });

  return { ok: true, status: updatedEnrollment?.status ?? "active" };
}

// ── Helpers ────────────────────────────────────────────────────────────

function getDelayMs(value: number, unit: string): number {
  switch (unit) {
    case "minutes": return value * 60 * 1000;
    case "hours": return value * 60 * 60 * 1000;
    case "days": return value * 24 * 60 * 60 * 1000;
    default: return value * 24 * 60 * 60 * 1000;
  }
}

function classifySendFailure(error?: string): {
  status: "paused" | "failed";
  resumeAfter: Date | null;
} {
  const message = (error ?? "").toLowerCase();

  const isConfigOrPolicyError =
    message.includes("verify a domain") ||
    message.includes("testing emails") ||
    message.includes("your own email address") ||
    message.includes("no email api key configured") ||
    message.includes("resend_api_key not set") ||
    message.includes("from address") ||
    message.includes("sender");

  if (isConfigOrPolicyError) {
    return { status: "failed", resumeAfter: null };
  }

  // Retry transient send failures after a short backoff.
  return {
    status: "paused",
    resumeAfter: new Date(Date.now() + 15 * 60 * 1000),
  };
}

function personalizeEmail(body: string, email: string): string {
  // Basic personalization — replace placeholders
  const name = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return body
    .replace(/\[First Name\]/gi, name)
    .replace(/\[EMAIL\]/gi, email)
    .replace(/\{firstName\}/gi, name)
    .replace(/\{\{\{FIRST_NAME\|there\}\}\}/g, name);
}

/** Called when an enrollment completes all nodes — fires learning + progression */
async function onFlowCompleted(flowId: string, contactEmail: string, userId: string): Promise<void> {
  try {
    // Record learning signal — this flow completed successfully
    const { recordWin } = await import("@/lib/intelligence/learningEngine");
    const flow = await prisma.emailFlow.findUnique({ where: { id: flowId }, select: { name: true, conversions: true } });
    if (flow) {
      recordWin({ userId, niche: flow.name, type: "email_subject", content: `Flow "${flow.name}" completed`, conversionRate: flow.conversions > 0 ? 100 : 50, channel: "email_flow" }).catch(() => {});
    }

    // Update contact tags to reflect nurture completion
    await prisma.emailContact.updateMany({
      where: { email: contactEmail, userId },
      data: { tags: { push: "flow-completed" } },
    }).catch(() => {});

    // Update lead status if exists
    await prisma.lead.updateMany({
      where: { email: contactEmail, userId, status: "new" },
      data: { status: "nurtured" },
    }).catch(() => {});

    // Notify owner
    const { createNotification } = await import("@/lib/notifications/notify");
    createNotification({
      userId,
      type: "system",
      title: `${contactEmail} completed email flow`,
      body: `${flow?.name ?? "Flow"} sequence finished. Lead has been marked as nurtured.`,
      href: "/leads",
    }).catch(() => {});
  } catch {
    // Completion triggers are never blocking
  }
}

function wrapEmailHtml(body: string, previewText?: string): string {
  // Convert newlines to HTML paragraphs
  const htmlBody = body
    .split("\n\n")
    .map((p) => `<p style="margin:0 0 16px 0;line-height:1.6;color:#333333;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${previewText ? `<span style="display:none;max-height:0;overflow:hidden;">${previewText}</span>` : ""}
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;">
<tr><td align="center" style="padding:40px 20px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:8px;overflow:hidden;">
<tr><td style="padding:32px 40px;font-size:16px;color:#333333;">
${htmlBody}
</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
<tr><td style="padding:20px 40px;text-align:center;font-size:12px;color:#9ca3af;">
<p>You received this email because you subscribed. <a href="#" style="color:#6b7280;">Unsubscribe</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
