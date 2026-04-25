// ---------------------------------------------------------------------------
// Weekly Task System — Playbook-based progression (Week 1-6)
//
// Each business type has a 6-week playbook with specific weekly goals.
// This system generates concrete, actionable tasks for each week based on:
// 1. Business type (agency, coach, dropship, affiliate, local_service)
// 2. Current week (calculated from first deployment date)
// 3. Completion status of previous weeks
// 4. User's actual deployed assets
//
// Week progression is AUTO-UNLOCKED when 80% of current week is complete.
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";

export type WeeklyTask = {
  id: string;
  week: number;                  // 1-6
  title: string;                 // "Set up Facebook pixel"
  description: string;           // Detailed instructions
  category: "setup" | "content" | "traffic" | "sales" | "optimize";
  estimatedTime: string;         // "15 min"
  priority: 1 | 2 | 3;          // 1 = critical path, 2 = important, 3 = bonus
  href?: string;                 // Link to tool/page
  completed: boolean;
  completedAt?: Date;
  resources?: { label: string; url: string }[];
};

export type WeeklyPlaybook = {
  week: number;
  title: string;                 // "Foundation Week"
  goal: string;                  // "Get your first system live"
  tasks: WeeklyTask[];
  unlocked: boolean;
  completionRate: number;        // 0-100
};

export type PlaybookProgress = {
  ok: boolean;
  currentWeek: number;
  totalWeeks: 6;
  bizType: string;
  weeks: WeeklyPlaybook[];
  overallCompletion: number;     // 0-100
  readyToAdvance: boolean;       // true if current week is 80%+ complete
};

// ═══════════════════════════════════════════════════════════════════════════
// PLAYBOOK TASK TEMPLATES (by business type and week)
// ═══════════════════════════════════════════════════════════════════════════

