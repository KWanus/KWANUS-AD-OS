// ---------------------------------------------------------------------------
// Enterprise & Advanced Systems (251-300)
//
// 251. Multi-workspace management
// 252. Role-based permissions
// 253. Audit trail (who did what when)
// 254. API rate limiting
// 255. Data retention policies
// 256. GDPR compliance automation
// 257. Cookie consent banner
// 258. Data processing agreement generator
// 259. SOC 2 readiness checklist
// 260. Uptime monitoring
// 261. Automated backup scheduling
// 262. Disaster recovery plan
// 263. Load testing recommendations
// 264. CDN optimization
// 265. Image optimization pipeline
// 266. Email template library (50+ templates)
// 267. Landing page template library
// 268. Ad template library
// 269. Social media template library
// 270. Proposal template library
// 271. Contract template library
// 272. SOP template library
// 273. Industry benchmark database
// 274. Competitive intelligence database
// 275. Pricing database per industry
// 276. Conversion rate database per funnel type
// 277. Email open rate database per industry
// 278. Ad cost database per platform/niche
// 279. Seasonal trend database
// 280. Holiday marketing calendar
// 281. Content idea database per niche
// 282. Headline formula database
// 283. Email subject line database
// 284. CTA copy database
// 285. Social proof template database
// 286. Testimonial prompt database
// 287. Objection handling database
// 288. Sales script database
// 289. Cold outreach template database
// 290. Follow-up sequence database
// 291. Onboarding checklist database
// 292. Customer success playbook database
// 293. Churn prevention playbook database
// 294. Upsell script database
// 295. Cross-sell recommendation database
// 296. Referral program template database
// 297. Partnership outreach database
// 298. PR pitch template database
// 299. Podcast pitch template database
// 300. Investor pitch template database
// ---------------------------------------------------------------------------

// ── 257. Cookie Consent Banner ───────────────────────────────────────────────

export function generateCookieConsent(primaryColor: string): string {
  return `
<div id="hm-cookie" style="display:none;position:fixed;bottom:0;left:0;right:0;z-index:99998;background:#1e293b;padding:14px 20px;font-family:sans-serif;">
  <div style="max-width:800px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
    <p style="margin:0;font-size:13px;color:#94a3b8;flex:1;">We use cookies to improve your experience and analyze site traffic. By continuing, you agree to our <a href="/privacy" style="color:${primaryColor};text-decoration:underline;">Privacy Policy</a>.</p>
    <div style="display:flex;gap:8px;">
      <button onclick="acceptCookies()" style="padding:8px 20px;background:${primaryColor};color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">Accept</button>
      <button onclick="declineCookies()" style="padding:8px 20px;background:transparent;color:#94a3b8;border:1px solid #475569;border-radius:8px;font-size:13px;cursor:pointer;">Decline</button>
    </div>
  </div>
</div>
<script>
function acceptCookies(){localStorage.setItem('hm_cookies','accepted');document.getElementById('hm-cookie').style.display='none';}
function declineCookies(){localStorage.setItem('hm_cookies','declined');document.getElementById('hm-cookie').style.display='none';}
if(!localStorage.getItem('hm_cookies'))document.getElementById('hm-cookie').style.display='block';
</script>`;
}

// ── 256. GDPR Compliance ─────────────────────────────────────────────────────

export function generateGDPRChecklist(): {
  items: { requirement: string; status: "required" | "recommended"; howToComply: string }[];
} {
  return {
    items: [
      { requirement: "Privacy Policy", status: "required", howToComply: "Auto-generated on every Himalaya site" },
      { requirement: "Cookie Consent Banner", status: "required", howToComply: "Auto-injected on every deployed site" },
      { requirement: "Data Processing Agreement", status: "required", howToComply: "Template available in legal pages" },
      { requirement: "Right to Access", status: "required", howToComply: "Users can export all data via /api/himalaya/export" },
      { requirement: "Right to Deletion", status: "required", howToComply: "Contact support to request deletion" },
      { requirement: "Consent for Marketing", status: "required", howToComply: "Double opt-in for email flows" },
      { requirement: "Data Breach Notification", status: "required", howToComply: "72-hour notification procedure documented" },
      { requirement: "Unsubscribe Link", status: "required", howToComply: "Auto-included in all marketing emails" },
      { requirement: "Data Minimization", status: "recommended", howToComply: "Only collect what's needed per form" },
      { requirement: "Encryption", status: "recommended", howToComply: "All data in transit (HTTPS) and at rest (Supabase)" },
    ],
  };
}

// ── 266-272. Template Libraries ──────────────────────────────────────────────

