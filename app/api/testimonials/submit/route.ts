// ---------------------------------------------------------------------------
// POST /api/testimonials/submit
// Public endpoint — clients submit testimonials via shareable link
// No auth required. Creates a pending testimonial for owner approval.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      userId: string; // Owner's user ID (embedded in the form URL)
      name: string;
      role?: string;
      company?: string;
      quote: string;
      stars?: number;
      result?: string;
    };

    if (!body.userId || !body.name || !body.quote) {
      return NextResponse.json({ ok: false, error: "name and quote required" }, { status: 400 });
    }

    // Store as a funnel event (no extra table needed)
    await prisma.himalayaFunnelEvent.create({
      data: {
        userId: body.userId,
        event: "testimonial_submitted",
        metadata: {
          name: body.name,
          role: body.role ?? "",
          company: body.company ?? "",
          quote: body.quote,
          stars: body.stars ?? 5,
          result: body.result ?? "",
          status: "pending", // Owner must approve
          submittedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ ok: true, message: "Thank you for your testimonial!" });
  } catch (err) {
    console.error("Testimonial error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