const AGENCY_PLAYBOOK: Record<number, Omit<WeeklyTask, "id" | "completed" | "completedAt">[]> = {
  1: [ // Foundation Week
    { week: 1, title: "Define your niche and offer", description: "Pick ONE industry to focus on (dentists, HVAC, law firms, etc.). Write your positioning: 'We help [niche] get [result] using [method].'", category: "setup", estimatedTime: "20 min", priority: 1 },
    { week: 1, title: "Create your case study page", description: "If you have past results, build a case study showing before/after. If you don't, create a 'Free Audit' offer page instead.", category: "setup", estimatedTime: "30 min", priority: 1, href: "/websites" },
    { week: 1, title: "Build your lead list (100 businesses)", description: "Go to Outreach → scrape 100 businesses in your niche. Use Google Maps or import CSV from Apollo/Hunter.", category: "setup", estimatedTime: "20 min", priority: 1, href: "/outreach" },
    { week: 1, title: "Write your cold email sequence", description: "3 emails: Day 0 (intro + audit offer), Day 3 (follow-up with specific observation), Day 7 (final value + calendar link).", category: "content", estimatedTime: "30 min", priority: 2, href: "/emails" },
    { week: 1, title: "Set up your booking page", description: "Connect your calendar and create a 15-min 'Strategy Call' booking link.", category: "setup", estimatedTime: "10 min", priority: 2, href: "/bookings" },
  ],
  2: [ // Start Outreach
    { week: 2, title: "Send 50 cold emails", description: "Use your lead list + sequence. Send 50 emails total. Track opens and replies in your CRM.", category: "sales", estimatedTime: "30 min", priority: 1, href: "/outreach" },
    { week: 2, title: "Post 3 case study snippets on LinkedIn", description: "Share client results, frameworks, or insights. Each post should end with 'DM me if you want similar results for [niche].'", category: "content", estimatedTime: "20 min", priority: 1, href: "/social" },
    { week: 2, title: "Follow up with email openers", description: "Check your outreach dashboard. Anyone who opened your email is warm — send a personalized follow-up.", category: "sales", estimatedTime: "15 min", priority: 1, href: "/leads" },
    { week: 2, title: "Run your first 2 strategy calls", description: "Book 2 calls from your outreach. Use the discovery framework: current state, desired state, gap, solution.", category: "sales", estimatedTime: "60 min", priority: 1 },
    { week: 2, title: "Create your proposal template", description: "Build a reusable proposal: situation, solution, timeline, pricing, guarantee. Store in Notion or Google Docs.", category: "setup", estimatedTime: "30 min", priority: 2 },
  ],
  3: [ // Close First Client
    { week: 3, title: "Send 5 personalized video audits", description: "Record a 3-min Loom walking through a prospect's website/ads. Show what's broken + how you'd fix it. Send to warm leads.", category: "sales", estimatedTime: "45 min", priority: 1 },
    { week: 3, title: "Follow up with everyone who didn't reply", description: "Send your Day 7 email to everyone who ignored your first 2 emails. 'Last email — yes or no?'", category: "sales", estimatedTime: "20 min", priority: 1, href: "/outreach" },
    { week: 3, title: "Close your first client (or die trying)", description: "Book 5 strategy calls this week. Send 3 proposals. Close 1. This is the only thing that matters this week.", category: "sales", estimatedTime: "2-5 hours", priority: 1 },
    { week: 3, title: "Ask for a testimonial from a past win", description: "If you've done ANY freelance/agency work before, ask that client for a video testimonial. Use it everywhere.", category: "content", estimatedTime: "15 min", priority: 2 },
  ],
  4: [ // Deliver & Scale
    { week: 4, title: "Onboard your first client properly", description: "Kickoff call, set expectations, define success metrics. Document everything in a project tracker.", category: "setup", estimatedTime: "30 min", priority: 1 },
    { week: 4, title: "Start delivering results", description: "Set up their ads, email flows, or whatever you sold. Over-deliver in week 1 to build trust.", category: "setup", estimatedTime: "3-5 hours", priority: 1 },
    { week: 4, title: "Send 100 more cold emails", description: "Don't stop outreach just because you closed one. Send 100 more emails this week. Build pipeline.", category: "sales", estimatedTime: "30 min", priority: 1, href: "/outreach" },
    { week: 4, title: "Post 5 LinkedIn updates this week", description: "Share client wins, behind-the-scenes, frameworks. Position yourself as the go-to expert in your niche.", category: "content", estimatedTime: "30 min", priority: 2, href: "/social" },
  ],
  5: [ // Systemize
    { week: 5, title: "Create your onboarding checklist", description: "Document every step you took to onboard client #1. Turn it into a repeatable checklist.", category: "optimize", estimatedTime: "30 min", priority: 1 },
    { week: 5, title: "Build your service delivery SOPs", description: "Write down how you deliver your service. What you do, when you do it, what tools you use. Future-you will thank you.", category: "optimize", estimatedTime: "45 min", priority: 1 },
    { week: 5, title: "Send first client report", description: "Show them what you've done + the results so far. Even if it's early, transparency builds trust.", category: "sales", estimatedTime: "20 min", priority: 2 },
    { week: 5, title: "Start hiring or automating", description: "Identify the most repetitive task in your process. Hire a VA for $5/hr or automate it with Zapier/Make.", category: "optimize", estimatedTime: "60 min", priority: 2 },
  ],
  6: [ // Full Speed
    { week: 6, title: "Close 2 more clients this week", description: "You know the drill now. Outreach → calls → proposals → close. Do it again x2.", category: "sales", estimatedTime: "5-8 hours", priority: 1 },
    { week: 6, title: "Build your referral system", description: "Ask your current client: 'Who else do you know in [niche] that could use help like this?' Get 3 warm intros.", category: "sales", estimatedTime: "15 min", priority: 1 },
    { week: 6, title: "Increase your prices by 30%", description: "You've proven you can deliver. Raise your prices for all NEW clients. $1,500 → $2,000. You're worth it.", category: "optimize", estimatedTime: "5 min", priority: 2 },
    { week: 6, title: "Post a big client win on LinkedIn", description: "Share a case study with real numbers. Tag the client if they allow it. This is how you scale without ads.", category: "content", estimatedTime: "15 min", priority: 2, href: "/social" },
  ],
};

