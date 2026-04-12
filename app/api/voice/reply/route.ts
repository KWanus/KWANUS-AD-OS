// ---------------------------------------------------------------------------
// POST /api/voice/reply — handles Twilio gather (keypress) during AI calls
// If lead presses 1, records interest and notifies the user
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/notify";

export async function POST(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get("leadId");
  const formData = await req.formData();
  const digits = formData.get("Digits") as string | null;

  if (digits === "1" && leadId) {
    // Lead pressed 1 — they're interested!
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { userId: true, name: true, phone: true, email: true },
    });

    if (lead?.userId) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { status: "converted", notes: `Pressed 1 during AI call — wants to talk! ${new Date().toISOString()}` },
      }).catch(() => {});

      await createNotification({
        userId: lead.userId,
        type: "new_lead",
        title: `HOT LEAD: ${lead.name ?? "Someone"} wants to talk!`,
        body: `They pressed 1 during the AI call. Call them back NOW at ${lead.phone ?? "no phone"}.`,
        href: `/leads/${leadId}`,
      }).catch(() => {});
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Excellent! I'm connecting you with a team member now. If no one is available, we'll call you back within 15 minutes. Thank you!</Say>
  <Hangup/>
</Response>`;

    return new NextResponse(twiml, {
      headers: { "Content-Type": "application/xml" },
    });
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">No worries! We'll follow up by email. Have a great day!</Say>
  <Hangup/>
</Response>`;

  return new NextResponse(twiml, {
    headers: { "Content-Type": "application/xml" },
  });
}
