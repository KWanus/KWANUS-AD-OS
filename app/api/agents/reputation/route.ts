import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { autoRequestReviews, calculateReputationScore, type Review } from "@/lib/agents/reputationAgent";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get testimonials as internal reviews
    const testimonials = await prisma.himalayaFunnelEvent.findMany({
      where: { userId: user.id, event: "testimonial_submitted" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const reviews: Review[] = testimonials.map((t) => {
      const meta = t.metadata as Record<string, unknown>;
      return {
        platform: "internal" as const,
        author: (meta.name as string) ?? "Customer",
        rating: (meta.stars as number) ?? 5,
        text: (meta.quote as string) ?? "",
        date: t.createdAt.toISOString(),
        responded: (meta.status as string) === "approved",
      };
    });

    const score = calculateReputationScore(reviews);

    return NextResponse.json({ ok: true, score, reviews, totalReviews: reviews.length });
  } catch (err) {
    console.error("Reputation error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await autoRequestReviews(user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Review request error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