const CONSULTANT_COACH_PLAYBOOK: Record<number, Omit<WeeklyTask, "id" | "completed" | "completedAt">[]> = {
  1: [
    { week: 1, title: "Define your transformation promise", description: "Write: 'I help [who] go from [current state] to [desired state] in [timeframe] without [pain point].'", category: "setup", estimatedTime: "20 min", priority: 1 },
    { week: 1, title: "Create your free training/webinar", description: "Outline a 45-min training: Problem → Solution Framework → Proof → Offer. Don't script it yet, just outline.", category: "content", estimatedTime: "30 min", priority: 1 },
    { week: 1, title: "Build your webinar registration page", description: "Simple opt-in: headline, 3 bullet points of what they'll learn, registration form.", category: "setup", estimatedTime: "20 min", priority: 1, href: "/websites" },
    { week: 1, title: "Record 3 talking-head value videos", description: "Each 60 seconds. Share a tip, framework, or mistake. Post on Instagram/TikTok/LinkedIn.", category: "content", estimatedTime: "30 min", priority: 2, href: "/social" },
  ],
  2: [
    { week: 2, title: "Run your first live webinar", description: "Deliver your training. Even if 3 people show up. Ask for feedback. Record it for the replay.", category: "sales", estimatedTime: "90 min", priority: 1 },
    { week: 2, title: "Run ads to your webinar", description: "Start with $10/day on Facebook/Instagram. Target your ideal audience. Goal: 50 registrations.", category: "traffic", estimatedTime: "30 min", priority: 1, href: "/campaigns" },
    { week: 2, title: "Post 5 pieces of content this week", description: "Client results, frameworks, personal story, myth-busting, behind-the-scenes. One per day.", category: "content", estimatedTime: "60 min", priority: 2, href: "/social" },
    { week: 2, title: "Get your first testimonial", description: "If you've coached/consulted anyone before, ask for a video testimonial. Even if it was free work.", category: "content", estimatedTime: "15 min", priority: 2 },
  ],
  3: [
    { week: 3, title: "Close your first 2 clients from the webinar", description: "Follow up with everyone who attended. Book strategy calls. Present your offer. Close 2.", category: "sales", estimatedTime: "3-5 hours", priority: 1 },
    { week: 3, title: "Create your welcome sequence", description: "Day 0 (welcome), Day 1 (expectation setting), Day 3 (quick win), Day 7 (check-in). Automate it.", category: "setup", estimatedTime: "45 min", priority: 2, href: "/emails" },
    { week: 3, title: "Build your curriculum outline", description: "12 weeks or 8 modules — whatever you promised. Just outline it. You'll fill it in as you go.", category: "content", estimatedTime: "30 min", priority: 2 },
  ],
  4: [
    { week: 4, title: "Deliver Week 1 to your first clients", description: "Over-deliver. Give them a quick win in the first 7 days. This creates momentum and referrals.", category: "setup", estimatedTime: "2-3 hours", priority: 1 },
    { week: 4, title: "Run another webinar (or use the replay)", description: "Set up an automated evergreen webinar or run another live one. Keep filling your pipeline.", category: "sales", estimatedTime: "90 min", priority: 1 },
    { week: 4, title: "Post client wins on social media", description: "Share screenshots, testimonials, before/after. Tag your clients (with permission).", category: "content", estimatedTime: "20 min", priority: 2, href: "/social" },
  ],
  5: [
    { week: 5, title: "Build your group community", description: "Create a private Facebook Group, Slack, or Circle community for your clients. This increases retention.", category: "setup", estimatedTime: "30 min", priority: 1 },
    { week: 5, title: "Host your first Q&A call", description: "Weekly group call where clients can ask questions. Record it. This becomes content later.", category: "setup", estimatedTime: "60 min", priority: 1 },
    { week: 5, title: "Increase your prices by 50%", description: "You've proven your program works. Raise prices for all new enrollments.", category: "optimize", estimatedTime: "5 min", priority: 2 },
  ],
  6: [
    { week: 6, title: "Close 5 new clients this week", description: "Run ads, do outreach, leverage referrals. Get to 5+ active clients total.", category: "sales", estimatedTime: "5-8 hours", priority: 1 },
    { week: 6, title: "Create your 1-on-1 upsell offer", description: "Offer 1-on-1 coaching at $3k-$5k for clients who want more personal attention.", category: "sales", estimatedTime: "20 min", priority: 2 },
    { week: 6, title: "Plan your next cohort launch", description: "Set a date for your next enrollment period. Create scarcity (only 10 spots, doors close X date).", category: "setup", estimatedTime: "30 min", priority: 2 },
  ],
};

