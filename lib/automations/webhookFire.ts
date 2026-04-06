// ---------------------------------------------------------------------------
// Webhook Fire — sends event data to user's configured webhook URL
// Enables n8n, Zapier, Make.com integrations
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";

export type WebhookEvent =
  | "lead.created"
  | "payment.completed"
  | "email.bounced"
  | "site.published"
  | "form.submitted"
  | "contact.created";

export async function fireWebhook(input: {
  userId: string;
  event: WebhookEvent;
  data: Record<string, unknown>;
}): Promise<void> {
  try {
    // Get user's webhook URL
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { webhookUrl: true },
    });

    const webhookUrl = user?.webhookUrl;
    if (!webhookUrl?.trim()) return;

    const webhookSecret = process.env.WEBHOOK_SECRET;
    const payload = {
      event: input.event,
      timestamp: new Date().toISOString(),
      data: input.data,
    };

    const controller = new AbortController();
    setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(webhookSecret && webhookSecret !== "REPLACE_ME" && { "x-webhook-secret": webhookSecret }),
        "x-webhook-event": input.event,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    // Log the webhook call
    await prisma.webhookLog.create({
      data: {
        source: "himalaya",
        workflow: input.event,
        status: res.ok ? "success" : "failed",
        payload: payload as object,
        response: { status: res.status },
        durationMs: 0,
      },
    }).catch(() => {});
  } catch {
    // Webhook failures are always non-blocking
  }
}

/** Fire webhook for new lead */
export async function fireLeadWebhook(userId: string, lead: {
  name: string;
  email: string;
  phone?: string;
  source: string;
  score: number;
}): Promise<void> {
  await fireWebhook({ userId, event: "lead.created", data: lead });
}

/** Fire webhook for payment */
export async function firePaymentWebhook(userId: string, payment: {
  amount: number;
  customerEmail: string;
  productName: string;
}): Promise<void> {
  await fireWebhook({ userId, event: "payment.completed", data: payment });
}
