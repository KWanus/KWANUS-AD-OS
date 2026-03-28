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
 * Failures are logged to the WebhookLog table for visibility.
 */
export function fireWebhook(userId: string, event: WebhookEvent): void {
  void (async () => {
    let webhookUrl: string | null = null;
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { webhookUrl: true },
      });
      if (!user?.webhookUrl) return;
      webhookUrl = user.webhookUrl;

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Himalaya-Event": event.event,
        },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        console.warn(`[webhook] ${event.event} → ${webhookUrl} responded ${res.status}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[webhook] ${event.event} → ${webhookUrl ?? "unknown"} failed: ${message}`);
    }
  })();
}