const DROPSHIP_PLAYBOOK: Record<number, Omit<WeeklyTask, "id" | "completed" | "completedAt">[]> = {
  1: [
    { week: 1, title: "Find your winning product", description: "Browse TikTok/AliExpress. Look for products with <1,000 orders, high engagement, solves a real problem. Test 1 product only.", category: "setup", estimatedTime: "60 min", priority: 1 },
    { week: 1, title: "Build your product page", description: "Use your site builder. Hero image, 5 benefits, 3 customer reviews (can use supplier's), trust badges, buy button.", category: "setup", estimatedTime: "45 min", priority: 1, href: "/websites" },
    { week: 1, title: "Create 3 UGC-style ads", description: "Record yourself or hire a creator on Fiverr. Show the product in use. Keep it raw and authentic.", category: "content", estimatedTime: "60 min", priority: 1 },
    { week: 1, title: "Set up your TikTok Ads account", description: "Create business account, add payment method, install TikTok pixel on your site.", category: "setup", estimatedTime: "20 min", priority: 2 },
  ],
  2: [
    { week: 2, title: "Launch your first ad campaign ($20/day)", description: "Run your 3 video ads on TikTok. Target broad (18-35, USA, interest: shopping). Let TikTok find your audience.", category: "traffic", estimatedTime: "30 min", priority: 1, href: "/campaigns" },
    { week: 2, title: "Post organic TikToks (3 per day)", description: "Same product, different hooks. 'I can't believe this actually works', 'TikTok made me buy this', etc.", category: "content", estimatedTime: "45 min", priority: 1, href: "/social" },
    { week: 2, title: "Monitor your metrics daily", description: "Check: CPM, CTR, add-to-cart rate, conversion rate. Kill ads with >$10 CPA after 50 clicks.", category: "optimize", estimatedTime: "15 min", priority: 1, href: "/analytics" },
  ],
  3: [
    { week: 3, title: "Scale your winning ad (if any)", description: "If you found an ad with <$15 CPA and >2% conversion rate, increase budget 50% every 2 days.", category: "traffic", estimatedTime: "10 min", priority: 1, href: "/campaigns" },
    { week: 3, title: "Build your abandoned cart email flow", description: "Email 1: 1 hour after (reminder), Email 2: 24 hours (social proof), Email 3: 3 days (15% discount).", category: "setup", estimatedTime: "30 min", priority: 1, href: "/emails" },
    { week: 3, title: "Add upsells to your checkout", description: "Offer a complementary product at checkout. 'Add [related item] for 50% off'.", category: "optimize", estimatedTime: "20 min", priority: 2 },
  ],
  4: [
    { week: 4, title: "Find product #2", description: "If product #1 is working, find a complementary product. If it's not working, kill it and test something new.", category: "setup", estimatedTime: "45 min", priority: 1 },
    { week: 4, title: "Create a bundle offer", description: "Combine your 2 products into a bundle. Price it at 30% off total. Promote on all channels.", category: "sales", estimatedTime: "30 min", priority: 2 },
    { week: 4, title: "Reach out to micro-influencers", description: "Find 10 TikTok creators (10k-100k followers) in your niche. Offer free product for a post.", category: "traffic", estimatedTime: "45 min", priority: 2 },
  ],
  5: [
    { week: 5, title: "Optimize your product page", description: "A/B test: headline, hero image, first benefit. Change one thing at a time. Track conversion rate.", category: "optimize", estimatedTime: "30 min", priority: 1 },
    { week: 5, title: "Set up post-purchase email flow", description: "Email 1: Thank you + tracking, Email 2: How to use it, Email 3: Ask for review, Email 4: Recommend bundle.", category: "setup", estimatedTime: "30 min", priority: 2, href: "/emails" },
    { week: 5, title: "Test Facebook/Instagram ads", description: "If TikTok is working, expand to FB/IG with the same creatives. Start with $15/day.", category: "traffic", estimatedTime: "30 min", priority: 2, href: "/campaigns" },
  ],
  6: [
    { week: 6, title: "Scale to $100/day ad spend", description: "If your ROAS is above 2.5x, increase budget to $100/day. Monitor daily, kill losers fast.", category: "traffic", estimatedTime: "15 min", priority: 1, href: "/campaigns" },
    { week: 6, title: "Launch product #3", description: "Build a product line. 3 products = 3 chances to win + cross-sell opportunities.", category: "setup", estimatedTime: "2 hours", priority: 2 },
    { week: 6, title: "Start building an email list", description: "Run a lead magnet ad: 'Free [topic] guide'. Capture emails, sell to them later. This is long-term equity.", category: "traffic", estimatedTime: "45 min", priority: 2 },
  ],
};

