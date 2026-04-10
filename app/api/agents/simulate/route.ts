import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { buildDigitalTwin, simulateReaction, simulateABTest } from "@/lib/agents/digitalTwin";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      action: "single" | "ab_test";
      niche: string;
      audience: string;
      painPoints?: string[];
      competitorPricing?: string[];
      asset?: string;
      assetType?: string;
      variants?: { text: string; type: string }[];
    };

    const twin = buildDigitalTwin({
      niche: body.niche,
      audience: body.audience,
      painPoints: body.painPoints ?? [],
      desires: [],
      competitorPricing: body.competitorPricing ?? [],
    });

    if (body.action === "ab_test" && body.variants) {
      const result = simulateABTest(twin, body.variants.map((v) => ({ text: v.text, type: (v.type ?? "headline") as any })));
      return NextResponse.json({ ok: true, twin: twin.name, result });
    }

    if (body.asset) {
      const result = simulateReaction(twin, body.asset, (body.assetType ?? "headline") as any);
      return NextResponse.json({ ok: true, twin: twin.name, result });
    }

    return NextResponse.json({ ok: true, twin });
  } catch (err) {
    console.error("Simulation error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
