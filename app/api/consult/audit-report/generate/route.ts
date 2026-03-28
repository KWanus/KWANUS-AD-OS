import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { callClaude, CONSULT_SYSTEM_PROMPT } from "@/lib/ai/claude";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import type { ExecutionTier } from "@/lib/sites/conversionEngine";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const limited = rateLimit(`ai:${user.id}`, RATE_LIMITS.aiGeneration);
    if (limited) return limited;

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
- Rating: ${lead.rating ?? "N/A"} (${lead.reviewCount ?? 0} reviews)
- AI Score: ${lead.score ?? score ?? "N/A"}/100
- Pain Points: ${lead.painPoints ?? "N/A"}
- Top Gaps: ${JSON.stringify(lead.topGaps ?? gaps ?? [])}
- Top Strengths: ${JSON.stringify(lead.topStrengths ?? strengths ?? [])}
- Weaknesses: ${JSON.stringify(lead.weaknesses ?? [])}
- Website: ${lead.website ?? website ?? "N/A"}`;
      }
    }

    const prompt = `Generate a detailed consultant audit report for this business prospect:

Business: ${businessName}
Niche: ${niche}
Location: ${location ?? "Not specified"}
Website: ${website ?? "Not provided"}
Overall Score: ${score ?? "Unknown"}/100
Known Gaps: ${JSON.stringify(gaps ?? [])}
Known Strengths: ${JSON.stringify(strengths ?? [])}
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

    const auditData = await callClaude<{
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
    }>(CONSULT_SYSTEM_PROMPT, prompt, { maxTokens: 4096 });

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
