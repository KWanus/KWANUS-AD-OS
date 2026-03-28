import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { extractUrl, scanUrlForCopilot, formatScanForPrompt } from "@/lib/scanForCopilot";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { getBusinessContext } from "@/lib/archetypes/getBusinessContext";
import { ARCHETYPES, type BusinessType, type SystemSlug } from "@/lib/archetypes";
import type { ExecutionTier } from "@/lib/sites/conversionEngine";
import { AI_MODELS } from "@/lib/ai/models";
import { config } from "@/lib/config";

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

// ─── Context builder ───────────────────────────────────────────────────────────

async function buildUserContext(userId: string): Promise<string> {
  const [leads, affiliateOffers, dropshipProducts, proposals, agencyAudits, localAudits, recentAnalyses, clients] =
    await Promise.all([
      prisma.lead.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, name: true, niche: true, location: true, status: true, score: true },
      }),
      prisma.affiliateOffer.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, name: true, platform: true, niche: true, status: true, commission: true, gravity: true },
      }),
      prisma.dropshipProduct.findMany({
        where: { userId },
        orderBy: { winnerScore: "desc" },
        take: 10,
        select: { id: true, name: true, niche: true, status: true, winnerScore: true, suggestedPrice: true, profitMargin: true },
      }),
      prisma.proposal.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, status: true, totalValue: true, createdAt: true },
      }),
      prisma.agencyAudit.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, businessName: true, niche: true, businessType: true, overallScore: true, status: true },
      }),
      prisma.localAudit.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, businessName: true, niche: true, overallScore: true },
      }),
      prisma.analysisRun.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, inputUrl: true, score: true, verdict: true, mode: true },
      }),
      prisma.client.findMany({
        where: { userId },
        orderBy: { healthScore: "asc" },
        take: 10,
        select: { id: true, name: true, pipelineStage: true, healthScore: true, healthStatus: true, dealValue: true },
      }),
    ]);

  const leadsLine = leads.length
    ? leads.map((l) => `${l.name} [${l.niche} - ${l.location} - ${l.status} - ${l.score ?? "??"}/100]`).join(", ")
    : "none";

  const offersLine = affiliateOffers.length
    ? affiliateOffers.map((o) => `${o.name} [${o.platform} - ${o.commission ?? "??"} - ${o.status}${o.gravity != null ? ` - gravity ${o.gravity}` : ""}]`).join(", ")
    : "none";

  const dropshipLine = dropshipProducts.length
    ? dropshipProducts.map((p) => `${p.name} [${p.niche} - ${p.winnerScore ?? "??"}/100 - $${p.suggestedPrice ?? "??"} - ${p.profitMargin != null ? `${p.profitMargin}% margin` : "?? margin"}]`).join(", ")
    : "none";

  const proposalsLine = proposals.length
    ? proposals.map((p) => `${p.title} [${p.status} - $${p.totalValue ?? "??"}]`).join(", ")
    : "none";

  const agencyAuditsLine = agencyAudits.length
    ? agencyAudits.map((a) => `${a.businessName} [${a.businessType} - ${a.overallScore ?? "??"}/100 - ${a.status}]`).join(", ")
    : "none";

  const localAuditsLine = localAudits.length
    ? localAudits.map((a) => `${a.businessName} [${a.niche ?? "?"} - ${a.overallScore ?? "??"}/100]`).join(", ")
    : "none";

  const analysesLine = recentAnalyses.length
    ? recentAnalyses.map((a) => `${a.title || a.inputUrl} [${a.score ?? "??"}/100 - ${a.verdict ?? "??"} - ${a.mode}]`).join(", ")
    : "none";

  const clientsLine = clients.length
    ? clients.map((c) => `${c.name} [${c.pipelineStage} - health:${c.healthScore}/100 (${c.healthStatus})${c.dealValue ? ` - $${c.dealValue}` : ""}]`).join(", ")
    : "none";

  const atRiskClients = clients.filter((c) => c.healthStatus === "red");
  const clientAlert = atRiskClients.length > 0
    ? `\n⚠️ AT-RISK CLIENTS (${atRiskClients.length}): ${atRiskClients.map((c) => `${c.name} (score:${c.healthScore})`).join(", ")} — recommend immediate follow-up`
    : "";

  return `=== YOUR ACTIVE WORKSPACE ===
RECENT SCANS (${recentAnalyses.length}): ${analysesLine}
CLIENTS (${clients.length}): ${clientsLine}${clientAlert}
LEADS (${leads.length}): ${leadsLine}
AFFILIATE OFFERS (${affiliateOffers.length}): ${offersLine}
DROPSHIP PRODUCTS (${dropshipProducts.length}): ${dropshipLine}
PROPOSALS (${proposals.length}): ${proposalsLine}
AGENCY AUDITS (${agencyAudits.length}): ${agencyAuditsLine}
LOCAL AUDITS (${localAudits.length}): ${localAuditsLine}`;
}

