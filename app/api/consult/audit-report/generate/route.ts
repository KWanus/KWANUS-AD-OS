import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import type { ExecutionTier } from "@/lib/sites/conversionEngine";
import { AI_MODELS } from "@/lib/ai/models";
import { config } from "@/lib/config";

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

function sanitize(value: unknown, max = 300): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\x00/g, "").replace(/[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "").trim().slice(0, max);
}

const GLOBAL_RULE = `You are the world's best business consultant and proposal writer inside Himalaya Agency OS.
Return valid JSON only. No markdown. No commentary outside JSON.
Before generating any output, research what the TOP 1% of consultants and coaches in this exact niche charge, deliver, and say.
Then produce outputs that BEAT those benchmarks — sharper positioning, stronger value props, higher conversion.`;

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { leadId, businessName, niche, location, website, score, gaps, strengths } = body;
    const executionTier: ExecutionTier = body.executionTier === "core" ? "core" : "elite";

    if (!businessName || !niche) {
      return NextResponse.json(
        { ok: false, error: "businessName and niche are required" },
        { status: 400 }
      );
    }

    // Enrich with lead data if provided
    let leadContext = "";
    if (leadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: leadId, userId: user.id },
      });
      if (lead) {
        leadContext = `
Lead Data:
- Rating: ${sanitize(lead.rating ?? "N/A")} (${lead.reviewCount ?? 0} reviews)
- AI Score: ${lead.score ?? score ?? "N/A"}/100
- Pain Points: ${sanitize(lead.painPoints ?? "N/A")}
- Top Gaps: ${sanitize(JSON.stringify(lead.topGaps ?? gaps ?? []))}
- Top Strengths: ${sanitize(JSON.stringify(lead.topStrengths ?? strengths ?? []))}
- Weaknesses: ${sanitize(JSON.stringify(lead.weaknesses ?? []))}
- Website: ${sanitize(lead.website ?? website ?? "N/A")}`;
      }
    }

    const prompt = `Generate a detailed consultant audit report for this business prospect:

Business: ${sanitize(businessName)}
Niche: ${sanitize(niche)}
Location: ${sanitize(location ?? "Not specified")}
Website: ${sanitize(website ?? "Not provided")}
Overall Score: ${sanitize(score ?? "Unknown")}/100
Known Gaps: ${sanitize(JSON.stringify(gaps ?? []))}
Known Strengths: ${sanitize(JSON.stringify(strengths ?? []))}
${leadContext}
Execution Tier: ${executionTier}

${executionTier === "elite"
  ? "Elite mode: write this like a premium consultant using the audit to create urgency, authority, and clear ROI framing. Sharpen the diagnosis, value framing, and proposed engagement."
  : "Core mode: write a strong, practical consultant audit report with clear gaps, wins, and next-step recommendations."}

Create a comprehensive, professional audit report that would impress a business owner and position you as the obvious expert. Be specific to their niche. Include actionable insights.

Return ONLY this JSON:
{
  "executiveSummary": "2-3 paragraph executive summary. Be direct about what's working and what's costing them money.",
  "scorecard": [
    {
      "category": "Website & Conversion",
      "score": 45,
      "grade": "C",
      "issues": ["Issue 1 specific to their niche", "Issue 2"],
      "quickWins": ["Quick win 1 they can do today", "Quick win 2"]
    },
    {
      "category": "Online Reputation & Reviews",
      "score": 60,
      "grade": "B-",
      "issues": ["Issue 1", "Issue 2"],
      "quickWins": ["Quick win 1", "Quick win 2"]
    },
    {
      "category": "Lead Generation & Traffic",
      "score": 35,
      "grade": "D+",
      "issues": ["Issue 1", "Issue 2"],
      "quickWins": ["Quick win 1", "Quick win 2"]
    },
    {
      "category": "Social Media & Content",
      "score": 40,
      "grade": "C-",
      "issues": ["Issue 1", "Issue 2"],
      "quickWins": ["Quick win 1", "Quick win 2"]
    },
    {
      "category": "Sales Process & Follow-Up",
      "score": 30,
      "grade": "D",
      "issues": ["Issue 1", "Issue 2"],
      "quickWins": ["Quick win 1", "Quick win 2"]
    }
  ],
  "topOpportunities": [
    {
      "title": "Specific opportunity title",
      "potentialValue": "$X,XXX/mo",
      "effort": "low",
      "timeline": "2-4 weeks",
      "description": "Specific explanation of this opportunity for their niche"
    },
    {
      "title": "Second opportunity",
      "potentialValue": "$X,XXX/mo",
      "effort": "medium",
      "timeline": "30-60 days",
      "description": "Specific explanation"
    },
    {
      "title": "Third opportunity",
      "potentialValue": "$XX,XXX/yr",
      "effort": "high",
      "timeline": "60-90 days",
      "description": "Specific explanation"
    }
  ],
  "recommendedNext": "Clear, specific recommendation for what they should do first and why. Make it feel urgent without being pushy.",
  "proposedEngagement": {
    "name": "Specific engagement package name",
    "price": 0,
    "deliverables": ["Deliverable 1", "Deliverable 2", "Deliverable 3"],
    "timeline": "X weeks",
    "expectedROI": "What they can realistically expect"
  }
}`;

    const response = await anthropic.messages.create({
      model: AI_MODELS.CLAUDE_PRIMARY,
      max_tokens: 4096,
      system: GLOBAL_RULE,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
    const match = raw.match(/\{[\s\S]+\}/);
    if (!match) {
      return NextResponse.json({ ok: false, error: "AI returned invalid JSON" }, { status: 500 });
    }

    const auditData = JSON.parse(match[0]) as {
      executiveSummary: string;
      scorecard: Array<{
        category: string;
        score: number;
        grade: string;
        issues: string[];
        quickWins: string[];
      }>;
      topOpportunities: Array<{
        title: string;
        potentialValue: string;
        effort: string;
        timeline: string;
        description: string;
      }>;
      recommendedNext: string;
      proposedEngagement: {
        name: string;
        price: number;
        deliverables: string[];
        timeline: string;
        expectedROI: string;
      };
    };

    // Store as a Proposal with audit type in aiJson
    const proposal = await prisma.proposal.create({
      data: {
        userId: user.id,
        leadId: leadId ?? null,
        title: `Audit Report: ${businessName}`,
        problemStatement: auditData.executiveSummary,
        solution: auditData.recommendedNext,
        packages: [auditData.proposedEngagement] as object,
        status: "draft",
        aiJson: {
          type: "audit_report",
          businessName,
          niche,
          location: location ?? null,
          website: website ?? null,
          executionTier,
          ...auditData,
        } as object,
      },
    });

    return NextResponse.json({ ok: true, proposal, report: auditData, executionTier }, { status: 201 });
  } catch (err) {
    console.error("Audit report generate error:", err);
    return NextResponse.json({ ok: false, error: "Failed to generate audit report" }, { status: 500 });
  }
}
