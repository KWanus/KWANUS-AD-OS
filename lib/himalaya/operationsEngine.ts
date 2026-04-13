// ---------------------------------------------------------------------------
// Operations Engine — the systems that keep the business running
//
// Handles gaps 79-83:
// 79. Partnership/collaboration finder
// 80. Team/VA access
// 81. Activity log
// 82. Error recovery dashboard
// 83. System health check
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { generateAI } from "@/lib/integrations/aiInference";

// ── 79. Partnership Finder ───────────────────────────────────────────────────

export async function findPartnerships(input: {
  niche: string;
  businessType: string;
  targetAudience: string;
}): Promise<{
  collaborationIdeas: { type: string; description: string; howToFind: string }[];
  affiliateOpportunities: { name: string; commission: string; relevance: string }[];
  crossPromotionAngles: string[];
}> {
  const result = await generateAI({
    prompt: `For a ${input.businessType} in ${input.niche} targeting ${input.targetAudience}:

Return JSON:
{
  "collaborationIdeas": [
    {"type":"Guest content","description":"Write for a bigger blog","howToFind":"Search '[niche] + write for us'"},
    {"type":"Joint webinar","description":"...","howToFind":"..."},
    {"type":"Bundle deal","description":"...","howToFind":"..."},
    {"type":"Podcast appearance","description":"...","howToFind":"..."}
  ],
  "affiliateOpportunities": [
    {"name":"Relevant product/service","commission":"20-50%","relevance":"Your audience already needs this"}
  ],
  "crossPromotionAngles": ["3 specific ways to cross-promote with complementary businesses"]
}`,
    systemPrompt: "You are a business development strategist. Be specific, not generic. Return only JSON.",
    maxTokens: 800,
  });

  try { return JSON.parse(result.content); }
  catch {
    return {
      collaborationIdeas: [
        { type: "Guest content", description: "Write for established blogs in your niche", howToFind: `Search "${input.niche} write for us" or "guest post ${input.niche}"` },
        { type: "Podcast appearances", description: "Get on podcasts your audience listens to", howToFind: `Search "${input.niche} podcast" on Apple Podcasts, then email hosts` },
        { type: "Joint webinar", description: "Team up with a complementary business for a free training", howToFind: "Find businesses that serve the same audience but sell different things" },
      ],
      affiliateOpportunities: [],
      crossPromotionAngles: [
        "Shout-for-shout on social media with similar-sized accounts",
        "Bundle your product with a complementary product for a joint offer",
        "Create a free resource together (co-branded guide/template)",
      ],
    };
  }
}

// ── 81. Activity Log ─────────────────────────────────────────────────────────

export type ActivityEntry = {
  id: string;
  action: string;
  details: string;
  category: "system" | "user" | "automation" | "error";
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export async function getActivityLog(userId: string, limit: number = 50): Promise<ActivityEntry[]> {
  const events = await prisma.himalayaFunnelEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, event: true, metadata: true, createdAt: true },
  });

  const actionMap: Record<string, { action: string; category: ActivityEntry["category"] }> = {
    full_business_deployed: { action: "Business deployed", category: "system" },
    site_deployed: { action: "Site published", category: "system" },
    campaign_optimized: { action: "Ads optimized", category: "automation" },
    command_completed: { action: "Command completed", category: "user" },
    milestone_achieved: { action: "Milestone reached", category: "system" },
    voice_call_made: { action: "Voice call initiated", category: "automation" },
    lead_contacted: { action: "Lead contacted", category: "automation" },
    organic_content_generated: { action: "Content generated", category: "system" },
    revenue_system_generated: { action: "Revenue system built", category: "system" },
    platform_reengagement: { action: "Re-engagement sent", category: "automation" },
    testimonial_request_sent: { action: "Review request sent", category: "automation" },
    split_test_created: { action: "Split test started", category: "user" },
    track_pageview: { action: "Site page view", category: "system" },
    track_form_submit: { action: "Form submitted", category: "system" },
    track_click: { action: "CTA clicked", category: "system" },
  };

  return events.map(e => {
    const meta = (e.metadata ?? {}) as Record<string, unknown>;
    const mapped = actionMap[e.event] ?? { action: e.event.replace(/_/g, " "), category: "system" as const };

    return {
      id: e.id,
      action: mapped.action,
      details: (meta.title as string) ?? (meta.milestoneId as string) ?? (meta.url as string) ?? "",
      category: mapped.category,
      timestamp: e.createdAt.toISOString(),
      metadata: meta,
    };
  });
}

// ── 82. Error Recovery ───────────────────────────────────────────────────────

