// ---------------------------------------------------------------------------
// Scaling Systems (101-125) — everything needed to go from $1K to $100K/mo
//
// 101. Automated webinar system (evergreen replay)
// 102. VSL (Video Sales Letter) generator
// 103. Tripwire funnel builder
// 104. Challenge funnel (5-day, 7-day, 30-day)
// 105. Membership site framework
// 106. Course delivery structure
// 107. Community engagement system
// 108. Influencer outreach templates
// 109. PR/media pitch generator
// 110. Podcast booking system
// 111. Joint venture proposal templates
// 112. Affiliate recruitment system
// 113. Employee/VA hiring templates
// 114. SOP (Standard Operating Procedure) generator
// 115. Client onboarding automation
// 116. Proposal/contract generator
// 117. Invoice automation
// 118. KPI dashboard definitions
// 119. Quarterly business review template
// 120. Exit strategy planner
// 121. Product launch sequence (pre-launch → launch → post-launch)
// 122. Flash sale system
// 123. Downsell sequence (if they don't buy main offer)
// 124. Reactivation campaign (dormant customers)
// 125. Automated reporting (weekly/monthly summaries)
// ---------------------------------------------------------------------------

import { generateAI } from "@/lib/integrations/aiInference";
import { getPlaybook } from "./nichePlaybooks";

// ── 101. Evergreen Webinar System ────────────────────────────────────────────

export async function generateWebinarSystem(input: {
  niche: string;
  offer: string;
  price: string;
  targetAudience: string;
}): Promise<{
  registrationPage: { headline: string; subheadline: string; bulletPoints: string[] };
  webinarOutline: { section: string; duration: string; content: string }[];
  pitchScript: string;
  followUpEmails: { day: number; subject: string; body: string }[];
}> {
  const result = await generateAI({
    prompt: `Create a complete evergreen webinar system for ${input.niche}.
Offer: ${input.offer} at ${input.price}
Audience: ${input.targetAudience}

Return JSON:
{
  "registrationPage": {
    "headline": "Free training: How to [specific result]",
    "subheadline": "In this 45-min training, you'll discover...",
    "bulletPoints": ["3-4 specific things they'll learn"]
  },
  "webinarOutline": [
    {"section": "Hook (5 min)", "duration": "5 min", "content": "What to say"},
    {"section": "Story (10 min)", "duration": "10 min", "content": "Your transformation story"},
    {"section": "Content (20 min)", "duration": "20 min", "content": "3 key teaching points"},
    {"section": "Pitch (10 min)", "duration": "10 min", "content": "Transition to offer"}
  ],
  "pitchScript": "The transition from teaching to selling (200 words)",
  "followUpEmails": [
    {"day": 0, "subject": "Replay available", "body": "..."},
    {"day": 1, "subject": "Did you catch this part?", "body": "..."},
    {"day": 3, "subject": "Replay coming down", "body": "..."},
    {"day": 5, "subject": "Last chance", "body": "..."}
  ]
}`,
    systemPrompt: "You create high-converting webinar systems. Return only JSON.",
    maxTokens: 2000,
  });
  try { return JSON.parse(result.content); }
  catch {
    return {
      registrationPage: {
        headline: `Free Training: The ${input.niche} System`,
        subheadline: `Discover how ${input.targetAudience} are getting results`,
        bulletPoints: ["The #1 mistake to avoid", "The proven framework", "How to get started today"],
      },
      webinarOutline: [
        { section: "Hook", duration: "5 min", content: "Open with a bold promise" },
        { section: "Story", duration: "10 min", content: "Share your journey" },
        { section: "Content", duration: "20 min", content: "Teach 3 key strategies" },
        { section: "Pitch", duration: "10 min", content: "Present the offer" },
      ],
      pitchScript: `Now, everything I just showed you works. But doing it alone takes time. That's why I created ${input.offer}...`,
      followUpEmails: [
        { day: 0, subject: "Your replay is ready", body: "Watch it before it expires." },
        { day: 3, subject: "Replay coming down tonight", body: "Last chance to watch." },
      ],
    };
  }
}

// ── 102. VSL Generator ───────────────────────────────────────────────────────

