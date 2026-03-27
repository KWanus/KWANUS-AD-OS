import fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

import { normalizeInput } from "../../src/logic/ad-os/normalizeInput.ts";
import { fetchPage } from "../../src/logic/ad-os/fetchPage.ts";
import { classifyLink } from "../../src/logic/ad-os/classifyLink.ts";
import { extractSignals } from "../../src/logic/ad-os/extractSignals.ts";
import { diagnoseLink } from "../../src/logic/ad-os/diagnoseLink.ts";
import { scoreOpportunity } from "../../src/logic/ad-os/scoreOpportunity.ts";
import { buildDecisionPacket } from "../../src/logic/ad-os/buildDecisionPacket.ts";
import { scoreOpportunityDimensions } from "../../src/logic/ad-os/scoreOpportunityDimensions.ts";
import { classifyOpportunity } from "../../src/logic/ad-os/classifyOpportunity.ts";
import { detectOpportunityGaps } from "../../src/logic/ad-os/detectOpportunityGaps.ts";
import { recommendOpportunityPath } from "../../src/logic/ad-os/recommendOpportunityPath.ts";
import { buildOpportunityPacket } from "../../src/logic/ad-os/buildOpportunityPacket.ts";

const OUTPUT_DIR = path.resolve("validation/roofing-austin");

const BUSINESSES = [
  { name: "Roof Company Austin", niche: "roofing", location: "Austin, TX", website: "https://www.roofcompanyaustin.com/" },
  { name: "Austin Roofing Company", niche: "roofing", location: "Austin, TX", website: "https://austinroofingcompany.us/" },
  { name: "Altair Austin Roofing Company", niche: "roofing", location: "Austin, TX", website: "https://austinroofingcompany.com/" },
  { name: "Red Owl Roofing", niche: "roofing", location: "Austin, TX", website: "https://www.redowlroofing.com/" },
  { name: "Transcendent Roofing", niche: "roofing", location: "Austin, TX", website: "https://transcendentroofing.com/" },
  { name: "Austin Roof Specialists", niche: "roofing", location: "Austin, TX", website: "https://www.austinroofspecialists.com/" },
  { name: "Austintatious Roofing Company", niche: "roofing", location: "Austin, TX", website: "https://www.ausroofco.com/" },
  { name: "AMP Roofing & Exteriors", niche: "roofing", location: "Austin, TX", website: "https://amproofing.com/" },
  { name: "Austin Roofing Repairs", niche: "roofing", location: "Austin, TX", website: "https://www.austinroofingrepairs.com/" },
  { name: "SAC Contractors", niche: "roofing", location: "Austin, TX", website: "https://saccontractorsllc.com/" },
];

const TARGET_LIMIT = Number.parseInt(process.env.VALIDATION_LIMIT ?? "3", 10);
const TARGETS = BUSINESSES.slice(0, Number.isNaN(TARGET_LIMIT) ? 3 : TARGET_LIMIT);
const FALLBACK_ONLY = process.env.VALIDATION_FALLBACK_ONLY === "1";

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
- Keep arrays to 2-3 items unless a smaller number is requested
- Keep paragraphs short and direct
- All recommendations must be realistic for a small business
- Before generating any output, mentally model what the TOP 1% of high-converting sites, ads, and emails in this specific niche look like
- Study the patterns of industry leaders, viral campaigns, and 8-figure funnels in this space
- Then produce outputs that BEAT those benchmarks - better hooks, sharper copy, stronger conversion architecture
- Never produce average or generic - every output must feel like it was crafted by the world's best copywriter and conversion specialist for this exact niche`;

function loadEnvFile(filepath) {
  const raw = readFileSync(filepath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    value = value.replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function stagePath(business, stage) {
  return path.join(OUTPUT_DIR, `${slugify(business.name)}.${stage}.json`);
}

function resultPath(business) {
  return path.join(OUTPUT_DIR, `${slugify(business.name)}.json`);
}

function pickJson(raw) {
  const cleaned = raw.replace(/```json|```/gi, "").trim();
  const match = cleaned.match(/\{[\s\S]+\}/);
  if (!match) throw new Error("No JSON object found in model response");
  const candidate = match[0].replace(/,\s*([}\]])/g, "$1");
  return JSON.parse(candidate);
}

