// ---------------------------------------------------------------------------
// Email Deployment Service — deploys email flows to real subscribers
// Handles scheduling, tracking, and delivery of automated email sequences
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/db";
import { sendEmail, sendBatchEmails } from "./resendService";
import type { EmailFlow, EmailFlowStep } from "@prisma/client";

export type DeploymentResult = {
  success: boolean;
  flowId: string;
  emailsSent: number;
  emailsFailed: number;
  error?: string;
};

export type EmailTemplateVariables = {
  firstName?: string;
  lastName?: string;
  email?: string;
  productName?: string;
  businessName?: string;
  [key: string]: string | undefined;
};

/**
 * Deploy an email flow to a single subscriber
 */
export async function deployFlowToSubscriber(
  flowId: string,
  subscriberEmail: string,
  variables: EmailTemplateVariables = {}
): Promise<DeploymentResult> {
  try {
    const flow = await prisma.emailFlow.findUnique({
      where: { id: flowId },
      include: { steps: { orderBy: { order: "asc" } } },
    });

    if (!flow || !flow.steps.length) {
      return {
        success: false,
        flowId,
        emailsSent: 0,
        emailsFailed: 0,
        error: "Email flow not found or has no steps",
      };
    }

    let emailsSent = 0;
    let emailsFailed = 0;

    // Send each email in the sequence
    for (const step of flow.steps) {
      let html = replaceTemplateVariables(step.body, variables);
      const subject = replaceTemplateVariables(step.subject, variables);

      // Generate a temporary tracking ID for this email
      const trackingId = `${flow.id}-${step.id}-${Date.now()}`;

      // Add tracking pixel and link tracking to HTML
      html = addTrackingToEmail(html, trackingId);

      const result = await sendEmail({
        to: subscriberEmail,
        subject,
        html,
        tags: {
          flowId: flow.id,
          stepId: step.id,
          stepOrder: step.order.toString(),
        },
      });

      if (result.success) {
        emailsSent++;

        // Track the email send in database
        await prisma.emailTracking.create({
          data: {
            flowId: flow.id,
            stepId: step.id,
            recipientEmail: subscriberEmail,
            status: "sent",
            messageId: result.messageId,
            sentAt: new Date(),
          },
        });
      } else {
        emailsFailed++;
        console.error(`[EmailDeployment] Failed to send step ${step.order}:`, result.error);
      }

      // Respect delay between emails (if not the first email)
      if (step.delayMinutes > 0 && step.order > 0) {
        // In production, this should be handled by a queue/scheduler
        // For now, we'll just log it
        console.log(`[EmailDeployment] Scheduled next email in ${step.delayMinutes} minutes`);
      }
    }

    return {
      success: emailsSent > 0,
      flowId,
      emailsSent,
      emailsFailed,
    };
  } catch (err) {
    console.error("[EmailDeployment] Error deploying flow:", err);
    return {
      success: false,
      flowId,
      emailsSent: 0,
      emailsFailed: 0,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Deploy an email flow to multiple subscribers
 */
export async function deployFlowToSubscribers(
  flowId: string,
  subscriberEmails: string[],
  variables: EmailTemplateVariables = {}
): Promise<DeploymentResult> {
  try {
    const flow = await prisma.emailFlow.findUnique({
      where: { id: flowId },
      include: { steps: { orderBy: { order: "asc" } } },
    });

    if (!flow || !flow.steps.length) {
      return {
        success: false,
        flowId,
        emailsSent: 0,
        emailsFailed: 0,
        error: "Email flow not found or has no steps",
      };
    }

    let totalSent = 0;
    let totalFailed = 0;

    // Send first email in the sequence to all subscribers
    const firstStep = flow.steps[0];
    const baseHtml = replaceTemplateVariables(firstStep.body, variables);
    const subject = replaceTemplateVariables(firstStep.subject, variables);

    // Create unique tracking ID for each subscriber
    const results = await sendBatchEmails(
      subscriberEmails.map((email) => {
        const trackingId = `${flow.id}-${firstStep.id}-${Date.now()}-${email}`;
        const html = addTrackingToEmail(baseHtml, trackingId);

        return {
          to: email,
          subject,
          html,
          tags: {
            flowId: flow.id,
            stepId: firstStep.id,
            stepOrder: firstStep.order.toString(),
          },
        };
      })
    );

    // Track results
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const email = subscriberEmails[i];

      if (result.success) {
        totalSent++;

        await prisma.emailTracking.create({
          data: {
            flowId: flow.id,
            stepId: firstStep.id,
            recipientEmail: email,
            status: "sent",
            messageId: result.messageId,
            sentAt: new Date(),
          },
        });
      } else {
        totalFailed++;
        console.error(`[EmailDeployment] Failed to send to ${email}:`, result.error);
      }
    }

    return {
      success: totalSent > 0,
      flowId,
      emailsSent: totalSent,
      emailsFailed: totalFailed,
    };
  } catch (err) {
    console.error("[EmailDeployment] Error deploying flow to subscribers:", err);
    return {
      success: false,
      flowId,
      emailsSent: 0,
      emailsFailed: 0,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Send a single email from a flow step
 */
export async function sendFlowEmail(
  flowId: string,
  stepId: string,
  subscriberEmail: string,
  variables: EmailTemplateVariables = {}
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const step = await prisma.emailFlowStep.findUnique({
      where: { id: stepId },
    });

    if (!step) {
      return { success: false, error: "Email step not found" };
    }

    let html = replaceTemplateVariables(step.body, variables);
    const subject = replaceTemplateVariables(step.subject, variables);

    // Add tracking
    const trackingId = `${flowId}-${stepId}-${Date.now()}`;
    html = addTrackingToEmail(html, trackingId);

    const result = await sendEmail({
      to: subscriberEmail,
      subject,
      html,
      tags: {
        flowId,
        stepId,
        stepOrder: step.order.toString(),
      },
    });

    if (result.success) {
      await prisma.emailTracking.create({
        data: {
          flowId,
          stepId,
          recipientEmail: subscriberEmail,
          status: "sent",
          messageId: result.messageId,
          sentAt: new Date(),
        },
      });
    }

    return result;
  } catch (err) {
    console.error("[EmailDeployment] Error sending flow email:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Track email open event
 */
export async function trackEmailOpen(messageId: string): Promise<void> {
  try {
    await prisma.emailTracking.updateMany({
      where: { messageId },
      data: {
        status: "opened",
        openedAt: new Date(),
      },
    });
  } catch (err) {
    console.error("[EmailDeployment] Error tracking open:", err);
  }
}

/**
 * Track email click event
 */
export async function trackEmailClick(messageId: string, url: string): Promise<void> {
  try {
    await prisma.emailTracking.updateMany({
      where: { messageId },
      data: {
        status: "clicked",
        clickedAt: new Date(),
        // You could store clicked URL in a separate table or JSON field
      },
    });
  } catch (err) {
    console.error("[EmailDeployment] Error tracking click:", err);
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────

/**
 * Replace template variables in email content
 * Example: "Hello {{firstName}}" + {firstName: "John"} => "Hello John"
 */
function replaceTemplateVariables(content: string, variables: EmailTemplateVariables): string {
  let result = content;

  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      result = result.replace(regex, value);
    }
  }

  return result;
}

/**
 * Add tracking pixel and link tracking to email HTML
 */
function addTrackingToEmail(html: string, messageId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Add tracking pixel at the end of the email body
  const trackingPixel = `<img src="${baseUrl}/api/emails/track/open?messageId=${encodeURIComponent(messageId)}" width="1" height="1" alt="" style="display:block;" />`;

  // If there's a closing </body> tag, insert before it
  if (html.includes("</body>")) {
    html = html.replace("</body>", `${trackingPixel}</body>`);
  } else {
    // Otherwise, just append to the end
    html += trackingPixel;
  }

  // Wrap all links with click tracking
  html = html.replace(
    /<a\s+([^>]*href=["']([^"']+)["'][^>]*)>/gi,
    (match, attrs, url) => {
      // Don't track if it's already a tracking URL
      if (url.includes("/api/emails/track/")) {
        return match;
      }

      const trackedUrl = `${baseUrl}/api/emails/track/click?messageId=${encodeURIComponent(messageId)}&url=${encodeURIComponent(url)}`;
      return `<a ${attrs.replace(url, trackedUrl)}>`;
    }
  );

  return html;
}
