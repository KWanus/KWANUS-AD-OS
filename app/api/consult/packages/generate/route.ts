import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { getBusinessContext } from "@/lib/archetypes/getBusinessContext";
import type { ExecutionTier } from "@/lib/sites/conversionEngine";
import { AI_MODELS } from "@/lib/ai/models";

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
      niche?: string;
      businessType?: string;
      targetClient?: string;
      executionTier?: ExecutionTier;
    };
    const { niche, businessType, targetClient } = body;
    const executionTier: ExecutionTier = body.executionTier === "core" ? "core" : "elite";

    if (!niche || !businessType || !targetClient) {
      return NextResponse.json(
        { ok: false, error: "niche, businessType, and targetClient are required" },
        { status: 400 }
      );
    }

    const businessContext = await getBusinessContext(user.id);

    const prompt = `Generate 3 consulting/coaching packages (Starter, Pro, VIP) for:
Niche: ${niche}
Business Type: ${businessType}
Target Client: ${targetClient}
Execution tier: ${executionTier}
${executionTier === "elite"
  ? "Build packages like a top 1% consultant: stronger offer framing, cleaner value ladders, better scope separation, and more premium price logic."
  : "Build strong, practical, conversion-ready packages a consultant could sell quickly."}
${businessContext}

Research what the top 1% of consultants in this exact niche charge. Then create packages that are priced and positioned BETTER.

Return ONLY this JSON structure:
{
  "packages": [
    {
      "name": "Starter Audit",
      "type": "project",
      "price": 497,
      "billingCycle": "one_time",
      "duration": "3 days",
      "deliverables": ["deliverable 1", "deliverable 2"],
      "isHighTicket": false,
      "targetNiche": "${niche}",
      "positioning": "Best for clients who..."
    },
    {
      "name": "Pro Growth",
      "type": "retainer",
      "price": 2497,
      "billingCycle": "monthly",
      "duration": "90 days",
      "deliverables": ["deliverable 1", "deliverable 2", "deliverable 3"],
      "isHighTicket": false,
      "targetNiche": "${niche}",
      "positioning": "Best for clients who..."
    },
    {
      "name": "VIP Elite",
      "type": "vip_day",
      "price": 9997,
      "billingCycle": "one_time",
      "duration": "1 day intensive + 30 days support",
      "deliverables": ["deliverable 1", "deliverable 2", "deliverable 3", "deliverable 4"],
      "isHighTicket": true,
      "targetNiche": "${niche}",
      "positioning": "Best for clients who..."
    }
  ]
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

    const parsed = JSON.parse(match[0]) as {
      packages: Array<{
        name: string;
        type: string;
        price: number;
        billingCycle: string;
        duration?: string;
        deliverables: string[];
        isHighTicket: boolean;
        targetNiche: string;
        positioning?: string;
      }>;
    };

    const created = await Promise.all(
      parsed.packages.map((pkg, index) =>
        prisma.consultPackage.create({
          data: {
            userId: user.id,
            name: pkg.name,
            type: pkg.type,
            price: Number(pkg.price),
            billingCycle: pkg.billingCycle,
            duration: pkg.duration ?? null,
            deliverables: pkg.deliverables,
            isHighTicket: pkg.isHighTicket ?? false,
            targetNiche: pkg.targetNiche ?? niche,
            sortOrder: index,
          },
        })
      )
    );

    return NextResponse.json({ ok: true, packages: created, executionTier }, { status: 201 });
  } catch (err) {
    console.error("Package generate error:", err);
    return NextResponse.json({ ok: false, error: "Failed to generate packages" }, { status: 500 });
  }
}
