import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { ExecutionTier } from "@/lib/sites/conversionEngine";
import { AI_MODELS } from "@/lib/ai/models";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const GLOBAL_RULE = `You are the world's best local SEO and digital marketing expert inside Himalaya Agency OS.
Return valid JSON only. No markdown. No commentary outside JSON.
Before generating any output, analyze what the TOP 1% local marketing agencies charge and deliver for this niche/location.
Then produce outputs that BEAT those benchmarks — more specific, higher ROI, better positioned.`;

async function callClaude(system: string, prompt: string) {
  const r = await anthropic.messages.create({
    model: AI_MODELS.CLAUDE_PRIMARY,
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  const raw = r.content[0].type === "text" ? r.content[0].text : "{}";
  const match = raw.match(/\{[\s\S]+\}/);
  if (!match) throw new Error("No JSON in Claude response");
  return JSON.parse(match[0]);
}

interface GeneratedPackage {
  name: string;
  tier: string;
  price: number;
  billingCycle: string;
  deliverables: string[];
  bestResults?: string;
  timeToResults?: string;
  targetNiche?: string;
  targetLocation?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user)
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { niche, location, auditId } = body as {
      niche: string;
      location: string;
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

    const prompt = `Generate 3-tier agency service packages for a local business in the following market:
Niche: ${niche}
Location: ${location}
Execution Tier: ${executionTier}

${executionTier === "elite"
  ? "Elite mode: build these like a premium local agency. Use stronger package contrast, sharper value ladders, better premium anchors, and clearer buyer-fit logic."
  : "Core mode: produce strong practical local service packages with clean value separation and credible pricing."}

Create pricing and deliverables that:
- Are competitive with top 1% local marketing agencies in this market
- Have a logical value ladder from Basic → Pro → Elite
- Include specific, tangible deliverables (not vague promises)
- Use market-appropriate pricing (research what agencies actually charge in this niche/location)
- Clearly articulate who each tier is best for

Return this exact JSON structure:
{
  "packages": [
    {
      "name": "descriptive package name (not just 'Basic')",
      "tier": "basic",
      "price": <monthly price as integer>,
      "billingCycle": "monthly",
      "deliverables": ["specific deliverable 1", "specific deliverable 2", "..."],
      "bestResults": "type of business this is ideal for",
      "timeToResults": "realistic timeline like '30-60 days'"
    },
    {
      "name": "descriptive package name",
      "tier": "pro",
      "price": <monthly price as integer>,
      "billingCycle": "monthly",
      "deliverables": ["..."],
      "bestResults": "...",
      "timeToResults": "..."
    },
    {
      "name": "descriptive package name",
      "tier": "elite",
      "price": <monthly price as integer>,
      "billingCycle": "monthly",
      "deliverables": ["..."],
      "bestResults": "...",
      "timeToResults": "..."
    }
  ]
}`;

    const result = await callClaude(GLOBAL_RULE, prompt);
    const packages: GeneratedPackage[] = Array.isArray(result.packages) ? result.packages : [];

    // Persist each package as a ServicePackage record
    const created = await Promise.all(
      packages.map((pkg, idx) =>
        prisma.servicePackage.create({
          data: {
            userId: user.id,
            name: pkg.name ?? `${pkg.tier} Package`,
            tier: pkg.tier ?? "basic",
            price: typeof pkg.price === "number" ? pkg.price : 497,
            billingCycle: pkg.billingCycle ?? "monthly",
            deliverables: Array.isArray(pkg.deliverables) ? pkg.deliverables : ([] as string[]),
            targetNiche: niche,
            targetLocation: location,
            sortOrder: idx,
            active: true,
          },
        })
      )
    );

    // If auditId provided, store packagesJson on the LocalAudit
    if (auditId) {
      await prisma.localAudit.update({
        where: { id: auditId },
        data: { packagesJson: result as object },
      });
    }

    return NextResponse.json({ ok: true, packages: created, raw: result, executionTier });
  } catch (err) {
    console.error("Packages generate POST error:", err);
    return NextResponse.json({ ok: false, error: "Failed to generate packages" }, { status: 500 });
  }
}
