import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PLANS = {
  pro: {
    name: "Himalaya Builder",
    price: 2900, // $29/month
    description: "50 runs, 20 deploys, full system access",
  },
  business: {
    name: "Himalaya Operator",
    price: 7900, // $79/month
    description: "Unlimited runs & deploys, priority access",
  },
} as const;

type PlanKey = keyof typeof PLANS;

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ ok: false, error: "Payments not configured" }, { status: 402 });
    }

    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as { plan?: string };
    const planKey = body.plan as PlanKey;

    if (!planKey || !PLANS[planKey]) {
      return NextResponse.json({ ok: false, error: "Invalid plan" }, { status: 400 });
    }

    const plan = PLANS[planKey];
    const stripe = new Stripe(stripeKey);
    const origin = req.headers.get("origin") ?? "http://localhost:3005";

    // Check for existing Stripe customer
    const sub = await prisma.himalayaSubscription.findUnique({ where: { userId: user.id } });
    let customerId = sub?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { userId: user.id, clerkId },
      });
      customerId = customer.id;

      // Save customer ID
      await prisma.himalayaSubscription.upsert({
        where: { userId: user.id },
        create: { userId: user.id, stripeCustomerId: customerId },
        update: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{
        price_data: {
          currency: "usd",
          recurring: { interval: "month" },
          unit_amount: plan.price,
          product_data: {
            name: plan.name,
            description: plan.description,
          },
        },
        quantity: 1,
      }],
      metadata: {
        userId: user.id,
        himalayaPlan: planKey,
      },
      success_url: `${origin}/himalaya/upgrade?success=true&plan=${planKey}`,
      cancel_url: `${origin}/himalaya/upgrade?canceled=true`,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    console.error("Himalaya checkout error:", err);
    return NextResponse.json({ ok: false, error: "Checkout failed" }, { status: 500 });
  }
}
