// ---------------------------------------------------------------------------
// POST /api/ai/generate-variants
// Generates 3 headline/CTA variants for A/B testing
// Input: current headline + business context
// Output: 3 alternative headlines with reasoning
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      currentHeadline: string;
      subheadline?: string;
      audience?: string;
      niche?: string;
      type?: "headline" | "cta" | "subheadline";
    };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "AI not configured" }, { status: 400 });
    }

    const type = body.type ?? "headline";
    const anthropic = new Anthropic({ apiKey });

    const prompt = `Generate 3 A/B test variants for this ${type}.

Current ${type}: "${body.currentHeadline}"
${body.subheadline ? `Subheadline: "${body.subheadline}"` : ""}
${body.audience ? `Audience: ${body.audience}` : ""}
${body.niche ? `Niche: ${body.niche}` : ""}

Create 3 variants that test different psychological angles:
- Variant A: Different emotional angle (pain vs aspiration)
- Variant B: Different specificity level (vague vs ultra-specific)
- Variant C: Different framing (question vs statement vs command)

Return as JSON:
[
  { "variant": "A", "text": "...", "angle": "...", "hypothesis": "..." },
  { "variant": "B", "text": "...", "angle": "...", "hypothesis": "..." },
  { "variant": "C", "text": "...", "angle": "...", "hypothesis": "..." }
]

Each ${type} must be under ${type === "cta" ? "6" : "80"} words. No placeholders.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    const raw = textContent?.text ?? "[]";

    let variants;
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      variants = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      variants = [{ variant: "A", text: raw, angle: "generated", hypothesis: "AI output" }];
    }

    return NextResponse.json({ ok: true, variants, original: body.currentHeadline });
  } catch (err) {
    console.error("Variant generation error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