function detectLiveSystems(counts: {
  campaigns: number;
  sites: number;
  leads: number;
  emailFlows: number;
  clients: number;
}) {
  const live = new Set<string>();

  if (counts.sites > 0) {
    live.add("website");
    live.add("product_page");
    live.add("bridge_page");
  }
  if (counts.campaigns > 0) {
    live.add("google_ads");
    live.add("facebook_ads");
    live.add("tiktok_ads");
    live.add("upsell_flow");
  }
  if (counts.emailFlows > 0) {
    live.add("email_sequence");
    live.add("sms_followup");
    live.add("abandoned_cart");
  }
  if (counts.clients > 0) {
    live.add("crm_pipeline");
    live.add("proposal_system");
    live.add("white_label_reports");
  }
  if (counts.leads > 0) {
    live.add("lead_magnet");
    live.add("booking_flow");
    live.add("review_system");
  }

  return Array.from(live);
}

function computeSystemScore(businessType: BusinessType | null, activeSystems: string[]): number {
  if (!businessType || !ARCHETYPES[businessType]) return Math.min(activeSystems.length * 10, 100);

  const systemMap = new Map(ARCHETYPES[businessType].systems.map((system) => [system.slug, system.priority]));
  let score = 0;
  for (const slug of activeSystems) {
    const priority = systemMap.get(slug as SystemSlug);
    if (priority === "essential") score += 18;
    else if (priority === "recommended") score += 10;
    else if (priority === "optional") score += 5;
    else score += 4;
  }
  return Math.min(score, 100);
}

function getOsVerdict(input: {
  effectiveSystemScore: number;
  unsyncedSystems: string[];
  missingCoreSystems: string[];
  recommendationAgeMs: number | null;
}) {
  const { effectiveSystemScore, unsyncedSystems, missingCoreSystems, recommendationAgeMs } = input;
  const recommendationIsStale = recommendationAgeMs !== null && recommendationAgeMs > 1000 * 60 * 60 * 24 * 7;

  if (unsyncedSystems.length > 0) {
    return "Needs Repair";
  }
  if (missingCoreSystems.length > 0 || effectiveSystemScore < 45) {
    return "Needs Attention";
  }
  if (recommendationIsStale) {
    return "Refresh Soon";
  }
  return "Healthy";
}

