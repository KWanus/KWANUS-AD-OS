// ---------------------------------------------------------------------------
// GET /api/referrals — get user's referral stats
// POST /api/referrals — generate a referral link for a contact
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { generateReferralCode, buildReferralUrl } from "@/lib/referrals/referralEngine";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get referral events
    const [clicks, conversions] = await Promise.all([
      prisma.himalayaFunnelEvent.count({
        where: { userId: user.id, event: "referral_click" },
      }),
      prisma.himalayaFunnelEvent.count({
        where: { userId: user.id, event: "referral_conversion" },
      }),
    ]);

    // Get user's sites for building referral URLs
    const sites = await prisma.site.findMany({
      where: { userId: user.id, published: true },
      select: { slug: true, name: true },
      take: 5,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true } });
    const code = generateReferralCode(dbUser?.email ?? user.id);

    const referralLinks = sites.map((s) => ({
      site: s.name,
      url: buildReferralUrl(`${appUrl}/s/${s.slug}`, code),
    }));

    return NextResponse.json({
      ok: true,
      referralCode: code,
      stats: { clicks, conversions },
      links: referralLinks,
    });
  } catch (err) {
    console.error("Referrals error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { email: string; siteSlug?: string };
    if (!body.email) return NextResponse.json({ ok: false, error: "email required" }, { status: 400 });

    const code = generateReferralCode(body.email);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";
    const baseUrl = body.siteSlug ? `${appUrl}/s/${body.siteSlug}` : appUrl;
    const url = buildReferralUrl(baseUrl, code);

    return NextResponse.json({ ok: true, referralCode: code, url });
  } catch (err) {
    console.error("Referral create error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