async function repairJson(clients, raw) {
  if (!clients.anthropic) {
    throw new Error("JSON repair requested without Anthropic client");
  }

  const repairPrompt = `Repair this malformed JSON.
Return valid JSON only.
Rebuild it as clean strict JSON.
Preserve the meaning, but you may simplify wording if needed to make the JSON valid.
Escape all quotes properly.
Do not add commentary.
Start with { and end with }.

Malformed JSON:
${raw}`;

  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await clients.anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1200,
        messages: [{ role: "user", content: repairPrompt }],
      });
      const text = response.content[0]?.type === "text" ? response.content[0].text : "{}";
      return pickJson(text);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError ?? new Error("JSON repair failed");
}

async function callSkill(clients, prompt) {
  if (clients.anthropic) {
    const response = await clients.anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system: GLOBAL_RULE,
      messages: [{ role: "user", content: prompt }],
    });
    const text = response.content[0]?.type === "text" ? response.content[0].text : "{}";
    try {
      return pickJson(text);
    } catch {
      return repairJson(clients, text);
    }
  }

  if (!clients.openai) {
    throw new Error("No working AI client configured");
  }

  const response = await clients.openai.responses.create({
    model: "gpt-4.1",
    input: [
      { role: "system", content: GLOBAL_RULE },
      { role: "user", content: prompt },
    ],
  });

  return pickJson(response.output_text ?? "{}");
}

async function callSkillWithFallback(clients, primaryPrompt, fallbackPrompt) {
  if (FALLBACK_ONLY && fallbackPrompt) {
    return callSkill(clients, fallbackPrompt);
  }

  try {
    return await callSkill(clients, primaryPrompt);
  } catch (err) {
    if (!fallbackPrompt) throw err;
    return callSkill(clients, fallbackPrompt);
  }
}

async function saveStageArtifact(business, stage, payload) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(stagePath(business, stage), JSON.stringify(payload, null, 2), "utf8");
}