async function buildOsContext(userId: string): Promise<string> {
  const [campaignCount, siteCount, leadCount, emailFlowCount, clientCount, profile] = await Promise.all([
    prisma.campaign.count({ where: { userId } }),
    prisma.site.count({ where: { userId } }),
    prisma.lead.count({ where: { userId } }),
    prisma.emailFlow.count({ where: { userId } }),
    prisma.client.count({ where: { userId } }),
    prisma.businessProfile.findUnique({
      where: { userId },
      select: {
        businessType: true,
        activeSystems: true,
        recommendedAt: true,
      },
    }),
  ]);

  const activeSystems = Array.isArray(profile?.activeSystems)
    ? profile.activeSystems.filter((item): item is string => typeof item === "string")
    : [];
  const liveSystems = detectLiveSystems({
    campaigns: campaignCount,
    sites: siteCount,
    leads: leadCount,
    emailFlows: emailFlowCount,
    clients: clientCount,
  });
  const unsyncedSystems = liveSystems.filter((slug) => !activeSystems.includes(slug));
  const missingCoreSystems = ["website", "email_sequence", "crm_pipeline"].filter((slug) => !activeSystems.includes(slug));
  const effectiveSystems = Array.from(new Set([...activeSystems, ...liveSystems]));
  const effectiveSystemScore = computeSystemScore((profile?.businessType as BusinessType | null | undefined) ?? null, effectiveSystems);
  const recommendationAgeMs = profile?.recommendedAt ? Date.now() - new Date(profile.recommendedAt).getTime() : null;
  const verdict = getOsVerdict({
    effectiveSystemScore,
    unsyncedSystems,
    missingCoreSystems,
    recommendationAgeMs,
  });

  return `=== BUSINESS OS STATUS ===
VERDICT: ${verdict}
EFFECTIVE SYSTEM SCORE: ${effectiveSystemScore}/100
ACTIVE SYSTEMS: ${activeSystems.length ? activeSystems.join(", ") : "none"}
LIVE SYSTEMS: ${liveSystems.length ? liveSystems.join(", ") : "none"}
UNSYNCED SYSTEMS: ${unsyncedSystems.length ? unsyncedSystems.join(", ") : "none"}
MISSING CORE SYSTEMS: ${missingCoreSystems.length ? missingCoreSystems.join(", ") : "none"}
RECOMMENDATION FRESHNESS: ${recommendationAgeMs == null ? "never refreshed" : recommendationAgeMs > 1000 * 60 * 60 * 24 * 7 ? "stale" : "current"}
=== END BUSINESS OS STATUS ===`;
}

