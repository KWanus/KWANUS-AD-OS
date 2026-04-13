// ---------------------------------------------------------------------------
// Conversion Systems (126-150) — maximize every visitor, lead, and customer
//
// 126. Smart CTA optimizer (test different button texts)
// 127. Lead scoring v2 (behavioral + fit scoring)
// 128. Automated lead nurture paths (cold → warm → hot → customer)
// 129. SMS marketing sequences
// 130. Browser push notification system
// 131. Abandoned browse recovery (visited page but didn't act)
// 132. Order bump system (add small item at checkout)
// 133. Subscription box configurator
// 134. Tiered pricing page generator
// 135. ROI calculator for prospects
// 136. Interactive quiz funnel
// 137. Survey/feedback automation
// 138. Net Promoter Score system
// 139. Churn prevention triggers
// 140. Win-back offer generator
// 141. Bundle deal creator
// 142. Limited edition/seasonal product launcher
// 143. Affiliate dashboard for partners
// 144. White-label client reporting
// 145. AI chatbot conversation flows
// 146. Meeting scheduler with timezone detection
// 147. Proposal follow-up automation
// 148. Contract/agreement templates
// 149. Onboarding drip for new customers
// 150. Graduation/completion system (course/program milestones)
// ---------------------------------------------------------------------------

import { generateAI } from "@/lib/integrations/aiInference";

// ── 126. Smart CTA Optimizer ─────────────────────────────────────────────────

export async function generateCTAVariants(input: {
  currentCTA: string;
  pageType: "landing" | "pricing" | "checkout" | "email";
  niche: string;
}): Promise<string[]> {
  const result = await generateAI({
    prompt: `Current CTA button text: "${input.currentCTA}"
Page: ${input.pageType}, Niche: ${input.niche}

Generate 5 CTA variants using different psychological triggers:
1. Urgency
2. Value
3. Curiosity
4. Social proof
5. Risk reversal

Return JSON array of 5 strings.`,
    systemPrompt: "You optimize CTAs for maximum clicks. Return only JSON array.",
    maxTokens: 200,
  });
  try { return JSON.parse(result.content); }
  catch { return [input.currentCTA]; }
}

// ── 128. Lead Nurture Paths ──────────────────────────────────────────────────

export type NurturePath = {
  stage: "cold" | "warm" | "hot" | "customer";
  triggers: string[];
  actions: { type: "email" | "sms" | "ad" | "call" | "content"; description: string; delay: string }[];
  exitCondition: string;
};

export function generateNurturePaths(niche: string): NurturePath[] {
  return [
    {
      stage: "cold",
      triggers: ["New email subscriber", "First site visit", "Social media follower"],
      actions: [
        { type: "email", description: "Welcome email with lead magnet delivery", delay: "Immediate" },
        { type: "email", description: "Value email — teach something useful", delay: "Day 2" },
        { type: "email", description: "Story email — your journey in " + niche, delay: "Day 4" },
        { type: "content", description: "Retarget with educational ad", delay: "Day 3" },
      ],
      exitCondition: "Clicks a link or replies to email → moves to WARM",
    },
    {
      stage: "warm",
      triggers: ["Clicked email link", "Visited pricing page", "Watched video >50%"],
      actions: [
        { type: "email", description: "Case study — show results from similar person", delay: "Immediate" },
        { type: "email", description: "FAQ — handle top 3 objections", delay: "Day 2" },
        { type: "ad", description: "Retarget with testimonial ad", delay: "Day 1" },
        { type: "email", description: "Direct offer — special price for engaged subscribers", delay: "Day 5" },
      ],
      exitCondition: "Visits checkout or books call → moves to HOT",
    },
    {
      stage: "hot",
      triggers: ["Started checkout", "Booked a call", "Replied asking about pricing"],
      actions: [
        { type: "email", description: "Urgency — offer expires soon", delay: "1 hour" },
        { type: "sms", description: "Quick text — 'Saw you were interested, any questions?'", delay: "2 hours" },
        { type: "call", description: "Personal call from team", delay: "Same day" },
        { type: "email", description: "Final push — last chance + bonus", delay: "Day 2" },
      ],
      exitCondition: "Purchases → moves to CUSTOMER",
    },
    {
      stage: "customer",
      triggers: ["Completed purchase"],
      actions: [
        { type: "email", description: "Receipt + onboarding guide", delay: "Immediate" },
        { type: "email", description: "Check-in — how's it going?", delay: "Day 3" },
        { type: "email", description: "Testimonial request", delay: "Day 7" },
        { type: "email", description: "Upsell — next level offer", delay: "Day 14" },
        { type: "email", description: "Referral program invitation", delay: "Day 21" },
      ],
      exitCondition: "Becomes repeat buyer or refers others",
    },
  ];
}

