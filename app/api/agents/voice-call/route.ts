import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { autoCallLead, hasVoiceAgent } from "@/lib/agents/voiceAgent";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!hasVoiceAgent()) {
      return NextResponse.json({ ok: false, error: "Voice agent not configured. Set RETELL_API_KEY or VAPI_API_KEY." }, { status: 400 });
    }

    const body = await req.json() as { leadId: string };
    if (!body.leadId) return NextResponse.json({ ok: false, error: "leadId required" }, { status: 400 });

    const lead = await prisma.lead.findFirst({ where: { id: body.leadId, userId: user.id } });
    if (!lead) return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
    if (!lead.phone) return NextResponse.json({ ok: false, error: "Lead has no phone number" }, { status: 400 });

    const profile = await prisma.businessProfile.findUnique({ where: { userId: user.id } });

    const result = await autoCallLead({
      userId: user.id,
      leadId: lead.id,
      leadName: lead.name,
      leadPhone: lead.phone,
      leadEmail: lead.email ?? "",
      niche: lead.niche,
      businessName: profile?.businessName ?? "Himalaya",
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Voice call error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
