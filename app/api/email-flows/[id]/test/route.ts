import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { sendEmail, markdownToHtml, wrapHtml } from "@/lib/email/send";

/**
 * POST /api/email-flows/[id]/test
 * Send a test email from a specific node in the flow.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as { nodeId?: string; toEmail?: string };

    const flow = await prisma.emailFlow.findFirst({
      where: { id, userId: user.id },
    });

    if (!flow) return NextResponse.json({ ok: false, error: "Flow not found" }, { status: 404 });

    // Find the email node
    const nodes = (flow.nodes ?? []) as { id: string; type?: string; data?: Record<string, unknown> }[];
    const emailNode = body.nodeId
      ? nodes.find(n => n.id === body.nodeId)
      : nodes.find(n => n.type === "email");

    if (!emailNode?.data) {
      return NextResponse.json({ ok: false, error: "No email node found" }, { status: 400 });
    }

    const subject = (emailNode.data.subject as string) ?? "Test Email";
    const emailBody = (emailNode.data.body as string) ?? "";
    const preview = (emailNode.data.previewText as string) ?? "";

    // Personalize with test data
    const personalizedBody = emailBody
      .replace(/\{\{first_name\}\}/gi, "Test")
      .replace(/\{\{last_name\}\}/gi, "User")
      .replace(/\{\{email\}\}/gi, body.toEmail ?? user.email ?? "test@example.com");

    const htmlBody = personalizedBody.includes("<") ? personalizedBody : wrapHtml(markdownToHtml(personalizedBody));

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { resendApiKey: true, sendingFromEmail: true, sendingFromName: true, email: true },
    });

    const toEmail = body.toEmail ?? dbUser?.email ?? "";
    if (!toEmail) {
      return NextResponse.json({ ok: false, error: "No email address for test send" }, { status: 400 });
    }

    const result = await sendEmail({
      to: toEmail,
      subject: `[TEST] ${subject}`,
      html: htmlBody,
      apiKey: dbUser?.resendApiKey ?? undefined,
      fromName: dbUser?.sendingFromName ?? undefined,
      fromEmail: dbUser?.sendingFromEmail ?? undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, sentTo: toEmail });
  } catch (err) {
    console.error("Test send error:", err);
    return NextResponse.json({ ok: false, error: "Test send failed" }, { status: 500 });
  }
}