const AFFILIATE_PLAYBOOK: Record<number, Omit<WeeklyTask, "id" | "completed" | "completedAt">[]> = {
  1: [
    { week: 1, title: "Pick your niche and 3 products", description: "Choose a niche you know or can research deeply. Find 3 affiliate products with >$50 commission and good reviews.", category: "setup", estimatedTime: "30 min", priority: 1 },
    { week: 1, title: "Build your comparison page", description: "Create 'Best [product category] for [audience]' comparison page. Compare your 3 products honestly.", category: "content", estimatedTime: "90 min", priority: 1, href: "/websites" },
    { week: 1, title: "Write your first review article", description: "Pick your #1 recommended product. Write 1,500+ word honest review. Include pros, cons, who it's for.", category: "content", estimatedTime: "2 hours", priority: 1 },
    { week: 1, title: "Set up email capture", description: "Create lead magnet (comparison PDF, checklist, mini-course). Add opt-in form to all pages.", category: "setup", estimatedTime: "30 min", priority: 2, href: "/emails" },
  ],
  2: [
    { week: 2, title: "Write 3 more articles this week", description: "Target keywords: '[product] review', 'best [category]', '[product] vs [competitor]'. SEO is your traffic engine.", category: "content", estimatedTime: "6 hours", priority: 1 },
    { week: 2, title: "Create your bonus stack", description: "Offer exclusive bonuses for buying through your link (templates, courses, consulting call, etc.).", category: "setup", estimatedTime: "60 min", priority: 1 },
    { week: 2, title: "Post on Reddit/Quora (5 answers)", description: "Find questions in your niche. Give genuinely helpful answers. Include your article link naturally.", category: "traffic", estimatedTime: "45 min", priority: 2 },
  ],
  3: [
    { week: 3, title: "Record your first YouTube review", description: "Same as your written review, but on camera (or screen recording). Upload to YouTube with affiliate link in description.", category: "content", estimatedTime: "90 min", priority: 1 },
    { week: 3, title: "Build your email welcome sequence", description: "5 emails: Welcome, Best product, Why this one, Objections, Final push. Automate it.", category: "setup", estimatedTime: "60 min", priority: 1, href: "/emails" },
    { week: 3, title: "Start Pinterest strategy", description: "Create 10 pins linking to your best articles. Pinterest = free traffic for affiliate content.", category: "traffic", estimatedTime: "45 min", priority: 2 },
  ],
  4: [
    { week: 4, title: "Publish 5 articles this week", description: "Consistency builds SEO authority. Aim for 1 article/day. Shorter is fine (800-1,000 words).", category: "content", estimatedTime: "8 hours", priority: 1 },
    { week: 4, title: "Build backlinks to your top 3 articles", description: "Guest post, HARO, or reach out to sites in your niche. 5 backlinks = page 1 Google ranking.", category: "traffic", estimatedTime: "2 hours", priority: 2 },
    { week: 4, title: "Create a comparison video for YouTube", description: "'[Product A] vs [Product B] — which should you buy?' Upload with timestamps and affiliate links.", category: "content", estimatedTime: "90 min", priority: 2 },
  ],
  5: [
    { week: 5, title: "Optimize your top-performing content", description: "Check Google Analytics. Find your highest-traffic page. Add better CTAs, update info, improve formatting.", category: "optimize", estimatedTime: "60 min", priority: 1 },
    { week: 5, title: "Launch a paid traffic test ($10/day)", description: "Run Facebook ads to your best comparison page. If ROI is positive, scale it.", category: "traffic", estimatedTime: "30 min", priority: 2, href: "/campaigns" },
    { week: 5, title: "Create an income report blog post", description: "'I made $X in affiliate commissions — here's how.' This builds trust and ranks well in SEO.", category: "content", estimatedTime: "60 min", priority: 2 },
  ],
  6: [
    { week: 6, title: "Publish 10+ articles this week", description: "Go all-in on content. More content = more traffic = more commissions. Batch-write if possible.", category: "content", estimatedTime: "12+ hours", priority: 1 },
    { week: 6, title: "Join affiliate programs for 5 more products", description: "Diversify your income streams. Don't rely on 1 product. Join 5 more programs in your niche.", category: "setup", estimatedTime: "30 min", priority: 2 },
    { week: 6, title: "Build your first email sales sequence", description: "Create a 7-email sequence selling your #1 product. Send to your list monthly.", category: "sales", estimatedTime: "90 min", priority: 2, href: "/emails" },
  ],
};

