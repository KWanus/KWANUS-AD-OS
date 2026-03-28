// ─────────────────────────────────────────────────────────────────────────────
// KWANUS AD OS — Email Sequence Templates
// Pre-built email sequences for common use cases.
// Each template defines a set of emails with subject, body, delay, and purpose.
// ─────────────────────────────────────────────────────────────────────────────

export type EmailTemplateCategory = "welcome" | "nurture" | "sales" | "cart" | "onboarding" | "reengagement";

export interface EmailStep {
  subject: string;
  previewText: string;
  body: string;
  delayDays: number;
  purpose: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: EmailTemplateCategory;
  thumbnail: string;
  trigger: string;
  emails: EmailStep[];
}

// ─── Template: Welcome Sequence ──────────────────────────────────────────────

const welcomeSequence: EmailTemplate = {
  id: "welcome-sequence",
  name: "Welcome Sequence",
  description: "5-email welcome series that builds trust and drives the first purchase.",
  category: "welcome",
  thumbnail: "👋",
  trigger: "signup",
  emails: [
    {
      subject: "Welcome to {{brand}} — here's what's next",
      previewText: "You made a great decision. Let me show you around.",
      body: `Hi {{firstName}},

Welcome to {{brand}}! You just made one of the best decisions for your business.

Here's what you can expect over the next few days:
• Tomorrow: The #1 mistake most people make (and how to avoid it)
• Day 3: A simple framework that changes everything
• Day 5: Your personal action plan

For now, here's the single most important thing you can do today:
[PRIMARY CTA BUTTON]

If you have any questions, just reply to this email. I read every message.

Talk soon,
{{senderName}}`,
      delayDays: 0,
      purpose: "Set expectations, deliver value, build rapport",
    },
    {
      subject: "The #1 mistake that costs you {{painPoint}}",
      previewText: "90% of people get this wrong. Here's how to fix it.",
      body: `Hi {{firstName}},

After working with hundreds of {{niche}} businesses, I've seen the same mistake over and over:

**They try to do everything at once.**

The result? Nothing gets done well. Leads slip through the cracks. Revenue stays flat.

Here's what the top performers do differently:

They pick ONE channel, master it, and only then expand.

For most businesses in {{niche}}, that channel is [specific recommendation].

**Here's a simple test:** Can you answer these 3 questions about your current marketing?
1. Where do most of your leads come from?
2. What's your cost per lead?
3. How many leads become paying customers?

If you can't answer all three, you're flying blind — and that's exactly what we fix.

[CTA: See how we solve this →]

{{senderName}}`,
      delayDays: 1,
      purpose: "Establish authority, identify pain, create curiosity",
    },
    {
      subject: "The framework behind {{successMetric}} results",
      previewText: "This simple system changed everything for our clients.",
      body: `Hi {{firstName}},

Yesterday I told you about the #1 mistake. Today, let me show you the fix.

We call it the {{frameworkName}} Framework:

**Step 1: Capture** — Get the right people's attention with a targeted message
**Step 2: Convert** — Turn attention into action with a clear, compelling offer
**Step 3: Close** — Follow up automatically so no lead falls through the cracks

Simple? Yes. But the difference between businesses that grow and ones that stall is usually just *how well* they execute these three steps.

Here's a real example: {{caseStudyName}} went from {{beforeMetric}} to {{afterMetric}} in {{timeframe}} using exactly this framework.

Want to see how it would work for your business?

[CTA: Get your custom plan →]

{{senderName}}`,
      delayDays: 2,
      purpose: "Deliver core framework, social proof, drive engagement",
    },
    {
      subject: "Quick question about your {{niche}} business",
      previewText: "I'm curious about one thing...",
      body: `Hi {{firstName}},

Quick question — what's the biggest challenge you're facing right now in your business?

A) Getting more leads
B) Converting leads into paying customers
C) Keeping customers long-term
D) Something else (just reply and tell me)

I ask because we're about to launch something specifically designed to help with [A/B/C] — and I want to make sure I'm sending you the most relevant information.

Just hit reply with your letter. Takes 2 seconds.

{{senderName}}

P.S. Everyone who replies gets a free [resource/template/audit] tailored to their answer.`,
      delayDays: 2,
      purpose: "Engagement trigger, segmentation, two-way conversation",
    },
    {
      subject: "Your personal action plan (+ special offer inside)",
      previewText: "Everything you need to start seeing results this week.",
      body: `Hi {{firstName}},

Over the past few days, I've shared:
✅ The #1 mistake to avoid
✅ The framework that drives results
✅ How to identify your biggest growth lever

Now it's time to put it all together.

**Here's your 7-day action plan:**

Day 1-2: Audit your current lead sources (we have a free template for this)
Day 3-4: Set up one automated follow-up sequence
Day 5-7: Launch a targeted campaign to your best audience

**Or — let us do it for you.**

For the next 48 hours, new members get {{discountOffer}} on our {{planName}} plan.

This includes:
• Custom strategy for your {{niche}} business
• Done-for-you landing page and email sequences
• Priority support from our team

[CTA: Claim Your {{discountOffer}} →]

This offer expires {{expiryDate}}.

{{senderName}}`,
      delayDays: 2,
      purpose: "Value summary, CTA, time-limited offer",
    },
  ],
};

