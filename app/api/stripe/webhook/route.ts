import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const stripe = new Stripe(stripeKey);
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  const rawBody = await req.text();

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const credits = parseInt(session.metadata?.credits ?? "0", 10);

    if (userId && credits > 0) {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: credits } },
        select: { credits: true },
      });

      // Log the credit purchase
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
  }

  return NextResponse.json({ received: true });
}