export const HEADLINE_FORMULAS: string[] = [
  "How to [achieve result] without [common pain]",
  "The #1 mistake [audience] make with [topic]",
  "[Number] ways to [achieve result] in [timeframe]",
  "Why [common belief] is dead wrong (and what works instead)",
  "I went from [before] to [after] in [timeframe]. Here's how.",
  "Stop [common mistake]. Start [better approach].",
  "The [audience]'s guide to [result]",
  "What [authority figure] taught me about [topic]",
  "[Result] in [timeframe] — no [common requirement] needed",
  "If you're [struggle], read this",
  "The truth about [topic] nobody talks about",
  "[X]% of [audience] get this wrong",
  "I tested [number] [things] — here's the winner",
  "You don't need [expected thing]. You need [surprising thing].",
  "The last [topic] guide you'll ever need",
  "Everything I wish I knew about [topic] when I started",
  "The [adjective] system for [result]",
  "Warning: [topic] will never be the same after this",
  "Dear [audience], stop doing [mistake]",
  "[Famous person] was wrong about [topic]. Here's proof.",
];

export const CTA_FORMULAS: string[] = [
  "Get started free",
  "Claim your spot",
  "Start my free trial",
  "Download the guide",
  "Book my call",
  "Join [number]+ others",
  "Get instant access",
  "Unlock [benefit] now",
  "Start seeing results",
  "Yes, I want this",
  "Show me how",
  "Try it risk-free",
  "Reserve my seat",
  "Send me the [resource]",
  "Take the first step",
  "Get my custom plan",
  "See it in action",
  "Start for $0",
  "Claim my discount",
  "Join the waitlist",
];

export const SOCIAL_PROOF_TEMPLATES: string[] = [
  "Trusted by [number]+ [audience]",
  "⭐⭐⭐⭐⭐ Rated [X]/5 by [number] customers",
  "As seen in [publication/media]",
  "[Number] businesses use [product] to [result]",
  "Join [number]+ [audience] who already [benefit]",
  '"[Short testimonial quote]" — [Name], [Title]',
  "[Result] for [number] clients and counting",
  "[X]% of customers see results in [timeframe]",
  "Featured in [list of logos/publications]",
  "Money-back guarantee · No risk · Cancel anytime",
];

export const OBJECTION_HANDLERS: { objection: string; response: string }[] = [
  { objection: "It's too expensive", response: "What's the cost of NOT solving this? In 6 months, you'll be in the same spot — or worse. This investment pays for itself in [timeframe]." },
  { objection: "I need to think about it", response: "Totally fair. What specifically would help you decide? I can probably answer that right now." },
  { objection: "I've tried something similar", response: "I hear that a lot. What was different about what you tried? Here's why this approach gets different results..." },
  { objection: "I don't have time", response: "That's exactly why this exists. It's designed for busy people — [X minutes/week] is all it takes." },
  { objection: "Does this work for my situation?", response: "Great question. We've helped [number] people in similar situations. Here's a case study..." },
  { objection: "What if it doesn't work?", response: "That's what the guarantee is for. [X]-day money-back, no questions. You literally can't lose." },
  { objection: "I need to talk to my partner/team", response: "Makes sense. Would it help if I sent you a summary they can review? That way you can make the decision together with all the info." },
  { objection: "Can I get a discount?", response: "The pricing reflects the value you'll get. But here's what I can do: [alternative value-add instead of discount]." },
  { objection: "I'll start next month", response: "I said the same thing once. Then next month became next quarter. The best time to start is when the pain is fresh — which is now." },
  { objection: "How is this different from [competitor]?", response: "Great question. The main difference is [specific differentiator]. They focus on [X], we focus on [Y result]." },
];

// ── 273-279. Industry Benchmark Databases ────────────────────────────────────

export const INDUSTRY_BENCHMARKS: Record<string, {
  avgConversionRate: string;
  avgCPA: string;
  avgEmailOpenRate: string;
  avgCTR: string;
  avgROAS: string;
  avgOrderValue: string;
}> = {
  "ecommerce": { avgConversionRate: "2.5-3.5%", avgCPA: "$15-30", avgEmailOpenRate: "15-20%", avgCTR: "1.5-2.5%", avgROAS: "3-5x", avgOrderValue: "$50-100" },
  "saas": { avgConversionRate: "3-7%", avgCPA: "$50-200", avgEmailOpenRate: "20-28%", avgCTR: "2-4%", avgROAS: "5-10x", avgOrderValue: "$30-100/mo" },
  "coaching": { avgConversionRate: "5-15%", avgCPA: "$30-100", avgEmailOpenRate: "25-40%", avgCTR: "1.5-3%", avgROAS: "5-15x", avgOrderValue: "$500-3000" },
  "agency": { avgConversionRate: "10-20%", avgCPA: "$50-200", avgEmailOpenRate: "20-35%", avgCTR: "1-2%", avgROAS: "5-20x", avgOrderValue: "$1500-5000/mo" },
  "local_service": { avgConversionRate: "10-25%", avgCPA: "$30-80", avgEmailOpenRate: "30-50%", avgCTR: "3-8%", avgROAS: "5-15x", avgOrderValue: "$200-1000" },
  "affiliate": { avgConversionRate: "1-3%", avgCPA: "$5-15", avgEmailOpenRate: "25-40%", avgCTR: "2-5%", avgROAS: "3-8x", avgOrderValue: "$20-200" },
  "dropshipping": { avgConversionRate: "2-5%", avgCPA: "$10-25", avgEmailOpenRate: "20-30%", avgCTR: "1-3%", avgROAS: "2-4x", avgOrderValue: "$30-80" },
  "digital_products": { avgConversionRate: "3-8%", avgCPA: "$10-40", avgEmailOpenRate: "22-35%", avgCTR: "2-4%", avgROAS: "5-12x", avgOrderValue: "$20-200" },
  "real_estate": { avgConversionRate: "2-5%", avgCPA: "$20-100", avgEmailOpenRate: "20-30%", avgCTR: "2-5%", avgROAS: "10-50x", avgOrderValue: "$5000+" },
  "health_fitness": { avgConversionRate: "3-6%", avgCPA: "$15-40", avgEmailOpenRate: "20-30%", avgCTR: "1.5-3%", avgROAS: "3-8x", avgOrderValue: "$30-200" },
};

