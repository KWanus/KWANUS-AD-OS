/**
 * generateLeadService — core lead asset generation extracted for direct service calls.
 * Used by both the route handler and the n8n webhook processor.
 */

import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { getBusinessContext } from "@/lib/archetypes/getBusinessContext";
import type { ExecutionTier } from "@/lib/sites/conversionEngine";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const GLOBAL_RULE = `You are a structured business-generation engine inside Himalaya Agency OS.
Your job is to analyze businesses in any niche and generate useful, conversion-focused outputs.
Rules:
- Return valid JSON only
- Do not include markdown
- Do not include commentary outside the JSON
- Be specific, practical, and business-relevant
- Do not hardcode any niche
- Adapt to the business type, location, and observed weaknesses
- Prioritize clarity, conversion, trust, and simplicity
- If information is missing, make grounded assumptions and include them in an "assumptions" field
- Keep outputs concise but high quality
- All recommendations must be realistic for a small business
- Before generating any output, mentally model what the TOP 1% of high-converting sites, ads, and emails in this specific niche look like
- Study the patterns of industry leaders, viral campaigns, and 8-figure funnels in this space
- Then produce outputs that BEAT those benchmarks — better hooks, sharper copy, stronger conversion architecture
- Never produce average or generic — every output must feel like it was crafted by the world's best copywriter and conversion specialist for this exact niche`;

async function callSkill(prompt: string): Promise<unknown> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: GLOBAL_RULE,
    messages: [{ role: "user", content: prompt }],
  });
  const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
  const match = raw.match(/\{[\s\S]+\}/);
  if (!match) throw new Error("No JSON returned from skill");
  return JSON.parse(match[0]);
}

export type GenerateLeadResult = {
  ok: boolean;
  executionTier?: ExecutionTier;
  error?: string;
};

