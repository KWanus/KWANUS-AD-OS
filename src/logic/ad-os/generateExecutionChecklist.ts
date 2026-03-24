import type { OpportunityPacket } from "./buildOpportunityPacket";
import type { AnalysisMode } from "./normalizeInput";

export type ExecutionChecklist = {
  day1: string[];
  day2: string[];
  day3: string[];
  week2: string[];
  scalingTrigger: string;
  killCriteria: string;
};

export function generateExecutionChecklist(
  opportunity: OpportunityPacket,
  mode: AnalysisMode
): ExecutionChecklist {

  /**
   * CONSULTANT MODE — "Agency Outreach SOP"
   * Framework used by top B2B consultants and agencies closing $5K–$50K clients.
   * Based on the "Personalized Value-First" outreach model — not cold spam.
   * Day 1: Deliver insight before asking for anything.
   * Day 2: Follow up via second channel with a different angle.
   * Day 3: Create a decision moment without pressure.
   * Week 2: Pipeline management + iteration.
   */
  if (mode === "consultant") {
    return {
      day1: [
        "BEFORE OUTREACH: Spend 15 minutes genuinely researching the prospect. Find one SPECIFIC weakness you can reference — their actual headline copy, a gap in their funnel, a review they got that reveals an unmet expectation. Generic outreach is noise. Specific outreach is authority.",
        "Record a 3–5 minute Loom video. Start by screensharing their website and pointing to the exact gap. Don't pitch. Diagnose. Say: 'I was looking at your homepage and noticed [specific thing] — here's why that's probably costing you [specific outcome]. Happy to show you what I'd do differently.'",
        "Send the Loom via email with subject line: 'Quick 4-min audit of [Company Name]' — do NOT say 'free consultation' or 'quick call.' Business owners are drowning in those. Lead with what they get, not what you want.",
        "LinkedIn DM simultaneously (not the same message — a one-liner that references the email): 'Sent you an email with a short audit of your [specific page]. Worth 4 minutes if you're focused on [their goal].'",
        "Set a CRM reminder for 48 hours — if no reply, you follow up via the second channel. If reply, book the call and move to the call prep checklist.",
      ],
      day2: [
        "If no reply: follow up via the channel you didn't use on Day 1. Keep it short: 'Following up on the audit I sent — wanted to make sure it landed. Worth a look before [specific time-relevant hook].'",
        "Research one of their top competitors and find one advantage the competitor has that they don't. This becomes your strongest qualifier line: 'I noticed [Competitor X] does [specific thing] that you don't — it's the same kind of gap that's been impacting conversion rates I've audited in your space.'",
        "Build your audit deck: Executive Summary (2 slides), Gap Analysis (3 slides — one per gap, with specific evidence), Recommendation (1 slide per gap — actionable, not vague), Investment (1 slide). Total: 8–10 slides maximum. Elite consultants never send a 30-slide deck.",
        "Prepare your discovery call framework: 70% listening, 30% presenting. First question: 'What's the single biggest barrier to hitting your revenue target this year?' Second question: 'What have you already tried?' Never go into solution mode until you understand both.",
      ],
      day3: [
        "If still no response after 2 touches: Send your final, shortest message. 'Last one from me — if the timing's off, totally understand. If you ever want fresh eyes on [the specific gap], I'm one reply away.' Stop at 3 touches. More than 3 signals low standards.",
        "If a call IS booked: Run the discovery framework. Listen until you understand their real problem — not the presenting symptom. Then show ONE piece of your audit (the most relevant gap) and ask: 'If we could fix this specific thing, what would that be worth to your business?' Their answer sets the anchor for your proposal.",
        "Send the proposal within 24 hours of the call while the conversation is fresh. Lead with their words from the call: 'You mentioned [exact quote they said]. Here's how we address that directly.' Price to the VALUE you're delivering — not your hourly rate. Elite consultants anchor to outcomes, not hours.",
        "After sending the proposal: set a 48-hour follow-up reminder. If no response at 48 hours: 'Just checking you got this — sometimes these land in spam. Happy to walk through it if anything's unclear.'",
      ],
      week2: [
        "PIPELINE AUDIT: How many prospects have you contacted? What's your response rate? If under 20% are responding to first touch, the outreach message needs work — not the volume. Fix the message before increasing the volume.",
        "For any active proposals: follow up every 72 hours. The best follow-up line: 'Any questions came up as you thought it over?' Not 'Just following up' — that signals impatience. Questions signal partnership.",
        "Identify 10 new prospects with the same specific gap pattern. Elite consultants don't do random outreach — they find a REPEATABLE niche gap and become the only person who talks about that exact problem with that level of specificity.",
        "If you closed a client this week: document the exact outreach message, the exact audit structure, and the exact discovery questions that worked. Systematize before you scale. The operators who grow fastest are the ones who don't reinvent the wheel with every new client.",
        "Begin building your case study from the client you're working with — even before results arrive. Document the before state with specifics: their metrics, their situation, their previous attempts. This becomes your most powerful piece of marketing once results land.",
      ],
      scalingTrigger:
        "Scale trigger: You've closed 3 clients using the same outreach + audit approach. At this point you have proof of concept. Now add volume — 20 personalized outreaches per week minimum. Also consider: package your audit as an async deliverable so you can deliver at scale without being on calls all day.",
      killCriteria:
        "Kill criteria: 30 outreaches with zero calls booked → stop adding volume and audit the message. 5 calls with zero proposals accepted → your positioning or pricing needs to change before more calls waste your time. 3 proposals declined with no feedback → you're pitching to the wrong prospect profile. Revise the qualification criteria before contacting anyone new.",
    };
  }

  /**
   * SAAS MODE — "Product-Led Growth Execution SOP"
   * Framework for SaaS operators using content + free trial → paid conversion.
   * Based on PLC growth model used by Notion, Airtable, and modern SaaS leaders.
   */
  if (mode === "saas") {
    return {
      day1: [
        "POSITIONING AUDIT: Rewrite your hero headline to speak to the specific job-to-be-done your ICP has — not your product's feature set. The best SaaS headlines (Notion, Linear, Superhuman) always lead with outcome, not mechanism. Test: Does your headline work even if you removed your product name? It should.",
        "Implement the 'Anti-Confusion' navbar: Your top nav should have max 4 items. Remove anything that a new visitor doesn't need to evaluate and purchase. Every extra nav item is a decision point that leaks conversion.",
        "Add an activation-focused onboarding email trigger: When a new trial starts, the first email should arrive within 5 minutes. Not a 'Welcome!' — a specific action prompt: 'Your account is ready. To get [specific outcome] in 10 minutes, start here: [link to the one most valuable first action].'",
        "Identify your product's 'Aha Moment' — the specific action that, when a user completes it, correlates with a 70%+ trial-to-paid conversion. Every part of your onboarding should drive toward that single moment, nothing else.",
      ],
      day2: [
        "Set up one expansion revenue trigger: If you have a free tier or trial, identify the usage threshold where users hit the paywall and add a 'You're getting a lot done — ready to keep going?' prompt at exactly that moment. Don't block the feature. Create a natural permission moment.",
        "Write 3 reactivation emails for churned or inactive users. The best one: 'Hey [Name] — you set up [specific thing] in [product] a while back. Have you been able to get [the intended outcome] with it? If not, I want to help.' This reads like a founder email, converts like one too.",
        "Review your in-app tooltips and onboarding tour. If they explain features rather than outcomes, rewrite them. 'Click here to invite a teammate' → 'Get 3x more done — invite a teammate and see how [Product] works with a team'.",
        "Competitor intelligence: Identify your top 3 competitors' weakest G2/Capterra reviews. Those are your copywriting briefs. Write your positioning to speak directly to those unmet needs — without naming the competitors.",
      ],
      day3: [
        "Launch a content wedge: Identify the one search term your ICP is actively Googling when they realize they have the problem your product solves. Build one piece of deeply useful content (1,500+ words) that ranks for that term. Include a clear CTA to your product. This is your compounding asset.",
        "Set up a cohort conversion analysis: Look at users who signed up in the last 30 days. How many hit your Aha Moment? How many converted? The delta between signup and Aha Moment is your biggest conversion lever — optimize this before spending more on acquisition.",
        "Run a win/loss debrief: Email the last 5 churned users with: 'Quick question — completely optional: what was the main reason you didn't continue? I read every reply.' 20% will respond. Their answers are more valuable than any A/B test.",
        "Launch a referral mechanism: The best SaaS referral programs give the referrer something they actually want (more usage, premium features, cash) and make sharing friction-free. Build this before you have a marketing budget.",
      ],
      week2: [
        "Trial conversion analysis: Of all trials started in the last 30 days, what % converted? Industry benchmark is 15–25% for B2B SaaS. If you're below 15%, the problem is activation — you're not getting users to the Aha Moment. If you're above 25% but growth is slow, the problem is top-of-funnel acquisition.",
        "ICP sharpening: Look at your best 10 customers — highest NPS, longest tenure, most expansion. What do they have in common (company size, industry, job title, use case)? Double down on acquiring that exact profile. Every dollar spent acquiring outside your ICP is mostly wasted.",
        "Implement a 'champion' program: Identify your most engaged users and give them something exclusive — early feature access, a private community, a direct line to the product team. Champions become your most powerful acquisition channel and your best defense against churn.",
        "Pricing page audit: Are you showing value before price? The best SaaS pricing pages show the outcome/ROI of the plan before showing the number. Users should feel the value before they see the cost.",
      ],
      scalingTrigger:
        "Scale trigger: Activation rate above 40% (users hitting Aha Moment within 7 days of signup), trial-to-paid above 20%, and Net Revenue Retention above 100% (existing customers expanding faster than you churn). When all three are true — your product has product-market fit and you can spend aggressively on acquisition without burning cash into a leaky bucket.",
      killCriteria:
        "Kill criteria: If after 90 days your trial-to-paid rate is below 5% — your positioning, your product, or your ICP targeting is fundamentally wrong. Don't add acquisition budget. Run a complete customer discovery sprint: talk to 20 people who evaluated and didn't buy. Their objections are your roadmap. Act on their answers before investing another dollar in growth.",
    };
  }

  /**
   * OPERATOR MODE (Dropshipping / Affiliate) — "Performance Media SOP"
   * Framework used by top 7–8 figure e-commerce operators and media buyers.
   * Built around the Meta/TikTok testing methodology, the exact kill criteria
   * and scale triggers used by agencies managing $500K+/month in ad spend.
   */
  const isStrong =
    opportunity.status === "Build Immediately" || opportunity.status === "Strong Opportunity";

  return {
    day1: [
      isStrong
        ? "PRODUCT VALIDATION IS DONE — move to build immediately. Use the landing page structure from this package. Do not over-engineer — the goal of Day 1 is a live, conversion-optimized product page, not perfection."
        : "BEFORE YOU BUILD ADS: Fix your product page first. An ad sends traffic — your page closes the sale. Use the landing page structure from this asset package. A 2% CVR beats a 1% CVR by 100% — permanently. Fix this before spending on traffic.",
      "Source product via CJdropshipping or a Zendrop-approved supplier. Confirm: (a) delivery time under 12 days, (b) supplier communicates in English, (c) you can get the product in your hands within 7 days. You cannot sell what you haven't touched.",
      "Order a sample unit to yourself — mandatory, no exceptions. Film your unboxing. Note any friction. Your unboxing reaction becomes your most authentic creative asset. Top operators build their UGC library from this moment.",
      "Set up your Shopify store (or list on your existing stack) with: hero image that shows the result (not just the product), at least 4 benefit bullets using the format from this package, a visible guarantee above the fold, and a proof section (even if you're starting — 'Be the first to leave a review' can work on day 1).",
      "Set up your pixel (Meta Pixel + TikTok Pixel) and verify both are firing on: product page view, add-to-cart, initiate checkout, purchase. Without verified pixel events, your data is blind and your algorithm can't optimize.",
    ],
    day2: [
      "CREATIVE DAY: Shoot your video creatives. You need 3–5 raw clips minimum. Format: vertical (9:16 ratio), under 30 seconds each, filmed on your phone in good natural lighting. Do NOT rent a studio. UGC-style content outperforms polished production by 35–60% on TikTok.",
      `Creative 1: Use Script 1 from this package (Ugly Truth VSL). Creative 2: Use Script 2 (Diagnostic Story). Creative 3: Film a raw unboxing or 'what I found' style with zero scripting — just you, the product, and honest reactions. The unscripted one often outperforms both scripted versions.`,
      "First 3 seconds rules: No logo. No brand name. No 'hey guys.' Open with the hook — the exact first line from the script. Algorithms use first-3-second retention as the primary distribution signal. If they don't watch past 3 seconds, the ad is dead.",
      "Build your ad account structure BEFORE you upload any creative: One campaign → 3–5 ad sets → 1 creative each (ABO, not CBO for testing). Each ad set targets a DIFFERENT audience interest pool. You're testing audiences AND creatives simultaneously.",
      "Install Klaviyo (or equivalent) and set up your 3-email abandoned cart flow using the sequences from this package. Abandoned cart recovery is your single highest-ROI marketing activity — if you skip this, you're leaving 15–25% of your potential revenue on the table.",
    ],
    day3: [
      isStrong
        ? "LAUNCH: $30–50/day total, ABO structure, 3 ad sets with your best 3 creatives. Broad targeting OR 1 broad audience + 2 interest-based. Do NOT layer interests (Crossfit + Health + Wellness all in one ad set). One clear audience per ad set."
        : "LAUNCH SMALL: $20/day total, 2 ad sets, 2 creatives. Your job right now is to validate the concept, not scale it. If you can get one sale per $40 spent, the business model works. That's the only metric that matters this week.",
      "TikTok vs Meta decision: If your product demos well visually AND your target audience is under 40 → start TikTok. Lower CPMs, faster feedback loops, better organic amplification. If your audience is 35+ or your product requires longer explanation → start Meta.",
      "DO NOT check your ad data for the first 48 hours. Seriously. The algorithm needs impressions to learn. Checking ROAS on hour 6 and pausing is the #1 mistake beginner operators make. You are buying data, not sales, for the first 72 hours.",
      "Metrics to track (and ONLY these) during the testing phase: CPM (cost to reach 1,000 people), CTR (link click-through rate — target above 1.5%), ATC Rate (add-to-cart / sessions — target above 4%), CPP (cost per purchase). Do not look at ROAS until you have at least 10 purchases.",
      "Set up your post-purchase email flow using the sequences from this package. Most operators only set up the abandoned cart. Post-purchase LTV emails increase repeat purchase rate by 20–40%. If you skip this, you're profiting only from new customers — the hardest and most expensive outcome.",
    ],
    week2: [
      "DATA REVIEW — 72h mark: Kill any ad set with CPM above $25 AND CTR below 1%. Kill any creative with 0 ATC after 1,000 impressions. Do NOT kill based on ROAS yet — you need 7+ days and $50+ spend per ad set for ROAS data to be meaningful.",
      "Find your winner and protect it: If any ad set generates 3+ purchases at a CPP below 50% of your product price — do NOT touch it. Do not edit the creative, the audience, or the budget more than 20% at a time. Every edit resets the learning phase.",
      "Creative iteration: Launch 2 new creatives based on the WINNING hook. If Hook Style A (Ugly Truth) drove CTR → make 2 more videos in the same style. Do not switch styles. Double down on what worked.",
      "Launch retargeting: Anyone who viewed your product page for 30+ seconds and didn't purchase gets retargeted with the strongest social proof creative from your library. Budget: 10% of your total ad spend. Expected ROAS: 3–8x (your best performing audience).",
      "Competitor intel: Go to Meta Ad Library. Search your top competitor's brand name. Look at what ads have been running the longest — those are their winners. Study the format, the hook structure, the thumbnail. Don't copy. Understand the principle and apply it to your angle.",
    ],
    scalingTrigger:
      "SCALE TRIGGER: CPP is 30% or less of your product's gross profit AND you've had 3 consecutive days of positive ROAS (above 2.5x). When BOTH of these are true simultaneously: (1) Duplicate the winning ad set into a CBO campaign at $100–150/day. (2) Never increase the budget of a single ABO ad set by more than 20% at a time — bigger jumps reset the algorithm's learning phase. (3) Your scale ceiling is approximately 5x your testing budget before you need lookalike audiences and creative refreshes to continue. Plan for this in advance.",
    killCriteria:
      "KILL CRITERIA: 3x daily budget spent = zero purchases → KILL immediately, do not wait. Zero add-to-carts after 500 impressions → your creative hook isn't working, not your product — test a different hook before switching angles entirely. ROAS below 1.0x after 10+ purchases → the unit economics don't work at this price point or this audience — raise price, lower COGS, or switch niche before spending more. Creative fatigue: If your CTR drops 40%+ week-over-week on a winning ad → introduce fresh creatives immediately. Do not spend more to save a dying ad set.",
  };
}