export async function getRecentErrors(userId: string): Promise<{
  errors: { area: string; message: string; timestamp: string; recoverable: boolean; fixAction?: string }[];
  systemHealthy: boolean;
}> {
  // Check for deploy errors
  const deployEvents = await prisma.himalayaFunnelEvent.findMany({
    where: { userId, event: "full_business_deployed", createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { metadata: true, createdAt: true },
  });

  const errors: { area: string; message: string; timestamp: string; recoverable: boolean; fixAction?: string }[] = [];

  for (const event of deployEvents) {
    const meta = (event.metadata ?? {}) as Record<string, unknown>;
    const errs = (meta.errors ?? []) as string[];
    for (const err of errs) {
      errors.push({
        area: err.split(":")[0] ?? "Deploy",
        message: err,
        timestamp: event.createdAt.toISOString(),
        recoverable: true,
        fixAction: err.includes("image") ? "Retry image generation from campaign page" :
          err.includes("site") ? "Publish site manually" :
          err.includes("email") ? "Configure email provider in Settings" :
          "Redeploy from Himalaya",
      });
    }
  }

  return { errors, systemHealthy: errors.length === 0 };
}

// ── 83. System Health Check ──────────────────────────────────────────────────

export type HealthStatus = {
  overall: "healthy" | "degraded" | "critical";
  checks: {
    name: string;
    status: "ok" | "warning" | "error";
    detail: string;
  }[];
  lastChecked: string;
};

export async function runHealthCheck(userId: string): Promise<HealthStatus> {
  const checks: HealthStatus["checks"] = [];

  // Database
  try {
    await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    checks.push({ name: "Database", status: "ok", detail: "Connected and responsive" });
  } catch {
    checks.push({ name: "Database", status: "error", detail: "Cannot reach database" });
  }

  // Email provider
  const hasEmail = !!(process.env.RESEND_API_KEY || process.env.SMTP_HOST || process.env.GMAIL_USER);
  checks.push({
    name: "Email",
    status: hasEmail ? "ok" : "warning",
    detail: hasEmail ? "Email provider configured" : "No email provider — flows won't send",
  });

  // AI provider
  const hasAI = !!(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY);
  checks.push({
    name: "AI Engine",
    status: hasAI ? "ok" : "warning",
    detail: hasAI ? "AI provider available" : "No AI provider — generation will use templates",
  });

  // Image generation
  const hasImages = !!(process.env.FAL_KEY || process.env.OPENAI_API_KEY);
  checks.push({
    name: "Image Generation",
    status: hasImages ? "ok" : "warning",
    detail: hasImages ? "Image generation available" : "No image API — ads will be text only",
  });

  // Stripe
  const hasStripe = !!process.env.STRIPE_SECRET_KEY;
  checks.push({
    name: "Payments",
    status: hasStripe ? "ok" : "warning",
    detail: hasStripe ? "Stripe connected" : "Stripe not configured — payments won't process",
  });

  // Ad platforms
  const hasMeta = !!process.env.META_APP_ID;
  checks.push({
    name: "Ad Platforms",
    status: hasMeta ? "ok" : "warning",
    detail: hasMeta ? "Meta Ads configured" : "No ad platforms connected — ads stay in Himalaya only",
  });

  // Published sites
  const publishedCount = await prisma.site.count({ where: { userId, published: true } }).catch(() => 0);
  checks.push({
    name: "Published Sites",
    status: publishedCount > 0 ? "ok" : "warning",
    detail: publishedCount > 0 ? `${publishedCount} site(s) live` : "No published sites — visitors can't find you",
  });

  // Active email flows
  const activeFlows = await prisma.emailFlow.count({ where: { userId, status: "active" } }).catch(() => 0);
  checks.push({
    name: "Email Flows",
    status: activeFlows > 0 ? "ok" : "warning",
    detail: activeFlows > 0 ? `${activeFlows} flow(s) active` : "No active flows — leads won't get follow-up",
  });

  const errorCount = checks.filter(c => c.status === "error").length;
  const warningCount = checks.filter(c => c.status === "warning").length;

  return {
    overall: errorCount > 0 ? "critical" : warningCount >= 3 ? "degraded" : "healthy",
    checks,
    lastChecked: new Date().toISOString(),
  };
}

// ── 80. Team Access — store team members ─────────────────────────────────────

export type TeamMember = {
  email: string;
  role: "admin" | "editor" | "viewer";
  invitedAt: string;
  accepted: boolean;
};

export async function getTeamMembers(userId: string): Promise<TeamMember[]> {
  const events = await prisma.himalayaFunnelEvent.findMany({
    where: { userId, event: "team_member_added" },
    select: { metadata: true },
  });
  return events.map(e => {
    const m = e.metadata as Record<string, unknown>;
    return {
      email: (m.email as string) ?? "",
      role: (m.role as TeamMember["role"]) ?? "viewer",
      invitedAt: (m.invitedAt as string) ?? "",
      accepted: (m.accepted as boolean) ?? false,
    };
  });
}

export async function addTeamMember(userId: string, email: string, role: TeamMember["role"]): Promise<void> {
  await prisma.himalayaFunnelEvent.create({
    data: {
      userId,
      event: "team_member_added",
      metadata: JSON.parse(JSON.stringify({ email, role, invitedAt: new Date().toISOString(), accepted: false })),
    },
  });
}