const LOCAL_SERVICE_PLAYBOOK: Record<number, Omit<WeeklyTask, "id" | "completed" | "completedAt">[]> = {
  1: [
    { week: 1, title: "Claim/optimize your Google Business Profile", description: "Complete 100% of your profile. Add photos, services, hours, description. This is your #1 lead source.", category: "setup", estimatedTime: "30 min", priority: 1 },
    { week: 1, title: "Build your service landing page", description: "One page: headline, 3 benefits, trust signals (reviews, years in business), call/book button.", category: "setup", estimatedTime: "45 min", priority: 1, href: "/websites" },
    { week: 1, title: "Set up call tracking", description: "Get a dedicated phone number for your website. Track which pages/ads drive calls.", category: "setup", estimatedTime: "15 min", priority: 2 },
    { week: 1, title: "Ask 5 past customers for Google reviews", description: "Text or email: 'Hey [name], would you mind leaving us a quick Google review? Here's the link.' Send to 5 happy customers.", category: "sales", estimatedTime: "15 min", priority: 1 },
  ],
  2: [
    { week: 2, title: "Launch Google Local Service Ads ($15/day)", description: "Set up Google LSA for your area. Pay per lead (call/message), not per click. Best ROI for local.", category: "traffic", estimatedTime: "30 min", priority: 1 },
    { week: 2, title: "Post 3 before/after photos on Google", description: "Post recent job photos to your Google Business Profile. Before/after comparisons work best.", category: "content", estimatedTime: "15 min", priority: 1 },
    { week: 2, title: "Create booking page for estimates", description: "Let people book free estimates online. Show available times, capture phone/email.", category: "setup", estimatedTime: "20 min", priority: 2, href: "/bookings" },
  ],
  3: [
    { week: 3, title: "Get 10 more Google reviews", description: "Ask every customer immediately after finishing a job. 'Can you leave us a review? Here's the link.' 10 reviews = page 1 ranking.", category: "sales", estimatedTime: "30 min", priority: 1 },
    { week: 3, title: "Run your first Nextdoor ad", description: "Nextdoor is huge for local services. Run a 'Free estimate' ad targeting your service area.", category: "traffic", estimatedTime: "30 min", priority: 2 },
    { week: 3, title: "Build your thank-you email + review request", description: "Automate: After job → send thank-you email → ask for review. Use Mailchimp or your CRM.", category: "setup", estimatedTime: "30 min", priority: 2, href: "/emails" },
  ],
  4: [
    { week: 4, title: "Launch your maintenance plan", description: "Create a $29-99/month plan: annual inspection, priority scheduling, 20% off services. Pitch to every customer.", category: "sales", estimatedTime: "30 min", priority: 1 },
    { week: 4, title: "Optimize for '[service] near me' keywords", description: "Add city names to your page titles, headers, and content. 'Best [service] in [city]'.", category: "optimize", estimatedTime: "30 min", priority: 1 },
    { week: 4, title: "Film a 60-second service video", description: "Record yourself doing a job or explaining your process. Post on Google, Facebook, YouTube.", category: "content", estimatedTime: "30 min", priority: 2 },
  ],
  5: [
    { week: 5, title: "Build referral system", description: "Offer $50 credit for every referral that books. Tell every customer. Add to email signature.", category: "sales", estimatedTime: "20 min", priority: 1 },
    { week: 5, title: "Partner with complementary businesses", description: "Real estate agents, property managers, HOAs — whoever serves your customers. Offer referral kickbacks.", category: "sales", estimatedTime: "60 min", priority: 2 },
    { week: 5, title: "Start your post-service email sequence", description: "Email 1: Thank you, Email 2: Maintenance offer (30 days), Email 3: Seasonal reminder (6 months).", category: "setup", estimatedTime: "45 min", priority: 2, href: "/emails" },
  ],
  6: [
    { week: 6, title: "Scale to $50/day on Google Ads", description: "If your LSA is profitable, expand to standard Google Search Ads. Target '[service] near me' keywords.", category: "traffic", estimatedTime: "30 min", priority: 1, href: "/campaigns" },
    { week: 6, title: "Get to 25+ Google reviews", description: "25+ reviews = top 3 ranking in most markets. Send review requests to everyone. Incentivize if legal in your area.", category: "sales", estimatedTime: "30 min", priority: 1 },
    { week: 6, title: "Hire your first subcontractor or assistant", description: "You can't scale alone. Hire help to handle overflow or admin work.", category: "optimize", estimatedTime: "2 hours", priority: 2 },
  ],
};

