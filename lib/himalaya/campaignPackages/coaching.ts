// ---------------------------------------------------------------------------
// COACHING / CONSULTING — Complete Campaign Package
// The Alex Hormozi model: free value → webinar → high-ticket close
// ---------------------------------------------------------------------------

import type { CampaignPackage } from "../campaignPackageGenerator";

export function getCoachingCampaignPackage(input: {
  subNiche?: string;
  targetIncome: number;
}): CampaignPackage {
  const dailyTarget = Math.round(input.targetIncome / 30);
  const niche = input.subNiche ?? "business coaching";

  const isFitness = /fitness|health|weight|gym|nutrition/i.test(niche);
  const isLife = /life|mindset|confidence|relationship|dating/i.test(niche);
  const isBusiness = /business|marketing|sales|money|revenue/i.test(niche);

  let productName = "Group Coaching Program";
  let avgPayout = "$1,500";
  let targetAudience = "Professionals looking to transform their results";

  if (isFitness) {
    productName = "12-Week Fitness Transformation Program";
    avgPayout = "$997";
    targetAudience = "Men and women 30-55 who want to get in the best shape of their lives";
  } else if (isLife) {
    productName = "90-Day Life Transformation Coaching";
    avgPayout = "$2,000";
    targetAudience = "People 25-50 feeling stuck and wanting a major life change";
  } else {
    productName = "Business Growth Coaching Program";
    avgPayout = "$2,500";
    targetAudience = "Business owners making $3-20K/month who want to scale";
  }

  const payoutNum = parseInt(avgPayout.replace(/[^0-9]/g, ""), 10);
  const salesNeeded = Math.ceil(dailyTarget / (payoutNum / 30)); // monthly program
  const callsNeeded = Math.ceil(salesNeeded / 0.3); // 30% close rate on calls
  const webinarAttendees = Math.ceil(callsNeeded / 0.2); // 20% book a call

  return {
    product: {
      name: productName,
      network: "Direct (your own offer)",
      avgPayout: `${avgPayout} per client`,
      targetAudience,
      whyItWins: "Coaching has the highest margins of any business model. No inventory, no shipping, no employees needed to start. One client at $2K/month covers your expenses. Five clients = six figures.",
      hoplink: "YOUR_BOOKING_URL",
    },

    math: {
      targetDaily: dailyTarget,
      payoutPerSale: payoutNum,
      salesNeeded: Math.ceil(input.targetIncome / payoutNum),
      clicksNeeded: webinarAttendees * 5,
      conversionRate: 0.06,
      organicClicks: webinarAttendees * 4,
      paidClicks: webinarAttendees,
      dailyAdBudget: 30,
      explanation: `$${input.targetIncome.toLocaleString()}/month ÷ $${payoutNum}/client = ${Math.ceil(input.targetIncome / payoutNum)} clients needed.\n\nFunnel: Content → Free Training/Webinar → Book a Call → Close\n${webinarAttendees} webinar attendees → ${callsNeeded} book calls (20%) → ${salesNeeded} close (30%)\n\nGet webinar registrations from: organic content (free) + $30/day Meta ads to landing page.\nWebinar can be live or recorded (evergreen replay).`,
    },

    scripts: [
      {
        id: 1, title: "The Transformation Promise", style: "Identity Interrupt", length: "20-25 sec", postFirst: true,
        hook: `If you're a ${targetAudience.toLowerCase().split(" who")[0]} and you feel stuck — watch this.`,
        body: `I work with people exactly like you. And the #1 thing I see is that you don't have a knowledge problem — you have an execution problem. You know what to do. You just can't seem to do it consistently. That's not a character flaw. That's a systems problem. And systems can be fixed.`,
        cta: "I'm running a free training this week that shows you exactly how. Link in bio.",
        caption: "This is why you feel stuck (it's not what you think) ⬇️",
        hashtags: ["coaching", niche.replace(/\s+/g, ""), "transformation", "results"],
      },
      {
        id: 2, title: "Client Result Story", style: "Story", length: "25-30 sec", postFirst: true,
        hook: `My client ${isBusiness ? "went from $5K months to $25K months" : isFitness ? "lost 30 pounds and kept it off" : "completely transformed their life"} in 90 days. Here's what changed.`,
        body: `When they started, they were ${isBusiness ? "working 60-hour weeks, undercharging, and burning out" : isFitness ? "frustrated, low energy, and had tried every diet" : "stuck in the same patterns, feeling lost, and ready to give up"}. The first thing we did was NOT what you'd expect. We didn't ${isBusiness ? "add more marketing" : isFitness ? "change their diet" : "set more goals"}. We ${isBusiness ? "fixed their offer and pricing first" : isFitness ? "addressed the root cause — their hormones and habits" : "identified the ONE pattern that was holding everything back"}. Everything else fell into place after that.`,
        cta: "Want to know what YOUR one thing is? Free training — link in bio.",
        caption: `${isBusiness ? "$5K to $25K" : isFitness ? "30 lbs gone" : "Complete transformation"} in 90 days. Here's the truth about how. ⬇️`,
        hashtags: ["results", "clientwin", niche.replace(/\s+/g, ""), "coaching"],
      },
      {
        id: 3, title: "Myth Bust", style: "Myth Bust", length: "18-22 sec", postFirst: true,
        hook: `The biggest lie in ${niche} is that you need to figure it out alone.`,
        body: `Think about it. Every elite athlete has a coach. Every Fortune 500 CEO has advisors. But somehow you're supposed to ${isBusiness ? "build a business" : isFitness ? "transform your body" : "change your life"} by watching free YouTube videos? The difference between where you are and where you want to be is not more information. It's the right guidance applied to YOUR specific situation.`,
        cta: "That's what I do. Free training shows you how — link in bio.",
        caption: "Stop trying to figure it out alone ⬇️",
        hashtags: [niche.replace(/\s+/g, ""), "coach", "guidance", "success"],
      },
      {
        id: 4, title: "Value Bomb", style: "Education", length: "20-25 sec", postFirst: false,
        hook: `3 things I tell every ${isBusiness ? "business owner" : isFitness ? "client" : "person"} on day one of coaching:`,
        body: `Number 1: ${isBusiness ? "Stop competing on price. You're not expensive — you're undervalued." : isFitness ? "Stop dieting. Start building habits that last." : "Stop setting goals. Start building systems."} Number 2: ${isBusiness ? "Your first $10K month comes from 3-5 clients, not 100." : isFitness ? "Sleep and stress matter more than your workout." : "Your environment determines your behavior more than willpower."} Number 3: ${isBusiness ? "Marketing is just having conversations at scale." : isFitness ? "The best program is the one you actually do." : "Progress isn't linear. Plateaus mean you're about to break through."}`,
        cta: "Want the full framework? Free training — link in bio.",
        caption: `3 things I tell EVERY ${isBusiness ? "business owner" : "client"} on day one 👆`,
        hashtags: [niche.replace(/\s+/g, ""), "tips", "coaching", "advice"],
      },
      { id: 5, title: "Day In The Life", style: "Relatable Venting", length: "20-24 sec", postFirst: false, hook: `What running a ${niche} coaching business actually looks like:`, body: `Morning: check in with clients, review their progress. Midday: one strategy call — this is where the magic happens. Afternoon: create content (like this video). Evening: done by 5. No office. No commute. No boss. Total revenue last month: $${Math.round(input.targetIncome * 0.7).toLocaleString()}. Did I mention I work 4 days a week?`, cta: "I teach others how to build this. Free training — link in bio.", caption: "This is my actual Tuesday 👆", hashtags: ["coachlife", niche.replace(/\s+/g, ""), "freedom", "dayinthelife"] },
      { id: 6, title: "Objection Handler", style: "Warning", length: "15-18 sec", postFirst: false, hook: `"I can't afford coaching" — let me reframe that for you.`, body: `You can't afford to stay where you are for another year. What's 12 more months of ${isBusiness ? "underearning" : isFitness ? "not feeling good in your body" : "being stuck"} costing you? Not just money — time, energy, confidence. The investment pays for itself when you get the right result. The question isn't can you afford it. It's can you afford NOT to.`, cta: "Free training shows you the ROI. Link in bio.", caption: "Let's talk about the REAL cost of staying stuck ⬇️", hashtags: [niche.replace(/\s+/g, ""), "invest", "coaching", "mindset"] },
      { id: 7, title: "Authority", style: "Education", length: "18-22 sec", postFirst: false, hook: `I've coached ${isBusiness ? "200+ business owners" : isFitness ? "500+ transformations" : "300+ people"} and here's the pattern:`, body: `The ones who succeed fastest all do the same thing: they stop collecting information and start implementing WITH accountability. It's never the person with the most knowledge. It's the person who takes action with guidance. Every. Single. Time.`, cta: "Ready to be that person? Link in bio.", caption: `The #1 pattern I see in people who succeed fast 👆`, hashtags: [niche.replace(/\s+/g, ""), "success", "pattern", "coaching"] },
      { id: 8, title: "Behind The Scenes", style: "Curiosity Gap", length: "15-18 sec", postFirst: false, hook: `Most coaching programs fail. Here's why mine doesn't.`, body: `I don't give you a course and disappear. Every week: live call. Daily: community check-in. Monthly: strategy review. You're never guessing what to do next. You're never alone in it. That's the difference between a program and a partnership.`, cta: "See how it works — free training in bio.", caption: "Why most coaching programs fail (and what's different here) ⬇️", hashtags: [niche.replace(/\s+/g, ""), "coaching", "different", "results"] },
      { id: 9, title: "Trending Audio", style: "Trending Audio", length: "12-15 sec", postFirst: false, hook: "[TEXT OVERLAY]", body: `Line 1: "Me before coaching: overwhelmed, stuck, frustrated"\nLine 2: "Me 90 days into coaching: ${isBusiness ? "$20K month, 4-day work week" : isFitness ? "Down 25 lbs, energy through the roof" : "Clear direction, actual results, finally happy"}"\nLine 3: "The difference was ONE decision"\nLine 4: "Free training — link in bio"`, cta: "Link in bio", caption: "The power of the right coach 🙌", hashtags: [niche.replace(/\s+/g, ""), "transformation", "coaching", "fyp"] },
      { id: 10, title: "Question Hook", style: "Question Hook", length: "15-20 sec", postFirst: false, hook: `What would your life look like in 90 days if you actually had ${isBusiness ? "a business that runs without you" : isFitness ? "the body you've always wanted" : "clarity and direction"}?`, body: `Not hoping. Not 'trying.' Actually HAVING it. Because that's what happens when you stop guessing and start following a proven path with someone who's done it before. 90 days is nothing. But it's enough to change everything.`, cta: "Comment '90' and check the link in my bio.", caption: "Where will you be in 90 days? 💭", hashtags: [niche.replace(/\s+/g, ""), "90days", "transformation", "coaching"] },
    ],

    bridgePage: {
      headline: `The Free Training That's Helping ${isBusiness ? "Business Owners" : isFitness ? "People" : "Professionals"} ${isBusiness ? "Double Their Revenue" : isFitness ? "Transform Their Bodies" : "Transform Their Lives"} in 90 Days`,
      subheadline: `Without ${isBusiness ? "working more hours or running ads" : isFitness ? "extreme diets or spending hours in the gym" : "willpower, motivation hacks, or going it alone"}.`,
      bodyParagraphs: [
        `If you're ${targetAudience.toLowerCase()}, this free training was made for you.`,
        `Inside, you'll discover the exact framework that's helped ${isBusiness ? "200+" : "500+"} ${isBusiness ? "business owners" : "people"} get results — even when everything else they tried failed.`,
        `This isn't theory. It's the same system being used right now by real people getting real results.`,
      ],
      symptoms: [
        `You know what you should be doing but can't seem to do it consistently`,
        `You've invested in courses/programs before and they didn't deliver`,
        `You feel like you're working hard but not seeing proportional results`,
        `You're overwhelmed by options and don't know what to focus on`,
        `You're ready for a breakthrough but need the right guidance`,
      ],
      scienceBlock: { title: "Why this works when other things haven't", body: "Most programs give you information. This gives you implementation. The difference is having a proven framework applied to YOUR specific situation, with accountability to follow through." },
      testimonials: [
        { text: `${isBusiness ? "Went from $5K to $25K months in 90 days. The clarity alone was worth 10x the investment." : "Completely changed my life. Not just the results — the confidence, the energy, everything."}`, author: isBusiness ? "Marcus W." : "Jennifer S.", age: isBusiness ? 38 : 44, result: isBusiness ? "$5K → $25K/month" : "Total transformation" },
        { text: "I was skeptical. I'd tried coaches before. This was different. They actually cared about MY results, not just selling me something.", author: "David R.", age: 42, result: "Exceeded every goal in 12 weeks" },
      ],
      ctaHeadline: "Watch the free training now",
      ctaButtonText: "Watch The Free Training",
      ctaSubtext: `Free · ${isBusiness ? "45" : "30"} minutes · No email required`,
      finalCtaHeadline: `Ready to ${isBusiness ? "scale your business" : isFitness ? "transform your body" : "change your life"} in the next 90 days?`,
    },

    emails: [
      { day: 0, subject: `Your free training + the #1 mistake ${isBusiness ? "business owners" : "most people"} make`, body: `Hi {{first_name}},\n\nHere's your free training: [LINK]\n\nBefore you watch, I want to share the #1 mistake I see:\n\nTrying to figure it out alone. The most successful ${isBusiness ? "business owners" : "people"} I've worked with all have one thing in common: they asked for help early.\n\nThe training explains why — and what to do instead.\n\nWatch it today while the motivation is fresh.\n\n[LINK]`, purpose: "Deliver training + first lesson" },
      { day: 2, subject: `${isBusiness ? "Marcus went from $5K to $25K months" : "Jennifer's story might sound familiar"}`, body: `Hi {{first_name}},\n\n${isBusiness ? "Marcus was working 60-hour weeks making $5K/month. Burning out. Ready to quit.\n\n90 days later: $25K month. Working 4 days a week.\n\nThe shift? He stopped trying to do everything and focused on the 3 things that actually move the needle." : "Jennifer had tried 4 different programs. Nothing stuck.\n\nThe difference this time? She had someone in her corner who understood HER specific situation. Not generic advice — specific guidance."}\n\nIf you haven't watched the training yet:\n[LINK]\n\nIt explains the exact framework.`, purpose: "Social proof" },
      { day: 4, subject: "The 3-step framework (quick overview)", body: `{{first_name}},\n\nQuick breakdown of the framework:\n\n1. ${isBusiness ? "Fix your offer (most businesses are one offer tweak away from doubling)" : isFitness ? "Identify your #1 habit blocker (it's never what you think)" : "Find your one pattern (the thing holding everything else back)"}\n2. ${isBusiness ? "Build a simple acquisition system (no cold DMs, no dancing on TikTok)" : "Build a sustainable system (not willpower, not motivation — systems)"}\n3. ${isBusiness ? "Deliver results so good that referrals become your growth engine" : "Compound your wins (small wins → momentum → transformation)"}\n\nThe training walks through each step in detail:\n[LINK]`, purpose: "Education" },
      { day: 6, subject: `"I've tried coaching before and it didn't work"`, body: `{{first_name}},\n\nI hear this every week. And it's valid.\n\nMost coaching IS disappointing. Here's why mine is different:\n\n1. You get a custom plan — not a cookie-cutter program\n2. Weekly live calls — not pre-recorded videos you'll never watch\n3. Daily accountability — I actually check in on you\n4. Results-based — if you don't get results, I work with you until you do\n\nThe training explains exactly how this works:\n[LINK]\n\nNo risk. See for yourself.`, purpose: "Objection handling" },
      { day: 9, subject: "Quick question (then I'll stop emailing)", body: `{{first_name}},\n\nHonest question: what's holding you back?\n\nIf it's timing — there's never a perfect time.\nIf it's money — what's another ${isBusiness ? "year of $5K months" : "year of being stuck"} costing you?\nIf it's trust — that's fair. Watch the training and decide for yourself.\n\n[LINK]\n\nThis is my last email on this. Whatever you decide, I respect it.\n\nBut if there's even a small part of you that knows something needs to change — this is the moment.\n\nRooting for you,\n{{sender_name}}`, purpose: "Final push" },
    ],

    contentStrategy: {
      postsPerDay: 3,
      pillars: [
        { name: "Client Results/Stories", percentage: 35, example: `"My client went from ${isBusiness ? "$5K to $25K" : "stuck to thriving"} in 90 days"` },
        { name: "Value/Teaching", percentage: 30, example: `"3 things every ${isBusiness ? "business owner" : "person"} needs to know about ${niche}"` },
        { name: "Personal Story/Authority", percentage: 20, example: "My journey from struggling to running a 6-figure coaching business" },
        { name: "CTA/Offer", percentage: 15, example: "I'm opening 3 spots for my coaching program this month" },
      ],
      bestPlatforms: ["Instagram", "YouTube", "LinkedIn", "TikTok"],
      boostRule: "Boost client result videos that get 300+ organic likes. Target lookalike audience of your email list. $30/day budget, run for 7 days per winning post.",
    },

    timeline: [
      { week: "Week 1-2", revenue: "$0", action: "Post daily. Create free training/webinar (45 min). Set up booking page. Start DM conversations with ideal clients." },
      { week: "Week 3-4", revenue: `$${payoutNum.toLocaleString()}-$${(payoutNum * 2).toLocaleString()}`, action: "Close first 1-2 clients from DMs + webinar. Get testimonials immediately. Start $30/day ads to webinar." },
      { week: "Week 5-8", revenue: `$${(payoutNum * 3).toLocaleString()}-$${(payoutNum * 5).toLocaleString()}`, action: "Webinar converting. 3-5 clients enrolled. Referrals starting. Document results for social proof." },
      { week: "Month 3+", revenue: `$${Math.round(input.targetIncome * 0.5).toLocaleString()}-$${input.targetIncome.toLocaleString()}/mo`, action: "Group program full. Waiting list forming. Raise prices. Launch premium 1-on-1 tier." },
    ],

    automation: [
      { tool: "Calendly or Cal.com", purpose: "Strategy call booking (free tier)", cost: "Free" },
      { tool: "Zoom", purpose: "Strategy calls + group coaching calls", cost: "Free (40 min limit) or $13/mo" },
      { tool: "Himalaya", purpose: "Landing page, email automation, tracking", cost: "Free" },
      { tool: "Loom", purpose: "Record free training/webinar (evergreen)", cost: "Free" },
      { tool: "Stripe", purpose: "Payment processing", cost: "2.9% + 30¢ per charge" },
      { tool: "Meta Ads", purpose: "Drive webinar registrations", cost: "$30/day when ready" },
    ],

    compliance: [
      "Don't guarantee specific income results in ads",
      "Use language: 'clients have achieved,' 'results vary'",
      "Testimonials must be real — use client's first name + last initial",
      "Include income disclaimer if showing revenue numbers",
      "Always disclose that coaching requires effort and results aren't guaranteed",
      "Don't use 'guru' or 'expert' in paid ads — triggers Meta review",
    ],
  };
}
