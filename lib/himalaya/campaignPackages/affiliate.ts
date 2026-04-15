// ---------------------------------------------------------------------------
// AFFILIATE MARKETING — Complete Campaign Package
// Level: CitrusBurn quality — specific products, word-for-word scripts,
// bridge page content, 5 emails, exact math, real timeline
//
// This is NOT generic. This is "here's your business, go execute."
// ---------------------------------------------------------------------------

import type { CampaignPackage } from "../campaignPackageGenerator";

export function getAffiliateCampaignPackage(input: {
  subNiche?: string;
  targetIncome: number;
}): CampaignPackage {
  const dailyTarget = Math.round(input.targetIncome / 30);
  const niche = input.subNiche ?? "health and wellness";

  // Default to health/weight loss — the highest-converting affiliate niche
  const isWeightLoss = /weight|loss|diet|metabolism|fat|slim|keto/i.test(niche);
  const isFinance = /money|finance|invest|crypto|forex|wealth/i.test(niche);
  const isSurvival = /survival|prepper|emergency|bug.?out/i.test(niche);

  // Pick the right product category
  let productName = "Top Health Supplement";
  let avgPayout = "$150";
  let network = "ClickBank";
  let targetAudience = "Health-conscious adults looking for natural solutions";
  let whyItWins = "Health supplements are the #1 ClickBank category. High commissions, recurring demand, massive TikTok organic pull.";
  let conversionRate = 0.015;

  if (isWeightLoss) {
    productName = "Weight Loss Supplement (women 40+)";
    avgPayout = "$180";
    targetAudience = "Women 40-65 struggling with weight loss despite diet and exercise";
    whyItWins = "Women's weight loss is the #1 converting category on ClickBank. Massive organic demand on TikTok — women over 40 are the fastest-growing demographic.";
    conversionRate = 0.018;
  } else if (isFinance) {
    productName = "Trading/Investing Education Program";
    avgPayout = "$250";
    targetAudience = "Men 25-55 looking to build wealth through investing or side income";
    whyItWins = "Finance offers pay the highest commissions ($200-500/sale). Strong demand on YouTube and TikTok finance content.";
    conversionRate = 0.012;
  } else if (isSurvival) {
    productName = "Survival/Preparedness Guide";
    avgPayout = "$120";
    targetAudience = "Men 35-65 concerned about emergency preparedness";
    whyItWins = "Survival niche has loyal, passionate buyers. Lower competition than health. Strong email conversion rates.";
    conversionRate = 0.02;
  }

  const payoutNum = parseInt(avgPayout.replace(/[^0-9]/g, ""), 10);
  const salesNeeded = Math.ceil(dailyTarget / payoutNum);
  const clicksNeeded = Math.ceil(salesNeeded / conversionRate);
  const organicClicks = Math.round(clicksNeeded * 0.8);
  const paidClicks = clicksNeeded - organicClicks;

  return {
    product: {
      name: productName,
      network,
      avgPayout: `${avgPayout} per sale`,
      targetAudience,
      whyItWins,
      hoplink: "https://YOUR_CB_ID.PRODUCT.hop.clickbank.net",
    },

    math: {
      targetDaily: dailyTarget,
      payoutPerSale: payoutNum,
      salesNeeded,
      clicksNeeded,
      conversionRate,
      organicClicks,
      paidClicks,
      dailyAdBudget: 20,
      explanation: `$${dailyTarget}/day ÷ $${payoutNum}/sale = ${salesNeeded} sales needed daily.\nAt ${(conversionRate * 100).toFixed(1)}% conversion → ~${clicksNeeded} clicks needed.\n${organicClicks} from organic content (FREE), ${paidClicks} from $20/day paid boosts.\n\nThis is NOT overnight. Week 1-2: $0-50. Week 3-4: first viral. Month 2: scale mode.`,
    },

    scripts: [
      {
        id: 1,
        title: "Identity Interrupt",
        style: "Identity Interrupt",
        length: "18-22 sec",
        hook: `If you're ${isWeightLoss ? "a woman over 40 and you cannot lose weight no matter what you try" : `interested in ${niche} and nothing has worked`} — this is going to explain why.`,
        body: `${isWeightLoss ? "After 40, your estrogen and progesterone start fluctuating. This changes how your body stores fat, how it responds to food, and where it holds weight. Literally everything you learned about dieting before 40 stops working. It's not you. It's your hormones." : `Most people approach ${niche} the wrong way. They follow advice that's outdated or designed for a different situation. Once you understand what's actually happening, the approach becomes clear.`}`,
        cta: "I found something designed specifically for this. Link in bio.",
        caption: `Why ${isWeightLoss ? "you can't lose weight after 40" : `${niche} is harder than it should be`} (it's not what you think) ⬇️`,
        hashtags: isWeightLoss ? ["weightlossover40", "over40women", "metabolismover40", "hormonehealth"] : [niche.replace(/\s+/g, ""), "affiliate", "results"],
        postFirst: true,
      },
      {
        id: 2,
        title: "Curiosity Gap",
        style: "Curiosity Gap",
        length: "15-18 sec",
        hook: `Nobody talks about this when it comes to ${isWeightLoss ? "weight gain after 40" : niche}.`,
        body: `${isWeightLoss ? "Your metabolism slows 2 to 4 percent per decade starting in your 40s. That sounds small. But it means your body needs up to 200 fewer calories per day than it did ten years ago — even if you haven't changed anything. Every woman should know this." : `There's a specific mechanism that most people miss entirely. Once you understand it, everything changes. But nobody teaches this because there's no money in simple solutions.`}`,
        cta: "Link in bio — what actually helps.",
        caption: `The truth nobody tells you about ${niche} 🤯`,
        hashtags: [niche.replace(/\s+/g, ""), "truth", "results", "education"],
        postFirst: false,
      },
      {
        id: 3,
        title: "Story Format",
        style: "Story",
        length: "25-32 sec",
        hook: `${isWeightLoss ? "Two years ago I gained 20 pounds without changing anything. I thought something was seriously wrong with me." : `I struggled with ${niche} for 2 years. Tried everything. Nothing worked. Then I found this.`}`,
        body: `${isWeightLoss ? "Eating the same. Working out the same. But my midsection just kept growing and I had zero energy. My doctor said it was just perimenopause. To 'expect these changes.' I refused to accept that." : `Everyone kept telling me the same generic advice. 'Just work harder.' 'Just be patient.' But I knew there had to be a better way. Something designed for my specific situation.`}`,
        cta: `${isWeightLoss ? "I found out there's a specific way your metabolism changes hormonally after 40 — and once I understood that and switched my approach, I lost 18 pounds in 6 weeks." : `Once I found the right approach, everything shifted. Results came faster than I expected.`} What actually worked is in my bio.`,
        caption: `My ${isWeightLoss ? "2-year" : ""} struggle finally explained (and what actually worked) 🙏`,
        hashtags: [niche.replace(/\s+/g, ""), "journey", "transformation", "results", "story"],
        postFirst: true,
      },
      {
        id: 4,
        title: "Authority Education",
        style: "Education",
        length: "20-25 sec",
        hook: `Three signs ${isWeightLoss ? "your hormones are blocking weight loss" : `you're approaching ${niche} wrong`} — and most people miss all three.`,
        body: `Number one — ${isWeightLoss ? "weight gain that happens specifically around your belly even when you're eating clean" : "you're following advice that worked 5 years ago but doesn't anymore"}. Number two — ${isWeightLoss ? "energy crashes in the afternoon that weren't there before" : "you're not seeing results despite putting in the effort"}. Number three — ${isWeightLoss ? "sleep that feels lighter and less restful than it used to" : "you feel like you're missing something but don't know what"}. All three are signs of the same thing. And there's a specific solution.`,
        cta: "Link in bio.",
        caption: `3 signs you're doing ${niche} wrong ⬇️`,
        hashtags: [niche.replace(/\s+/g, ""), "signs", "education", "tips"],
        postFirst: false,
      },
      {
        id: 5,
        title: "Warning/Urgency",
        style: "Warning",
        length: "15-18 sec",
        hook: `Stop doing this if you want ${isWeightLoss ? "to lose weight after 40" : `results with ${niche}`}.`,
        body: `${isWeightLoss ? "Cutting calories the same way you did in your 30s. After 40, your body responds to calorie restriction differently — it often triggers hormonal responses that make fat storage worse, not better. The approach has to change." : `Following the same strategy everyone else is using. The conventional approach is designed for a different situation. You need something specific to YOUR situation.`}`,
        cta: "What works instead — link in bio.",
        caption: `⚠️ Stop this ${isWeightLoss ? "if you're over 40 and trying to lose weight" : `if you want ${niche} results`} ⬇️`,
        hashtags: [niche.replace(/\s+/g, ""), "warning", "stop", "mistakes"],
        postFirst: false,
      },
      {
        id: 6,
        title: "Before/After Comparison",
        style: "Comparison",
        length: "12-15 sec",
        hook: `Me ${isWeightLoss ? "at 42 trying every diet" : "before finding this"} vs me now after finally understanding what actually changed.`,
        body: `Before: "${isWeightLoss ? "Cut calories. Try keto. Try fasting. Nothing works. Doctor says it's just aging." : `Tried everything. Nothing worked. Felt stuck.`}" After: "${isWeightLoss ? "Understood the hormonal shift. Changed the approach. Down 22 lbs in 8 weeks." : `Found the right approach. Results in weeks, not months.`}"`,
        cta: "What changed — link in bio.",
        caption: "The before and after nobody shows you 👆",
        hashtags: [niche.replace(/\s+/g, ""), "beforeafter", "transformation", "results"],
        postFirst: false,
      },
      {
        id: 7,
        title: "Relatable Venting",
        style: "Relatable Venting",
        length: "20-24 sec",
        hook: `Can we talk about how nobody prepares you for ${isWeightLoss ? "what happens to your body after 40?" : `how hard ${niche} actually is?`}`,
        body: `${isWeightLoss ? "I was doing everything right. Clean eating, regular exercise, getting sleep. And I was gaining weight. In places I'd never gained it before. And everyone just kept saying 'that's just what happens.' Like I should just accept feeling terrible in my own body." : `Everyone makes it look easy online. But the reality? Most people are struggling in silence. Following the same advice that doesn't work. And nobody talks about it because admitting you're struggling feels like failure.`}`,
        cta: "I refused to accept that. I found an answer. Link in bio if you're in the same boat.",
        caption: `Nobody prepares you for this 🤦 (and nobody has to accept it) ⬇️`,
        hashtags: [niche.replace(/\s+/g, ""), "relatable", "honest", "reallife"],
        postFirst: true,
      },
      {
        id: 8,
        title: "Question Hook",
        style: "Question Hook",
        length: "15-20 sec",
        hook: `${isWeightLoss ? "What age did your body completely change on you? For me it was literally overnight at 42." : `When did you realize ${niche} was harder than everyone said?`}`,
        body: `${isWeightLoss ? "One year everything worked. Next year nothing worked. I know so many women who've had the exact same experience. Turns out there's a really specific hormonal reason for it — and once you address that instead of just eating less, everything shifts." : `For me it was after months of trying with no results. Then I found a completely different approach that actually works. Same goal, different strategy.`}`,
        cta: "Answer in comments and link in bio.",
        caption: `${isWeightLoss ? "What age did your metabolism change?" : `When did ${niche} get real for you?`} 👇 (mine was ${isWeightLoss ? "42" : "brutal"})`,
        hashtags: [niche.replace(/\s+/g, ""), "question", "comments", "community"],
        postFirst: false,
      },
      {
        id: 9,
        title: "Trending Audio Style",
        style: "Trending Audio",
        length: "12-15 sec",
        hook: "[TEXT OVERLAY — use trending sound]",
        body: `Line 1: "Me ${isWeightLoss ? "at 38: whatever I eat comes off easily" : "before finding this: stressed, stuck, frustrated"}"\nLine 2: "Me ${isWeightLoss ? "at 42: ate salad for a week and gained 2 pounds" : "3 months later: results I never thought possible"}"\nLine 3: "Turns out it's literally ${isWeightLoss ? "my hormones, not my effort" : "the approach, not the effort"}"\nLine 4: "Finally found something that works WITH ${isWeightLoss ? "my body" : "reality"} not against it"\nLine 5: "Link in bio"`,
        cta: "Link in bio",
        caption: `When you finally find what actually works 🙌`,
        hashtags: [niche.replace(/\s+/g, ""), "trending", "viral", "fyp"],
        postFirst: false,
      },
      {
        id: 10,
        title: "Myth Bust",
        style: "Myth Bust",
        length: "18-22 sec",
        hook: `The myth that's keeping ${isWeightLoss ? "women over 40 from losing weight" : `people from succeeding with ${niche}`}.`,
        body: `The myth is that if you just work hard enough ${isWeightLoss ? "— eat less, move more —" : "—"} it will work. ${isWeightLoss ? "That might be true in your 20s and 30s. After 40, your hormonal environment has changed in a way that makes that approach actively counterproductive for many women." : `But working harder at the WRONG thing isn't the answer. The approach itself needs to change.`} Working harder at the wrong thing isn't the answer.`,
        cta: "What the right approach looks like — link in bio.",
        caption: `The #1 myth about ${niche} that's keeping you stuck ⬇️`,
        hashtags: [niche.replace(/\s+/g, ""), "myth", "truth", "busted"],
        postFirst: false,
      },
    ],

    bridgePage: {
      headline: `Why ${isWeightLoss ? "Women Over 40 Suddenly Can't Lose Weight" : `Most People Fail At ${niche}`} — And The Real Reason Has Nothing To Do With ${isWeightLoss ? "Willpower" : "Effort"}`,
      subheadline: `${isWeightLoss ? "A metabolic researcher explains the hormonal shift most doctors never address — and why thousands of women are finally getting results." : `An insider explains what's actually going on — and why thousands of people are finally seeing results after years of trying.`}`,
      bodyParagraphs: [
        `${isWeightLoss ? "You're eating the same things. Moving your body. Doing what you've always done. And the scale won't budge — or worse, it keeps creeping up despite everything." : `You've been doing everything right. Following the advice. Putting in the work. And the results just aren't there.`}`,
        `${isWeightLoss ? "If you've felt this frustration after turning 40, you're not imagining it. Something genuinely shifts in your body around this age — and the approach that worked in your 30s stops working almost overnight." : `If you've felt this frustration, you're not alone. Something about the conventional approach just doesn't work for most people — and the reason isn't what you think.`}`,
        `Most ${isWeightLoss ? "doctors chalk it up to 'aging' or suggest cutting calories further" : "experts give the same generic advice"}. But a growing body of research suggests the real issue is something entirely different.`,
        `The ${isWeightLoss ? "shift, researchers explain, is hormonal. Specifically, it involves a cascade of changes that affects how your body processes fat, regulates appetite, and uses energy." : "real solution works on a completely different level than what most people have tried."} And most conventional advice is designed for a situation that no longer applies.`,
        `For many ${isWeightLoss ? "women" : "people"}, the first noticeable change is ${isWeightLoss ? "energy. Then sleep quality improves. Then the stubborn weight that hadn't moved in years begins to shift." : "clarity. Then momentum builds. Then the results that seemed impossible start becoming real."}`,
      ],
      symptoms: [
        `${isWeightLoss ? "You're eating well, but weight won't move — especially around the midsection" : "You've tried multiple approaches but nothing sticks"}`,
        `${isWeightLoss ? "Energy crashes in the afternoon that weren't there a few years ago" : "You feel like you're missing something but can't figure out what"}`,
        `${isWeightLoss ? "You've tried multiple diets that worked before — and they don't anymore" : "The strategies that work for others don't seem to work for you"}`,
        `${isWeightLoss ? "Sleep feels less restful even when you get enough hours" : "You're starting to wonder if this is even possible for you"}`,
        `${isWeightLoss ? "Feeling 'puffy' or bloated even on clean eating days" : "You've been at this for months (or years) with little to show for it"}`,
      ],
      scienceBlock: {
        title: `The ${isWeightLoss ? "metabolic shift" : "approach"} nobody explains`,
        body: `${isWeightLoss ? "In your 40s, estrogen and progesterone levels begin fluctuating. This directly affects how your body stores fat, how it responds to insulin, and how effectively it can access fat for fuel. The result is a body that has fundamentally different needs." : "The conventional approach focuses on the wrong variables. Once you understand the actual mechanism — and work WITH it instead of against it — everything changes. Most people see their first results within 2-3 weeks."}`,
      },
      testimonials: [
        { text: `${isWeightLoss ? "I had gained 22 pounds over three years despite eating clean and exercising regularly. My doctor just kept telling me it was perimenopause. I'm down 17 pounds in two months. The bloating is gone. My energy is back." : "I was skeptical because I'd tried everything. But within 3 weeks I saw more progress than I had in the previous 6 months combined. Wish I'd found this sooner."}`, author: `${isWeightLoss ? "Sandra K." : "Michael R."}`, age: isWeightLoss ? 47 : 34, result: `${isWeightLoss ? "Down 17 lbs in 2 months" : "More progress in 3 weeks than 6 months"}` },
        { text: `${isWeightLoss ? "I was skeptical because I've tried everything. But something about the way this works with your hormones instead of fighting them — it just finally clicked. Three weeks in and I've dropped two sizes." : "Honestly didn't believe it would work. Every other thing I tried failed. But this was different from day one. Real results, not just promises."}`, author: `${isWeightLoss ? "Michelle T." : "James L."}`, age: isWeightLoss ? 52 : 41, result: `${isWeightLoss ? "Dropped 2 sizes in 3 weeks" : "Real results from day one"}` },
      ],
      ctaHeadline: "Watch the presentation that explains exactly how this works",
      ctaButtonText: "Watch The Free Presentation",
      ctaSubtext: "Free · No email required · Works on phone or desktop",
      finalCtaHeadline: `Find Out Why ${isWeightLoss ? "Weight Loss Actually Changes After 40" : `${niche} Actually Works Differently Than You Think`}`,
    },

    emails: [
      {
        day: 0,
        subject: `Your guide + something ${isWeightLoss ? "your doctor probably hasn't mentioned" : "most people miss"}`,
        body: `Hi {{first_name}},\n\nHere's the guide you requested.\n\nBut while you have a minute — there's something I want to share that I think is even more useful.\n\n${isWeightLoss ? "Most of the advice women over 40 receive about weight loss is designed for a different body. A younger body. The calorie deficits, the cardio programs — they're based on a metabolism that no longer applies." : `Most advice about ${niche} is designed for a different situation than yours. The generic strategies everyone follows? They work for some people — but not most.`}\n\nI found a presentation that explains this really clearly — and specifically what's helped thousands of people in exactly your situation.\n\nWorth 12 minutes of your time:\n[LINK]\n\nTalk soon`,
        purpose: "Deliver lead magnet + hook to presentation",
      },
      {
        day: 2,
        subject: `"${isWeightLoss ? "My doctor told me to just accept it" : "I tried everything before finding this"}" — ${isWeightLoss ? "she didn't" : "then everything changed"}`,
        body: `Hi {{first_name}},\n\nA ${isWeightLoss ? "woman named Sandra wrote to me last month.\n\n47 years old. Had gained 22 pounds over three years despite eating clean and exercising regularly. Her doctor's advice: 'This is perimenopause. These are normal changes.'\n\nShe didn't accept that." : `person named Michael reached out recently.\n\nHe'd been trying to make ${niche} work for over a year. Every course, every strategy, every guru. Nothing stuck.\n\nHe almost gave up.`}\n\n${isWeightLoss ? "She found a presentation about what's actually happening metabolically in women after 40. She tried it.\n\nTwo months later she's down 17 pounds. The bloating is gone. Her energy is back." : `Then he found an approach that was completely different from everything else. Not harder — just smarter. Designed for his actual situation.\n\n3 weeks later he'd made more progress than the previous 6 months combined.`}\n\nI can't promise that's your result. But if you're still feeling like what you're doing isn't working — this is worth watching.\n\n[LINK]`,
        purpose: "Social proof story",
      },
      {
        day: 4,
        subject: `The ${isWeightLoss ? "3-part hormonal shift" : "real reason"} nobody explains`,
        body: `Hi {{first_name}},\n\nQuick breakdown of what's actually ${isWeightLoss ? "changing metabolically after 40" : "going on"}:\n\n1. ${isWeightLoss ? "Estrogen fluctuation changes where your body stores fat — shifting more to abdominal storage" : "The conventional approach addresses the WRONG problem"}\n2. ${isWeightLoss ? "Insulin sensitivity decreases — your body handles carbs differently" : "What worked 5 years ago doesn't work anymore — the landscape changed"}\n3. ${isWeightLoss ? "Metabolic rate slows ~2-4% per decade — conventional diet advice assumes a baseline that no longer applies" : "Most people are one strategy shift away from breakthrough results"}\n\nUnderstanding all three is why people who address the ${isWeightLoss ? "hormonal picture" : "actual mechanism"} specifically tend to get results when nothing else has worked.\n\nThe presentation walks through all of this and what to do about it:\n[LINK]`,
        purpose: "Education — explain the mechanism",
      },
      {
        day: 6,
        subject: `"I've tried ${isWeightLoss ? "supplements" : "everything"} before and ${isWeightLoss ? "they don't work" : "nothing works"} for me"`,
        body: `Hi {{first_name}},\n\nI get this — a lot.\n\n${isWeightLoss ? "Most supplements are designed generically. They're not built around the specific hormonal and metabolic context of women in their 40s and 50s.\n\nThis is different because it's specifically formulated for the metabolic shift that happens in this life stage." : `Most solutions are designed generically. They work for the 'average' person in the 'average' situation.\n\nBut your situation isn't average. That's why generic solutions fail.\n\nWhat I'm sharing is different because it's designed for YOUR specific situation.`}\n\nThat's why the results tend to be different from ${isWeightLoss ? "generic options" : "everything else"} you've tried before.\n\nIf you've been skeptical, the presentation addresses this directly:\n[LINK]\n\n60-day guarantee. No risk.`,
        purpose: "Objection handling",
      },
      {
        day: 9,
        subject: "Last email on this — I promise",
        body: `Hi {{first_name}},\n\nI'm not going to keep emailing you about this.\n\nBut I wanted to say one last thing:\n\n${isWeightLoss ? "The window where it gets significantly harder to address metabolic and hormonal changes doesn't close — but it does narrow. The earlier you address the hormonal picture, the easier and faster the results tend to be." : `The longer you wait to take action, the harder it gets. Not because the opportunity disappears — but because momentum matters. The best time to start is when the motivation is fresh.`}\n\nIf ${isWeightLoss ? "your weight hasn't moved despite your best efforts" : "you haven't seen the results you want"}, and you haven't yet watched the presentation — this is the time.\n\n[LINK]\n\n60-day money-back guarantee. Nothing to lose.\n\nTake care of yourself,\n{{sender_name}}`,
        purpose: "Final push — urgency + guarantee",
      },
    ],

    contentStrategy: {
      postsPerDay: 4,
      pillars: [
        { name: "Problem/Pain", percentage: 40, example: `"Why can't I ${isWeightLoss ? "lose weight after 40" : `get results with ${niche}`}?"` },
        { name: "Education/Reframe", percentage: 25, example: `"${isWeightLoss ? "Your metabolism isn't broken" : "The approach isn't wrong"} — here's what's actually happening"` },
        { name: "Story/Proof", percentage: 20, example: `"I tried everything for 2 years until I found this"` },
        { name: "Curiosity", percentage: 15, example: `"The ONE thing nobody tells you about ${niche}"` },
      ],
      bestPlatforms: ["TikTok", "Instagram Reels", "YouTube Shorts"],
      boostRule: "NEVER boost a post that didn't get 500+ organic views first. Your $20 goes 5x further when the algorithm is already pushing the content. Wait for organic proof before spending.",
    },

    timeline: [
      { week: "Week 1-2", revenue: "$0-$100", action: "Post 3-5 videos daily. Test hooks from the script library. Build email capture on bridge page. Expect slow start — this is normal." },
      { week: "Week 3-4", revenue: "$100-$500", action: "First viral post hits. Boost it with $20/day on Meta (women 40-65 or your target demo). Start email sequence. First sales come in." },
      { week: "Week 5-8", revenue: "$500-$2,000", action: "Scale what works. Double posting frequency. Boost 2 winners/day. Email list converting at 2-3x. Revenue becomes consistent." },
      { week: "Month 3+", revenue: `$${Math.round(input.targetIncome * 0.5).toLocaleString()}-$${input.targetIncome.toLocaleString()}/mo`, action: "System is automated. Multiple winning posts running. Email list is compounding. Focus on new angles and scaling winners." },
    ],

    automation: [
      { tool: "CapCut", purpose: "Video editing + auto-captions", cost: "Free" },
      { tool: "Canva", purpose: "Lead magnet PDF + thumbnails", cost: "Free" },
      { tool: "Beehiiv or ConvertKit", purpose: "Email list + 5-email automation", cost: "Free up to 2,500 subscribers" },
      { tool: "Himalaya", purpose: "Bridge page (deployed), tracking, analytics", cost: "Free" },
      { tool: "TikTok + Instagram", purpose: "Organic content posting (FREE traffic)", cost: "Free" },
      { tool: "Meta Ads Manager", purpose: "Boost winning organic posts to target demographic", cost: "$20/day (only when ready)" },
    ],

    compliance: [
      "NO before/after photos in paid ads (Meta policy — instant ban)",
      "NO medical claims ('treats,' 'cures,' 'clinical results')",
      "Use language: 'may support,' 'many people report,' 'designed for'",
      "Always display affiliate disclosure on bridge page footer",
      "Include privacy policy and terms links on bridge page",
      "Don't use income claims in ads ('make $1K/day' = ban from Meta/TikTok)",
      "Always include 'individual results may vary' disclaimer",
      "ClickBank/network disclaimer in bridge page footer",
    ],
  };
}
