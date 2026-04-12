// ---------------------------------------------------------------------------
// GET /api/voice/twiml?leadId=xxx
// Serves TwiML for Twilio voice calls — reads the AI-generated script
// and converts it to speech via Twilio's <Say> verb
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get("leadId");

  let script = "Hi there, I'm following up on your recent inquiry. Do you have a moment to chat?";

  if (leadId) {
    const event = await prisma.himalayaFunnelEvent.findFirst({
      where: { event: "voice_script", metadata: { path: ["leadId"], equals: leadId } },
      orderBy: { createdAt: "desc" },
    });

    if (event) {
      const meta = event.metadata as Record<string, string>;
      script = meta.script ?? script;
    }
  }

  // Clean script for XML
  const cleanScript = script
    .replace(/\[PAUSE\]/g, '</Say><Pause length="1"/><Say voice="Polly.Joanna">')
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Restore our intentional XML tags
    .replace(/&lt;\/Say&gt;/g, "</Say>")
    .replace(/&lt;Pause length="1"\/&gt;/g, '<Pause length="1"/>')
    .replace(/&lt;Say voice="Polly.Joanna"&gt;/g, '<Say voice="Polly.Joanna">');

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${cleanScript}</Say>
  <Pause length="2"/>
  <Say voice="Polly.Joanna">If you'd like to speak with someone on our team, press 1 now or we'll follow up by email.</Say>
  <Gather numDigits="1" action="/api/voice/reply?leadId=${leadId ?? ""}" method="POST">
    <Pause length="5"/>
  </Gather>
  <Say voice="Polly.Joanna">Thank you for your time. We'll follow up by email. Have a great day!</Say>
</Response>`;

  return new NextResponse(twiml, {
    headers: { "Content-Type": "application/xml" },
  });
}
