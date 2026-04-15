// ---------------------------------------------------------------------------
// LOCAL SERVICE BUSINESS — Complete Campaign Package
// Google Local Ads → Calls → Jobs → Reviews → Repeat
// ---------------------------------------------------------------------------

import type { CampaignPackage } from "../campaignPackageGenerator";

export function getLocalServiceCampaignPackage(input: {
  subNiche?: string;
  targetIncome: number;
}): CampaignPackage {
  const dailyTarget = Math.round(input.targetIncome / 30);
  const niche = input.subNiche ?? "home services";

  const isPlumbing = /plumb|pipe|drain|water/i.test(niche);
  const isHVAC = /hvac|heat|cool|air|furnace/i.test(niche);
  const isRoofing = /roof|gutter|exterior/i.test(niche);
  const isCleaning = /clean|maid|janitorial/i.test(niche);
  const isLawn = /lawn|landscap|yard|tree/i.test(niche);

  let serviceName = "Home Service";
  let avgJobValue = "$350";
  let targetClient = "Homeowners in your service area";

  if (isPlumbing) { serviceName = "Plumbing"; avgJobValue = "$400"; targetClient = "Homeowners with plumbing emergencies or home buyers"; }
  else if (isHVAC) { serviceName = "HVAC"; avgJobValue = "$500"; targetClient = "Homeowners needing AC/heating repair or installation"; }
  else if (isRoofing) { serviceName = "Roofing"; avgJobValue = "$5,000"; targetClient = "Homeowners with storm damage or aging roofs"; }
  else if (isCleaning) { serviceName = "Cleaning"; avgJobValue = "$150"; targetClient = "Busy professionals and families who need regular cleaning"; }
  else if (isLawn) { serviceName = "Landscaping"; avgJobValue = "$200"; targetClient = "Homeowners who want a beautiful yard without the work"; }

  const jobValue = parseInt(avgJobValue.replace(/[^0-9]/g, ""), 10);
  const jobsNeeded = Math.ceil(input.targetIncome / jobValue);
  const callsNeeded = Math.ceil(jobsNeeded / 0.4); // 40% call-to-job conversion

  return {
    product: {
      name: `${serviceName} Business`,
      network: "Direct (your own service)",
      avgPayout: `${avgJobValue} average job value`,
      targetAudience: targetClient,
      whyItWins: `Local service businesses have the FASTEST path to revenue. People search "${serviceName.toLowerCase()} near me" every day with credit card in hand. Google Local Ads puts your phone number in front of them. No funnels, no email sequences — just phone calls and jobs.`,
      hoplink: "YOUR_BOOKING_URL",
    },

    math: {
      targetDaily: dailyTarget,
      payoutPerSale: jobValue,
      salesNeeded: Math.ceil(dailyTarget / jobValue) || 1,
      clicksNeeded: callsNeeded,
      conversionRate: 0.4,
      organicClicks: Math.round(callsNeeded * 0.5),
      paidClicks: Math.round(callsNeeded * 0.5),
      dailyAdBudget: isRoofing ? 50 : 25,
      explanation: `$${input.targetIncome.toLocaleString()}/month ÷ ${avgJobValue}/job = ${jobsNeeded} jobs/month needed.\nAt 40% call-to-booking rate → ${callsNeeded} phone calls needed/month.\n\nSource 1: Google Business Profile (FREE) → ${Math.round(callsNeeded * 0.3)} calls\nSource 2: Google Local Service Ads ($${isRoofing ? "50" : "25"}/day) → ${Math.round(callsNeeded * 0.4)} calls\nSource 3: Referrals + Reviews → ${Math.round(callsNeeded * 0.3)} calls\n\nEvery 5-star review = 2-3 more calls/month. Reviews are your growth engine.`,
    },

    scripts: [
      { id: 1, title: "Job Timelapse", style: "Identity Interrupt", length: "15-20 sec", postFirst: true, hook: `Another day, another ${serviceName.toLowerCase()} job done right. 💪`, body: `[Timelapse of the job from start to finish. Before → During → After. Satisfying transformation.]`, cta: `Need ${serviceName.toLowerCase()} help? Link in bio or call us.`, caption: `${serviceName} transformation — before and after 🔥⬇️`, hashtags: [serviceName.toLowerCase().replace(/\s+/g, ""), "beforeafter", "satisfying", "localbusiness", "contractor"] },
      { id: 2, title: "Customer Reaction", style: "Story", length: "18-22 sec", postFirst: true, hook: "Their face when they saw the finished job 😊", body: `[Film customer seeing the completed work for the first time. Genuine reaction. Quick interview: "How does it look?" "It's amazing, thank you!"]`, cta: "We love making people happy. Book yours — link in bio.", caption: "This is why we do what we do ❤️", hashtags: ["customerreaction", serviceName.toLowerCase().replace(/\s+/g, ""), "happy", "localbusiness"] },
      { id: 3, title: "Emergency Story", style: "Urgency", length: "20-25 sec", postFirst: true, hook: `Got a call at ${isPlumbing ? "11pm" : "7am"} — ${isPlumbing ? "water everywhere" : isHVAC ? "AC died in 100° heat" : "emergency job"}.`, body: `The homeowner was ${isPlumbing ? "panicking. Water pouring from the ceiling. We got there in 30 minutes, found the burst pipe, and had it fixed by midnight" : isHVAC ? "desperate. Baby at home, no AC in July. We rearranged our schedule and had them cool within 2 hours" : "stressed. Called 3 other companies — nobody could come. We showed up same day and got it done"}. That's what we do. When you need us, we're there.`, cta: "Save our number. You'll need it someday. Link in bio.", caption: `${isPlumbing ? "11pm" : "Emergency"} call. This is what we do. ⬇️`, hashtags: ["emergency", serviceName.toLowerCase().replace(/\s+/g, ""), "sameday", "reliable"] },
      { id: 4, title: "Tips for Homeowners", style: "Education", length: "20-25 sec", postFirst: false, hook: `${isPlumbing ? "3 things every homeowner should know about their plumbing:" : isHVAC ? "How to save money on your energy bill:" : `${serviceName} tips that save you money:`}`, body: `Number 1: ${isPlumbing ? "Know where your main water shutoff is. In an emergency, this saves you thousands" : isHVAC ? "Change your filters every 90 days — dirty filters make your system work 30% harder" : "Preventive maintenance costs 1/10th of emergency repairs"}. Number 2: ${isPlumbing ? "Don't put grease down your drain. Ever. It's the #1 cause of clogs" : isHVAC ? "Get a tune-up twice a year — spring for AC, fall for heating" : "Address small issues before they become big ones"}. Number 3: ${isPlumbing ? "That running toilet is costing you $100/month in water" : "Annual service plans save you 20-30% over emergency calls"}.`, cta: "Follow for more tips. Need help? Link in bio.", caption: `Free tips that save you money 💰⬇️`, hashtags: ["homeownertips", serviceName.toLowerCase().replace(/\s+/g, ""), "savemoney", "tips"] },
      { id: 5, title: "Day in the Life", style: "Relatable Venting", length: "20-25 sec", postFirst: false, hook: `Day in the life of a ${serviceName.toLowerCase()} business owner:`, body: `6am: First job scheduled. 7am: Coffee and drive. 8am-12pm: Two jobs done, $${jobValue * 2} earned. 12pm: Lunch — the best part. 1pm-4pm: Two more jobs. 4pm: Invoicing while listening to music. 5pm: Done. Total for the day: $${jobValue * 4}. Be your own boss. It's not easy but it's worth it.`, cta: "Want to start? Or need our service? Link in bio.", caption: "A real day running a ${serviceName.toLowerCase()} business 👆", hashtags: ["dayinthelife", "smallbusiness", serviceName.toLowerCase().replace(/\s+/g, ""), "entrepreneur"] },
      { id: 6, title: "5-Star Review", style: "Social Proof", length: "12-15 sec", postFirst: false, hook: "Another 5-star review just came in ⭐⭐⭐⭐⭐", body: `[Show the review on screen. Read the highlight. Show the finished job that earned the review.]`, cta: "Join 200+ happy homeowners. Link in bio.", caption: "We don't just do the job — we earn the review ⬇️", hashtags: ["5stars", "reviews", serviceName.toLowerCase().replace(/\s+/g, ""), "trusted"] },
      { id: 7, title: "Common Mistake", style: "Warning", length: "15-18 sec", postFirst: false, hook: `The most expensive ${serviceName.toLowerCase()} mistake homeowners make:`, body: `${isPlumbing ? "Ignoring a small leak. That drip costs you $200/month in water and can cause $10,000 in water damage. Fix it now." : isHVAC ? "Skipping annual maintenance. A $150 tune-up prevents $3,000 repairs. Every time." : "Hiring the cheapest contractor. You'll pay twice — once for the bad job, once to fix it."}`, cta: "Don't make this mistake. Call us first. Link in bio.", caption: "This mistake costs homeowners thousands ⬇️", hashtags: ["mistake", "homeowner", serviceName.toLowerCase().replace(/\s+/g, ""), "warning"] },
      { id: 8, title: "Trending Before/After", style: "Trending Audio", length: "12-15 sec", postFirst: false, hook: "[TRENDING SOUND — before/after reveal]", body: `[Split screen: messy/broken BEFORE → clean/fixed AFTER. Satisfying transformation.]`, cta: "Link in bio for a free estimate.", caption: "Satisfying transformation 🤩 #beforeafter", hashtags: ["beforeafter", "satisfying", serviceName.toLowerCase().replace(/\s+/g, ""), "transformation"] },
      { id: 9, title: "Free Estimate Offer", style: "Curiosity Gap", length: "12-15 sec", postFirst: false, hook: `Free ${serviceName.toLowerCase()} estimates — no obligation, no pressure.`, body: "We show up, assess the situation, give you an honest price. If you like it, we do the work. If not, no hard feelings. That's how it should be.", cta: "Call or book online — link in bio.", caption: "Free estimates. No games. ⬇️", hashtags: ["freeestimate", serviceName.toLowerCase().replace(/\s+/g, ""), "honest", "localbusiness"] },
      { id: 10, title: "Team Spotlight", style: "Story", length: "15-20 sec", postFirst: false, hook: "Meet our team 👋", body: "[Quick intro of 2-3 team members. Name, role, fun fact. Show them on the job. Make them human and likeable.]", cta: "The people behind the work. Book us — link in bio.", caption: "We're real people who care about your home ❤️", hashtags: ["meettheteam", serviceName.toLowerCase().replace(/\s+/g, ""), "people", "localbusiness"] },
    ],

    bridgePage: {
      headline: `${serviceName} You Can Trust — Serving [Your City]`,
      subheadline: `Rated 4.9/5 by ${isRoofing ? "200" : "500"}+ local homeowners. Same-day service available.`,
      bodyParagraphs: [
        `When you need ${serviceName.toLowerCase()} help, you need someone who shows up on time, does the job right, and charges a fair price. That's us.`,
        `We've been serving [Your City] for [X] years. Every job comes with our satisfaction guarantee.`,
      ],
      symptoms: [],
      scienceBlock: { title: "Why homeowners choose us", body: `Same-day service. Transparent pricing. ${isRoofing ? "200" : "500"}+ 5-star reviews. Licensed and insured. Satisfaction guaranteed.` },
      testimonials: [
        { text: `They came same day, fixed the problem in an hour, and the price was exactly what they quoted. Can't ask for more than that.`, author: "Mark T.", age: 52, result: "Same-day fix" },
        { text: `Used them 3 times now. They're my go-to. Always professional, always fair.`, author: "Karen S.", age: 45, result: "Repeat customer" },
      ],
      ctaHeadline: "Get a Free Estimate",
      ctaButtonText: "Call Now or Book Online",
      ctaSubtext: `Same-day service · Licensed & insured · ${isRoofing ? "200" : "500"}+ 5-star reviews`,
      finalCtaHeadline: `Your Trusted ${serviceName} Team in [Your City]`,
    },

    emails: [
      { day: 0, subject: `Thank you for choosing us! — ${serviceName}`, body: `Hi {{first_name}},\n\nThank you for letting us handle your ${serviceName.toLowerCase()} needs. We appreciate your trust.\n\nIf you have a moment, would you leave us a quick Google review? It helps other homeowners find reliable service.\n\n[GOOGLE_REVIEW_LINK]\n\nIf anything needs attention, call us directly. We stand behind our work 100%.`, purpose: "Post-service review request" },
      { day: 30, subject: "How's everything holding up?", body: `{{first_name}}, just checking in.\n\nIt's been about a month since we did your ${serviceName.toLowerCase()} work. How's everything?\n\nIf you want to make sure things stay running smoothly, our maintenance plan covers:\n✓ Annual inspection\n✓ Priority scheduling\n✓ 20% off all services\n\nReply 'interested' and I'll set it up.`, purpose: "Maintenance plan upsell" },
      { day: 90, subject: `Seasonal ${serviceName.toLowerCase()} check — don't miss this`, body: `Hi {{first_name}},\n\nIt's that time of year when ${isPlumbing ? "pipes can freeze" : isHVAC ? "your system works hardest" : "seasonal issues pop up"}. A quick check now prevents expensive repairs later.\n\nBook your inspection: [BOOKING_LINK]\n\nMention this email for $25 off.`, purpose: "Seasonal re-engagement" },
      { day: 180, subject: "Miss us? 😊 Here's $50 off your next service", body: `{{first_name}},\n\nIt's been 6 months! Hope everything is running smoothly.\n\nAs a past customer, here's $50 off your next ${serviceName.toLowerCase()} service. Use code LOYALTY50.\n\nBook here: [BOOKING_LINK]\n\nWe'd love to help you again.`, purpose: "Win-back with discount" },
      { day: 365, subject: `Your annual ${serviceName.toLowerCase()} check-up`, body: `Hi {{first_name}},\n\nOne year already! Time for your annual checkup.\n\nPrevention is always cheaper than repair. Book your inspection:\n\n[BOOKING_LINK]\n\nStill $25 off for returning customers.\n\nLooking forward to hearing from you!`, purpose: "Annual re-engagement" },
    ],

    contentStrategy: {
      postsPerDay: 2,
      pillars: [
        { name: "Job Timelapses/Before-After", percentage: 40, example: "Satisfying transformation videos of completed jobs" },
        { name: "Tips for Homeowners", percentage: 25, example: `"3 things every homeowner should know about their ${serviceName.toLowerCase()}"` },
        { name: "Customer Reviews/Reactions", percentage: 20, example: "Customer seeing finished work + reading 5-star review" },
        { name: "Day in the Life/Team", percentage: 15, example: "What a day running a service business actually looks like" },
      ],
      bestPlatforms: ["Google Business Profile (MOST IMPORTANT)", "Facebook", "Instagram", "Nextdoor", "TikTok"],
      boostRule: "Post 3x/week on Google Business Profile — this is FREE and directly improves your local search ranking. Boost transformation videos on Facebook targeting homeowners within 25 miles. $25/day.",
    },

    timeline: [
      { week: "Week 1", revenue: "$0", action: "Set up Google Business Profile (CRITICAL). Create booking page. Design truck/uniform with branding. Get your first 5 reviews from friends/family." },
      { week: "Week 2-3", revenue: `$${jobValue}-$${jobValue * 3}`, action: "Launch Google Local Service Ads ($25/day). First calls come in. Complete first jobs perfectly. Ask EVERY customer for a review." },
      { week: "Week 4-6", revenue: `$${jobValue * 5}-$${jobValue * 10}/mo`, action: "10+ Google reviews. Ranking in local pack. Referrals starting. Post job photos on social media daily." },
      { week: "Month 3+", revenue: `$${Math.round(input.targetIncome * 0.5).toLocaleString()}-$${input.targetIncome.toLocaleString()}/mo`, action: `${jobsNeeded}+ jobs/month. Hire first helper. Launch maintenance plan for recurring revenue. Reviews compounding.` },
    ],

    automation: [
      { tool: "Google Business Profile", purpose: "FREE local visibility — this is your #1 tool", cost: "Free" },
      { tool: "Google Local Service Ads", purpose: "Pay per lead (phone calls), not per click", cost: "$15-50 per lead" },
      { tool: "Jobber or ServiceTitan", purpose: "Job scheduling + invoicing", cost: "$30-50/month" },
      { tool: "Himalaya", purpose: "Website, review collection, email automation", cost: "Free" },
      { tool: "QuickBooks", purpose: "Bookkeeping + invoicing", cost: "$15/month" },
      { tool: "Facebook + Instagram", purpose: "Local brand awareness", cost: "$25/day when ready" },
    ],

    compliance: [
      "Must have proper licensing for your trade (check your state requirements)",
      "Carry general liability insurance ($1M minimum recommended)",
      "Get permits for work that requires them (don't skip this — huge liability)",
      "Always provide written estimates before starting work",
      "Never start work without signed authorization",
      "Follow OSHA safety guidelines on every job site",
      "Don't guarantee timelines you can't keep — under-promise, over-deliver",
    ],
  };
}