export const HOLIDAY_CALENDAR: { month: number; day?: number; name: string; niches: string[]; adAngle: string }[] = [
  { month: 1, day: 1, name: "New Year's Day", niches: ["all"], adAngle: "New year, new start. Transform your [X] this year." },
  { month: 2, day: 14, name: "Valentine's Day", niches: ["ecommerce", "coaching", "health_fitness"], adAngle: "The best gift: investing in yourself." },
  { month: 3, day: 17, name: "St. Patrick's Day", niches: ["ecommerce", "local_service"], adAngle: "Lucky deals. Unlucky if you miss them." },
  { month: 4, day: 15, name: "Tax Day", niches: ["coaching", "agency", "saas"], adAngle: "Tax season stress? Here's a deduction that actually pays for itself." },
  { month: 5, day: 12, name: "Mother's Day", niches: ["ecommerce", "coaching"], adAngle: "She deserves more than flowers. Give her [result]." },
  { month: 6, day: 15, name: "Father's Day", niches: ["ecommerce", "coaching"], adAngle: "For the dad who has everything — except [solution]." },
  { month: 7, day: 4, name: "Independence Day", niches: ["all"], adAngle: "Freedom from [pain]. Declare your independence today." },
  { month: 9, day: 1, name: "Labor Day", niches: ["all"], adAngle: "Work smarter, not harder. Start here." },
  { month: 10, day: 31, name: "Halloween", niches: ["ecommerce", "digital_products"], adAngle: "Scary good deals. Don't let them vanish." },
  { month: 11, day: 29, name: "Black Friday", niches: ["all"], adAngle: "Biggest sale of the year. Period." },
  { month: 12, day: 2, name: "Cyber Monday", niches: ["all"], adAngle: "Online-only deals. 24 hours. Then gone." },
  { month: 12, day: 25, name: "Christmas", niches: ["ecommerce"], adAngle: "The gift that keeps giving — [result]." },
  { month: 12, day: 31, name: "New Year's Eve", niches: ["all"], adAngle: "Last chance this year. Start next year ahead." },
];

// ── 280. Content Idea Database ───────────────────────────────────────────────

export function getContentIdeas(niche: string): string[] {
  const universal = [
    "Behind the scenes of your daily workflow",
    "3 mistakes beginners make (and how to fix them)",
    "Before and after: a client transformation story",
    "The tool stack I use daily",
    "Myth vs reality in [your niche]",
    "What I'd do differently if I started over",
    "Day in the life running a [niche] business",
    "Unpopular opinion about [niche topic]",
    "The first $1,000 I made and how",
    "FAQ: answers to your top 5 questions",
    "Tutorial: how to [common task] step by step",
    "My biggest failure and what it taught me",
    "Why most people fail at [niche] (honest take)",
    "Comparison: [option A] vs [option B]",
    "The one thing that changed everything for me",
    "Reply to a hate comment/criticism with facts",
    "Predictions for [niche] in the next year",
    "The underrated [tool/strategy] nobody talks about",
    "How I went from [X] to [Y] in [timeframe]",
    "What [industry leader] gets wrong about [topic]",
  ];

  return universal.map(idea => idea.replace(/\[niche\]|\[your niche\]/g, niche));
}

// ── Get benchmarks for a specific niche ──────────────────────────────────────

export function getBenchmarksForNiche(niche: string): typeof INDUSTRY_BENCHMARKS[string] | null {
  const lower = niche.toLowerCase();
  for (const [key, benchmarks] of Object.entries(INDUSTRY_BENCHMARKS)) {
    if (lower.includes(key) || key.includes(lower)) return benchmarks;
  }
  // Fuzzy match
  if (/coach|consult|mentor/.test(lower)) return INDUSTRY_BENCHMARKS.coaching;
  if (/agency|marketing|ads/.test(lower)) return INDUSTRY_BENCHMARKS.agency;
  if (/shop|store|product|ecom/.test(lower)) return INDUSTRY_BENCHMARKS.ecommerce;
  if (/local|plumb|hvac|clean/.test(lower)) return INDUSTRY_BENCHMARKS.local_service;
  if (/affiliate|promote/.test(lower)) return INDUSTRY_BENCHMARKS.affiliate;
  if (/dropship/.test(lower)) return INDUSTRY_BENCHMARKS.dropshipping;
  if (/course|ebook|digital/.test(lower)) return INDUSTRY_BENCHMARKS.digital_products;
  return null;
}
