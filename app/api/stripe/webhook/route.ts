import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { enrollContact } from "@/lib/integrations/emailFlowEngine";
import { notifyPayment } from "@/lib/notifications/notify";
import { firePaymentWebhook } from "@/lib/automations/webhookFire";
import { recordWin } from "@/lib/intelligence/learningEngine";

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const stripe = new Stripe(stripeKey);
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;

  // If webhook secret is configured and not placeholder, verify signature
  if (webhookSecret && webhookSecret !== "whsec_REPLACE_ME" && webhookSecret !== "REPLACE_ME" && sig) {
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } else {
    // Development mode: parse event without signature verification
    // WARNING: In production, always set STRIPE_WEBHOOK_SECRET
    try {
      event = JSON.parse(rawBody) as Stripe.Event;
      if (!event.type) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
      console.warn("⚠️ Stripe webhook running WITHOUT signature verification. Set STRIPE_WEBHOOK_SECRET in production.");
    } catch {
      return NextResponse.json({ error: "Invalid event payload" }, { status: 400 });
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const runId = session.metadata?.runId;
    const credits = parseInt(session.metadata?.credits ?? "0", 10);

    // ── Credit purchase ──
    if (userId && credits > 0) {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: credits } },
        select: { credits: true },
      });

      await prisma.creditLog.create({
        data: {
          userId,
          amount: credits,
          balance: updatedUser.credits,
          action: "purchase",
          detail: `${session.metadata?.bundle ?? "credit"} bundle — $${((session.amount_total ?? 0) / 100).toFixed(2)}`,
        },
      });

      console.log(`✓ Added ${credits} credits to user ${userId} (new balance: ${updatedUser.credits})`);
    }

    // ── Product/service purchase via Himalaya payment link ──
    if (userId && runId && session.amount_total && session.amount_total > 0) {
      const customerEmail = session.customer_details?.email ?? session.customer_email;
      const customerName = session.customer_details?.name;

      try {
        // Find the deployment to get the site
        const deployment = await prisma.himalayaDeployment.findFirst({
          where: { analysisRunId: runId, userId },
          orderBy: { createdAt: "desc" },
        });

        // Create order record if site exists
        if (deployment?.siteId) {
          const stripePaymentId =
            (typeof session.payment_intent === "string" && session.payment_intent) ||
            session.id;

          const existingOrder = await prisma.siteOrder.findFirst({
            where: { stripePaymentId },
            select: { id: true },
          });

          // Find a product on the site (or use generic)
          if (!existingOrder) {
            const product = await prisma.siteProduct.findFirst({
              where: { siteId: deployment.siteId },
            });

            await prisma.siteOrder.create({
              data: {
                siteId: deployment.siteId,
                productId: product?.id ?? "himalaya-payment-link",
                customerEmail: customerEmail ?? "unknown",
                customerName: customerName ?? null,
                amountCents: session.amount_total,
                currency: session.currency ?? "usd",
                status: "paid",
                stripePaymentId,
              },
            });
          }
        }

        // Enroll buyer in post-purchase email flow
        if (customerEmail) {
          // Upsert contact
          await prisma.emailContact.upsert({
            where: { userId_email: { userId, email: customerEmail } },
            update: { status: "subscribed", tags: { push: "customer" } },
            create: {
              userId,
              email: customerEmail,
              firstName: customerName ?? null,
              source: `purchase:${runId}`,
              tags: ["customer", "purchaser"],
            },
          });

          // Find post-purchase flow
          const postPurchaseFlow = await prisma.emailFlow.findFirst({
            where: {
              userId,
              trigger: "purchase",
              status: "active",
            },
            orderBy: { createdAt: "desc" },
          });

          if (postPurchaseFlow) {
            await enrollContact({
              flowId: postPurchaseFlow.id,
              contactEmail: customerEmail,
              userId,
              contactName: customerName ?? undefined,
            });
          }

          // Update email flow revenue tracking
          if (deployment?.emailFlowId) {
            await prisma.emailFlow.update({
              where: { id: deployment.emailFlowId },
              data: {
                conversions: { increment: 1 },
                revenue: { increment: (session.amount_total ?? 0) / 100 },
              },
            }).catch(() => {});
          }
        }

        // Track the purchase event
        await prisma.himalayaFunnelEvent.create({
          data: {
            userId,
            event: "purchase_completed",
            metadata: {
              runId,
              amount: session.amount_total,
              currency: session.currency,
              customerEmail,
              siteId: deployment?.siteId,
              stripeSessionId: session.id,
            },
          },
        }).catch(() => {});

        // Notify user + fire webhook
        notifyPayment(userId, session.amount_total ?? 0, customerEmail ?? "unknown").catch(() => {});
        firePaymentWebhook(userId, {
          amount: session.amount_total ?? 0,
          customerEmail: customerEmail ?? "unknown",
          productName: session.metadata?.productName ?? "Product",
        }).catch(() => {});

        // Record learning signal — the entire funnel worked (biggest win signal)
        recordWin({ userId, niche: "purchase", type: "offer_angle", content: `Converted at $${(session.amount_total / 100).toFixed(2)}`, conversionRate: 100, channel: "stripe" }).catch(() => {});

        console.log(`✓ Purchase: $${(session.amount_total / 100).toFixed(2)} from ${customerEmail} for run ${runId}`);
      } catch (err) {
        console.error("Purchase processing error:", err);
        // Don't fail the webhook — Stripe will retry
      }
    }
  }

  return NextResponse.json({ received: true });
}
