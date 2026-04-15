// ---------------------------------------------------------------------------
// Campaign Package Generator — the new standard
//
// When someone says "I want to do affiliate marketing" or "I want to dropship"
// Himalaya doesn't give generic advice. It gives them:
//
// 1. THE specific product to sell (researched, validated, high-commission)
// 2. 10 word-for-word video scripts they record on their phone
// 3. A bridge page deployed on their site (with their tracking pixels)
// 4. 5 complete emails written and activated
// 5. The exact math: $/sale × sales needed = target income
// 6. A day-by-day timeline with realistic expectations
// 7. Automation stack: what runs automatically, what they do manually
// 8. Compliance rules so they don't get banned
//
// This is the difference between "here's a tool" and "here's a business"
// ---------------------------------------------------------------------------

import { generateAI } from "@/lib/integrations/aiInference";
import { getPlaybook } from "./nichePlaybooks";

// ── Types ────────────────────────────────────────────────────────────────────

export type CampaignPackage = {
  // The product
  product: {
    name: string;
    network: string;              // ClickBank, Digistore, Amazon, etc.
    avgPayout: string;            // "$200 per sale"
    targetAudience: string;       // "Women 40-65 struggling with weight loss"
    whyItWins: string;            // "Top ClickBank offer, massive organic pull"
    hoplink: string;              // Template: "https://YOUR_CB_ID.product.hop.clickbank.net"
  };

  // The math
  math: {
    targetDaily: number;          // $1000
    payoutPerSale: number;        // 200
    salesNeeded: number;          // 5
    clicksNeeded: number;         // 333
    conversionRate: number;       // 0.015
    organicClicks: number;        // 273
    paidClicks: number;           // 60
    dailyAdBudget: number;        // 20
    explanation: string;          // Human-readable breakdown
  };

  // 10 word-for-word scripts
  scripts: {
    id: number;
    title: string;
    style: string;                // "Identity Interrupt", "Curiosity Gap", "Story", etc.
    length: string;               // "18-22 sec"
    hook: string;                 // First 3 seconds
    body: string;                 // Middle content
    cta: string;                  // Call to action
    caption: string;              // Post caption
    hashtags: string[];
    postFirst: boolean;           // Should this be one of the first 3 posted?
  }[];

  // Bridge page content
  bridgePage: {
    headline: string;
    subheadline: string;
    bodyParagraphs: string[];
    symptoms: string[];           // "Sound familiar?" checklist
    scienceBlock: { title: string; body: string };
    testimonials: { text: string; author: string; age: number; result: string }[];
    ctaHeadline: string;
    ctaButtonText: string;
    ctaSubtext: string;
    finalCtaHeadline: string;
  };

  // 5 complete emails
  emails: {
    day: number;
    subject: string;
    body: string;                 // Full email text with [LINK] placeholders
    purpose: string;
  }[];

  // Content strategy
  contentStrategy: {
    postsPerDay: number;
    pillars: { name: string; percentage: number; example: string }[];
    bestPlatforms: string[];
    boostRule: string;            // "Only boost posts with 500+ organic views"
  };

  // Timeline
  timeline: {
    week: string;
    revenue: string;
    action: string;
  }[];

  // Automation stack
  automation: {
    tool: string;
    purpose: string;
    cost: string;
  }[];

  // Compliance
  compliance: string[];
};

// ── Generator ────────────────────────────────────────────────────────────────

