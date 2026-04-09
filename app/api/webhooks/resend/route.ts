// ---------------------------------------------------------------------------
// Resend Webhook — tracks email opens, clicks, bounces, complaints
// Register this URL in Resend Dashboard → Webhooks
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordWin } from "@/lib/intelligence/learningEngine";

type ResendEvent = {
  type: "email.sent" | "email.delivered" | "email.opened" | "email.clicked" | "email.bounced" | "email.complained";
  data: {
    email_id: string;
    to: string[];
    from: string;
    subject: string;
    tags?: { name: string; value: string }[];
  };
  created_at: string;
};

export async function POST(req: NextRequest) {
  try {
    const event = (await req.json()) as ResendEvent;

    if (!event.type || !event.data) {
      return NextResponse.json({ ok: true }); // Ignore malformed
    }

    const recipientEmail = event.data.to?.[0];
    if (!recipientEmail) return NextResponse.json({ ok: true });

    // Find the flow tag if present
    const flowTag = event.data.tags?.find((t) => t.name === "flowId");
    const flowId = flowTag?.value;

    // Update flow metrics based on event type
    if (flowId) {
      switch (event.type) {
        case "email.opened":
          await prisma.emailFlow.update({
            where: { id: flowId },
            data: { opens: { increment: 1 } },
          }).catch(() => {});
          break;

        case "email.clicked":
          await prisma.emailFlow.update({
            where: { id: flowId },
            data: { clicks: { increment: 1 } },
          }).catch(() => {});
          // Record learning signal — this email subject/content drives clicks
          if (flowId) {
            const flow = await prisma.emailFlow.findUnique({ where: { id: flowId }, select: { userId: true, name: true } }).catch(() => null);
            if (flow?.userId) {
              recordWin({ userId: flow.userId, niche: flow.name, type: "email_subject", content: event.data.subject ?? "", conversionRate: 1, channel: "email" }).catch(() => {});
            }
          }
          break;

        case "email.bounced":
          // Mark contact as bounced
          await prisma.emailContact.updateMany({
            where: { email: recipientEmail },
            data: { status: "bounced" },
          }).catch(() => {});

          // Pause enrollment
          await prisma.emailFlowEnrollment.updateMany({
            where: { flowId, contactEmail: recipientEmail },
            data: { status: "failed" },
          }).catch(() => {});
          break;

        case "email.complained":
          // Unsubscribe immediately
          await prisma.emailContact.updateMany({
            where: { email: recipientEmail },
            data: { status: "unsubscribed" },
          }).catch(() => {});

          // Stop all enrollments for this contact
          await prisma.emailFlowEnrollment.updateMany({
            where: { contactEmail: recipientEmail, status: "active" },
            data: { status: "paused" },
          }).catch(() => {});
          break;
      }
    }

    // Also update broadcast metrics if this was a broadcast
    const broadcastTag = event.data.tags?.find((t) => t.name === "broadcastId");
    if (broadcastTag?.value) {
      switch (event.type) {
        case "email.opened":
          await prisma.emailBroadcast.update({
            where: { id: broadcastTag.value },
            data: { opens: { increment: 1 } },
          }).catch(() => {});
          break;
        case "email.clicked":
          await prisma.emailBroadcast.update({
            where: { id: broadcastTag.value },
            data: { clicks: { increment: 1 } },
          }).catch(() => {});
          break;
        case "email.bounced":
          await prisma.emailBroadcast.update({
            where: { id: broadcastTag.value },
            data: { bounces: { increment: 1 } },
          }).catch(() => {});
          break;
        case "email.complained":
          await prisma.emailBroadcast.update({
            where: { id: broadcastTag.value },
            data: { unsubscribes: { increment: 1 } },
          }).catch(() => {});
          break;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Resend webhook error:", err);
    return NextResponse.json({ ok: true }); // Always return 200 to Resend
  }
}