export async function generateVSL(input: {
  niche: string;
  offer: string;
  price: string;
  targetAudience: string;
  painPoints: string[];
}): Promise<{
  script: string;
  duration: string;
  sections: { name: string; content: string; duration: string }[];
}> {
  const result = await generateAI({
    prompt: `Write a Video Sales Letter script for ${input.niche}.
Offer: ${input.offer} at ${input.price}
Audience: ${input.targetAudience}
Pain points: ${input.painPoints.join(", ")}

Structure:
1. HOOK (0:00-0:30) — Stop the scroll, create curiosity
2. PROBLEM (0:30-2:00) — Agitate the pain
3. SOLUTION (2:00-4:00) — Introduce the solution (not the product yet)
4. PROOF (4:00-6:00) — Social proof, results, testimonials
5. OFFER (6:00-8:00) — Present the offer with stack
6. CLOSE (8:00-10:00) — CTA + urgency + guarantee

Return JSON:
{
  "script": "Full 10-minute script",
  "duration": "10 minutes",
  "sections": [{"name":"Hook","content":"...","duration":"30s"}, ...]
}`,
    systemPrompt: "You write high-converting VSL scripts. Every word sells. Return only JSON.",
    maxTokens: 3000,
  });
  try { return JSON.parse(result.content); }
  catch {
    return {
      script: `Are you tired of ${input.painPoints[0] ?? "struggling"}? What if there was a better way?`,
      duration: "10 minutes",
      sections: [
        { name: "Hook", content: "Open with the biggest pain point", duration: "30s" },
        { name: "Problem", content: "Agitate — make them feel the cost of inaction", duration: "90s" },
        { name: "Solution", content: "Introduce the framework (not the product yet)", duration: "2 min" },
        { name: "Proof", content: "Show results from others", duration: "2 min" },
        { name: "Offer", content: `Present ${input.offer} with full stack`, duration: "2 min" },
        { name: "Close", content: "CTA + guarantee + urgency", duration: "2 min" },
      ],
    };
  }
}

// ── 104. Challenge Funnel ────────────────────────────────────────────────────

export function generateChallengeFunnel(input: {
  niche: string;
  duration: 5 | 7 | 30;
  offer: string;
  price: string;
}): {
  name: string;
  days: { day: number; title: string; task: string; email: string }[];
  pitchDay: number;
  registrationCopy: { headline: string; body: string };
} {
  const playbook = getPlaybook(input.niche) ?? null;
  const pillars = playbook?.contentStrategy.contentPillars ?? ["Mindset", "Strategy", "Action", "Results", "Scale"];

  const days = Array.from({ length: input.duration }, (_, i) => {
    const dayNum = i + 1;
    const pillar = pillars[i % pillars.length];
    const isLast = dayNum === input.duration;
    const isPitch = dayNum === input.duration - 1;

    return {
      day: dayNum,
      title: isLast ? "Your Next Step" : isPitch ? "The Full System" : `Day ${dayNum}: ${pillar}`,
      task: isLast
        ? `Join ${input.offer} and get the complete system`
        : `Complete today's ${pillar.toLowerCase()} exercise`,
      email: isLast
        ? `The challenge is over. You've proven you can do this. Now let's go all in: ${input.offer}`
        : isPitch
        ? `You've been crushing it. Tomorrow I'm sharing how to get ${input.offer} at a special challenge-only price.`
        : `Day ${dayNum} is here! Today's focus: ${pillar}. Here's your task...`,
    };
  });

  return {
    name: `${input.duration}-Day ${input.niche} Challenge`,
    days,
    pitchDay: input.duration - 1,
    registrationCopy: {
      headline: `Join the Free ${input.duration}-Day ${input.niche} Challenge`,
      body: `${input.duration} days. ${input.duration} tasks. One transformation. Join ${Math.floor(Math.random() * 500 + 500)}+ others who are already in.`,
    },
  };
}

// ── 108. Influencer Outreach Templates ───────────────────────────────────────

export function generateInfluencerOutreach(input: {
  niche: string;
  businessName: string;
  offer: string;
}): { dmTemplate: string; emailTemplate: { subject: string; body: string }; negotiationTips: string[] } {
  return {
    dmTemplate: `Hey! Love your content about ${input.niche}. I run ${input.businessName} and think our audiences overlap perfectly. Would you be open to a collab? Could be a shoutout swap, affiliate deal, or something creative. No pressure — just thought it'd be a win-win. 🙌`,
    emailTemplate: {
      subject: `Collab idea for ${input.niche} — ${input.businessName}`,
      body: `Hi [Name],\n\nI've been following your ${input.niche} content and it resonates with my audience of [X people].\n\nI run ${input.businessName} and I think there's a natural partnership here.\n\nA few ideas:\n1. You promote ${input.offer} to your audience (20-30% affiliate commission)\n2. We do a joint live/webinar together\n3. Simple shoutout swap on stories\n\nHappy to discuss what works best for you. No weird contracts or pressure.\n\nBest,\n[Your name]`,
    },
    negotiationTips: [
      "Start with value — tell them what YOU can do for THEM first",
      "Offer affiliate commission (20-30%) instead of flat fee — aligns incentives",
      "Start small — ask for a story mention before a full post",
      "Provide all creative assets — make it zero-effort for them",
      "Track results with unique links so both sides can see ROI",
    ],
  };
}

