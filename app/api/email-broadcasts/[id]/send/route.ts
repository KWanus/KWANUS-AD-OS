import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { sendEmail, markdownToHtml } from "@/lib/email/send";
import { fireWebhook } from "@/lib/webhooks";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const broadcast = await prisma.emailBroadcast.findFirst({
      where: { id, userId: user.id },
    });
    if (!broadcast) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    if (broadcast.status === "sent") {
      return NextResponse.json({ ok: false, error: "Already sent" }, { status: 400 });
    }

    // Load contacts — filter by segmentTags if set
    const contactWhere = {
      userId: user.id,
      status: "subscribed",
      ...(broadcast.segmentTags.length > 0 && {
        tags: { hasSome: broadcast.segmentTags },
      }),
    };

    const contacts = await prisma.emailContact.findMany({
      where: contactWhere,
      select: { email: true, firstName: true, lastName: true },
    });

    if (contacts.length === 0) {
      return NextResponse.json({ ok: false, error: "No subscribed contacts match this segment" }, { status: 400 });
    }

    // Mark as sending
    await prisma.emailBroadcast.update({
      where: { id },
      data: { status: "sending", recipients: contacts.length },
    });

    const htmlBody = markdownToHtml(broadcast.body);
    let sent = 0;
    let failed = 0;

    // Send in batches of 10 to avoid rate limits
    const BATCH = 10;
    for (let i = 0; i < contacts.length; i += BATCH) {
      const batch = contacts.slice(i, i + BATCH);
      await Promise.all(
        batch.map(async (contact: { email: string; firstName: string | null; lastName: string | null }) => {
          const personalizedHtml = htmlBody
            .replace(/\{\{first_name\}\}/gi, contact.firstName ?? "there")
            .replace(/\{\{last_name\}\}/gi, contact.lastName ?? "")
            .replace(/\{\{email\}\}/gi, contact.email);

          const result = await sendEmail({
            to: contact.email,
            subject: broadcast.subject,
            html: personalizedHtml,
            fromName: broadcast.fromName ?? user.sendingFromName ?? user.name ?? "KWANUS",
            fromEmail: broadcast.fromEmail ?? user.sendingFromEmail ?? undefined,
            apiKey: user.resendApiKey ?? undefined,
          });

          if (result.ok) sent++;
          else failed++;
        })
      );
    }

    // Mark as sent
    const updated = await prisma.emailBroadcast.update({
      where: { id },
      data: {
        status: "sent",
        sentAt: new Date(),
        recipients: sent,
      },
    });

    // Fire webhook (fire-and-forget)
    fireWebhook(user.id, {
      event: "broadcast_sent",
      timestamp: new Date().toISOString(),
      data: {
        broadcastId: id,
        subject: broadcast.subject,
        sent,
        failed,
        total: contacts.length,
      },
    });

    return NextResponse.json({ ok: true, broadcast: updated, sent, failed, total: contacts.length });
  } catch (err) {
    console.error("Broadcast send:", err);
    // Mark as failed if errored
    const { id } = await params;
    await prisma.emailBroadcast.updateMany({
      where: { id },
      data: { status: "draft" },
    }).catch(() => {});
    return NextResponse.json({ ok: false, error: "Send failed" }, { status: 500 });
  }
}
