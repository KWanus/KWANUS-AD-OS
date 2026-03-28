import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { callClaude, LOCAL_SYSTEM_PROMPT } from "@/lib/ai/claude";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { ExecutionTier } from "@/lib/sites/conversionEngine";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user)
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { niche, location, radius, auditId } = body as {
      niche: string;
      location: string;
      radius?: string;
      auditId?: string;
    };
    const executionTier: ExecutionTier = body.executionTier === "core" ? "core" : "elite";

    if (!niche || !location) {
      return NextResponse.json(
        { ok: false, error: "niche and location are required" },
        { status: 400 }
      );
    }

    // Optionally verify the audit belongs to this user
    if (auditId) {
      const auditCheck = await prisma.localAudit.findFirst({
        where: { id: auditId, userId: user.id },
        select: { id: true },
      });
      if (!auditCheck)
        return NextResponse.json({ ok: false, error: "Audit not found" }, { status: 404 });
    }

    const prompt = `Generate a comprehensive local keyword research strategy for:
Niche: ${niche}
Location: ${location}
${radius ? `Service Radius: ${radius}` : ""}
Execution Tier: ${executionTier}

${executionTier === "elite"
  ? "Elite mode: think like a premium local SEO strategist. Push for better money-keyword prioritization, stronger service-area logic, and more commercially useful content opportunities."
  : "Core mode: produce a strong, practical local keyword plan with clear intent mapping and usable content ideas."}

Include:
- Primary money keywords (high commercial intent, local modifier)
- Long-tail keywords (lower competition, high conversion)
- "Near me" variations
- Service area keyword variations (city + surrounding areas)
- Content ideas that capture informational traffic and build authority

For each primary keyword, estimate:
- Search intent (transactional = buying now, informational = researching, navigational = brand search)
- Difficulty based on typical competition in this niche/market
- Rough monthly search volume range

Return this exact JSON structure:
{
  "primaryKeywords": [
    {
      "keyword": "exact keyword phrase",
      "intent": "transactional|informational|navigational",
      "difficulty": "low|medium|high",
      "searchVolume": "estimated monthly range e.g. '100-500/mo'"
    }
  ],
  "longTail": ["long tail keyword 1", "long tail keyword 2"],
  "nearMeKeywords": ["niche near me", "service near me variations"],
  "serviceAreaKeywords": ["niche + city", "niche + neighborhood", "niche + region"],
  "contentIdeas": [
    {
      "title": "blog/page title",
      "keyword": "target keyword for this content",
      "type": "blog|faq|landing"
    }
  ]
}`;

    const result = await callClaude(LOCAL_SYSTEM_PROMPT, prompt);

    // If auditId provided, store keywordsJson on the LocalAudit
    if (auditId) {
      await prisma.localAudit.update({
        where: { id: auditId },
        data: { keywordsJson: result as object },
      });
    }

    return NextResponse.json({ ok: true, keywords: result, executionTier });
  } catch (err) {
    console.error("Keywords research POST error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to generate keyword research" },
      { status: 500 }
    );
  }
}
