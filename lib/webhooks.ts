import { prisma } from "./prisma";

export interface WebhookEvent {
  event:
    | "new_contact"
    | "broadcast_sent"
    | "order_placed"
    | "campaign_launched"
    | "site_published";
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Fire the user's configured webhook URL.
 * Always fire-and-forget — never blocks the caller.
 */
export function fireWebhook(userId: string, event: WebhookEvent): void {
  void (async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { webhookUrl: true },
      });
      if (!user?.webhookUrl) return;

      await fetch(user.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Himalaya-Event": event.event,
        },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      // webhook errors are non-fatal — never surface to caller
    }
  })();
}