// ── 132. Order Bump ──────────────────────────────────────────────────────────

export async function generateOrderBump(input: {
  mainProduct: string;
  mainPrice: string;
  niche: string;
}): Promise<{
  bumpProduct: string;
  bumpPrice: string;
  headline: string;
  description: string;
  conversionTip: string;
}> {
  const result = await generateAI({
    prompt: `Create an order bump for ${input.mainProduct} (${input.mainPrice}) in ${input.niche}.
An order bump is a small add-on shown at checkout that 30-50% of buyers add.

Return JSON:
{
  "bumpProduct": "Specific small product that complements the main one",
  "bumpPrice": "$X (should be 20-30% of main price)",
  "headline": "Add this to your order (one-click)",
  "description": "2-3 sentences explaining why they need this",
  "conversionTip": "Why this specific bump works"
}`,
    systemPrompt: "You create high-converting order bumps. Return only JSON.",
    maxTokens: 300,
  });
  try { return JSON.parse(result.content); }
  catch {
    const bumpPrice = `$${Math.round(parseInt(input.mainPrice.replace(/[^0-9]/g, ""), 10) * 0.25)}`;
    return {
      bumpProduct: `${input.niche} Quick-Start Templates`,
      bumpPrice,
      headline: `Add the Quick-Start Pack for just ${bumpPrice}`,
      description: `Save hours of setup time. These proven templates let you hit the ground running instead of starting from scratch.`,
      conversionTip: "Templates are low-cost, high-perceived-value items that 30%+ of buyers add.",
    };
  }
}

// ── 134. Tiered Pricing Page ─────────────────────────────────────────────────

export function generatePricingTiers(input: {
  niche: string;
  baseOffer: string;
  basePrice: number;
}): {
  tiers: {
    name: string;
    price: string;
    billing: string;
    features: string[];
    cta: string;
    highlighted: boolean;
    badge?: string;
  }[];
} {
  return {
    tiers: [
      {
        name: "Starter",
        price: `$${Math.round(input.basePrice * 0.5)}`,
        billing: "one-time",
        features: [
          "Core access to " + input.baseOffer,
          "Email support",
          "Community access",
        ],
        cta: "Get Started",
        highlighted: false,
      },
      {
        name: "Professional",
        price: `$${input.basePrice}`,
        billing: "one-time",
        features: [
          "Everything in Starter",
          "Premium templates & resources",
          "Priority support",
          "Monthly group Q&A calls",
          "Bonus: Quick-start guide",
        ],
        cta: "Go Professional",
        highlighted: true,
        badge: "Most Popular",
      },
      {
        name: "VIP",
        price: `$${Math.round(input.basePrice * 3)}`,
        billing: "one-time",
        features: [
          "Everything in Professional",
          "1-on-1 strategy session",
          "Done-with-you implementation",
          "Direct access via Slack/Voxer",
          "Lifetime updates",
          "Custom strategy plan",
        ],
        cta: "Go VIP",
        highlighted: false,
        badge: "Best Value",
      },
    ],
  };
}

// ── 135. ROI Calculator ──────────────────────────────────────────────────────