// Map business types to their playbooks
const PLAYBOOK_MAP: Record<string, Record<number, Omit<WeeklyTask, "id" | "completed" | "completedAt">[]>> = {
  agency: AGENCY_PLAYBOOK,
  consultant_coach: CONSULTANT_COACH_PLAYBOOK,
  dropship: DROPSHIP_PLAYBOOK,
  ecommerce: DROPSHIP_PLAYBOOK,
  ecommerce_brand: DROPSHIP_PLAYBOOK,
  affiliate: AFFILIATE_PLAYBOOK,
  content_creator: AFFILIATE_PLAYBOOK,
  local_service: LOCAL_SERVICE_PLAYBOOK,
  financial: LOCAL_SERVICE_PLAYBOOK,
  real_estate: LOCAL_SERVICE_PLAYBOOK,
};

// Week titles and goals
const WEEK_META: Record<number, { title: string; goal: string }> = {
  1: { title: "Foundation Week", goal: "Build your core infrastructure" },
  2: { title: "Launch & Test", goal: "Get your first traction" },
  3: { title: "First Wins", goal: "Close your first customers" },
  4: { title: "Deliver & Scale", goal: "Prove it works, do it again" },
  5: { title: "Systemize", goal: "Build repeatable processes" },
  6: { title: "Full Speed", goal: "Scale to sustainable revenue" },
};

