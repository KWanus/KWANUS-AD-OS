import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ ok: false, error: "Payments not configured" }, { status: 402 });
    }

    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const sub = await prisma.himalayaSubscription.findUnique({ where: { userId: user.id } });
    if (!sub?.stripeCustomerId) {
      return NextResponse.json({ ok: false, error: "No billing account found" }, { status: 400 });
    }

    const stripe = new Stripe(stripeKey);
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005"}/himalaya/upgrade`,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    console.error("Billing portal error:", err);
    return NextResponse.json({ ok: false, error: "Failed to open billing" }, { status: 500 });
  }
}
