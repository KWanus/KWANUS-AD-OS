import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key) : null;
}

/** GET — get connected account status */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // Check if user has a connected Stripe account
    const config = await prisma.himalayaFunnelEvent.findFirst({
      where: { userId: user.id, event: "stripe_connect" },
      orderBy: { createdAt: "desc" },
    });

    const meta = config?.metadata as Record<string, unknown> | null;
    const accountId = meta?.accountId as string | undefined;

    if (!accountId) {
      return NextResponse.json({ ok: true, connected: false });
    }

    // Verify account is still valid
    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ ok: true, connected: true, accountId, verified: false });

    try {
      const account = await stripe.accounts.retrieve(accountId);
      return NextResponse.json({
        ok: true,
        connected: true,
        accountId,
        verified: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        businessName: account.business_profile?.name ?? account.settings?.dashboard?.display_name ?? null,
        email: account.email,
      });
    } catch {
      return NextResponse.json({ ok: true, connected: true, accountId, verified: false });
    }
  } catch (err) {
    console.error("Stripe connect GET:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

/** POST — create Stripe Connect onboarding link OR save connected account */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ ok: false, error: "Stripe not configured" }, { status: 503 });

    const body = await req.json() as { action: string; accountId?: string };

    if (body.action === "create_account") {
      // Create a Stripe Connect Express account
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        metadata: { userId: user.id },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      // Store the account ID
      await prisma.himalayaFunnelEvent.create({
        data: {
          userId: user.id,
          event: "stripe_connect",
          metadata: { accountId: account.id, status: "pending", createdAt: new Date().toISOString() },
        },
      });

      // Create onboarding link
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${appUrl}/settings?stripe=refresh`,
        return_url: `${appUrl}/settings?stripe=connected`,
        type: "account_onboarding",
      });

      return NextResponse.json({ ok: true, url: accountLink.url, accountId: account.id });
    }

    if (body.action === "create_login_link") {
      // Get existing account
      const config = await prisma.himalayaFunnelEvent.findFirst({
        where: { userId: user.id, event: "stripe_connect" },
        orderBy: { createdAt: "desc" },
      });
      const accountId = (config?.metadata as Record<string, unknown>)?.accountId as string;
      if (!accountId) return NextResponse.json({ ok: false, error: "No connected account" }, { status: 400 });

      const loginLink = await stripe.accounts.createLoginLink(accountId);
      return NextResponse.json({ ok: true, url: loginLink.url });
    }

    if (body.action === "disconnect") {
      // Remove the stored connection
      const configs = await prisma.himalayaFunnelEvent.findMany({
        where: { userId: user.id, event: "stripe_connect" },
      });
      for (const c of configs) {
        await prisma.himalayaFunnelEvent.delete({ where: { id: c.id } });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Stripe connect POST:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