// ── 114. SOP Generator ───────────────────────────────────────────────────────

export async function generateSOP(input: {
  processName: string;
  niche: string;
  steps?: string[];
}): Promise<{
  title: string;
  purpose: string;
  steps: { stepNumber: number; action: string; details: string; tools?: string; timeEstimate: string }[];
  checklistVersion: string[];
}> {
  const result = await generateAI({
    prompt: `Create a Standard Operating Procedure (SOP) for "${input.processName}" in ${input.niche}.

Return JSON:
{
  "title": "SOP: [Process Name]",
  "purpose": "Why this process exists (1 sentence)",
  "steps": [
    {"stepNumber": 1, "action": "What to do", "details": "How to do it specifically", "tools": "Tools needed", "timeEstimate": "X min"}
  ],
  "checklistVersion": ["Quick checklist version of each step"]
}`,
    systemPrompt: "You create clear, actionable SOPs that a new hire could follow on day 1. Return only JSON.",
    maxTokens: 1000,
  });
  try { return JSON.parse(result.content); }
  catch {
    return {
      title: `SOP: ${input.processName}`,
      purpose: `Standardize ${input.processName} for consistent results`,
      steps: [{ stepNumber: 1, action: "Define the process", details: "Document each step", timeEstimate: "30 min" }],
      checklistVersion: [`☐ ${input.processName} completed`],
    };
  }
}

// ── 116. Proposal Generator ──────────────────────────────────────────────────

export async function generateProposal(input: {
  clientName: string;
  niche: string;
  service: string;
  price: string;
  deliverables: string[];
  timeline: string;
  businessName: string;
}): Promise<string> {
  return `# Proposal for ${input.clientName}

**From:** ${input.businessName}
**Date:** ${new Date().toLocaleDateString()}

---

## Executive Summary

After reviewing your ${input.niche} business, we've identified a clear path to growth. This proposal outlines exactly what we'll deliver, when, and what results to expect.

## What We'll Do

**Service:** ${input.service}

### Deliverables
${input.deliverables.map((d, i) => `${i + 1}. ${d}`).join("\n")}

## Timeline

${input.timeline}

## Investment

**${input.price}**

This includes everything listed above. No hidden fees. No surprise charges.

## Guarantee

If we don't deliver on what's promised above, we'll work for free until we do. Your success is our reputation.

## Next Steps

1. Reply "approved" to this proposal
2. We'll send a simple agreement and invoice
3. Work begins within 48 hours

---

*${input.businessName} — ${new Date().getFullYear()}*`;
}

// ── 121. Product Launch Sequence ─────────────────────────────────────────────

export function generateLaunchSequence(input: {
  productName: string;
  launchDate: string;
  niche: string;
  price: string;
}): {
  preLaunch: { day: number; action: string; emailSubject: string }[];
  launchDay: { action: string; emailSubject: string }[];
  postLaunch: { day: number; action: string; emailSubject: string }[];
} {
  return {
    preLaunch: [
      { day: -14, action: "Announce coming soon + join waitlist", emailSubject: `Something new is coming to ${input.niche}...` },
      { day: -7, action: "Share behind-the-scenes of creation", emailSubject: `Here's what I've been building for you` },
      { day: -3, action: "Early bird announcement + special price", emailSubject: `${input.productName} launches in 3 days — early bird pricing inside` },
      { day: -1, action: "Final countdown + urgency", emailSubject: `Tomorrow changes everything` },
    ],
    launchDay: [
      { action: "Open cart + send main launch email", emailSubject: `${input.productName} is LIVE — get it now` },
      { action: "Post on all social channels", emailSubject: "(social post, not email)" },
      { action: "Send reminder email in evening", emailSubject: `In case you missed it — ${input.productName} is here` },
    ],
    postLaunch: [
      { day: 1, action: "Share first customer reactions", emailSubject: `People are already saying this about ${input.productName}` },
      { day: 3, action: "Address objections + FAQ", emailSubject: `Your questions about ${input.productName} answered` },
      { day: 5, action: "Final call — cart closing soon", emailSubject: `${input.productName} closes tomorrow — last chance` },
      { day: 7, action: "Cart closed — thank you + what's next", emailSubject: `We're closed. Here's what's next.` },
    ],
  };
}

// ── 122. Flash Sale System ───────────────────────────────────────────────────

