// ---------------------------------------------------------------------------
// GET /api/testimonials/approved?userId=xxx
// Returns approved testimonials for a user (public)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });

  try {
    const events = await prisma.himalayaFunnelEvent.findMany({
      where: { userId, event: "testimonial_submitted" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const testimonials = events
      .map((e) => {
        const meta = e.metadata as Record<string, unknown>;
        return {
          id: e.id,
          name: meta.name as string,
          role: meta.role as string,
          company: meta.company as string,
          quote: meta.quote as string,
          stars: (meta.stars as number) ?? 5,
          result: meta.result as string,
          status: (meta.status as string) ?? "pending",
          submittedAt: meta.submittedAt as string,
        };
      })
      .filter((t) => t.status === "approved");

    return NextResponse.json({ ok: true, testimonials });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