// ─── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(
  workspaceContext: string,
  businessContext: string,
  osContext: string,
  executionTier: ExecutionTier
): string {
  return `You are the Himalaya Agency OS AI Copilot — the most advanced business-building AI assistant ever created.

You have full context about the user's active business across every vertical:
- Consultant/Coach work: proposals, audit reports, service packages
- Local service businesses: audits, GMB optimization, review systems
- Affiliate marketing: offer research, funnel building, swipe copy
- Dropshipping: product research, winner scoring, store content
- Agency/white-label: business audits, 90-day strategies, proposals

${workspaceContext}
${businessContext}
${osContext}
=== EXECUTION LANE ===
ACTIVE EXECUTION TIER: ${executionTier.toUpperCase()}
${executionTier === "elite"
  ? "Respond like a top-agency operator: sharper positioning, stronger proof logic, clearer objections, and higher-conviction next moves."
  : "Respond with strong operator-ready clarity: practical, direct, structured, and immediately usable."}

Your capabilities:
- Analyze any business, product, or offer
- Generate proposals, packages, ad copy, email sequences
- Research niches, competitors, and market opportunities
- Build full funnels, landing pages, and email flows
- Provide specific recommendations based on the user's actual data

## Himalaya Platform — Feature Map

### Analyze (/analyze)
- Paste any URL or describe a product/niche → full competitor intelligence report
- Scores 0-100: audience, pain points, conversion readiness, ad viability, SEO potential
- Generates: ad hooks, scripts, landing page copy, email sequences, execution checklist

### Campaigns (/campaigns)
- 5-phase workflow: SOURCE → AUDIT → STRATEGIZE → PRODUCE → DEPLOY
- Stores ad variations, landing page drafts, email sequences

### Sites (/websites)
- Drag-and-drop funnel/website builder — Golden Funnel, Landing Page, Store templates
- Zero transaction fees — publish at himalaya.co/s/[slug] or custom domain

### Emails (/emails)
- Visual automation flows (welcome, cart abandon, post-purchase)
- Broadcasts, contacts, analytics — connect your own Resend API key

### Leads (/leads)
- Find local businesses to pitch — AI-scored leads with full profiles
- Ad hooks, outreach emails, landing pages auto-generated per lead

### Affiliate (/affiliate)
- Research and track affiliate offers across ClickBank, JVZoo, Amazon, and more
- AI generates: funnels, bridge pages, email swipes, ad hooks, keyword research

### Dropship (/dropship)
- Product research + winner scoring — AI finds viable products with margin analysis
- Store content, UGC briefs, ad angles, abandoned cart flows

### Consult (/consult)
- Proposals, service packages, audit reports for consultant/coach businesses
- Full 90-day strategies and white-label deliverables

### Agency (/agency)
- Full business audits (20-point AI analysis) for any business type
- White-label proposals, 90-day roadmaps, pricing recommendations

### Local (/local)
- Local business audits: GMB, reviews, citations, website, SEO scores
- Review request templates, GMB post calendar, package recommendations

### CRM (/clients)
- Pipeline: Lead → Qualified → Proposal → Active → Won → Churned
- Health scoring, activity timeline, AI follow-up drafts

### Skills (/skills)
- One-click AI tools: Ad Copy, TikTok Script, Google Ads Pack, Landing Page, Email Nurture, Sales Script

Rules:
- Always give specific, actionable answers — never generic advice
- Reference the user's actual workspace data when relevant (use the workspace context above)
- Use the Business OS verdict when prioritizing advice. If the OS says "Needs Repair", lead with repair/sync actions before net-new expansion.
- Before any recommendation, think about what the TOP 1% in that niche does
- Match the requested execution lane. ` + (executionTier === "elite"
    ? "Elite means premium, high-conviction, top-operator execution."
    : "Core means strong, pragmatic, operator-ready execution without unnecessary flourish.") + `
- Keep responses focused and direct
- If asked to generate something, produce actual content (not instructions)
- Return structured markdown with headers when listing multiple items
- Link to specific app paths like /leads, /affiliate, /agency when recommending actions`;
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    if (!config.anthropicApiKey) {
      return NextResponse.json(
        { ok: false, error: "AI service not configured. Please set ANTHROPIC_API_KEY in your environment." },
        { status: 503 }
      );
    }

    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      messages: { role: "user" | "assistant"; content: string }[];
      executionTier?: ExecutionTier;
    };
    const executionTier: ExecutionTier = body.executionTier === "core" ? "core" : "elite";

    if (!body.messages?.length) {
      return NextResponse.json({ ok: false, error: "No messages" }, { status: 400 });
    }

    // Resolve internal user ID for DB queries
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // Fetch workspace context and detect URL in parallel
    const lastUserMsg = [...body.messages].reverse().find((m) => m.role === "user");
    const detectedUrl = lastUserMsg ? extractUrl(lastUserMsg.content) : null;

    const [workspaceContext, businessContext, osContext, quickActionsRes, urlScan] = await Promise.all([
      buildUserContext(user.id),
      getBusinessContext(user.id),
      buildOsContext(user.id),
      fetch(new URL("/api/quick-actions", req.url), {
        headers: { cookie: req.headers.get("cookie") ?? "" },
      }).then(r => r.json()).catch(() => ({ ok: false })) as Promise<{
        ok: boolean;
        actions?: { priority: string; title: string; href: string }[];
      }>,
      detectedUrl
        ? Promise.race([
            scanUrlForCopilot(detectedUrl).catch(() => null),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 12000)),
          ])
        : Promise.resolve(null),
    ]);

    const quickActionsContext = quickActionsRes.ok && quickActionsRes.actions?.length
      ? `\n=== PRIORITIZED ACTIONS ===\n${quickActionsRes.actions.slice(0, 5).map(a => `[${a.priority.toUpperCase()}] ${a.title} → ${a.href}`).join("\n")}`
      : "";

    // Build system prompt with workspace context + quick actions
    let systemPrompt = buildSystemPrompt(
      workspaceContext + quickActionsContext,
      businessContext,
      osContext,
      executionTier
    );

    // Inject URL scan data if present
    if (urlScan) {
      const scanContext = formatScanForPrompt(urlScan);
      systemPrompt = `${systemPrompt}

---
## SCAN CONTEXT (injected automatically — the user just shared a URL)
${scanContext}

**Instructions for this response:**
- Lead with the score and verdict (e.g. "Scanned it — **${urlScan.score}/100, ${urlScan.verdict}**")
- Give your honest take on the biggest opportunity and the biggest problem
- Recommend 1-2 specific next actions using Himalaya (link to the relevant section)
- Mention the top 2 ad hooks if they're good
- Keep it under 250 words — punchy, consultant tone, not a data dump
`;
    }

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await anthropic.messages.create({
            model: AI_MODELS.CLAUDE_PRIMARY,
            max_tokens: 1024,
            system: systemPrompt,
            messages: body.messages.slice(-20),
            stream: true,
          });

          for await (const event of response) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Copilot error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
