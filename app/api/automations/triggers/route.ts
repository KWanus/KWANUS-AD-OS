// ---------------------------------------------------------------------------
// GET /api/automations/triggers — list available trigger events
// POST /api/automations/triggers — create a new automation trigger
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

const AVAILABLE_TRIGGERS = [
  { event: "form.submitted", label: "Form Submitted", description: "Fires when someone submits a form on your site" },
  { event: "purchase.completed", label: "Purchase Completed", description: "Fires when a Stripe payment succeeds" },
  { event: "lead.scored_hot", label: "Hot Lead Detected", description: "Fires when a lead scores 60+ (hot)" },
  { event: "email.bounced", label: "Email Bounced", description: "Fires when an email delivery fails" },
  { event: "contact.created", label: "New Contact", description: "Fires when a new contact is created" },
  { event: "site.published", label: "Site Published", description: "Fires when you publish a site" },
];

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get user's active automations
    const automations = await prisma.automation.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, trigger: true, status: true, runsTotal: true, runsSuccess: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      availableTriggers: AVAILABLE_TRIGGERS,
      automations,
    });
  } catch (err) {
    console.error("Triggers error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      name: string;
      trigger: string;
      actions: { type: string; [key: string]: unknown }[];
    };

    if (!body.name || !body.trigger) {
      return NextResponse.json({ ok: false, error: "name and trigger required" }, { status: 400 });
    }

    const automation = await prisma.automation.create({
      data: {
        userId: user.id,
        name: body.name,
        trigger: body.trigger,
        status: "active",
        nodes: body.actions as unknown as object,
        edges: [],
      },
    });

    return NextResponse.json({ ok: true, automation: { id: automation.id, name: automation.name } });
  } catch (err) {
    console.error("Create automation error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