export async function generateCampaignPackage(input: {
  niche: string;
  targetIncome: number;          // Monthly target: $10000
  businessType: string;          // "affiliate", "dropship", etc.
  audienceDescription?: string;
}): Promise<CampaignPackage> {
  const dailyTarget = Math.round(input.targetIncome / 30);

  // Step 1: Find the best product for this niche
  const productResult = await generateAI({
    prompt: `Find the BEST affiliate/product opportunity for "${input.niche}" in 2026.

I need a SPECIFIC real product or product type that:
- Pays $50+ per sale (higher is better)
- Has proven demand (people are already buying it)
- Works well with short-form video marketing (TikTok, Reels)
- Targets a specific audience with a specific pain point

Return JSON:
{
  "name": "Specific product or product category name",
  "network": "ClickBank/Digistore/Amazon/Direct",
  "avgPayout": "$X per sale",
  "targetAudience": "Specific demographic with specific pain",
  "whyItWins": "Why THIS product over alternatives (2 sentences)",
  "conversionRate": 0.015,
  "searchTerms": ["5 search terms people use when they need this"]
}`,
    systemPrompt: "You are an affiliate marketing expert who knows the top-converting offers on every network. Be specific — name real product categories, real niches, real numbers. Return only JSON.",
    maxTokens: 500,
  });

  let product = {
    name: `Top ${input.niche} offer`,
    network: "ClickBank",
    avgPayout: "$150 per sale",
    targetAudience: `People interested in ${input.niche}`,
    whyItWins: "High conversion, proven demand, works with video content",
    hoplink: "https://YOUR_CB_ID.PRODUCT.hop.clickbank.net",
  };
  let conversionRate = 0.015;

  try {
    const parsed = JSON.parse(productResult.content);
    product = {
      name: parsed.name ?? product.name,
      network: parsed.network ?? "ClickBank",
      avgPayout: parsed.avgPayout ?? "$150 per sale",
      targetAudience: parsed.targetAudience ?? product.targetAudience,
      whyItWins: parsed.whyItWins ?? product.whyItWins,
      hoplink: `https://YOUR_CB_ID.${(parsed.name ?? "product").toLowerCase().replace(/\s+/g, "")}.hop.clickbank.net`,
    };
    conversionRate = parsed.conversionRate ?? 0.015;
  } catch { /* use defaults */ }

  // Step 2: Calculate the math
  const payoutNum = parseInt(product.avgPayout.replace(/[^0-9]/g, ""), 10) || 150;
  const salesNeeded = Math.ceil(dailyTarget / payoutNum);
  const clicksNeeded = Math.ceil(salesNeeded / conversionRate);
  const organicClicks = Math.round(clicksNeeded * 0.8);
  const paidClicks = clicksNeeded - organicClicks;

  const math = {
    targetDaily: dailyTarget,
    payoutPerSale: payoutNum,
    salesNeeded,
    clicksNeeded,
    conversionRate,
    organicClicks,
    paidClicks,
    dailyAdBudget: 20,
    explanation: `$${dailyTarget}/day ÷ $${payoutNum}/sale = ${salesNeeded} sales needed. At ${(conversionRate * 100).toFixed(1)}% conversion, you need ~${clicksNeeded} clicks. ${organicClicks} from organic content (free), ${paidClicks} from $20/day paid boosts.`,
  };

  // Step 3: Generate 10 scripts
  const scriptsResult = await generateAI({
    prompt: `Create 10 TikTok/Reels video scripts for promoting ${product.name} to ${product.targetAudience}.

Each script should be 15-30 seconds spoken. Include:
- A HOOK (first 3 seconds — must stop the scroll)
- BODY (middle content — educate or tell a story)
- CTA (call to action — "link in bio")

Use these angles (at least one of each):
1. Identity Interrupt ("If you're [identity], this is for you")
2. Curiosity Gap ("Nobody talks about this...")
3. Story ("I was struggling with X until...")
4. Warning ("Stop doing this if you...")
5. Education ("3 signs that...")
6. Comparison (before vs after)
7. Relatable Venting ("Can we talk about...")
8. Question Hook ("What age did your body change?")
9. Trending Audio Style (text overlay only)
10. Myth Bust ("The myth keeping you from...")

Return JSON array of 10 objects:
[{"id":1,"title":"Script name","style":"Identity Interrupt","length":"18-22 sec","hook":"...","body":"...","cta":"...","caption":"...","hashtags":["tag1","tag2"],"postFirst":true/false}]

Mark the 3 best as postFirst:true.
Make scripts SPECIFIC to ${input.niche} and ${product.targetAudience}. No generic advice.`,
    systemPrompt: "You are a viral TikTok content strategist. Every script you write is designed to go viral AND convert to affiliate sales. Be specific to this exact niche. Return only JSON array.",
    maxTokens: 3000,
  });

  let scripts: CampaignPackage["scripts"] = [];
  try {
    scripts = JSON.parse(scriptsResult.content);
  } catch {
    scripts = [
      { id: 1, title: "Identity Interrupt", style: "Identity Interrupt", length: "18-22 sec", hook: `If you're interested in ${input.niche} and nothing has worked — this explains why.`, body: `Most people approach ${input.niche} wrong. Here's what actually works.`, cta: "Link in bio.", caption: `Why ${input.niche} is harder than it should be ⬇️`, hashtags: [input.niche.replace(/\s+/g, "")], postFirst: true },
    ];
  }

  // Step 4: Generate bridge page content
  const bridgeResult = await generateAI({
    prompt: `Create bridge page content for ${product.name} targeting ${product.targetAudience}.

A bridge page is a pre-sell page that warms up the visitor before they see the product page. It should:
- Feel like a health/wellness article, NOT an ad
- Build trust through education
- Create desire through social proof
- Lead naturally to the product

Return JSON:
{
  "headline": "Editorial-style headline (50-70 chars)",
  "subheadline": "Supporting line that builds curiosity",
  "bodyParagraphs": ["5-6 paragraphs that educate and pre-sell"],
  "symptoms": ["5 'sound familiar?' checklist items"],
  "scienceBlock": {"title":"Educational heading","body":"2-3 sentences explaining the science"},
  "testimonials": [{"text":"Quote","author":"First name + last initial","age":47,"result":"Specific result"}],
  "ctaHeadline": "Watch the presentation that explains how this works",
  "ctaButtonText": "Watch The Free Presentation",
  "ctaSubtext": "Free · No email required · 12 minutes",
  "finalCtaHeadline": "Find out why [problem] actually changes after [age/event]"
}`,
    systemPrompt: "You write high-converting bridge pages that feel like editorial content. Natural, trustworthy, not salesy. Return only JSON.",
    maxTokens: 2000,
  });

  let bridgePage: CampaignPackage["bridgePage"] = {
    headline: `Why ${input.niche} Is Harder Than It Should Be`,
    subheadline: "And what thousands of people are doing instead",
    bodyParagraphs: [`If you've been struggling with ${input.niche}, you're not alone.`],
    symptoms: ["Nothing seems to work despite your best efforts"],
    scienceBlock: { title: "The shift nobody explains", body: "There's a specific reason this happens." },
    testimonials: [{ text: "This changed everything for me.", author: "Sarah K.", age: 45, result: "Amazing results in 6 weeks" }],
    ctaHeadline: "Watch the presentation that explains exactly how this works",
    ctaButtonText: "Watch The Free Presentation",
    ctaSubtext: "Free · No email required",
    finalCtaHeadline: `Find out why ${input.niche} actually works differently than you think`,
  };
  try { bridgePage = JSON.parse(bridgeResult.content); } catch { /* use default */ }

  // Step 5: Generate 5 emails
  const emailsResult = await generateAI({
    prompt: `Write a 5-email sequence for ${product.name} targeting ${product.targetAudience}.

Day 0: Deliver lead magnet + hook to watch presentation
Day 2: Social proof story (specific person, specific result)
Day 4: Education (explain the science/mechanism)
Day 6: Objection handling ("I've tried everything before")
Day 9: Final push (last email, urgency, guarantee)

Each email: subject line + full body text. Use [LINK] where the hoplink goes.
Conversational, personal tone. Not corporate. Under 200 words each.

Return JSON array:
[{"day":0,"subject":"...","body":"...","purpose":"..."}]`,
    systemPrompt: "You write email sequences that convert cold leads into buyers. Warm, personal, specific. Return only JSON array.",
    maxTokens: 2000,
  });

  let emails: CampaignPackage["emails"] = [];
  try { emails = JSON.parse(emailsResult.content); } catch {
    emails = [
      { day: 0, subject: `Your guide + something important about ${input.niche}`, body: `Here's your guide. Also — check out this presentation: [LINK]`, purpose: "Deliver + hook" },
      { day: 2, subject: "This person's story might sound familiar", body: "Someone just like you got incredible results. [LINK]", purpose: "Social proof" },
      { day: 4, subject: `The real reason ${input.niche} is hard`, body: "Here's what's actually happening and what to do about it. [LINK]", purpose: "Education" },
      { day: 6, subject: "I know you've tried everything before", body: "This is different because... [LINK]", purpose: "Objection handling" },
      { day: 9, subject: "Last email on this — I promise", body: "Final chance. 60-day guarantee. [LINK]", purpose: "Final push" },
    ];
  }

  // Step 6: Build the rest
  const contentStrategy: CampaignPackage["contentStrategy"] = {
    postsPerDay: 4,
    pillars: [
      { name: "Problem/Pain", percentage: 40, example: `"Why can't I get results with ${input.niche}?"` },
      { name: "Education/Reframe", percentage: 25, example: `"Your approach isn't broken — here's what's actually happening"` },
      { name: "Story/Proof", percentage: 20, example: `"I tried everything for 2 years until I found this"` },
      { name: "Curiosity", percentage: 15, example: `"The ONE thing nobody tells you about ${input.niche}"` },
    ],
    bestPlatforms: ["TikTok", "Instagram Reels", "YouTube Shorts"],
    boostRule: "NEVER boost a post that didn't get 500+ organic views first. Your $20 goes 5x further when the algorithm is already behind the content.",
  };

  const timeline: CampaignPackage["timeline"] = [
    { week: "Week 1-2", revenue: "$0-$100", action: "Post 3-5 videos daily. Test hooks. Build the system. Expect slow start." },
    { week: "Week 3-4", revenue: "$100-$500", action: "First viral post hits. Boost it with $20/day. Start email capture." },
    { week: "Week 5-8", revenue: "$500-$2,000", action: "Scale what works. Double posting. Boost 2 winners/day. Email list converting." },
    { week: "Month 3", revenue: `$${Math.round(input.targetIncome * 0.5).toLocaleString()}-$${input.targetIncome.toLocaleString()}`, action: "System automated. Multiple winning posts. Email list is your ATM." },
  ];

  const automation: CampaignPackage["automation"] = [
    { tool: "CapCut", purpose: "Video editing + captions", cost: "Free" },
    { tool: "Canva", purpose: "Lead magnet PDF + thumbnails", cost: "Free" },
    { tool: "Beehiiv or ConvertKit", purpose: "Email list + automation", cost: "Free up to 2,500 subs" },
    { tool: "Himalaya", purpose: "Bridge page, ads, tracking, everything", cost: "Free" },
    { tool: "TikTok + Instagram", purpose: "Organic content posting", cost: "Free" },
    { tool: "Meta Ads", purpose: "Boost winning organic posts", cost: "$20/day" },
  ];

  const compliance = [
    "NO before/after photos in paid ads (Meta policy violation)",
    "NO medical claims ('treats,' 'cures,' 'clinical results')",
    "Use language: 'may support,' 'many people report,' 'designed for'",
    "Always display affiliate disclosure on bridge page",
    "Include privacy policy and terms links",
    "Don't use income claims in ads ('make $1K/day' = ban)",
    "Always include 'results vary' disclaimer",
  ];

  return {
    product,
    math,
    scripts,
    bridgePage,
    emails,
    contentStrategy,
    timeline,
    automation,
    compliance,
  };
}