export function generateROICalculator(input: {
  productPrice: number;
  avgCustomerValue: number;
  conversionRate: number;
}): string {
  return `
<div style="max-width:400px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px;font-family:sans-serif;">
  <h3 style="margin:0 0 16px;font-size:18px;font-weight:800;color:#0f172a;">ROI Calculator</h3>
  <label style="display:block;margin-bottom:12px;">
    <span style="font-size:12px;font-weight:600;color:#64748b;">Your monthly traffic</span>
    <input id="roi-traffic" type="number" value="1000" style="display:block;width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;margin-top:4px;box-sizing:border-box;" oninput="calcROI()"/>
  </label>
  <label style="display:block;margin-bottom:16px;">
    <span style="font-size:12px;font-weight:600;color:#64748b;">Average order value ($)</span>
    <input id="roi-aov" type="number" value="${input.avgCustomerValue}" style="display:block;width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;margin-top:4px;box-sizing:border-box;" oninput="calcROI()"/>
  </label>
  <div id="roi-result" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;text-align:center;">
    <p style="margin:0;font-size:12px;color:#15803d;">Estimated monthly revenue</p>
    <p id="roi-value" style="margin:4px 0 0;font-size:28px;font-weight:900;color:#059669;">$0</p>
  </div>
</div>
<script>
function calcROI(){
  var t=parseInt(document.getElementById('roi-traffic').value)||0;
  var a=parseInt(document.getElementById('roi-aov').value)||0;
  var rev=Math.round(t*${input.conversionRate/100}*a);
  document.getElementById('roi-value').textContent='$'+rev.toLocaleString();
}
calcROI();
</script>`;
}

// ── 136. Interactive Quiz Funnel ─────────────────────────────────────────────

export async function generateQuizFunnel(input: {
  niche: string;
  offer: string;
  outcomes: string[];
}): Promise<{
  title: string;
  questions: { question: string; options: { label: string; value: string; leadsTo: string }[] }[];
  results: { id: string; headline: string; body: string; cta: string; ctaUrl: string }[];
}> {
  const result = await generateAI({
    prompt: `Create an interactive quiz funnel for ${input.niche}.
Offer: ${input.offer}
Possible outcomes: ${input.outcomes.join(", ")}

Return JSON:
{
  "title": "Quiz title that creates curiosity",
  "questions": [
    {"question": "...", "options": [{"label": "...", "value": "a", "leadsTo": "result_id"}]}
  ],
  "results": [
    {"id": "result_1", "headline": "Your result...", "body": "Explanation", "cta": "Get your plan", "ctaUrl": "#"}
  ]
}

3-5 questions, 2-4 options each, 2-3 result types.`,
    systemPrompt: "You create quiz funnels that segment and convert. Return only JSON.",
    maxTokens: 1200,
  });
  try { return JSON.parse(result.content); }
  catch {
    return {
      title: `What's your ${input.niche} personality?`,
      questions: [
        { question: `What's your biggest challenge with ${input.niche}?`, options: [
          { label: "Getting started", value: "beginner", leadsTo: "starter" },
          { label: "Getting results", value: "intermediate", leadsTo: "accelerator" },
          { label: "Scaling what works", value: "advanced", leadsTo: "scaler" },
        ]},
      ],
      results: [
        { id: "starter", headline: "You're a Starter", body: "You need the foundation first.", cta: "Get the Starter Plan", ctaUrl: "#" },
        { id: "accelerator", headline: "You're an Accelerator", body: "You have the basics, now you need systems.", cta: "Get the Pro Plan", ctaUrl: "#" },
        { id: "scaler", headline: "You're a Scaler", body: "Time to multiply what's working.", cta: "Get the VIP Plan", ctaUrl: "#" },
      ],
    };
  }
}

// ── 138. Net Promoter Score ──────────────────────────────────────────────────