// ─── Template: Abandoned Cart ────────────────────────────────────────────────

const abandonedCartSequence: EmailTemplate = {
  id: "abandoned-cart",
  name: "Abandoned Cart Recovery",
  description: "3-email sequence to recover abandoned carts with escalating urgency.",
  category: "cart",
  thumbnail: "🛒",
  trigger: "abandoned_cart",
  emails: [
    {
      subject: "You left something behind...",
      previewText: "Your cart is still waiting for you.",
      body: `Hi {{firstName}},

Looks like you were checking out {{productName}} but didn't finish your order.

No worries — your cart is saved and ready whenever you are.

[CTA: Complete Your Order →]

If you had any questions or ran into an issue, just reply to this email and we'll help you out.

{{senderName}}`,
      delayDays: 0,
      purpose: "Gentle reminder, remove friction",
    },
    {
      subject: "Still thinking about {{productName}}?",
      previewText: "Here's why 2,000+ people chose it.",
      body: `Hi {{firstName}},

I noticed you were interested in {{productName}}. Here's what others are saying about it:

⭐⭐⭐⭐⭐ "Best purchase I've made this year" — {{reviewerName}}

Here's why people love it:
• {{benefit1}}
• {{benefit2}}
• {{benefit3}}

Plus, every order comes with our {{guarantee}} guarantee.

[CTA: Get Yours Now →]

{{senderName}}`,
      delayDays: 1,
      purpose: "Social proof, benefits, reduce risk",
    },
    {
      subject: "Last chance: {{discountOffer}} off your order",
      previewText: "We don't do this often, but here's a special discount.",
      body: `Hi {{firstName}},

I don't usually do this, but I really think you'd love {{productName}} — so here's a special offer:

**Use code {{discountCode}} for {{discountOffer}} off your order.**

This code expires in 24 hours.

[CTA: Apply Discount & Checkout →]

After that, the price goes back to normal and I won't be able to offer this again.

{{senderName}}`,
      delayDays: 1,
      purpose: "Urgency, discount, final push",
    },
  ],
};

// ─── Template: Post-Purchase ─────────────────────────────────────────────────

