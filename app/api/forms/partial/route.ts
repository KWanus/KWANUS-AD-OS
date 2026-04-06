// ---------------------------------------------------------------------------
// POST /api/forms/partial
// Captures partial form data (email entered but not submitted)
// Enables abandoned form recovery via email
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { siteId: string; email: string; name?: string };

    if (!body.siteId || !body.email) {
      return NextResponse.json({ ok: true }); // Silent — don't error on partial data
    }

    // Find site owner
    const site = await prisma.site.findUnique({
      where: { id: body.siteId },
      select: { userId: true, name: true },
    });
    if (!site) return NextResponse.json({ ok: true });

    // Create or update contact as "partial" (not fully subscribed)
    await prisma.emailContact.upsert({
      where: { userId_email: { userId: site.userId, email: body.email } },
      update: {}, // Don't overwrite if they already fully submitted
      create: {
        userId: site.userId,
        email: body.email,
        firstName: body.name ?? null,
        source: `partial:${body.siteId}`,
        status: "partial",
        tags: ["partial-form", `site:${body.siteId}`],
      },
    });

    // Track event
    await prisma.himalayaFunnelEvent.create({
      data: {
        userId: site.userId,
        event: "form_partial",
        metadata: { siteId: body.siteId, email: body.email },
      },
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Always succeed — this is fire-and-forget
  }
}
