import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { config } from "@/lib/config";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, resendApiKey: true, sendingFromEmail: true, sendingFromName: true },
    });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const lead = await prisma.lead.findFirst({ where: { id, userId: user.id } });
    if (!lead) return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });

    const outreachEmail = lead.outreachEmail as { subject: string; body: string } | null;
    if (!outreachEmail) {
      return NextResponse.json({ ok: false, error: "Generate assets first" }, { status: 400 });
    }

    const body = await req.json() as { toEmail?: string; customBody?: string };
    const toEmail = body.toEmail?.trim() ?? lead.email;

    if (!toEmail) {
      return NextResponse.json({ ok: false, error: "No email address for this lead. Add one manually." }, { status: 400 });
    }

    const resendKey = user.resendApiKey ?? config.resendApiKey;
    if (!resendKey || resendKey === "re_REPLACE_ME") {
      return NextResponse.json({ ok: false, error: "Configure your Resend API key in Settings first." }, { status: 400 });
    }

    const resend = new Resend(resendKey);
    const fromEmail = user.sendingFromEmail ?? "onboarding@resend.dev";
    const fromName = user.sendingFromName ?? "Himalaya";

    const emailBody = body.customBody ?? outreachEmail.body;

    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: toEmail,
      subject: outreachEmail.subject,
      text: emailBody,
    });

    await prisma.lead.update({
      where: { id },
      data: {
        status: "outreach_sent",
        outreachSentAt: new Date(),
        email: toEmail,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Outreach send error:", err);
    return NextResponse.json({ ok: false, error: "Failed to send email" }, { status: 500 });
  }
}
