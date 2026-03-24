import type { SkillMeta } from "./types";

export const SKILLS: SkillMeta[] = [
  // ── Ads ──────────────────────────────────────────────────────────────────────
  {
    slug: "ad-copy",
    name: "Ad Copy Generator",
    tagline: "Facebook, TikTok & Google ads written in 30 seconds",
    description:
      "Paste your offer details and get 5 scroll-stopping ad variations — hooks, body copy, and CTAs — tuned for your chosen platform and objective.",
    icon: "📣",
    category: "ads",
    credits: 3,
    inputs: [
      { key: "offer", label: "What are you selling?", type: "textarea", placeholder: "e.g. Online course teaching freelancers to charge $5k/mo", required: true },
      { key: "audience", label: "Target audience", type: "text", placeholder: "e.g. Freelancers 25–40 stuck under $2k/mo", required: true },
      { key: "platform", label: "Platform", type: "select", options: ["Facebook / Instagram", "TikTok", "Google Search", "YouTube"], required: true },
      { key: "objective", label: "Campaign objective", type: "select", options: ["Lead generation", "Sales / conversions", "Brand awareness", "Traffic"], required: true },
      { key: "tone", label: "Tone", type: "select", options: ["Bold & direct", "Conversational", "Urgency / scarcity", "Story-based", "Educational"] },
    ],
    outputs: ["5 ad variations with hooks + body + CTA", "Saved to your campaign drafts"],
  },
  {
    slug: "tiktok-script",
    name: "TikTok / Reels Script",
    tagline: "Hook-first video scripts that stop the scroll",
    description:
      "Get a full 15–60 second video script with scene descriptions, spoken VO, text overlays, and the hook tested to perform on TikTok and Instagram Reels.",
    icon: "🎬",
    category: "ads",
    credits: 4,
    inputs: [
      { key: "product", label: "Product or service", type: "text", placeholder: "e.g. AI-powered email marketing tool", required: true },
      { key: "hook_angle", label: "Hook angle", type: "select", options: ["Problem → solution", "Shocking stat", "Day in the life", "Before & after", "How I did X"], required: true },
      { key: "duration", label: "Video length", type: "select", options: ["15 seconds", "30 seconds", "60 seconds"] },
      { key: "cta", label: "Call to action", type: "text", placeholder: "e.g. Link in bio — free trial" },
    ],
    outputs: ["Full scene-by-scene script", "Spoken VO lines", "Text overlay suggestions", "Hook variants"],
  },
  {
    slug: "google-ads",
    name: "Google Ads Pack",
    tagline: "Responsive Search Ads + keyword list in one click",
    description:
      "Enter your business and get a complete Google Ads pack: 15 headlines, 4 descriptions, 30 keywords with match types, and negative keyword recommendations.",
    icon: "🔍",
    category: "ads",
    credits: 3,
    inputs: [
      { key: "business", label: "Business name & what you do", type: "textarea", placeholder: "e.g. Himalaya CRM — marketing automation for consultants", required: true },
      { key: "landing_url", label: "Landing page URL", type: "url", placeholder: "https://yourdomain.com/landing" },
      { key: "location", label: "Target location", type: "text", placeholder: "e.g. United States, New York, Global" },
      { key: "budget_daily", label: "Daily budget ($)", type: "text", placeholder: "e.g. 50" },
    ],
    outputs: ["15 RSA headlines (max 30 chars)", "4 descriptions", "30 keywords with match types", "Negative keyword list"],
  },

  // ── Website ──────────────────────────────────────────────────────────────────
  {
    slug: "landing-page",
    name: "Landing Page Builder",
    tagline: "AI-writes and builds your page in one click",
    description:
      "Describe your offer and get a complete 8-block landing page — hero, features, social proof, FAQ, and CTA — with real copy, published instantly to your Himalaya site.",
    icon: "🌐",
    category: "website",
    credits: 5,
    inputs: [
      { key: "offer", label: "What is the offer?", type: "textarea", placeholder: "e.g. Free 30-min strategy call for coaches who want to hit $10k/mo", required: true },
      { key: "audience", label: "Who is it for?", type: "text", placeholder: "e.g. Life coaches 0–5k/mo", required: true },
      { key: "business_name", label: "Business / brand name", type: "text", placeholder: "e.g. Himalaya Coaching", required: true },
      { key: "tone", label: "Tone & style", type: "select", options: ["Professional & clean", "Bold & energetic", "Minimal & premium", "Friendly & conversational"] },
      { key: "primary_color", label: "Brand accent color", type: "text", placeholder: "#06b6d4" },
    ],
    outputs: ["8-block landing page with AI copy", "New published site on your account", "SEO title + meta description"],
  },
  {
    slug: "seo-audit",
    name: "SEO Content Audit",
    tagline: "Find what's killing your Google rankings",
    description:
      "Paste your website URL and get a detailed SEO audit: title tag analysis, content gaps, missing schema, page speed issues, keyword opportunities, and a prioritized fix list.",
    icon: "📈",
    category: "website",
    credits: 3,
    inputs: [
      { key: "url", label: "Website URL", type: "url", placeholder: "https://yoursite.com", required: true },
      { key: "niche", label: "Business niche", type: "text", placeholder: "e.g. fitness coaching, SaaS, ecommerce" },
      { key: "target_keyword", label: "Primary keyword you want to rank for", type: "text", placeholder: "e.g. email marketing for coaches" },
    ],
    outputs: ["SEO score (0–100)", "Title & meta tag audit", "Keyword gap analysis", "Prioritized fix list (quick wins first)"],
  },

  // ── Email ─────────────────────────────────────────────────────────────────────
  {
    slug: "email-sequence",
    name: "Email Nurture Sequence",
    tagline: "5-email sequence that turns leads into buyers",
    description:
      "Input your offer and audience and get a complete 5-email welcome/nurture sequence — subject lines, preview text, and full body copy — saved directly to your email flows.",
    icon: "📧",
    category: "email",
    credits: 4,
    inputs: [
      { key: "offer", label: "What are you selling?", type: "textarea", placeholder: "e.g. $997 online course for freelancers", required: true },
      { key: "audience", label: "Who is your audience?", type: "text", placeholder: "e.g. Freelancers who want to escape the hourly trap", required: true },
      { key: "from_name", label: "From name", type: "text", placeholder: "e.g. Your Name or Brand" },
      { key: "sequence_goal", label: "Sequence goal", type: "select", options: ["Sell a product", "Book a call", "Download a lead magnet", "Build trust / authority"] },
    ],
    outputs: ["5 emails with subject lines + preview text", "Full body copy", "Saved to your Email Flows"],
  },
  {
    slug: "broadcast-blast",
    name: "Broadcast Email",
    tagline: "Write a high-converting broadcast in 60 seconds",
    description:
      "Tell the AI what you want to promote and get a single broadcast email with a punchy subject line, engaging body copy, and a strong CTA — saved to your Broadcasts queue.",
    icon: "📮",
    category: "email",
    credits: 2,
    inputs: [
      { key: "subject_matter", label: "What is this email about?", type: "textarea", placeholder: "e.g. Announcing our new feature — AI site builder. 50% off for existing users.", required: true },
      { key: "tone", label: "Tone", type: "select", options: ["Exciting / launch energy", "Personal / story", "Educational", "Urgency / deadline", "Plain-text feel"] },
      { key: "cta_text", label: "CTA button text", type: "text", placeholder: "e.g. Claim 50% Off →" },
      { key: "cta_url", label: "CTA URL", type: "url", placeholder: "https://yoursite.com" },
    ],
    outputs: ["Subject line + preview text", "Full email body", "Saved to Broadcast drafts"],
  },

  // ── Leads ─────────────────────────────────────────────────────────────────────
  {
    slug: "lead-magnet",
    name: "Lead Magnet Creator",
    tagline: "A lead magnet outline + opt-in page in 60 seconds",
    description:
      "Create a high-value lead magnet (checklist, guide, cheat sheet) plus a full opt-in landing page, opt-in form config, and a follow-up email — all ready to publish.",
    icon: "🧲",
    category: "leads",
    credits: 5,
    inputs: [
      { key: "topic", label: "Lead magnet topic", type: "text", placeholder: "e.g. The 5-Step Checklist to Close More Consulting Clients", required: true },
      { key: "audience", label: "Target audience", type: "text", placeholder: "e.g. B2B consultants 0–$10k/mo", required: true },
      { key: "format", label: "Format", type: "select", options: ["Checklist", "Cheat Sheet", "Mini Guide (5–10 pages)", "Email Course (5 days)", "Video Training"], required: true },
      { key: "business_name", label: "Business name", type: "text", placeholder: "e.g. Himalaya Consulting" },
    ],
    outputs: ["Lead magnet outline (10+ points)", "Opt-in page copy + 6-block site", "Opt-in form config", "Follow-up email sequence"],
  },
  {
    slug: "offer-script",
    name: "Sales Script / VSL",
    tagline: "Video sales letter or sales call script",
    description:
      "Generate a complete VSL script or sales call framework — opening hook, problem agitation, solution reveal, proof, offer, and close — tailored to your product and price point.",
    icon: "🎯",
    category: "leads",
    credits: 4,
    inputs: [
      { key: "offer_name", label: "Offer name", type: "text", placeholder: "e.g. The Consulting Accelerator", required: true },
      { key: "price", label: "Price point", type: "text", placeholder: "e.g. $2,997 one-time or $497/mo", required: true },
      { key: "audience", label: "Target audience", type: "text", placeholder: "e.g. Consultants who charge under $5k/mo", required: true },
      { key: "format", label: "Script format", type: "select", options: ["VSL (video sales letter)", "Sales call script", "Webinar pitch", "DM / cold outreach"] },
      { key: "big_promise", label: "The big promise / result", type: "text", placeholder: "e.g. Go from $3k to $10k/mo in 90 days or less" },
    ],
    outputs: ["Full script with timestamps", "Objection handling section", "Closing sequence"],
  },

  // ── Power Skills (Analysis Pipeline) ─────────────────────────────────────────
  {
    slug: "website-builder-scout",
    name: "Website Builder Scout",
    tagline: "Show up with their new site already built.",
    description:
      "Enter any business URL. Himalaya deep-scans it, scores it, builds a full demo redesign, creates the client in your CRM, generates 7 ad hooks + outreach email — all in one shot. The ultimate cold outreach weapon.",
    icon: "🏗️",
    category: "website",
    credits: 3,
    inputs: [
      { key: "url", label: "Business Website URL", type: "url", placeholder: "https://localroofer.com", required: true, hint: "The target business's current website" },
      { key: "businessName", label: "Business Name", type: "text", placeholder: "Local Roofer Atlanta", hint: "Leave blank to auto-detect from the site" },
      { key: "niche", label: "Niche / Industry", type: "text", placeholder: "roofing, plumbing, dentist...", hint: "Helps tailor the ad copy angles" },
      { key: "outreachGoal", label: "Your Offer to Them", type: "select", options: ["Sell them a new website", "Sell them ads management", "Sell them SEO", "Sell them full marketing retainer"] },
    ],
    outputs: ["CRM client + pipeline stage", "Full campaign (hooks, scripts, briefs)", "Landing page draft", "Demo site built automatically", "Outreach email copy", "Cold DM + SMS hooks"],
  },
  {
    slug: "ad-campaign",
    name: "Ad Campaign Builder",
    tagline: "URL to launch-ready campaign in one click.",
    description:
      "Enter a product or offer URL. Get 7 scroll-stopping hooks, 3 video scripts (UGC/VSL/testimonial), scene-by-scene production briefs, landing page structure, 3-part email sequence, and a day-by-day execution checklist — all saved to your campaigns.",
    icon: "🎯",
    category: "ads",
    credits: 2,
    inputs: [
      { key: "url", label: "Product / Offer URL", type: "url", placeholder: "https://your-product.com", required: true, hint: "Your product page or a competitor to reverse-engineer" },
      { key: "mode", label: "Campaign Mode", type: "select", options: ["operator", "consultant", "saas"], hint: "Operator = your product. Consultant = client's. SaaS = software." },
      { key: "platform", label: "Primary Platform", type: "select", options: ["Meta (Facebook/Instagram)", "TikTok", "YouTube", "Google", "Multi-platform"] },
      { key: "campaignName", label: "Campaign Name", type: "text", placeholder: "Summer Launch 2026", hint: "Auto-detected if blank" },
    ],
    outputs: ["7 scroll-stopping ad hooks", "3 video scripts (UGC, VSL, testimonial)", "Production briefs (scene-by-scene)", "Full landing page structure", "3-part email sequence", "Day-by-day execution checklist + scaling triggers"],
  },
  {
    slug: "email-campaign",
    name: "Email Campaign Builder",
    tagline: "Full email automation from a single URL.",
    description:
      "Enter a product or offer URL. Get a complete email system: welcome sequence, cart abandonment recovery, post-purchase retention, and a broadcast template — with proven subject lines and copy frameworks, saved to your flows.",
    icon: "📧",
    category: "email",
    credits: 2,
    inputs: [
      { key: "url", label: "Product / Offer URL", type: "url", placeholder: "https://your-product.com", required: true },
      { key: "flowType", label: "Email Flow Type", type: "select", options: ["Full System (welcome + cart + post-purchase)", "Welcome Sequence Only", "Cart Abandon Recovery", "Post-Purchase Retention", "Launch Sequence"] },
      { key: "listGoal", label: "List Goal", type: "select", options: ["Sell a product", "Book a call", "Generate leads", "Nurture a community", "Promote a service"] },
      { key: "tone", label: "Email Tone", type: "select", options: ["Direct & bold", "Friendly & conversational", "Professional & credible", "Story-driven & emotional"] },
    ],
    outputs: ["Welcome sequence (3 emails)", "Cart recovery sequence (3 emails)", "Post-purchase retention (3 emails)", "Email flow automation (visual)", "Broadcast template + subject lines"],
  },
] as SkillMeta[];

export function getSkill(slug: string): SkillMeta | undefined {
  return SKILLS.find((s) => s.slug === slug);
}

export const SKILL_CATEGORIES = {
  ads:     { label: "Ads & Creative", emoji: "📣", color: "cyan" },
  website: { label: "Website & SEO",  emoji: "🌐", color: "purple" },
  email:   { label: "Email",          emoji: "📧", color: "blue" },
  leads:   { label: "Lead Gen",       emoji: "🧲", color: "green" },
} as const;