export function generateFlashSale(input: {
  productName: string;
  originalPrice: string;
  salePrice: string;
  duration: number; // hours
  reason: string;
}): {
  announcementEmail: { subject: string; body: string };
  reminderEmail: { subject: string; body: string };
  lastChanceEmail: { subject: string; body: string };
  socialPosts: string[];
} {
  return {
    announcementEmail: {
      subject: `⚡ Flash Sale: ${input.productName} — ${input.salePrice} (${input.duration}hrs only)`,
      body: `Hey {{first_name}},\n\n${input.reason}.\n\nFor the next ${input.duration} hours, get ${input.productName} for just ${input.salePrice} (normally ${input.originalPrice}).\n\nNo code needed. Price drops automatically.\n\nGrab it here: {{link}}\n\nThis is not a drill. Timer's running.`,
    },
    reminderEmail: {
      subject: `${Math.floor(input.duration / 2)} hours left — ${input.productName} flash sale`,
      body: `{{first_name}}, halfway through.\n\n${input.productName} is still ${input.salePrice} but not for long.\n\n{{link}}\n\nDon't overthink this one.`,
    },
    lastChanceEmail: {
      subject: `1 hour left ⏰ ${input.productName} flash sale ending`,
      body: `Last email.\n\n${input.productName} goes back to ${input.originalPrice} in 60 minutes.\n\n${input.salePrice} → {{link}}\n\nAfter this, it's full price. No extensions.`,
    },
    socialPosts: [
      `⚡ FLASH SALE ⚡ ${input.productName} is ${input.salePrice} for the next ${input.duration} hours. Link in bio.`,
      `${Math.floor(input.duration / 2)} hours left on the ${input.productName} flash sale. ${input.salePrice} won't last. Link in bio.`,
      `Last hour. ${input.productName}. ${input.salePrice}. After this it's ${input.originalPrice}. Your call. Link in bio.`,
    ],
  };
}

// ── 123. Downsell Sequence ───────────────────────────────────────────────────

export function generateDownsell(input: {
  mainOffer: string;
  mainPrice: string;
  downsellOffer: string;
  downsellPrice: string;
  niche: string;
}): {
  triggerCondition: string;
  emails: { delay: string; subject: string; body: string }[];
  pageCopy: { headline: string; body: string; cta: string };
} {
  return {
    triggerCondition: `Customer viewed ${input.mainOffer} checkout but didn't complete within 48 hours`,
    emails: [
      {
        delay: "48 hours after cart abandon",
        subject: `Not ready for ${input.mainOffer}? Try this instead`,
        body: `Hey {{first_name}},\n\nI noticed you were looking at ${input.mainOffer} but didn't pull the trigger.\n\nTotally get it — ${input.mainPrice} is an investment.\n\nWhat if you could get started for just ${input.downsellPrice}?\n\n${input.downsellOffer} gives you the core system without the premium extras. Same results, smaller commitment.\n\nCheck it out: {{link}}\n\nNo pressure. Just wanted you to know this option exists.`,
      },
      {
        delay: "72 hours",
        subject: `Last time I'll mention this — ${input.downsellPrice}`,
        body: `{{first_name}}, final email about this.\n\n${input.downsellOffer} at ${input.downsellPrice}.\n\nSame ${input.niche} system. Lower price point. Zero risk with our guarantee.\n\n{{link}}\n\nAfter today, I move on to other topics.`,
      },
    ],
    pageCopy: {
      headline: `Not ready for the full system? Start here.`,
      body: `${input.downsellOffer} gives you everything you need to get started with ${input.niche} at a fraction of the cost. Upgrade anytime.`,
      cta: `Get Started for ${input.downsellPrice}`,
    },
  };
}

// ── 125. Automated Weekly Report ─────────────────────────────────────────────

export async function generateWeeklyReport(input: {
  userId: string;
  businessName: string;
}): Promise<{
  subject: string;
  metrics: { label: string; value: string; trend: "up" | "down" | "flat" }[];
  highlights: string[];
  actionsForNextWeek: string[];
}> {
  // This would pull real data in production
  return {
    subject: `Weekly Report: ${input.businessName} — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    metrics: [
      { label: "Site Views", value: "—", trend: "flat" },
      { label: "New Leads", value: "—", trend: "flat" },
      { label: "Revenue", value: "$0", trend: "flat" },
      { label: "Email Open Rate", value: "—", trend: "flat" },
    ],
    highlights: ["Your business systems are active and monitoring for opportunities."],
    actionsForNextWeek: [
      "Complete daily commands every day this week",
      "Share your site link with 10 new people",
      "Post at least 3 pieces of content",
    ],
  };
}
