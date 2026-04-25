import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { sendEmailUnified, getFromAddressUnified } from "@/lib/integrations/emailSender";

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
      select: { id: true, name: true, workspaceName: true, sendingFromName: true, sendingFromEmail: true, sendingDomain: true },
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

    // Use unified sender (Gmail OAuth → Resend → SMTP → fallback)
    const from = getFromAddressUnified(user);
    const emailBody = body.customBody ?? outreachEmail.body;

    const result = await sendEmailUnified({
      from,
      to: toEmail,
      subject: outreachEmail.subject,
      html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.7; color: #1a1a2e;">
${emailBody.split("\n").map((line: string) => `<p style="margin: 0 0 12px;">${line}</p>`).join("")}
</div>`,
    }, user.id);

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error ?? "Failed to send email" }, { status: 500 });
    }

    await prisma.lead.update({
      where: { id },
      data: {
        status: "outreach_sent",
        outreachSentAt: new Date(),
        email: toEmail,
      },
    });

    return NextResponse.json({ ok: true, provider: result.provider });
  } catch (err) {
    console.error("Outreach send error:", err);
    return NextResponse.json({ ok: false, error: "Failed to send email" }, { status: 500 });
  }
}