export function generateNPSSurvey(businessName: string, webhookUrl: string): string {
  return `
<div style="max-width:400px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px;text-align:center;font-family:sans-serif;">
  <h3 style="margin:0 0 8px;font-size:16px;font-weight:800;color:#0f172a;">How likely are you to recommend ${businessName}?</h3>
  <p style="margin:0 0 16px;font-size:12px;color:#94a3b8;">0 = Not likely · 10 = Extremely likely</p>
  <div id="nps-buttons" style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;margin-bottom:16px;">
  ${Array.from({length:11},(_, i)=>`<button onclick="submitNPS(${i})" style="width:36px;height:36px;border-radius:8px;border:1px solid ${i<=6?'#fca5a5':i<=8?'#fde68a':'#86efac'};background:${i<=6?'#fef2f2':i<=8?'#fffbeb':'#f0fdf4'};font-weight:700;font-size:13px;color:${i<=6?'#dc2626':i<=8?'#d97706':'#16a34a'};cursor:pointer;">${i}</button>`).join("")}
  </div>
  <div id="nps-thanks" style="display:none;padding:16px;background:#f0fdf4;border-radius:12px;color:#059669;font-weight:600;">Thank you for your feedback!</div>
</div>
<script>
function submitNPS(score){
  document.getElementById('nps-buttons').style.display='none';
  document.getElementById('nps-thanks').style.display='block';
  fetch('${webhookUrl}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'nps',score:score,business:'${businessName.replace(/'/g,"\\'")}',ts:Date.now()})}).catch(function(){});
}
</script>`;
}

// ── 148. Contract Templates ──────────────────────────────────────────────────

export function generateServiceContract(input: {
  businessName: string;
  clientName: string;
  service: string;
  price: string;
  duration: string;
  deliverables: string[];
}): string {
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return `# Service Agreement

**Date:** ${date}
**Between:** ${input.businessName} ("Provider") and ${input.clientName} ("Client")

## 1. Scope of Work
Provider agrees to deliver the following services: **${input.service}**

### Deliverables
${input.deliverables.map((d, i) => `${i + 1}. ${d}`).join("\n")}

## 2. Timeline
This agreement covers a period of **${input.duration}** starting from the date of first payment.

## 3. Investment
**Total: ${input.price}**
- 50% due upon signing
- 50% due at project midpoint

## 4. Revisions
Includes up to 2 rounds of revisions per deliverable. Additional revisions billed at $100/hour.

## 5. Confidentiality
Both parties agree to keep all shared information confidential.

## 6. Termination
Either party may terminate with 14 days written notice. Work completed up to termination date will be billed.

## 7. Acceptance

**Provider:** ${input.businessName}
Signature: _________________ Date: _________

**Client:** ${input.clientName}
Signature: _________________ Date: _________`;
}

// ── 149. Customer Onboarding Drip ────────────────────────────────────────────

export function generateOnboardingDrip(input: {
  productName: string;
  niche: string;
  stepsToSuccess: string[];
}): { day: number; subject: string; body: string; goal: string }[] {
  const steps = input.stepsToSuccess.length > 0 ? input.stepsToSuccess : [
    "Set up your account",
    "Complete the quick-start guide",
    "Take your first action",
    "See your first results",
    "Share your experience",
  ];

  return steps.map((step, i) => ({
    day: i === 0 ? 0 : i * 2,
    subject: i === 0
      ? `Welcome to ${input.productName} — here's your first step`
      : i === steps.length - 1
      ? `You did it! What's next with ${input.productName}`
      : `Day ${i * 2}: ${step}`,
    body: i === 0
      ? `Hey {{first_name}},\n\nWelcome to ${input.productName}! You made a great decision.\n\nYour first step: ${step}\n\nThis takes about 5 minutes and sets the foundation for everything else.\n\nLet's go.`
      : i === steps.length - 1
      ? `{{first_name}}, you've completed the core onboarding!\n\nHere's what you've accomplished:\n${steps.map((s, j) => `✓ ${s}`).join("\n")}\n\nNow the real work begins. Reply to this email if you need any help.`
      : `Hey {{first_name}},\n\nTime for the next step: ${step}\n\nThis builds on what you did in the last email. Most people see results after completing this.\n\nLet's keep the momentum going.`,
    goal: step,
  }));
}
