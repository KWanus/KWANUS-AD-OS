// ---------------------------------------------------------------------------
// POST /api/emails/broadcast-quick
// Quick broadcast — sends one email to all subscribed contacts or a tag segment
// One-click broadcast from contacts page
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { sendBatch, getFromAddress } from "@/lib/integrations/resendClient";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      subject: string;
      body: string;
      tags?: string[];   // Filter by tags, or send to all if empty
      previewText?: string;
    };

    if (!body.subject || !body.body) {
      return NextResponse.json({ ok: false, error: "subject and body required" }, { status: 400 });
    }

    // Get contacts
    const where: Record<string, unknown> = {
      userId: user.id,
      status: "subscribed",
    };
    if (body.tags && body.tags.length > 0) {
      where.tags = { hasSome: body.tags };
    }

    const contacts = await prisma.emailContact.findMany({
      where,
      select: { email: true, firstName: true },
      take: 500,
    });

    if (contacts.length === 0) {
      return NextResponse.json({ ok: false, error: "No subscribed contacts found" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { sendingFromName: true, sendingFromEmail: true, sendingDomain: true },
    });
    const fromAddress = getFromAddress(dbUser ?? undefined);

    // Build HTML
    const htmlBody = body.body
      .split("\n\n")
      .map((p) => `<p style="margin:0 0 16px;line-height:1.6;color:#333;">${p.replace(/\n/g, "<br>")}</p>`)
      .join("");

    const html = `<!DOCTYPE html><html><body style="margin:0;padding:40px 20px;background:#f9fafb;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;">
<tr><td style="padding:32px 40px;font-size:16px;color:#333;">
${htmlBody}
</td></tr></table></body></html>`;

    // Send in batches of 50
    let totalSent = 0;
    const batchSize = 50;

    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);
      const emails = batch.map((c) => ({
        from: fromAddress,
        to: c.email,
        subject: body.subject.replace(/\{firstName\}/g, c.firstName ?? "there"),
        html: html.replace(/\{firstName\}/g, c.firstName ?? "there"),
        replyTo: dbUser?.sendingFromEmail ?? undefined,
      }));

      const result = await sendBatch(emails);
      if (result.ok) {
        totalSent += batch.length;
      }
    }

    // Record broadcast
    await prisma.emailBroadcast.create({
      data: {
        userId: user.id,
        name: body.subject,
        subject: body.subject,
        previewText: body.previewText ?? "",
        body: body.body,
        fromName: dbUser?.sendingFromName ?? "Himalaya",
        fromEmail: dbUser?.sendingFromEmail ?? "onboarding@resend.dev",
        status: "sent",
        sentAt: new Date(),
        recipients: totalSent,
        segmentTags: body.tags ?? [],
      },
    }).catch(() => {});

    return NextResponse.json({ ok: true, sent: totalSent, total: contacts.length });
  } catch (err) {
    console.error("Quick broadcast error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
