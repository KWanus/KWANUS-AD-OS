import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { analyzeGEO } from "@/lib/agents/geoOptimizer";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      title: string; headline: string; content: string;
      faqItems?: { question: string; answer: string }[];
      businessName: string; niche: string; location?: string;
    };

    const analysis = analyzeGEO(body);
    return NextResponse.json({ ok: true, analysis });
  } catch (err) {
    console.error("GEO error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