async function readJsonIfExists(filepath) {
  try {
    const raw = await fs.readFile(filepath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function buildAnalysis(business, page) {
  const input = normalizeInput(business.website, "consultant");
  const linkType = classifyLink(input.url, page);
  const signals = extractSignals(page);
  const diagnosis = diagnoseLink(signals, linkType);
  const scoreResult = scoreOpportunity(signals, diagnosis, page);
  const packet = buildDecisionPacket(signals, diagnosis, scoreResult, linkType, "consultant");
  const dimensions = scoreOpportunityDimensions(signals, page);
  const classified = classifyOpportunity(dimensions);
  const gaps = detectOpportunityGaps(dimensions, signals);
  const recommendation = recommendOpportunityPath(classified.status, dimensions, "consultant");
  const opportunityPacket = buildOpportunityPacket(classified, dimensions, gaps, recommendation);

  return {
    page,
    scoreResult,
    packet,
    dimensions,
    classified,
    gaps,
    opportunityPacket,
  };
}

function buildPrompts(business, analysis) {
  const knownGaps = analysis.opportunityPacket.topGaps ?? [];
  const knownStrengths = analysis.opportunityPacket.topStrengths ?? [];
  const weaknesses = analysis.packet.weaknesses ?? [];

  const analyzerPrompt = `You are the business-analyzer skill for Himalaya Agency OS.
Analyze this business and return concise JSON with this exact structure:
{
  "business_name": "",
  "niche": "",
  "location": "",
  "summary": "",
  "scores": { "design_score": 0, "trust_score": 0, "clarity_score": 0, "cta_score": 0, "conversion_score": 0 },
  "issues": [{ "title": "", "severity": "low|medium|high", "reason": "" }],
  "missed_opportunities": ["", ""],
  "strengths": ["", ""],
  "quick_wins": ["", ""],
  "assumptions": [""]
}

Input:
- business_name: ${business.name}
- niche: ${business.niche}
- location: ${business.location}
- website_url: ${business.website}
- known_score: ${analysis.scoreResult.total}/100
- known_summary: ${analysis.packet.summary}
- known_gaps: ${knownGaps.join(", ") || "none"}
- known_weaknesses: ${weaknesses.join(", ") || "none"}
- known_strengths: ${knownStrengths.join(", ") || "none"}`;

  return { analyzerPrompt, knownGaps, knownStrengths, weaknesses };
}

async function processBusiness(clients, business) {
  console.log(`processing:${business.name}:fetch`);
  const page = await fetchPage(business.website);
  const analysis = buildAnalysis(business, page);
  const { analyzerPrompt, knownGaps, knownStrengths } = buildPrompts(business, analysis);

  let analyzerJson = await readJsonIfExists(stagePath(business, "analyzer"));
  if (analyzerJson) {
    console.log(`processing:${business.name}:analyzer:cached`);
  } else {
    console.log(`processing:${business.name}:analyzer`);
    analyzerJson = await callSkill(clients, analyzerPrompt);
    await saveStageArtifact(business, "analyzer", analyzerJson);
  }

  const profilePrompt = `You are the profile-builder skill for Himalaya Agency OS.
Turn business info and analysis into a concise conversion profile.
Return JSON with this exact structure:
{
  "business_name": "",
  "niche": "",
  "location": "",
  "audience": {
    "primary_audience": "",
    "customer_pains": ["", ""],
    "customer_desires": ["", ""],
    "customer_objections": ["", ""]
  },
  "brand_direction": {
    "recommended_tone": "",
    "offer_angle": ""
  },
  "conversion_strategy": {
    "primary_cta": "",
    "trust_elements_needed": ["", ""],
    "recommended_sections": ["", ""]
  },
  "content_strategy": {
    "top_hooks": ["", ""],
    "top_benefits": ["", ""],
    "top_problems_to_call_out": ["", ""]
  },
  "assumptions": [""]
}

Input:
- business_name: ${business.name}
- niche: ${business.niche}
- location: ${business.location}
- analysis_summary: ${analyzerJson.summary ?? analysis.packet.summary}
- issues: ${(analyzerJson.issues ?? []).map((i) => i.title).join(", ") || knownGaps.join(", ")}
- strengths: ${(analyzerJson.strengths ?? knownStrengths).join(", ")}
- missed_opportunities: ${(analyzerJson.missed_opportunities ?? knownGaps).join(", ")}`;

  let profileJson = await readJsonIfExists(stagePath(business, "profile"));
  if (profileJson) {
    console.log(`processing:${business.name}:profile:cached`);
  } else {
    console.log(`processing:${business.name}:profile`);
    profileJson = await callSkill(clients, profilePrompt);
    await saveStageArtifact(business, "profile", profileJson);
  }

  const websitePrompt = `You are the website-generator skill for Himalaya Agency OS.
Generate a concise conversion-focused landing page structure.
Return JSON with this exact structure:
{
  "business_name": "",
  "page_type": "local-business-landing-page",
  "seo": { "title": "", "meta_description": "" },
  "hero": { "headline": "", "subheadline": "", "primary_cta": "", "secondary_cta": "" },
  "sections": [
    { "type": "problem", "headline": "", "body": "" },
    { "type": "solution", "headline": "", "body": "" },
    { "type": "benefits", "headline": "", "items": ["", ""] },
    { "type": "trust", "headline": "", "items": ["", ""] },
    { "type": "process", "headline": "", "steps": ["", ""] },
    { "type": "faq", "headline": "", "items": [{ "question": "", "answer": "" }] },
    { "type": "cta", "headline": "", "body": "", "primary_cta": "" }
  ],
  "visual_direction": { "style": "", "color_direction": "", "image_prompts": [""] },
  "notes": { "conversion_notes": [""], "mobile_notes": [""] }
}

Input:
- business_name: ${business.name}
- niche: ${business.niche}
- location: ${business.location}
- audience: ${profileJson.audience?.primary_audience ?? ""}
- brand_direction: tone=${profileJson.brand_direction?.recommended_tone ?? ""}, angle=${profileJson.brand_direction?.offer_angle ?? ""}
- primary_cta: ${profileJson.conversion_strategy?.primary_cta ?? "Call Now"}
- top_hooks: ${profileJson.content_strategy?.top_hooks?.join(", ") ?? ""}
- top_problems: ${profileJson.content_strategy?.top_problems_to_call_out?.join(", ") ?? ""}`;

  const websiteFallbackPrompt = `Return minimal valid JSON for a high-converting roofing landing page.
Schema:
{
  "business_name": "",
  "page_type": "local-business-landing-page",
  "seo": { "title": "", "meta_description": "" },
  "hero": { "headline": "", "subheadline": "", "primary_cta": "", "secondary_cta": "" },
  "sections": [
    { "type": "benefits", "headline": "", "items": ["", ""] },
    { "type": "trust", "headline": "", "items": ["", ""] },
    { "type": "cta", "headline": "", "body": "", "primary_cta": "" }
  ],
  "visual_direction": { "style": "", "color_direction": "", "image_prompts": [""] },
  "notes": { "conversion_notes": [""], "mobile_notes": [""] }
}
Business: ${business.name}
Niche: ${business.niche}
Location: ${business.location}
Audience: ${profileJson.audience?.primary_audience ?? ""}
Offer angle: ${profileJson.brand_direction?.offer_angle ?? ""}`;

  let websiteJson = await readJsonIfExists(stagePath(business, "website"));
  if (websiteJson) {
    console.log(`processing:${business.name}:website:cached`);
  } else {
    console.log(`processing:${business.name}:website`);
    websiteJson = await callSkillWithFallback(clients, websitePrompt, websiteFallbackPrompt);
    await saveStageArtifact(business, "website", websiteJson);
  }

  const adsPrompt = `You are the ad-generator skill for Himalaya Agency OS.
Generate concise ad copy for a local business based on its profile.
Return JSON with this exact structure:
{
  "business_name": "",
  "platforms": {
    "facebook_instagram": {
      "hooks": ["", "", ""],
      "primary_texts": ["", ""],
      "headlines": ["", ""],
      "ctas": ["", ""]
    },
    "google_search": {
      "headlines": ["", "", ""],
      "descriptions": ["", ""]
    },
    "short_form_video": {
      "hooks": ["", ""],
      "script_angles": ["", ""]
    }
  },
  "angles": [
    { "name": "", "focus": "", "why_it_should_work": "" }
  ],
  "assumptions": [""]
}

Input:
- business_name: ${business.name}
- niche: ${business.niche}
- location: ${business.location}
- audience: ${profileJson.audience?.primary_audience ?? ""}
- customer_pains: ${profileJson.audience?.customer_pains?.join(", ") ?? ""}
- top_hooks: ${profileJson.content_strategy?.top_hooks?.join(", ") ?? ""}
- offer_angle: ${profileJson.brand_direction?.offer_angle ?? ""}
- top_benefits: ${profileJson.content_strategy?.top_benefits?.join(", ") ?? ""}`;

  const adsFallbackPrompt = `Return minimal valid JSON for local roofing ads.
Schema:
{
  "business_name": "",
  "platforms": {
    "facebook_instagram": {
      "hooks": ["", ""],
      "primary_texts": [""],
      "headlines": [""],
      "ctas": [""]
    },
    "google_search": {
      "headlines": ["", ""],
      "descriptions": [""]
    },
    "short_form_video": {
      "hooks": [""],
      "script_angles": [""]
    }
  },
  "angles": [
    { "name": "", "focus": "", "why_it_should_work": "" }
  ],
  "assumptions": [""]
}
Business: ${business.name}
Audience: ${profileJson.audience?.primary_audience ?? ""}
Offer angle: ${profileJson.brand_direction?.offer_angle ?? ""}`;

  let adsJson = await readJsonIfExists(stagePath(business, "ads"));
  if (adsJson) {
    console.log(`processing:${business.name}:ads:cached`);
  } else {
    console.log(`processing:${business.name}:ads`);
    adsJson = await callSkillWithFallback(clients, adsPrompt, adsFallbackPrompt);
    await saveStageArtifact(business, "ads", adsJson);
  }

  const emailsPrompt = `You are the email-generator skill for Himalaya Agency OS.
Generate concise outreach and follow-up emails for a business whose site and marketing need improvement.
Return JSON with this exact structure:
{
  "business_name": "",
  "outreach_email": { "subject": "", "body": "" },
  "follow_ups": [
    { "subject": "", "body": "" },
    { "subject": "", "body": "" }
  ],
  "sms": { "message": "" },
  "notes": { "tone": "", "goal": "" }
}

Rules for body: 70-110 words, personalized, no placeholders like [Your Name], write as if sending today from a web/marketing consultant.

Input:
- business_name: ${business.name}
- niche: ${business.niche}
- location: ${business.location}
- analysis_summary: ${analyzerJson.summary ?? analysis.packet.summary}
- key_issues: ${knownGaps.slice(0, 3).join(", ") || "No website or poor design"}
- website_preview_link: [preview site built in Himalaya]
- offer_angle: ${profileJson.brand_direction?.offer_angle ?? "Build better online presence"}`;

  const emailsFallbackPrompt = `Return minimal valid JSON for local roofing outreach.
Schema:
{
  "business_name": "",
  "outreach_email": { "subject": "", "body": "" },
  "follow_ups": [
    { "subject": "", "body": "" },
    { "subject": "", "body": "" }
  ],
  "sms": { "message": "" },
  "notes": { "tone": "", "goal": "" }
}
Rules:
- outreach body 70-110 words
- follow-up bodies 40-80 words
Business: ${business.name}
Location: ${business.location}
Issues: ${knownGaps.slice(0, 2).join(", ")}
Offer angle: ${profileJson.brand_direction?.offer_angle ?? "Build better online presence"}`;

  let emailsJson = await readJsonIfExists(stagePath(business, "emails"));
  if (emailsJson) {
    console.log(`processing:${business.name}:emails:cached`);
  } else {
    console.log(`processing:${business.name}:emails`);
    emailsJson = await callSkillWithFallback(clients, emailsPrompt, emailsFallbackPrompt);
    await saveStageArtifact(business, "emails", emailsJson);
  }

  return {
    business,
    analysis,
    analyzerJson,
    profileJson,
    websiteJson,
    adsJson,
    emailsJson,
  };
}

function buildReview(result) {
  const hero = result.websiteJson.hero ?? {};
  const hooks = result.adsJson.platforms?.facebook_instagram?.hooks ?? [];
  const outreach = result.emailsJson.outreach_email ?? {};
  return {
    websiteVerdict: hero.headline ? "Strong opening structure present" : "Weak hero structure",
    websiteTrust: (result.websiteJson.sections ?? []).some((section) => section.type === "trust")
      ? "Trust section included"
      : "Trust layer is thin",
    adVerdict: hooks[0] ?? "No clear hook generated",
    emailVerdict: outreach.subject ?? "No subject generated",
  };
}

async function main() {
  loadEnvFile(path.resolve(".env"));
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const clients = {
    anthropic: process.env.ANTHROPIC_API_KEY
      ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      : null,
    openai: process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null,
  };
  const processed = [];

  for (const business of TARGETS) {
    const cachedResult = await readJsonIfExists(resultPath(business));
    if (cachedResult?.review) {
      console.log(`processing:${business.name}:result:cached`);
      processed.push({
        business,
        score: cachedResult.analysis.scoreResult.total,
        verdict: cachedResult.analysis.scoreResult.verdict,
        review: cachedResult.review,
      });
      continue;
    }

    const result = await processBusiness(clients, business);
    const review = buildReview(result);
    processed.push({
      business,
      score: result.analysis.scoreResult.total,
      verdict: result.analysis.scoreResult.verdict,
      review,
    });

    await fs.writeFile(resultPath(business), JSON.stringify({ ...result, review }, null, 2), "utf8");
    console.log(`processing:${business.name}:saved`);
  }

  await fs.writeFile(
    path.join(OUTPUT_DIR, "businesses.json"),
    JSON.stringify(BUSINESSES, null, 2),
    "utf8"
  );

  const lines = [
    "# Roofing Validation Run",
    "",
    "Niche: roofing",
    "Location: Austin, TX",
    "",
    "## Candidate Businesses",
    ...BUSINESSES.map((biz) => `- ${biz.name} — ${biz.website}`),
    "",
    "## Processed Businesses",
    ...processed.map((item) => `- ${item.business.name} — score ${item.score}/100 — ${item.verdict}`),
    "",
    "## Output Files",
    ...processed.map((item) => `- ${item.business.name}: ${slugify(item.business.name)}.json`),
  ];

  await fs.writeFile(path.join(OUTPUT_DIR, "README.md"), `${lines.join("\n")}\n`, "utf8");

  console.log(JSON.stringify(processed, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