export async function generateLeadById(
  leadId: string,
  userId: string,
  executionTierOverride?: ExecutionTier
): Promise<GenerateLeadResult> {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, userId } });
  if (!lead) return { ok: false, error: "Lead not found" };

  const storedExecutionTier =
    ((lead.analyzerJson as { executionTier?: ExecutionTier } | null | undefined)?.executionTier === "core"
      ? "core"
      : "elite") as ExecutionTier;
  const executionTier: ExecutionTier = executionTierOverride === "core" ? "core" : storedExecutionTier;
  const businessContext = await getBusinessContext(userId);

  await prisma.lead.update({ where: { id: leadId }, data: { status: "generating" } });

  try {
    const gaps = (lead.topGaps as string[] | null) ?? [];
    const strengths = (lead.topStrengths as string[] | null) ?? [];
    const weaknesses = (lead.weaknesses as string[] | null) ?? [];

    const analyzerPrompt = `You are the business-analyzer skill for Himalaya Agency OS.
Analyze this business and return JSON with this exact structure:
{
  "business_name": "",
  "niche": "",
  "location": "",
  "summary": "",
  "scores": { "design_score": 0, "trust_score": 0, "clarity_score": 0, "cta_score": 0, "conversion_score": 0 },
  "issues": [{ "title": "", "severity": "low|medium|high", "reason": "", "impact": "" }],
  "missed_opportunities": [""],
  "strengths": [""],
  "quick_wins": [""],
  "assumptions": [""]
}

Input:
- business_name: ${lead.name}
- niche: ${lead.niche}
- location: ${lead.location}
- website_url: ${lead.website ?? "none"}
- execution_tier: ${executionTier}
- ${executionTier === "elite"
      ? "Use top-operator specificity, stronger conversion criticism, and higher-conviction recommendations."
      : "Keep the output clear, useful, and launch-ready without overreaching."}
- known_score: ${lead.score ?? "N/A"}/100
- known_summary: ${lead.summary ?? "No website analysis available"}
- known_gaps: ${gaps.join(", ") || "none"}
- known_weaknesses: ${weaknesses.join(", ") || "none"}
- known_strengths: ${strengths.join(", ") || "none"}
${businessContext}`;

    const analyzerJson = await callSkill(analyzerPrompt);
    const analyzer = analyzerJson as {
      summary?: string;
      issues?: { title: string }[];
      strengths?: string[];
      missed_opportunities?: string[];
    };

    const profilePrompt = `You are the profile-builder skill for Himalaya Agency OS.
Turn business info and analysis into a usable conversion profile.
Return JSON with this exact structure:
{
  "business_name": "",
  "niche": "",
  "location": "",
  "audience": {
    "primary_audience": "",
    "secondary_audience": "",
    "customer_pains": [""],
    "customer_desires": [""],
    "customer_objections": [""]
  },
  "brand_direction": {
    "recommended_tone": "",
    "trust_style": "",
    "positioning_angle": "",
    "offer_angle": ""
  },
  "conversion_strategy": {
    "primary_cta": "",
    "secondary_cta": "",
    "trust_elements_needed": [""],
    "recommended_sections": [""]
  },
  "content_strategy": {
    "top_hooks": [""],
    "top_benefits": [""],
    "top_problems_to_call_out": [""]
  },
  "assumptions": [""]
}

Input:
- business_name: ${lead.name}
- niche: ${lead.niche}
- location: ${lead.location}
- execution_tier: ${executionTier}
- analysis_summary: ${analyzer.summary ?? lead.summary ?? ""}
- issues: ${analyzer.issues?.map((i) => i.title).join(", ") ?? gaps.join(", ")}
- strengths: ${(analyzer.strengths ?? strengths).join(", ")}
- missed_opportunities: ${(analyzer.missed_opportunities ?? gaps).join(", ")}
${businessContext}`;

    const profileJson = await callSkill(profilePrompt);
    const profile = profileJson as {
      audience?: { primary_audience?: string; customer_pains?: string[]; customer_desires?: string[] };
      brand_direction?: { recommended_tone?: string; positioning_angle?: string; offer_angle?: string };
      conversion_strategy?: { primary_cta?: string; secondary_cta?: string; recommended_sections?: string[] };
      content_strategy?: { top_hooks?: string[]; top_benefits?: string[]; top_problems_to_call_out?: string[] };
    };

    const websitePrompt = `You are the website-generator skill for Himalaya Agency OS.
Generate a conversion-focused landing page structure.
Return JSON with this exact structure:
{
  "business_name": "",
  "page_type": "local-business-landing-page",
  "seo": { "title": "", "meta_description": "" },
  "hero": { "headline": "", "subheadline": "", "primary_cta": "", "secondary_cta": "" },
  "sections": [
    { "type": "problem", "headline": "", "body": "" },
    { "type": "solution", "headline": "", "body": "" },
    { "type": "benefits", "headline": "", "items": ["", "", ""] },
    { "type": "trust", "headline": "", "items": ["", "", ""] },
    { "type": "process", "headline": "", "steps": ["", "", ""] },
    { "type": "faq", "headline": "", "items": [{ "question": "", "answer": "" }] },
    { "type": "cta", "headline": "", "body": "", "primary_cta": "" }
  ],
  "visual_direction": { "style": "", "color_direction": "", "image_prompts": [""] },
  "notes": { "conversion_notes": [""], "mobile_notes": [""] }
}

Input:
- business_name: ${lead.name}
- niche: ${lead.niche}
- location: ${lead.location}
- execution_tier: ${executionTier}
- audience: ${profile.audience?.primary_audience ?? lead.audience ?? ""}
- brand_direction: tone=${profile.brand_direction?.recommended_tone ?? ""}, angle=${profile.brand_direction?.offer_angle ?? lead.angle ?? ""}
- primary_cta: ${profile.conversion_strategy?.primary_cta ?? "Call Now"}
- top_hooks: ${profile.content_strategy?.top_hooks?.join(", ") ?? ""}
- top_problems: ${profile.content_strategy?.top_problems_to_call_out?.join(", ") ?? ""}
${businessContext}`;

    const websiteJson = await callSkill(websitePrompt);

    const adsPrompt = `You are the ad-generator skill for Himalaya Agency OS.
Generate ad copy for a local business based on its profile.
Return JSON with this exact structure:
{
  "business_name": "",
  "platforms": {
    "facebook_instagram": {
      "hooks": ["", "", "", "", ""],
      "primary_texts": ["", "", ""],
      "headlines": ["", "", ""],
      "ctas": ["", "", ""]
    },
    "google_search": {
      "headlines": ["", "", "", "", ""],
      "descriptions": ["", "", ""]
    },
    "short_form_video": {
      "hooks": ["", "", ""],
      "script_angles": ["", "", ""]
    }
  },
  "angles": [{ "name": "", "focus": "", "why_it_should_work": "" }],
  "assumptions": [""]
}

Input:
- business_name: ${lead.name}
- niche: ${lead.niche}
- location: ${lead.location}
- execution_tier: ${executionTier}
- audience: ${profile.audience?.primary_audience ?? lead.audience ?? ""}
- customer_pains: ${profile.audience?.customer_pains?.join(", ") ?? lead.painPoints ?? ""}
${businessContext}
- top_hooks: ${profile.content_strategy?.top_hooks?.join(", ") ?? ""}
- offer_angle: ${profile.brand_direction?.offer_angle ?? lead.angle ?? ""}
- top_benefits: ${profile.content_strategy?.top_benefits?.join(", ") ?? ""}`;

    const adsJson = await callSkill(adsPrompt);
    const website = websiteJson as { hero?: { headline?: string }; seo?: { title?: string } };

    const emailsPrompt = `You are the email-generator skill for Himalaya Agency OS.
Generate outreach and follow-up emails for a business whose site and marketing need improvement.
Return JSON with this exact structure:
{
  "business_name": "",
  "outreach_email": { "subject": "", "body": "" },
  "follow_ups": [
    { "subject": "", "body": "" },
    { "subject": "", "body": "" },
    { "subject": "", "body": "" }
  ],
  "sms": { "message": "" },
  "notes": { "tone": "", "goal": "" }
}

Rules for body: 100-150 words, personalized, no placeholders like [Your Name], write as if sending today from a web/marketing consultant.

Input:
- business_name: ${lead.name}
- niche: ${lead.niche}
- location: ${lead.location}
- execution_tier: ${executionTier}
- analysis_summary: ${analyzer.summary ?? lead.summary ?? "Business has weak online presence"}
- key_issues: ${gaps.slice(0, 3).join(", ") || "No website or poor design"}
- website_preview_link: [preview site built in Himalaya]
- offer_angle: ${profile.brand_direction?.offer_angle ?? lead.angle ?? "Build better online presence"}`;

    const emailsJson = await callSkill(emailsPrompt);
    const emails = emailsJson as {
      outreach_email?: { subject?: string; body?: string };
      follow_ups?: { subject: string; body: string }[];
      sms?: { message: string };
    };

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: "ready",
        analyzerJson: analyzerJson as object,
        profileJson: { ...(profileJson as object), executionTier } as object,
        websiteJson: websiteJson as object,
        adsJson: adsJson as object,
        emailsJson: { ...(emailsJson as object), executionTier } as object,
        outreachEmail: {
          subject: emails.outreach_email?.subject ?? "",
          body: emails.outreach_email?.body ?? "",
          followUp1: emails.follow_ups?.[0]?.body ?? "",
          followUp2: emails.follow_ups?.[1]?.body ?? "",
          sms: emails.sms?.message ?? "",
        },
      },
    });

    // Silence unused variable warning
    void website;

    return { ok: true, executionTier };
  } catch (err) {
    console.error("generateLeadById error:", err);
    await prisma.lead.update({ where: { id: leadId }, data: { status: "analyzed" } }).catch(() => null);
    return { ok: false, error: String(err) };
  }
}
