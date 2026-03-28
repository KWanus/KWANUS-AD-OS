import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { getBusinessContext } from "@/lib/archetypes/getBusinessContext";
import type { ExecutionTier } from "@/lib/sites/conversionEngine";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

    const body = await req.json() as {
      leadId?: string;
      niche?: string;
      businessName?: string;
      businessUrl?: string;
      location?: string;
      problem?: string;
      budget?: string;
      executionTier?: ExecutionTier;
    };
    const { leadId, niche, businessName, businessUrl, location, problem, budget } = body;
    const executionTier: ExecutionTier = body.executionTier === "core" ? "core" : "elite";

    if (!niche || !businessName) {
      return NextResponse.json(
        { ok: false, error: "niche and businessName are required" },
        { status: 400 }
      );
    }

    // Enrich with lead data if provided
    let leadContext = "";
    const businessContext = await getBusinessContext(user.id);
    if (leadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: leadId, userId: user.id },
      });
      if (lead) {
        leadContext = `
Lead Intelligence Data:
- Rating: ${lead.rating ?? "N/A"} stars (${lead.reviewCount ?? 0} reviews)
- Current Score: ${lead.score ?? "N/A"}/100
- Verdict: ${lead.verdict ?? "N/A"}
- Key Pain Points: ${lead.painPoints ?? "Unknown"}
- Top Gaps: ${JSON.stringify(lead.topGaps ?? [])}
- Top Strengths: ${JSON.stringify(lead.topStrengths ?? [])}
- AI Summary: ${lead.summary ?? "N/A"}`;
      }
    }

    const prompt = `Create a high-converting sales proposal for:

Business: ${businessName}
Niche: ${niche}
Website: ${businessUrl ?? "Not provided"}
Location: ${location ?? "Not specified"}
Stated Problem: ${problem ?? "Not specified"}
Budget Signal: ${budget ?? "Not specified"}
Execution tier: ${executionTier}
${executionTier === "elite"
  ? "Write like a top-closing consultant. Sharper diagnosis, more premium positioning, stronger package logic, and a CTA that feels expensive and inevitable."
  : "Write a strong, persuasive, practical consulting proposal that is easy to sell and easy to understand."}
${leadContext}
${businessContext}

Generate a complete, persuasive proposal that would close a premium consulting engagement. Use psychological triggers: problem agitation, unique solution, social proof, risk reversal, and urgency.

Return ONLY this JSON:
{
  "title": "Compelling proposal title",
  "problemStatement": "3-4 sentences agitating their exact pain. Be specific. Make them feel seen.",
  "solution": "Your unique methodology and approach. Why you. Why now.",
  "socialProof": "Relevant case studies, results, or proof points (can be illustrative for the niche)",
  "guarantee": "Your risk-reversal guarantee that removes objections",
  "urgency": "Legitimate urgency reason to act now",
  "packages": [
    {
      "name": "Starter",
      "price": 497,
      "deliverables": ["deliverable 1", "deliverable 2", "deliverable 3"],
      "bestFor": "Who this tier is ideal for"
    },
    {
      "name": "Growth",
      "price": 1497,
      "deliverables": ["deliverable 1", "deliverable 2", "deliverable 3", "deliverable 4"],
      "bestFor": "Who this tier is ideal for"
    },
    {
      "name": "Elite",
      "price": 3997,
      "deliverables": ["deliverable 1", "deliverable 2", "deliverable 3", "deliverable 4", "deliverable 5"],
      "bestFor": "Who this tier is ideal for"
    }
  ],
  "closingStatement": "Powerful closing paragraph that reinforces transformation and creates desire",
  "callToAction": "Specific CTA text and next step"
}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: GLOBAL_RULE,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
    const match = raw.match(/\{[\s\S]+\}/);
    if (!match) {
      return NextResponse.json({ ok: false, error: "AI returned invalid JSON" }, { status: 500 });
    }

    const aiData = JSON.parse(match[0]) as {
      title: string;
      problemStatement: string;
      solution: string;
      socialProof: string;
      guarantee: string;
      urgency: string;
      packages: Array<{ name: string; price: number; deliverables: string[]; bestFor: string }>;
      closingStatement: string;
      callToAction: string;
    };

    const totalValue = aiData.packages.reduce((sum, pkg) => sum + (pkg.price ?? 0), 0);

    const proposal = await prisma.proposal.create({
      data: {
        userId: user.id,
        leadId: leadId ?? null,
        title: aiData.title,
        problemStatement: aiData.problemStatement,
        solution: aiData.solution,
        socialProof: aiData.socialProof,
        guarantee: aiData.guarantee,
        urgency: aiData.urgency,
        packages: aiData.packages as object,
        totalValue,
        aiJson: {
          ...aiData,
          executionTier,
        } as object,
        status: "draft",
      },
    });

    return NextResponse.json({ ok: true, proposal, executionTier }, { status: 201 });
  } catch (err) {
    console.error("Proposal generate error:", err);
    return NextResponse.json({ ok: false, error: "Failed to generate proposal" }, { status: 500 });
  }
}
