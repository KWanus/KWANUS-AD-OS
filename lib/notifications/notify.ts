// ---------------------------------------------------------------------------
// Notification System — creates in-app notifications for key events
// Stored in HimalayaFunnelEvent with event type "notification"
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "new_lead"
  | "new_payment"
  | "email_bounce"
  | "site_published"
  | "campaign_winner"
  | "flow_completed"
  | "system";

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.himalayaFunnelEvent.create({
      data: {
        userId: input.userId,
        event: "notification",
        metadata: {
          type: input.type,
          title: input.title,
          body: input.body,
          href: input.href,
          read: false,
          ...input.metadata,
        },
      },
    });
  } catch {
    // Non-blocking
  }
}

/** Notify on new lead from form submission */
export async function notifyNewLead(userId: string, leadName: string, source: string): Promise<void> {
  await createNotification({
    userId,
    type: "new_lead",
    title: "New lead",
    body: `${leadName} submitted a form on ${source}`,
    href: "/leads",
  });
}

/** Notify on payment */
export async function notifyPayment(userId: string, amount: number, customerEmail: string): Promise<void> {
  await createNotification({
    userId,
    type: "new_payment",
    title: `Payment received: $${(amount / 100).toFixed(2)}`,
    body: `${customerEmail} completed a purchase`,
    href: "/",
    metadata: { amount, customerEmail },
  });
}

/** Notify on email bounce */
export async function notifyBounce(userId: string, email: string): Promise<void> {
  await createNotification({
    userId,
    type: "email_bounce",
    title: "Email bounced",
    body: `${email} bounced — contact marked as inactive`,
    href: "/emails/contacts",
  });
}

/** Notify when site goes live */
export async function notifySitePublished(userId: string, siteName: string, siteUrl: string): Promise<void> {
  await createNotification({
    userId,
    type: "site_published",
    title: "Site is live",
    body: `${siteName} is now published and accepting visitors`,
    href: siteUrl,
  });
}
