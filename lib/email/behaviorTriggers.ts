import { prisma } from "@/lib/prisma";
import { fireTrigger } from "@/lib/email-flows/triggerEngine";

/**
 * Process an analytics event and fire email triggers if conditions are met.
 * Called from the analytics tracking endpoint.
 */
export async function processEventTrigger(event: {
  siteId: string;
  visitorId: string;
  eventType: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  // Only process events that could trigger emails
  const triggerableEvents = ["form_submit", "checkout_start", "checkout_complete", "return_visit"];
  if (!triggerableEvents.includes(event.eventType)) return;

  try {
    // Find the site owner
    const site = await prisma.site.findUnique({
      where: { id: event.siteId },
      select: { userId: true },
    });
    if (!site?.userId) return;

    // Try to find the visitor's email from previous form submissions or contacts
    const visitorEmail = await resolveVisitorEmail(site.userId, event.visitorId, event.metadata);
    if (!visitorEmail) return; // Can't trigger without email

    switch (event.eventType) {
      case "form_submit":
        await fireTrigger({
          type: "form_submit",
          email: visitorEmail,
          firstName: (event.metadata?.name as string)?.split(" ")[0],
          userId: site.userId,
          metadata: { siteId: event.siteId, visitorId: event.visitorId },
        });
        break;

      case "checkout_start":
        // Start a timer — if no checkout_complete within 1 hour, fire abandoned_cart
        await prisma.himalayaFunnelEvent.create({
          data: {
            userId: site.userId,
            event: "checkout_started_pending",
            metadata: {
              visitorId: event.visitorId,
              email: visitorEmail,
              siteId: event.siteId,
              startedAt: new Date().toISOString(),
            },
          },
        });
        break;

      case "checkout_complete":
        // Clear any pending abandoned cart triggers
        const pending = await prisma.himalayaFunnelEvent.findMany({
          where: {
            userId: site.userId,
            event: "checkout_started_pending",
          },
        });
        for (const p of pending) {
          const meta = p.metadata as Record<string, unknown>;
          if (meta?.visitorId === event.visitorId) {
            await prisma.himalayaFunnelEvent.delete({ where: { id: p.id } });
          }
        }

        // Fire purchase trigger
        await fireTrigger({
          type: "purchase",
          email: visitorEmail,
          userId: site.userId,
          metadata: {
            siteId: event.siteId,
            visitorId: event.visitorId,
            ...event.metadata,
          },
        });
        break;

      case "return_visit":
        // Fire browse_abandon for return visitors who haven't purchased
        const hasOrder = await prisma.siteOrder.findFirst({
          where: { siteId: event.siteId, customerEmail: visitorEmail },
        });
        if (!hasOrder) {
          await fireTrigger({
            type: "browse_abandon",
            email: visitorEmail,
            userId: site.userId,
            metadata: { siteId: event.siteId, visitCount: event.metadata?.visitCount },
          });
        }
        break;
    }
  } catch {
    // Non-blocking — don't fail tracking for trigger errors
  }
}

/**
 * Process abandoned checkouts — called by daily cron.
 * Finds checkout_started_pending events older than 1 hour with no matching purchase.
 */
export async function processAbandonedCheckouts(): Promise<number> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const pending = await prisma.himalayaFunnelEvent.findMany({
    where: {
      event: "checkout_started_pending",
      createdAt: { lte: oneHourAgo },
    },
  });

  let fired = 0;
  for (const p of pending) {
    const meta = p.metadata as Record<string, unknown>;
    const email = meta?.email as string;
    const userId = p.userId;

    if (email && userId) {
      await fireTrigger({
        type: "abandoned_cart",
        email,
        userId,
        metadata: { siteId: meta?.siteId, startedAt: meta?.startedAt },
      }).catch(() => {});
      fired++;
    }

    // Clean up the pending event
    await prisma.himalayaFunnelEvent.delete({ where: { id: p.id } }).catch(() => {});
  }

  return fired;
}

/** Resolve a visitor ID to an email address */
async function resolveVisitorEmail(
  userId: string,
  visitorId: string,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  // Check if email was provided in the event metadata
  if (metadata?.email) return metadata.email as string;

  // Check if we've seen this visitor before in form submissions
  const formEvents = await prisma.himalayaFunnelEvent.findMany({
    where: {
      userId,
      event: "site_form_submit",
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  for (const ev of formEvents) {
    const meta = ev.metadata as Record<string, unknown>;
    if (meta?.visitorId === visitorId && meta?.email) {
      return meta.email as string;
    }
  }

  return null;
}
