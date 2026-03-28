import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { AI_MODELS } from "@/lib/ai/models";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const analysis = await prisma.analysisRun.findFirst({
      where: { id, userId: user.id },
      include: {
        opportunityAssessments: { take: 1 },
        assetPackages: { take: 1 },
      },
    });

    if (!analysis) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const opp = analysis.opportunityAssessments[0];
    const packet = analysis.decisionPacket as Record<string, unknown> | null;
    const signals = analysis.rawSignals as Record<string, unknown> | null;

    const prompt = `You are an expert digital marketing strategist and business analyst. Analyze this opportunity and provide deep, actionable insights.

## Scan Data
URL: ${analysis.inputUrl}
Mode: ${analysis.mode}
Score: ${analysis.score ?? 0}/100
Verdict: ${analysis.verdict ?? "Unknown"}
Confidence: ${analysis.confidence ?? "Unknown"}
Summary: ${analysis.summary ?? "No summary"}

## Decision Packet
Audience: ${packet?.audience ?? "Unknown"}
Pain/Desire: ${packet?.painDesire ?? "Unknown"}
Angle: ${packet?.angle ?? "Unknown"}
Strengths: ${JSON.stringify(packet?.strengths ?? [])}
Weaknesses: ${JSON.stringify(packet?.weaknesses ?? [])}
Risks: ${JSON.stringify(packet?.risks ?? [])}

## Opportunity Assessment
Status: ${opp?.status ?? "Unknown"}
Total Score: ${opp?.totalScore ?? 0}
Demand Potential: ${opp?.demandPotential ?? 0}/100
Offer Strength: ${opp?.offerStrength ?? 0}/100
Emotional Leverage: ${opp?.emotionalLeverage ?? 0}/100
Trust & Credibility: ${opp?.trustCredibility ?? 0}/100
Conversion Readiness: ${opp?.conversionReadiness ?? 0}/100
Ad Viability: ${opp?.adViability ?? 0}/100
Email Lifecycle: ${opp?.emailLifecyclePotential ?? 0}/100
SEO Potential: ${opp?.seoPotential ?? 0}/100
Differentiation: ${opp?.differentiation ?? 0}/100
Risk: ${opp?.risk ?? 0}/100

Top Gaps: ${JSON.stringify(opp?.topGaps ?? [])}
Top Strengths: ${JSON.stringify(opp?.topStrengths ?? [])}
Recommended Path: ${opp?.recommendedPath ?? "None"}

## Raw Signals
${JSON.stringify(signals ?? {}, null, 2).slice(0, 2000)}

## Instructions
Provide a JSON response with this exact structure:
{
  "executiveSummary": "2-3 sentence high-level verdict for a busy agency owner",
  "marketPosition": "1-2 sentences on where this sits in the competitive landscape",
  "audienceInsight": "1-2 sentences on who the ideal buyer is and what drives them",
  "biggestOpportunity": "The single most valuable thing to do with this, in 1-2 sentences",
  "biggestRisk": "The single biggest risk or red flag, in 1 sentence",
  "strategyRecommendations": [
    "First specific, actionable recommendation",
    "Second specific, actionable recommendation",
    "Third specific, actionable recommendation"
  ],
  "adAngle": "A specific ad angle/hook direction that would work for this offer",
  "emailPlaybook": "1-2 sentences describing the ideal email sequence approach",
  "landingPageAdvice": "1-2 sentences on what the landing page should emphasize",
  "competitiveAdvantage": "What would make this offer beat competitors, in 1-2 sentences",
  "scoreJustification": "2-3 sentences explaining why the score is what it is"
}

Be specific to THIS offer — no generic advice. Reference actual signals from the data.`;

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (anthropicKey) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: AI_MODELS.CLAUDE_PRIMARY,
          max_tokens: 1200,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json() as { content: { text: string }[] };
        const text = data.content?.[0]?.text ?? "";
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const insights = JSON.parse(jsonMatch[0]);
            return NextResponse.json({ ok: true, insights, provider: "claude" });
          }
        } catch {
          return NextResponse.json({ ok: true, insights: { raw: text }, provider: "claude" });
        }
      }
    }

    if (openaiKey) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: AI_MODELS.OPENAI_FAST,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1200,
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
      });

      if (response.ok) {
        const data = await response.json() as { choices: { message: { content: string } }[] };
        const text = data.choices?.[0]?.message?.content ?? "";
        try {
          const insights = JSON.parse(text);
          return NextResponse.json({ ok: true, insights, provider: "openai" });
        } catch {
          return NextResponse.json({ ok: true, insights: { raw: text }, provider: "openai" });
        }
      }
    }

    // Fallback — generate local insights from data
    const fallbackInsights = {
      executiveSummary: `${analysis.title || analysis.inputUrl} scored ${analysis.score ?? 0}/100 with a "${analysis.verdict}" verdict. ${(analysis.score ?? 0) >= 60 ? "This shows promise and is worth pursuing with strategic improvements." : "This needs significant work before it can convert effectively."}`,
      marketPosition: `Based on the ${opp?.differentiation ?? 0}/100 differentiation score, ${(opp?.differentiation ?? 0) >= 60 ? "this offer has a unique angle that sets it apart." : "this offer needs a stronger unique selling proposition to stand out."}`,
      audienceInsight: `${packet?.audience ?? "Target audience unclear"} — ${packet?.painDesire ?? "pain/desire signals need strengthening."}`,
      biggestOpportunity: `${opp?.recommendedPath ?? "Focus on strengthening the weakest dimension scores to unlock growth."}`,
      biggestRisk: `${(opp?.risk ?? 0) > 60 ? "High risk profile — multiple foundational elements are missing." : (opp?.trustCredibility ?? 0) < 40 ? "Trust and credibility are critically low — this will kill cold traffic conversion." : "Monitor competitive landscape — the current positioning may be easily replicated."}`,
      strategyRecommendations: [
        ...(JSON.parse(JSON.stringify(packet?.nextActions ?? ["Improve the weakest scoring dimension first"]))).slice(0, 3),
      ],
      adAngle: `Lead with ${packet?.angle ?? "the primary pain point"} — this resonates most with the target audience.`,
      emailPlaybook: `${(opp?.emailLifecyclePotential ?? 0) >= 60 ? "Strong lifecycle potential — build a 5-part nurture sequence focusing on education then urgency." : "Low lifecycle signals — start with a 3-part welcome sequence to build trust before selling."}`,
      landingPageAdvice: `${(opp?.conversionReadiness ?? 0) >= 60 ? "Page structure is solid — optimize headlines and add more social proof." : "Needs a complete conversion overhaul — start with a clear headline, strong CTA, and trust elements."}`,
      competitiveAdvantage: `${(opp?.differentiation ?? 0) >= 60 ? "Leverage existing unique elements in all marketing." : "Create differentiation through superior positioning, guarantee, or bundled value."}`,
      scoreJustification: `Score of ${analysis.score ?? 0}/100 reflects ${(JSON.parse(JSON.stringify(opp?.topStrengths ?? []))).slice(0, 2).join("; ") || "limited strengths"}. ${(JSON.parse(JSON.stringify(opp?.topGaps ?? []))).slice(0, 2).join("; ") || "Key gaps need addressing."}`,
    };

    return NextResponse.json({ ok: true, insights: fallbackInsights, provider: "local" });
  } catch (err) {
    console.error("AI insights:", err);
    return NextResponse.json({ ok: false, error: "Failed to generate insights" }, { status: 500 });
  }
}