const postPurchaseSequence: EmailTemplate = {
  id: "post-purchase",
  name: "Post-Purchase Nurture",
  description: "4-email sequence to build loyalty, get reviews, and drive repeat purchases.",
  category: "onboarding",
  thumbnail: "🎉",
  trigger: "purchase",
  emails: [
    {
      subject: "Your order is confirmed! Here's what happens next",
      previewText: "Thank you for your purchase. Here's everything you need to know.",
      body: `Hi {{firstName}},

Thank you for your order! Here's a quick summary:

**Order #{{orderNumber}}**
{{orderSummary}}

**What's next:**
• Your order is being processed now
• You'll receive tracking info within {{shippingTimeframe}}
• Questions? Reply to this email anytime

We're excited for you to experience {{productName}}!

{{senderName}}`,
      delayDays: 0,
      purpose: "Order confirmation, set expectations, reduce buyer's remorse",
    },
    {
      subject: "Quick tip to get the most out of {{productName}}",
      previewText: "Most people miss this one thing...",
      body: `Hi {{firstName}},

Now that you have {{productName}}, here's the #1 tip to get the best results:

**{{topTip}}**

Most customers who follow this see {{expectedResult}} within {{timeframe}}.

Need help getting started? Here are some resources:
• [Getting Started Guide]
• [Video Tutorial]
• [FAQ Page]

And remember — if you need anything, just reply to this email.

{{senderName}}`,
      delayDays: 3,
      purpose: "Deliver value, increase product usage, reduce returns",
    },
    {
      subject: "How's {{productName}} working for you?",
      previewText: "We'd love your honest feedback (takes 30 seconds).",
      body: `Hi {{firstName}},

You've had {{productName}} for about a week now — how's it going?

We'd love to hear your honest feedback. It takes just 30 seconds:

[CTA: Leave a Review ⭐⭐⭐⭐⭐]

Your review helps other people like you make a confident decision. Plus, everyone who leaves a review gets {{reviewReward}}.

Thanks for being part of our community!

{{senderName}}`,
      delayDays: 7,
      purpose: "Get reviews, social proof generation",
    },
    {
      subject: "Something special for our best customers",
      previewText: "You're in the top 10% — here's an exclusive offer.",
      body: `Hi {{firstName}},

Because you're one of our valued customers, I wanted to give you early access to something special:

**{{upsellProduct}} — {{upsellDiscount}} off (customers only)**

This pairs perfectly with {{productName}} and most customers see even better results when they use both together.

[CTA: Claim Your Exclusive Offer →]

This offer is only available to existing customers and expires in {{expiryDays}} days.

{{senderName}}`,
      delayDays: 14,
      purpose: "Upsell, reward loyalty, drive repeat purchase",
    },
  ],
};

// ─── Template: Re-engagement ─────────────────────────────────────────────────

const reengagementSequence: EmailTemplate = {
  id: "reengagement",
  name: "Win-Back / Re-engagement",
  description: "3-email sequence to re-activate cold subscribers with curiosity and incentives.",
  category: "reengagement",
  thumbnail: "🔄",
  trigger: "custom",
  emails: [
    {
      subject: "We miss you, {{firstName}}",
      previewText: "It's been a while — here's what you've been missing.",
      body: `Hi {{firstName}},

It's been a while since we've heard from you, and a lot has changed:

• {{update1}}
• {{update2}}
• {{update3}}

We've been working hard to make things even better, and we'd love for you to come back and see what's new.

[CTA: See What's New →]

{{senderName}}`,
      delayDays: 0,
      purpose: "Curiosity, show improvements, re-activate",
    },
    {
      subject: "A gift for coming back",
      previewText: "We put together something special just for you.",
      body: `Hi {{firstName}},

Since it's been a while, I want to make it easy for you to come back:

**Here's {{reactivationOffer}} — just for you.**

Use code {{reactivationCode}} at checkout. Valid for 72 hours.

No strings attached. We just want you to give us another shot.

[CTA: Redeem Your Gift →]

{{senderName}}`,
      delayDays: 3,
      purpose: "Incentive, lower barrier to re-entry",
    },
    {
      subject: "Should we stop emailing you?",
      previewText: "No hard feelings either way — just let us know.",
      body: `Hi {{firstName}},

I want to respect your inbox, so I'll keep this simple:

Would you like to keep hearing from us?

[CTA: Yes, keep me subscribed →]

If not, no hard feelings at all. You can unsubscribe below and we won't email you again.

But if there's anything we can do better, I genuinely want to hear about it. Just hit reply.

{{senderName}}`,
      delayDays: 4,
      purpose: "List hygiene, final engagement attempt, respect",
    },
  ],
};

// ─── Export ──────────────────────────────────────────────────────────────────

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  welcomeSequence,
  abandonedCartSequence,
  postPurchaseSequence,
  reengagementSequence,
];

export function getEmailTemplateById(id: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find((t) => t.id === id);
}

export function getEmailTemplatesByCategory(category: EmailTemplateCategory): EmailTemplate[] {
  return EMAIL_TEMPLATES.filter((t) => t.category === category);
}
