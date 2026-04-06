// ---------------------------------------------------------------------------
// Trigger Engine — event-based automation dispatcher
// When events happen, this engine evaluates triggers and fires actions
// Used by: form submit, purchase, email events, lead score changes
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { enrollContact } from "@/lib/integrations/emailFlowEngine";
import { fireWebhook } from "@/lib/automations/webhookFire";
import { createNotification } from "@/lib/notifications/notify";

export type TriggerEvent =
  | "form.submitted"
  | "purchase.completed"
  | "lead.scored_hot"
  | "email.bounced"
  | "contact.created"
  | "site.published";

export type AutomationAction =
  | { type: "enroll_flow"; flowId: string }
  | { type: "notify"; message: string }
  | { type: "webhook" }
  | { type: "tag_contact"; tags: string[] }
  | { type: "update_lead_status"; status: string };

type StoredAutomation = {
  id: string;
  trigger: string;
  actions: AutomationAction[];
};

/** Process a trigger event — find matching automations and execute actions */
export async function processTrigger(input: {
  userId: string;
  event: TriggerEvent;
  data: {
    email?: string;
    name?: string;
    contactId?: string;
    leadId?: string;
    amount?: number;
    siteId?: string;
    metadata?: Record<string, unknown>;
  };
}): Promise<{ actionsExecuted: number }> {
  let actionsExecuted = 0;

  try {
    // Find active automations matching this trigger
    const automations = await prisma.automation.findMany({
      where: {
        userId: input.userId,
        trigger: input.event,
        status: "active",
      },
      select: { id: true, trigger: true, nodes: true },
      take: 10,
    });

    for (const automation of automations) {
      const nodes = automation.nodes as unknown[];
      // Each node can be an action
      for (const node of nodes) {
        const action = node as Record<string, unknown>;
        try {
          switch (action.type) {
            case "enroll_flow":
              if (input.data.email && action.flowId) {
                await enrollContact({
                  flowId: action.flowId as string,
                  contactEmail: input.data.email,
                  userId: input.userId,
                  contactName: input.data.name,
                });
                actionsExecuted++;
              }
              break;

            case "notify":
              await createNotification({
                userId: input.userId,
                type: "system",
                title: (action.message as string) ?? `Automation triggered: ${input.event}`,
                body: `Event: ${input.event}. ${input.data.email ?? ""}`,
              });
              actionsExecuted++;
              break;

            case "webhook":
              await fireWebhook({
                userId: input.userId,
                event: input.event as any,
                data: input.data as Record<string, unknown>,
              });
              actionsExecuted++;
              break;

            case "tag_contact":
              if (input.data.email && Array.isArray(action.tags)) {
                await prisma.emailContact.updateMany({
                  where: { userId: input.userId, email: input.data.email },
                  data: { tags: { push: action.tags as string[] } },
                });
                actionsExecuted++;
              }
              break;

            case "update_lead_status":
              if (input.data.leadId && action.status) {
                await prisma.lead.update({
                  where: { id: input.data.leadId },
                  data: { status: action.status as string },
                });
                actionsExecuted++;
              }
              break;
          }
        } catch {
          // Individual action failures are non-blocking
        }
      }
    }
  } catch {
    // Trigger processing is non-blocking
  }

  return { actionsExecuted };
}
