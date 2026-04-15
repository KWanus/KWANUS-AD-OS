// ---------------------------------------------------------------------------
// AGENCY — Complete Campaign Package
// Cold outreach → free audit → strategy call → $2-5K/month retainer
// ---------------------------------------------------------------------------

import type { CampaignPackage } from "../campaignPackageGenerator";

export function getAgencyCampaignPackage(input: {
  subNiche?: string;
  targetIncome: number;
}): CampaignPackage {
  const dailyTarget = Math.round(input.targetIncome / 30);
  const niche = input.subNiche ?? "digital marketing agency";

  const isSEO = /seo|search|rank/i.test(niche);
  const isSocial = /social|instagram|tiktok|content/i.test(niche);
  const isAds = /ads|paid|ppc|meta|google|facebook/i.test(niche);
  const isWeb = /web|design|develop|site/i.test(niche);

  let serviceName = "Full-Service Marketing";
  let retainerPrice = "$3,000";
  let targetClient = "Local businesses making $50K-500K/year";
  let setupFee = "$1,500";

  if (isSEO) { serviceName = "SEO & Local Search"; retainerPrice = "$2,000"; targetClient = "Local service businesses (plumbers, dentists, lawyers, etc.)"; setupFee = "$1,000"; }
  else if (isSocial) { serviceName = "Social Media Management"; retainerPrice = "$2,500"; targetClient = "E-commerce brands and local businesses"; setupFee = "$1,000"; }
  else if (isAds) { serviceName = "Paid Advertising Management"; retainerPrice = "$3,500"; targetClient = "Businesses spending $2K+/month on ads who need better results"; setupFee = "$2,000"; }
  else if (isWeb) { serviceName = "Web Design + Conversion Optimization"; retainerPrice = "$2,000"; targetClient = "Businesses with outdated websites losing customers"; setupFee = "$3,000"; }

  const retainerNum = parseInt(retainerPrice.replace(/[^0-9]/g, ""), 10);
  const clientsNeeded = Math.ceil(input.targetIncome / retainerNum);

  return {
    product: {
      name: `${serviceName} Agency`,
      network: "Direct (your own agency)",
      avgPayout: `${setupFee} setup + ${retainerPrice}/month retainer per client`,
      targetAudience: targetClient,
      whyItWins: `Agency model = highest recurring revenue. ${clientsNeeded} clients at ${retainerPrice}/month = $${input.targetIncome.toLocaleString()}/month. No inventory, no shipping, high margins. Scale by hiring, not by working harder.`,
      hoplink: "YOUR_BOOKING_URL",
    },

    math: {
      targetDaily: dailyTarget,
      payoutPerSale: retainerNum,
      salesNeeded: clientsNeeded,
      clicksNeeded: clientsNeeded * 20,
      conversionRate: 0.15,
      organicClicks: clientsNeeded * 15,
      paidClicks: clientsNeeded * 5,
      dailyAdBudget: 15,
      explanation: `$${input.targetIncome.toLocaleString()}/month ÷ ${retainerPrice}/client = ${clientsNeeded} clients needed.\n\nAcquisition funnel:\n- Send 20 cold emails/day → 3-5 replies → 1-2 calls/week → close 1-2/month\n- Post case studies on LinkedIn → inbound leads\n- Run local Facebook ads to free audit landing page → book calls\n\nFirst client covers your tools. Third client = profit.\nEach client stays 6-12 months on average = ${retainerPrice} × 8 = $${retainerNum * 8} lifetime value per client.`,
    },

    scripts: [
      { id: 1, title: "Case Study Result", style: "Story", length: "25-30 sec", postFirst: true,
        hook: `We just helped a ${isSEO ? "plumber" : isSocial ? "boutique" : isAds ? "dentist" : "restaurant"} go from $${isSEO ? "8K" : "12K"} to $${isSEO ? "35K" : "45K"}/month. Here's what we did.`,
        body: (() => {
          const step1 = isSEO ? "Fixed their Google Business Profile — it was only 30% optimized" : isSocial ? "Audited their content — they were posting what THEY liked, not what their audience wanted" : isAds ? "Restructured their ad account — they were wasting 60% of their budget" : "Rebuilt their website — it loaded in 8 seconds and had no mobile optimization";
          const step2 = isSEO ? "Built 15 local citations and got 20 new Google reviews in 60 days" : isSocial ? "Created a 30-day content calendar based on competitor analysis" : isAds ? "Built 3 new campaigns targeting high-intent keywords at 40% lower CPC" : "Designed a conversion-focused site that loads in 1.5 seconds";
          return `Step 1: ${step1}. Step 2: ${step2}. Step 3: Results came in ${isSEO ? "90 days" : "30 days"}.`;
        })(),
        cta: "Want a free audit of YOUR business? Link in bio.",
        caption: `How we ${isSEO ? "4x'd" : "3x'd"} this business in ${isSEO ? "90" : "60"} days ⬇️`,
        hashtags: ["marketing", "agency", "results", "casestudy", niche.replace(/\s+/g, "")],
      },
      { id: 2, title: "Free Audit Offer", style: "Identity Interrupt", length: "18-22 sec", postFirst: true,
        hook: `If you own a ${isSEO ? "local " : ""}business and you're not getting enough ${isSEO ? "Google calls" : isSocial ? "engagement" : isAds ? "leads from your ads" : "website visitors"} — I'll tell you exactly why for free.`,
        body: `I run a ${serviceName.toLowerCase()} agency. We audit businesses every week and 90% of them have the same 3 problems. I'll find yours in 15 minutes. No charge. No pitch. Just honest feedback you can use.`,
        cta: "DM me 'audit' or link in bio to book.",
        caption: `Free ${isSEO ? "SEO" : "marketing"} audit — no strings ⬇️`,
        hashtags: ["freeaudit", "marketing", niche.replace(/\s+/g, ""), "smallbusiness"],
      },
      { id: 3, title: "Mistake They're Making", style: "Warning", length: "15-18 sec", postFirst: false, hook: `The #1 ${isSEO ? "SEO" : isSocial ? "social media" : isAds ? "ad" : "website"} mistake I see businesses make:`, body: `${isSEO ? "They set up their Google Business Profile once and never touch it again. Google rewards activity. If you're not posting weekly, adding photos, and responding to reviews — you're invisible." : isSocial ? "Posting without a strategy. Random content = random results. You need content pillars, a posting schedule, and to actually talk to your audience — not just broadcast." : isAds ? "Running ads without proper tracking. If you don't know your cost per lead and cost per acquisition, you're flying blind. Most businesses waste 40-60% of their ad budget." : "Having a slow website. Every second of load time costs you 7% of conversions. If your site takes 4+ seconds, you're losing almost a third of visitors."}`, cta: "We fix this. Link in bio.", caption: "Stop making this mistake with your business ⬇️", hashtags: ["businesstips", niche.replace(/\s+/g, ""), "marketing", "mistakes"] },
      { id: 4, title: "Day in Agency Life", style: "Relatable Venting", length: "20-24 sec", postFirst: false, hook: "What running a marketing agency actually looks like:", body: `8am: Coffee + check client dashboards. 9am: Client strategy call — their revenue is up 40%. 10am: Build a new campaign. 12pm: Lunch. 1pm: Sales call with potential client. 3pm: Create content (like this). 5pm: Done. Revenue this month: $${(retainerNum * clientsNeeded * 0.8).toLocaleString()}. No boss. No commute.`, cta: "I teach people how to start this. Link in bio.", caption: "My actual Tuesday running a marketing agency 👆", hashtags: ["agencylife", "entrepreneur", niche.replace(/\s+/g, ""), "dayinthelife"] },
      { id: 5, title: "How to Get Your First Client", style: "Education", length: "25-30 sec", postFirst: false, hook: "How to get your first agency client with $0:", body: "Step 1: Pick ONE service (don't be a generalist). Step 2: Do a free audit for 5 local businesses — email them personally. Step 3: At least 1 will say yes to a paid engagement. Step 4: Deliver results. Get a testimonial. Step 5: Use that testimonial to get client #2 and #3. That's it. No website needed. No ads needed. Just outreach and results.", cta: "Full breakdown — link in bio.", caption: "How to get your first agency client (step by step) ⬇️", hashtags: ["agency", "firstclient", "marketing", "entrepreneur"] },
      { id: 6, title: "Revenue Breakdown", style: "Curiosity Gap", length: "15-18 sec", postFirst: false, hook: `How I make $${(retainerNum * clientsNeeded).toLocaleString()}/month with ${clientsNeeded} clients:`, body: `Client 1: ${retainerPrice}/month — ${isSEO ? "dentist" : "e-commerce brand"}. Client 2: ${retainerPrice}/month — ${isSEO ? "plumber" : "local restaurant"}. Client 3: ${retainerPrice}/month — ${isSEO ? "lawyer" : "fitness studio"}. ${clientsNeeded > 3 ? `Clients 4-${clientsNeeded}: same thing.` : ""} Tools cost me $200/month total. That's a $${((retainerNum * clientsNeeded) - 200).toLocaleString()} profit margin. Monthly recurring.`, cta: "Want to build this? Link in bio.", caption: `$${(retainerNum * clientsNeeded).toLocaleString()}/month with ${clientsNeeded} clients. Here's how. 👆`, hashtags: ["revenue", "agency", "recurring", niche.replace(/\s+/g, "")] },
      { id: 7, title: "Cold Email Template", style: "Education", length: "20-25 sec", postFirst: false, hook: "The cold email that got me my first 3 agency clients:", body: `Subject: Quick question about [BUSINESS NAME]. Body: "Hi [Name], I was looking at your ${isSEO ? "Google presence" : isSocial ? "social media" : isAds ? "ad account" : "website"} and noticed a few things that could be improved. I help ${targetClient.toLowerCase()} get more ${isSEO ? "calls from Google" : "customers"}. Would it be worth a 15-minute call to show you what I found? No pitch. Just feedback." That's it. Send 20 of these per day. You'll close 1-2 clients per month.`, cta: "More templates — link in bio.", caption: "The cold email that lands agency clients ⬇️", hashtags: ["coldemail", "agency", "marketing", "outreach"] },
      { id: 8, title: "Client Win", style: "Social Proof", length: "12-15 sec", postFirst: false, hook: "Another happy client 📈", body: `[Screenshot of client results — Google Analytics, ad dashboard, or revenue chart]. Started working with them 60 days ago. ${isSEO ? "They're now ranking #1 for 12 keywords." : "Their leads are up 340%."}. This is what happens when you stop guessing and hire someone who knows what they're doing.`, cta: "Want results like this? Link in bio.", caption: "Results > promises. Every time. 📈", hashtags: ["results", "clientwin", niche.replace(/\s+/g, ""), "agency"] },
      { id: 9, title: "Trending Format", style: "Trending Audio", length: "12-15 sec", postFirst: false, hook: "[TRENDING SOUND — text overlay]", body: `"My 9-5: emails, meetings, $4K/month"\n"My agency: coffee, client calls, $${(retainerNum * clientsNeeded).toLocaleString()}/month"\n"Same hours. Different results."`, cta: "Link in bio", caption: "Should've started sooner 🤷‍♂️", hashtags: ["agency", "quit95", "entrepreneur", "freedom"] },
      { id: 10, title: "Objection Handler", style: "Myth Bust", length: "18-22 sec", postFirst: false, hook: `"I can't start an agency — I don't have experience."`, body: "Here's what you actually need: 1) The ability to learn ONE skill (SEO, ads, social — pick one). 2) The willingness to reach out to businesses. 3) The discipline to deliver results. That's it. You don't need a degree. You don't need 10 years of experience. You need ONE client, ONE result, and ONE testimonial. Everything builds from there.", cta: "Start here — link in bio.", caption: "You don't need experience. You need ONE client. ⬇️", hashtags: ["agency", "noexperience", "start", "marketing"] },
    ],

    bridgePage: {
      headline: `Free ${serviceName} Audit For Your Business`,
      subheadline: `We'll show you exactly what's working, what's broken, and how to fix it — in 15 minutes.`,
      bodyParagraphs: [
        `Most ${targetClient.toLowerCase()} are leaving money on the table. Not because their product or service is bad — because their ${isSEO ? "online presence" : "marketing"} has gaps they can't see.`,
        `We audit businesses like yours every week. And 90% of the time, there are 3-5 quick fixes that can significantly increase your leads and revenue.`,
        `This audit is free. No pitch, no commitment. Just honest, actionable feedback from someone who does this every day.`,
      ],
      symptoms: [
        `Your competitors seem to show up everywhere online — and you don't`,
        `You've tried marketing before but the ROI was unclear`,
        `You know you should be doing more online but don't know where to start`,
        `You're getting some leads but not enough to hit your growth goals`,
        `You're spending money on marketing but not sure it's working`,
      ],
      scienceBlock: { title: `Why most ${isSEO ? "SEO" : "marketing"} fails`, body: `It's not the tactics — it's the strategy. Most businesses implement random tactics without a cohesive plan. We build systems that compound over time.` },
      testimonials: [
        { text: `They found problems I didn't even know I had. Within 60 days our leads tripled.`, author: "Robert M.", age: 48, result: "3x leads in 60 days" },
        { text: `Best investment we've made. They pay for themselves 10x over every month.`, author: "Lisa K.", age: 41, result: "10x ROI on agency fees" },
      ],
      ctaHeadline: "Get Your Free Audit",
      ctaButtonText: "Book My Free Audit",
      ctaSubtext: "15 minutes · No commitment · Actionable insights",
      finalCtaHeadline: "Stop Leaving Money On The Table",
    },

    emails: [
      { day: 0, subject: `Quick question about {{company}}`, body: `Hi {{first_name}},\n\nI was looking at {{company}}'s online presence and noticed a few opportunities you might be missing.\n\nWe recently helped a similar business increase their ${isSEO ? "Google calls by 340%" : "leads by 3x"} in 60 days.\n\nWould it be worth a 15-minute call to see if we could do something similar for you?\n\nNo pitch, just a quick audit and honest feedback.\n\n[BOOKING_LINK]`, purpose: "Cold outreach — first touch" },
      { day: 3, subject: `Re: Quick question about {{company}}`, body: `{{first_name}}, following up on my last email.\n\nI actually went ahead and did a quick free audit of your current setup. Found 3 things:\n\n1. [Will be customized per client]\n2. [Based on actual research]\n3. [Specific to their business]\n\nHappy to walk you through these on a quick call. Completely free, no obligation.\n\nWorth 15 minutes?\n\n[BOOKING_LINK]`, purpose: "Follow-up with value" },
      { day: 7, subject: `Last thing, {{first_name}}`, body: `Hey {{first_name}},\n\nLast email on this — I don't want to be that annoying person.\n\nIf growing your ${isSEO ? "Google visibility" : "leads"} is a priority right now, I genuinely think we can help. If not, no worries at all.\n\nReply 'yes' and I'll send you my calendar link. Reply 'no' and I'll stop.\n\nEither way, respect your time.`, purpose: "Final follow-up" },
      { day: 14, subject: `Your ${serviceName.toLowerCase()} audit results`, body: `Hi {{first_name}},\n\nThanks for taking the call. Here's a summary of what we found:\n\n[AUDIT FINDINGS]\n\nOur recommendation: [SPECIFIC PLAN]\n\nInvestment: ${setupFee} setup + ${retainerPrice}/month\nIncludes: [DELIVERABLES]\nGuarantee: If we don't improve your results in 60 days, we work free until we do.\n\nReady to start? [PAYMENT_LINK]\n\nQuestions? Just reply.`, purpose: "Post-call proposal" },
      { day: 17, subject: `Quick update on our proposal`, body: `{{first_name}},\n\nJust checking in on the proposal I sent.\n\nIf timing isn't right, totally understand. But I wanted to mention: we're taking on ${Math.min(clientsNeeded, 3)} new clients this month and ${Math.min(clientsNeeded, 3) - 1} spots are already spoken for.\n\nNot trying to pressure you — just want to make sure you don't miss out if this is something you want to move forward on.\n\n[PAYMENT_LINK]\n\nEither way, the audit insights are yours to keep.`, purpose: "Proposal follow-up with scarcity" },
    ],

    contentStrategy: {
      postsPerDay: 2,
      pillars: [
        { name: "Case Studies/Results", percentage: 40, example: `"We helped a ${isSEO ? "dentist" : "local business"} go from $8K to $35K/month"` },
        { name: "Tips/Education", percentage: 30, example: `"3 ${isSEO ? "SEO" : "marketing"} mistakes killing your leads"` },
        { name: "Behind The Scenes", percentage: 15, example: "What running a $20K/month agency actually looks like" },
        { name: "Direct Offer", percentage: 15, example: "Taking on 3 new clients this month — DM 'audit' for a free review" },
      ],
      bestPlatforms: ["LinkedIn", "Instagram", "YouTube", "TikTok"],
      boostRule: "Boost case study posts that get 50+ organic likes on LinkedIn or 200+ on Instagram. Target business owners in your service area. $15/day, 5 days per post.",
    },

    timeline: [
      { week: "Week 1-2", revenue: "$0", action: "Pick ONE service. Create a free audit template. Send 20 cold emails/day. Post daily on LinkedIn. Build your audit landing page on Himalaya." },
      { week: "Week 3-4", revenue: `${setupFee}`, action: "First client signed from outreach. Deliver exceptional results. Document EVERYTHING for case studies. Get testimonial." },
      { week: "Week 5-8", revenue: `${retainerPrice}-$${retainerNum * 2}/mo`, action: "2-3 clients signed. Referrals starting. Systemize delivery. Start $15/day ads to audit page." },
      { week: "Month 3+", revenue: `$${(retainerNum * clientsNeeded * 0.5).toLocaleString()}-$${input.targetIncome.toLocaleString()}/mo`, action: `${clientsNeeded}+ clients. Recurring revenue stable. Hire first VA for delivery. Focus on sales + strategy.` },
    ],

    automation: [
      { tool: "Instantly.ai or Smartlead", purpose: "Cold email outreach at scale", cost: "$30/month" },
      { tool: "Calendly or Cal.com", purpose: "Audit call booking", cost: "Free" },
      { tool: "Loom", purpose: "Record audit walkthroughs for prospects", cost: "Free" },
      { tool: "Himalaya", purpose: "Client reporting, landing page, email automation", cost: "Free" },
      { tool: "Google Workspace", purpose: "Professional email domain", cost: "$6/month" },
      { tool: "Slack or Voxer", purpose: "Client communication", cost: "Free" },
    ],

    compliance: [
      "Don't guarantee specific results in contracts (guarantee effort and process, not outcomes)",
      "Always have a written agreement before starting work",
      "Set clear expectations on timeline — results take 30-90 days",
      "Never access client accounts without written permission",
      "Don't bad-mouth competitors in your content",
      "Get written permission before sharing client results publicly",
    ],
  };
}