/** Get playbook progress for a user */
export async function getPlaybookProgress(userId: string): Promise<PlaybookProgress> {
  try {
    // Get business type
    const profile = await prisma.businessProfile.findUnique({
      where: { userId },
      select: { businessType: true },
    });
    const bizType = profile?.businessType ?? "agency";

    // Get playbook template
    const playbook = PLAYBOOK_MAP[bizType] ?? AGENCY_PLAYBOOK;

    // Calculate current week (days since first deployment)
    const firstDeployment = await prisma.himalayaDeployment.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    const currentWeek = firstDeployment
      ? Math.min(6, Math.max(1, Math.ceil((Date.now() - firstDeployment.createdAt.getTime()) / (7 * 86400000))))
      : 1;

    // Get completed tasks from database
    const completedTasks = await prisma.himalayaFunnelEvent.findMany({
      where: { userId, event: "weekly_task_completed" },
    });
    const completedIds = new Set(completedTasks.map(t => (t.metadata as { taskId?: string })?.taskId ?? ""));

    // Build weeks
    const weeks: WeeklyPlaybook[] = [];
    let totalTasks = 0;
    let totalCompleted = 0;

    for (let weekNum = 1; weekNum <= 6; weekNum++) {
      const weekTasks = playbook[weekNum] ?? [];
      const tasks: WeeklyTask[] = weekTasks.map((t, idx) => {
        const taskId = `${bizType}-w${weekNum}-t${idx}`;
        const completed = completedIds.has(taskId);
        const completedEvent = completedTasks.find(e => (e.metadata as { taskId?: string })?.taskId === taskId);

        totalTasks++;
        if (completed) totalCompleted++;

        return {
          ...t,
          id: taskId,
          completed,
          completedAt: completedEvent?.createdAt,
        };
      });

      const completedCount = tasks.filter(t => t.completed).length;
      const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
      const unlocked = weekNum <= currentWeek;

      weeks.push({
        week: weekNum,
        title: WEEK_META[weekNum].title,
        goal: WEEK_META[weekNum].goal,
        tasks,
        unlocked,
        completionRate,
      });
    }

    const overallCompletion = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
    const currentWeekData = weeks[currentWeek - 1];
    const readyToAdvance = currentWeekData ? currentWeekData.completionRate >= 80 && currentWeek < 6 : false;

    return {
      ok: true,
      currentWeek,
      totalWeeks: 6,
      bizType,
      weeks,
      overallCompletion,
      readyToAdvance,
    };
  } catch (err) {
    console.error("Playbook progress error:", err);
    return {
      ok: false,
      currentWeek: 1,
      totalWeeks: 6,
      bizType: "agency",
      weeks: [],
      overallCompletion: 0,
      readyToAdvance: false,
    };
  }
}

/** Mark a weekly task as completed */
export async function completeWeeklyTask(userId: string, taskId: string): Promise<void> {
  await prisma.himalayaFunnelEvent.create({
    data: {
      userId,
      event: "weekly_task_completed",
      metadata: JSON.parse(JSON.stringify({ taskId, completedAt: new Date().toISOString() })),
    },
  });
}

/** Un-complete a weekly task (for testing/corrections) */
export async function uncompleteWeeklyTask(userId: string, taskId: string): Promise<void> {
  const existing = await prisma.himalayaFunnelEvent.findFirst({
    where: {
      userId,
      event: "weekly_task_completed",
    },
  });

  if (existing && (existing.metadata as { taskId?: string })?.taskId === taskId) {
    await prisma.himalayaFunnelEvent.delete({ where: { id: existing.id } });
  }
}
