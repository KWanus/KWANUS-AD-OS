// ---------------------------------------------------------------------------
// POST /api/email-flows/from-template
// Creates a complete email flow from a template with one click
// Templates: welcome, nurture, sales, cart-recovery, post-purchase, re-engagement
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

const TEMPLATES: Record<string, {
  name: string;
  trigger: string;
  emails: { subject: string; preview: string; body: string; delayDays: number }[];
}> = {
  welcome: {
    name: "Welcome Sequence",
    trigger: "signup",
    emails: [
      { subject: "Welcome — here's what happens next", preview: "You made the right call.", body: "Hey there,\n\nWelcome! You made a great decision.\n\nHere's what to expect:\n\n1. Over the next few days, I'll send you the most important insights I've learned.\n2. Each email is short, actionable, and designed to move you forward.\n3. If you ever want to reply — please do. I read every response.\n\nLet's get started.\n\n— The Team", delayDays: 0 },
      { subject: "The one thing most people get wrong", preview: "Worth reading before you go further.", body: "Hey,\n\nBefore we go any further, I want to share the #1 mistake I see.\n\nMost people try to do everything at once. They spread thin, see no results, and quit.\n\nThe better approach: pick ONE thing, go deep, measure results, then expand.\n\nTomorrow I'll show you a real example of this in action.\n\n— The Team", delayDays: 1 },
      { subject: "A real example (this might surprise you)", preview: "This happened faster than expected.", body: "Hey,\n\nYesterday I mentioned the power of focus. Here's a real example.\n\nSomeone in your exact situation focused on just one channel for 30 days. No distractions, no shiny objects.\n\nResult: they went from zero to their first paying customers in under 3 weeks.\n\nThe takeaway? Depth beats breadth every time.\n\nReply 'focus' if you want to know which channel they picked.\n\n— The Team", delayDays: 2 },
      { subject: "Quick question for you", preview: "This helps me help you better.", body: "Hey,\n\nI have a quick question:\n\nWhat's the single biggest thing holding you back right now?\n\nA) I don't know where to start\nB) I'm started but not seeing results\nC) I need more customers/clients\nD) Something else entirely\n\nJust reply with A, B, C, or D. I'll send you something specific based on your answer.\n\n— The Team", delayDays: 4 },
      { subject: "The next step (when you're ready)", preview: "No pressure — just an option.", body: "Hey,\n\nOver the past few days, I've shared some of the most important things I know.\n\nIf you've been finding these useful and you want to go deeper, here's the natural next step:\n\n[CTA — link to your offer, booking page, or product]\n\nNo pressure. If you're not ready, these emails will keep coming with valuable insights.\n\nBut if you ARE ready to move faster — that link above is the shortest path.\n\n— The Team", delayDays: 7 },
    ],
  },
  "cart-recovery": {
    name: "Cart Recovery",
    trigger: "cart_abandoned",
    emails: [
      { subject: "Did something go wrong?", preview: "Your cart is saved.", body: "Hey,\n\nWe noticed you left before completing your order.\n\nNo worries — your cart is saved exactly as you left it.\n\nIf something went wrong (payment issue, distraction, questions), just reply and let us know.\n\n→ Complete My Order [LINK]\n\nWe're here if you need anything.\n\n— The Team", delayDays: 0 },
      { subject: "Still thinking it over?", preview: "Here's what others are saying.", body: "Hey,\n\nI get it — you want to be sure before you commit.\n\nHere's what recent customers have said:\n\n'I was skeptical at first, but the results spoke for themselves.'\n'Wish I'd started sooner. The value is obvious once you try it.'\n\nYour cart is still waiting:\n\n→ Complete My Order [LINK]\n\n— The Team", delayDays: 1 },
      { subject: "Last chance — then I'll stop", preview: "One final note.", body: "Hey,\n\nThis is my last email about your cart. I don't want to be annoying.\n\nIf you still want it, your cart is here: [LINK]\n\nIf not, no hard feelings at all. Hope your situation works out.\n\n— The Team", delayDays: 2 },
    ],
  },
  "post-purchase": {
    name: "Post-Purchase",
    trigger: "purchase",
    emails: [
      { subject: "Your order is confirmed — do this first", preview: "One quick thing before you start.", body: "Hey,\n\nOrder confirmed — great choice.\n\nBefore you dive in, here's the single most important thing to do first:\n\n[Specific first action — customize for your product]\n\nThis one step separates people who get great results from people who don't.\n\nIf anything about your order isn't right, reply immediately and we'll fix it.\n\n— The Team", delayDays: 0 },
      { subject: "How's it going? (genuine question)", preview: "I want to know if this is working for you.", body: "Hey,\n\nYou've had a few days with your purchase.\n\nHow's it going? Are you seeing what you expected?\n\nIf yes — amazing. Would you mind sharing your experience? It helps others who are on the fence.\n\nIf not — reply and tell me what's happening. I want to fix it.\n\nEither way, I want to know.\n\n— The Team", delayDays: 5 },
      { subject: "A thank-you + something for you", preview: "Two weeks in. Here's what comes next.", body: "Hey,\n\nTwo weeks ago you made a decision. I hope you're seeing results.\n\nAs a thank-you:\n\n[Special offer — loyalty discount, referral program, early access]\n\nAnd if you know someone who'd benefit from this — share your referral link: [LINK]\n\nThank you for being a customer.\n\n— The Team", delayDays: 14 },
    ],
  },
};

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { template: string };
    const template = TEMPLATES[body.template];

    if (!template) {
      return NextResponse.json({
        ok: false,
        error: `Unknown template. Available: ${Object.keys(TEMPLATES).join(", ")}`,
      }, { status: 400 });
    }

    // Build flow nodes and edges
    const nodes: object[] = [
      { id: "trigger_0", type: "trigger", data: { label: template.trigger }, position: { x: 250, y: 0 } },
    ];
    const edges: object[] = [];
    let prevId = "trigger_0";
    let yPos = 150;

    for (let i = 0; i < template.emails.length; i++) {
      const email = template.emails[i];

      // Add delay (except before first if delay is 0)
      if (email.delayDays > 0 || i > 0) {
        const delayDays = email.delayDays || (i > 0 ? i * 2 : 0);
        if (delayDays > 0) {
          const delayId = `delay_${i}`;
          nodes.push({
            id: delayId,
            type: "delay",
            data: { delayValue: delayDays, delayUnit: "days", label: `Wait ${delayDays} day${delayDays > 1 ? "s" : ""}` },
            position: { x: 250, y: yPos },
          });
          edges.push({ id: `e_${prevId}_${delayId}`, source: prevId, target: delayId });
          prevId = delayId;
          yPos += 100;
        }
      }

      // Add email node
      const emailId = `email_${i}`;
      nodes.push({
        id: emailId,
        type: "email",
        data: {
          subject: email.subject,
          previewText: email.preview,
          body: email.body,
          label: email.subject,
        },
        position: { x: 250, y: yPos },
      });
      edges.push({ id: `e_${prevId}_${emailId}`, source: prevId, target: emailId });
      prevId = emailId;
      yPos += 150;
    }

    const flow = await prisma.emailFlow.create({
      data: {
        userId: user.id,
        name: template.name,
        trigger: template.trigger,
        triggerConfig: { source: "template", template: body.template },
        status: "active",
        nodes: nodes as unknown as object,
        edges: edges as unknown as object,
      },
    });

    return NextResponse.json({ ok: true, flow: { id: flow.id, name: flow.name } });
  } catch (err) {
    console.error("Template flow error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
