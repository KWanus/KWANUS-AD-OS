import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getOrCreateUser } from "@/lib/auth";

export const CREDIT_BUNDLES = {
  starter: { credits: 100,  price: 900,   label: "Starter",  priceId: "starter" },
  growth:  { credits: 400,  price: 2900,  label: "Growth",   priceId: "growth"  },
  scale:   { credits: 1200, price: 7900,  label: "Scale",    priceId: "scale"   },
  pro:     { credits: 3500, price: 19900, label: "Pro",      priceId: "pro"     },
} as const;

export type BundleKey = keyof typeof CREDIT_BUNDLES;

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ ok: false, error: "no_stripe_key" }, { status: 402 });
  }

  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { bundle: BundleKey };
  const bundle = CREDIT_BUNDLES[body.bundle];
  if (!bundle) {
    return NextResponse.json({ ok: false, error: "Invalid bundle" }, { status: 400 });
  }

  const stripe = new Stripe(stripeKey);
  const origin = req.headers.get("origin") ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: bundle.price,
          product_data: {
            name: `KWANUS AD OS — ${bundle.label} Credits`,
            description: `${bundle.credits} credits for AI image & video generation`,
          },
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      userId: user.id,
      credits: String(bundle.credits),
      bundle: body.bundle,
    },
    success_url: `${origin}/billing?success=1&bundle=${body.bundle}`,
    cancel_url: `${origin}/billing?cancelled=1`,
    customer_email: user.email,
  });

  return NextResponse.json({ ok: true, url: session.url });
}
