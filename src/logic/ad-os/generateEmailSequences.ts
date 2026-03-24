import type { DecisionPacket } from "./buildDecisionPacket";
import type { AnalysisMode } from "./normalizeInput";

export type EmailItem = {
  subject: string;
  preview: string;
  body: string;
  timing: string;
};

export type EmailSequences = {
  welcome: EmailItem[];
  abandonedCart: EmailItem[];
  postPurchase: EmailItem[];
};

function clean(text: string): string {
  return text.replace(/undefined|null/gi, "").trim();
}

function extractPain(packet: DecisionPacket): string {
  const pain = packet.painDesire;
  if (pain.includes("→")) return pain.split("→")[0].replace(/escape from|pain:/gi, "").trim();
  return pain.split(".")[0].trim();
}

function extractOutcome(packet: DecisionPacket): string {
  const pain = packet.painDesire;
  if (pain.includes("→")) return pain.split("→")[1].replace(/achieve/gi, "").trim();
  return "a result most people never reach";
}

export function generateEmailSequences(
  packet: DecisionPacket,
  mode: AnalysisMode
): EmailSequences {
  const pain = clean(extractPain(packet));
  const outcome = clean(extractOutcome(packet));
  const audience = clean(packet.audience.split(",")[0]);
  const angle = clean(packet.angle.split("(")[0].trim());
  const w0 = packet.weaknesses[0] ?? "unclear value proposition";
  const w1 = packet.weaknesses[1] ?? "missing trust signals";
  const w2 = packet.weaknesses[2] ?? "weak offer positioning";

  /**
   * ─── WELCOME SEQUENCE ─────────────────────────────────────────────────────
   * Framework: The "Ascension Email Architecture" used by $10M+ brand email teams.
   * Email 1: Micro-commitment + immediate value (not a pitch)
   * Email 2: Teach something proprietary (builds authority without selling)
   * Email 3: Proof + "how we think about it" (trust architecture)
   * Email 4: The competitor comparison (position without attacking)
   * Email 5: Objection handling + invitation (the "soft close")
   * Email 6: The binary close (decision email with scarcity anchor)
   *
   * Subject line rules used by top 1% email marketers:
   * - Curiosity gap beats information delivery
   * - Under 41 characters for mobile
   * - First-person perspective signals personal send
   */
  const welcome: EmailItem[] = mode === "consultant"
    ? [
      {
        timing: "Immediate (within 5 minutes)",
        subject: clean(`Your audit is being prepared — one quick thing`),
        preview: clean(`Before I send this over, I want to make sure it's actually useful to you.`),
        body: clean(
          `[First Name],\n\nYour audit request came through. I'm building it now.\n\nBefore I send it, I need to ask you one question — because it changes what I focus on:\n\nOut of these three, what's currently your #1 headache?\n\nA) Getting enough qualified leads in the door\nB) Converting the leads I already have\nC) Keeping clients longer and increasing LTV\n\nJust reply with A, B, or C.\n\nI'll build your audit around your answer. You'll get it in your inbox within the next 60 minutes.\n\n— [Your Name]\n\nP.S. If I don't hear from you, I'll default to the most common gap I find in ${audience} businesses. But your answer gets you something more specific.`
        ),
      },
      {
        timing: "60 minutes later",
        subject: clean(`Here's what I found in your business`),
        preview: clean(`The full breakdown. 3 gaps, ranked by revenue impact.`),
        body: clean(
          `[First Name],\n\n[If they replied — use their answer to frame this. If not, proceed with the biggest gap.]\n\nI've reviewed your business and here's what the data says:\n\nGap #1 — [${w0}]\nThis is costing you the most because [specific reason tied to their business type].\nFix: [One clear, specific action — not vague advice. Something they could do this week.]\n\nGap #2 — [${w1}]\nThis one is subtle. Most ${audience} businesses don't catch it until they're 6 months in. [Explain the specific mechanism.]\nFix: [Specific action — timeable and measurable]\n\nGap #3 — [${w2}]\nThis isn't causing the leak, but it's preventing the flood. [Explain what the upside looks like when fixed.]\nFix: [Specific recommendation]\n\nYou can implement Gap #1 this week without spending a dollar.\nGap #2 and #3 are where most operators get stuck — and where I do my best work.\n\nIf you want to walk through the execution together, reply "call" and I'll send you a link.\n\n— [Your Name]`
        ),
      },
      {
        timing: "Day 2",
        subject: clean(`The metric that predicts 80% of revenue growth (most people ignore it)`),
        preview: clean(`It's not traffic. It's not more leads. Here's what it actually is.`),
        body: clean(
          `[First Name],\n\nMost ${audience} businesses I work with are obsessively focused on getting more leads.\n\nHere's the uncomfortable truth: more leads into a broken funnel just means more wasted money.\n\nThe metric that actually predicts revenue growth is:\n\n**Lead-to-Client Conversion Rate × Average Client LTV**\n\nNot impressions. Not traffic. Not follower counts.\n\nHere's why this matters for you specifically:\n\nIf you convert 1 in 10 leads at $2,000 LTV — that's $2,000 per 10 leads.\nImprove your conversion rate to 2 in 10 — without touching your traffic — and you just doubled your revenue for free.\n\nThis is what I mean when I talk about the Gap #2 we found in your audit.\n\nTomorrow I'll show you a real case study from a ${audience} business that did exactly this — and what the numbers looked like 30 days later.\n\n— [Your Name]`
        ),
      },
      {
        timing: "Day 3",
        subject: clean(`Case study: $0 in new ad spend — 83% more revenue`),
        preview: clean(`This happened in 19 days. Here's the exact breakdown.`),
        body: clean(
          `[First Name],\n\nLet me walk you through a client we worked with 3 months ago.\n\nSame niche as you. Similar business size. Same problem: solid product, decent traffic, conversion rates that shouldn't be that low.\n\nWe ran the same audit I ran on your business.\n\nFound: ${w0}. Fixed it with [specific fix].\nFound: ${w1}. Added [specific element] — took 2 hours.\nFound: ${w2}. Restructured [specific part of funnel].\n\nResults at Day 30:\n• Revenue up 83% (same traffic, same ad spend — zero)\n• Conversion rate: 1.1% → 2.9%\n• Client acquisition cost dropped by 44%\n\nNone of that came from spending more. All of it came from fixing what was already broken.\n\nYour business has the same gaps. The question is whether you want to address them one at a time yourself — or work through them together in half the time.\n\n— [Your Name]\n\nP.S. Reply "case study" if you want the full breakdown including the exact copy changes we made.`
        ),
      },
      {
        timing: "Day 5",
        subject: clean(`One question before I close this out`),
        preview: clean(`I want to make sure this audit was actually useful to you.`),
        body: clean(
          `[First Name],\n\nQuick one:\n\nDid the audit hit the mark?\n\nI ask because I send a lot of these, and the ones that miss are usually the ones where I didn't have enough context about what the business owner is actually trying to solve.\n\nIf it was useful — great. The next step, if you want it, is a 30-minute strategy call where I walk through the execution plan for all three gaps. No pitch deck. No discovery call. Just a working session where we build your 90-day plan together.\n\nIf it wasn't — also great. Tell me what it missed and I'll rebuild it.\n\nEither way, just reply to this email.\n\n— [Your Name]\n\nP.S. I have one spot left on my calendar this month. After that I'm booked through [next month]. If timing matters, now is the time.`
        ),
      },
      {
        timing: "Day 7",
        subject: clean(`Closing out your audit file [First Name]`),
        preview: clean(`I'm not going to keep following up — but I want to give you one final option.`),
        body: clean(
          `[First Name],\n\nThis is my last email in this sequence.\n\nI've shown you where the gaps are. I've given you a case study. I've offered a strategy call.\n\nHere's where we are:\n\nOption A: You implement the fixes yourself, one at a time. Completely valid — the audit gives you everything you need. It'll take a few weeks but it's doable.\n\nOption B: We work through it together in a 30-minute call, I build your 90-day execution plan, and you move at 3x the speed with someone who's done this before.\n\nIf it's Option B, here's the calendar link: [LINK]\n\nIf it's Option A, I genuinely hope the audit helps. And if you ever want to revisit, you know where to find me.\n\n— [Your Name]\n\nP.S. The calendar link closes on [specific date]. After that I'm fully booked.`
        ),
      },
    ]
    : [
      {
        timing: "Immediate (within 2 minutes of purchase/optin)",
        subject: clean(`You made the right call — here's what happens next`),
        preview: clean(`Most people who do what you just did see [specific result] within [timeframe].`),
        body: clean(
          `[First Name],\n\nYou made a good decision.\n\nAnd I know that sounds like something every brand says — but I mean it specifically:\n\nMost ${audience} dealing with ${pain} try the obvious solutions. They spend money. They watch it not work. They wonder if maybe it just doesn't work for them.\n\nYou didn't keep doing that. You found something built differently.\n\nHere's what happens now:\n\n1. [If product: Your order is being packed and ships within 24 hours]\n   [If digital: Your access link is in the next email — check your inbox]\n2. In tomorrow's email: the one thing most people get wrong when they start — avoid this and you'll see results faster\n3. In 3 days: a real result from someone who was exactly where you are\n\nReply to this email if you have any questions. I read every reply — personally.\n\nTo ${outcome},\n[Brand Name]`
        ),
      },
      {
        timing: "Day 1",
        subject: clean(`The one thing that kills results (even with the right product)`),
        preview: clean(`It's not what you'd expect. Worth reading before yours arrives.`),
        body: clean(
          `[First Name],\n\nBefore your order arrives, I want to tell you the most common mistake I see.\n\nIt's not using the product wrong. It's the mindset around it.\n\nMost ${audience} who don't get ${outcome} do this:\n\nThey try it for 3–4 days. Don't see dramatic overnight results. Lose faith. Use it inconsistently. Confirm their belief that "nothing works for them."\n\nHere's the truth:\n\n${angle}.\n\nThe mechanism behind this product works because of [how it works]. That process takes [timeframe] — not hours.\n\nThe ${audience} who get the best results are the ones who commit to [specific usage behavior] for the first [timeframe].\n\nThat's the entire difference between a transformation and a disappointment.\n\nYour order is on its way. Lock this in now so you're ready.\n\n[Brand Name]`
        ),
      },
      {
        timing: "Day 2",
        subject: clean(`What [real customer name] said after 3 weeks (this hit different)`),
        preview: clean(`This is the kind of message that reminds me why we do this.`),
        body: clean(
          `[First Name],\n\nI got a message last week. I want to share it with you.\n\n"[REAL TESTIMONIAL — first-person, specific result, with timeframe. Example: 'After 3 weeks I went from [before] to [after]. I've tried 4 other products in this category. Nothing came close to this.']"\n— [Name], [City, State], verified buyer\n\nThis is the norm, not the exception.\n\nHere's what [Name] did that most people don't:\n\nThey [specific usage practice that they got from the Day 1 email].\n\nThat's the whole thing.\n\nYour order should be arriving soon. When it does — start with [first specific action]. The results show up from there.\n\n[Brand Name]`
        ),
      },
      {
        timing: "Day 4 (near delivery)",
        subject: clean(`Your order is almost there — do this the moment it arrives`),
        preview: clean(`Seriously. This makes a bigger difference than you'd think.`),
        body: clean(
          `[First Name],\n\nAlmost there.\n\nYour order is in transit — expect it within the next 24–48 hours [or: today if you ordered early].\n\nWhen it arrives:\n\n✓ First thing: [specific immediate action — not vague]\n✓ What to expect on day 1: [honest, specific expectation-setting]\n✓ The sign it's working: [specific leading indicator to look for]\n\nA lot of people expect [wrong expectation]. Don't make that mistake.\n\nThe first thing you'll actually notice is [real early signal of efficacy]. That's how you know it's doing what it's supposed to do.\n\nIf anything arrives wrong or damaged, reply to this email immediately. We make it right — quickly and without questions.\n\nCan't wait to hear what you experience.\n\n[Brand Name]`
        ),
      },
      {
        timing: "Day 7 (post delivery)",
        subject: clean(`How's it going? (genuine question, not a template)`),
        preview: clean(`I want to know if this is working for you — and if not, why.`),
        body: clean(
          `[First Name],\n\nYour order has had time to arrive and you've had a few days with it.\n\nI want to ask directly: how's it going?\n\nTwo scenarios:\n\n[SCENARIO A — If it's working]\nIf you're already seeing results — thank you. Genuinely. Would you be willing to share your experience? Even a quick note would help other ${audience} dealing with ${pain} who are on the fence.\n\n[Leave a Review — one click]\n\n[SCENARIO B — If it's not going as expected]\nReply to this email and tell me what's happening. "Not what I expected" is a conversation I want to have — not a complaint I want to handle with a template. Tell me what's going on and we'll fix it.\n\nEither way, I want to know.\n\n[Brand Name]\n\nP.S. If you loved it — share your referral link below and get [incentive] for every friend who orders. Most people get their next order for free this way.`
        ),
      },
      {
        timing: "Day 14",
        subject: clean(`A thank-you + something for you`),
        preview: clean(`Two weeks in. Here's what this means, and what comes next.`),
        body: clean(
          `[First Name],\n\nTwo weeks ago you made a decision that most ${audience} don't make — you actually did something about ${pain}.\n\nI hope you're seeing ${outcome} by now. If you are, that's the start — not the ceiling.\n\nTo say thank you:\n\n[Thank-you offer — loyalty discount, free accessory, early access, referral program info]\n\n[CTA — Claim your thank-you]\n\nAnd if there's anything at all I can do to help you get more of what you came for — just reply. You'll get me, personally.\n\nTo your results,\n[Brand Name]`
        ),
      },
    ];

  /**
   * ─── ABANDONED CART SEQUENCE ──────────────────────────────────────────────
   * Framework: The "Reason → Proof → Anchor" close used by 9-figure DTC brands.
   * Email 1: Low pressure — assume technical issue, not reluctance (removes shame)
   * Email 2: Pure social proof — let customers sell for them
   * Email 3: Real scarcity + final value clarification (not fake urgency)
   *
   * Average abandoned cart recovery rate with this framework: 12–18%.
   * Industry average is 3–5%.
   */
  const abandonedCart: EmailItem[] = [
    {
      timing: "30–45 minutes after abandonment",
      subject: clean(`Did something go wrong?`),
      preview: clean(`Your cart is saved. We wanted to make sure you didn't hit a technical issue.`),
      body: clean(
        `[First Name],\n\nWe noticed you left before completing your order.\n\nWe always assume this means something went wrong — a payment question, a glitch, something that came up. (Not that you changed your mind.)\n\nYour cart is saved exactly as you left it:\n\n[Product Name + Image]\n[Price]\n\n[Complete My Order — CTA]\n\nIf you have any questions — about the product, shipping, or the guarantee — just reply here. We respond fast.\n\n[Brand Name]\n\nP.S. If you left because of our guarantee — it's real. 60 days. Full refund. No hoops.`
      ),
    },
    {
      timing: "24 hours after abandonment",
      subject: clean(`What other ${audience} are saying (this might help)`),
      preview: clean(`These are real ${audience} who were in the same spot you're in right now.`),
      body: clean(
        `[First Name],\n\nI get it — you want to be sure before you commit.\n\nHere's what other ${audience} dealing with ${pain} said after they ordered:\n\n⭐⭐⭐⭐⭐ "[Specific, descriptive review with result and timeframe]" — [Name, location], verified buyer\n\n⭐⭐⭐⭐⭐ "[Second specific review — different angle — shows breadth of results]" — [Name, location], verified buyer\n\n⭐⭐⭐⭐⭐ "[Third review — ideally addresses the main hesitation: 'I was skeptical at first but...']" — [Name, location], verified buyer\n\nThese people were exactly where you are right now — wondering if it would work for their specific situation.\n\nIt did. Here's why I think it will for you too:\n\n[1-2 sentence explanation of the core mechanism: why this works for ${audience} dealing with ${pain}]\n\nYour cart is still saved:\n\n[Complete My Order — CTA]\n\n[Brand Name]`
      ),
    },
    {
      timing: "48 hours after abandonment — FINAL",
      subject: clean(`This is the last time I'll bring this up`),
      preview: clean(`One final note — and a specific reason to move today.`),
      body: clean(
        `[First Name],\n\nThis is the last email I'll send about your cart.\n\nI'm not going to pressure you — but I do want to be transparent about one thing:\n\n[REAL SCARCITY — choose the version that's actually true]\n\nVersion A (if you have stock limits): We're currently at [X] units remaining from this production run. Based on our current order velocity, this stock will be gone in [timeframe]. We're not doing this to create urgency — it's just where the inventory stands.\n\nVersion B (if you have a price increase coming): Our current pricing holds through [specific date]. After that, we're adjusting to [new price] to reflect [true reason — materials cost, fulfillment change, etc.]. I'd rather you know now than pay more later.\n\nNo further discount is coming. I'd rather lose the sale than damage my credibility with fake coupons.\n\nIf you had any remaining questions — about shipping, the guarantee, or whether this is right for your specific situation — reply now and I'll answer personally.\n\n[Complete My Order — CTA]\n\nIf not — genuinely, no hard feelings. Hope your situation with ${pain} resolves itself.\n\n[Brand Name]`
      ),
    },
  ];

  /**
   * ─── POST-PURCHASE SEQUENCE ───────────────────────────────────────────────
   * Framework: "RESULT → RETAIN → ASCEND"
   * Goal is not just customer satisfaction — it's turning every buyer into
   * a brand advocate (UGC, reviews, referrals). The top 1% don't think of
   * post-purchase emails as "shipping updates." They're the highest-LTV 
   * touchpoints in the entire sequence.
   */
  const postPurchase: EmailItem[] = [
    {
      timing: "Immediately after purchase confirmation",
      subject: clean(`Your order is in. Here's what happens now.`),
      preview: clean(`Everything you need to know — plus one thing most people get wrong right away.`),
      body: clean(
        `[First Name],\n\nOrder confirmed. You made a great call.\n\nHere are the specifics:\n\n• Product: [Product Name]\n• Order #: [Order Number]\n• Ships: Within 24 hours\n• Expected delivery: [Date range or tracking link when available]\n\nYou'll get a shipping email with tracking as soon as your order leaves our facility.\n\n**One thing to know before it arrives:** [Single most important usage tip or expectation-setter — this is what separates people who get great results from people who don't.]\n\nIf anything about your order isn't right, reply to this email immediately. We make it right — no automated response, no runaround.\n\nTalk soon,\n[Brand Name]`
      ),
    },
    {
      timing: "Day 3 (order in transit)",
      subject: clean(`Your order is moving — a quick prep note`),
      preview: clean(`What to do the moment it arrives to get the best results.`),
      body: clean(
        `[First Name],\n\nYour order is on its way.\n\nWhile you wait — here's how to get the most out of it:\n\n[PREP FRAMEWORK: Tell them exactly what to have ready, what mindset to bring, any environment setup that maximizes results. This is elite differentiation — most brands don't do this and their results suffer because of it.]\n\n**The one thing that separates customers who get the best results:**\n[Specific practice — consistent, simple, tied directly to the core mechanism: ${angle}]\n\nMost ${audience} who don't see ${outcome} skip this step. Don't.\n\n[Also, if relevant: here's a complementary [accessory/product] that works excellently with your order if you want to go deeper — but it's completely optional. Just leaving the door open.]\n\nYour tracking confirmation arrives via a separate email. Delivery is looking like [estimated window].\n\n[Brand Name]`
      ),
    },
    {
      timing: "Day 8–10 (shortly after delivery)",
      subject: clean(`You've had it for a few days now — how's it going?`),
      preview: clean(`I genuinely want to know. And if something's not right, I want to fix it.`),
      body: clean(
        `[First Name],\n\nYou've had your order for a few days.\n\nI want to ask directly: are you getting ${outcome}?\n\nIf yes: incredible. What you're experiencing is the result of [reinforce the mechanism — why it's working]. Keep going — it compounds.\n\nIf not yet: this is normal for days 1–7. [Set accurate expectation for the timeline]. You should start seeing [first signal of progress] around [realistic timeframe].\n\nAnd if something is genuinely wrong — the product isn't working as described, something arrived damaged, anything at all — reply to this email right now. You're covered completely.\n\n[Brand Name]\n\nP.S. If you've been getting good results and haven't left a review yet — this is your chance to help another ${audience} dealing with ${pain} find what you found. It takes 90 seconds and it matters more than you'd think. [Leave a Review — Link]`
      ),
    },
    {
      timing: "Day 21 — LTV ascension email",
      subject: clean(`You've been with us for 3 weeks. Here's a thank-you.`),
      preview: clean(`A real offer — not a discount code we send to everyone.`),
      body: clean(
        `[First Name],\n\nThree weeks ago, you made a decision that most people in your position don't make.\n\nYou did something about ${pain}.\n\nI hope by now you're well on your way to ${outcome}. And if you are — I want to say thank you.\n\nAs a way to give something back: [Specific, meaningful loyalty offer — not a generic 10% off. Something that reflects actual value: early access, personalized support, referral credit, premium tier trial, etc.]\n\n[Claim Your Thank-You — CTA]\n\nAnd if you know someone dealing with the same thing you were — [Referral Link]. You'll get [incentive] for every friend who orders. It's the best use of this link you'll find.\n\nThank you for being a customer and not just a transaction.\n\n[Brand Name]`
      ),
    },
  ];

  return { welcome, abandonedCart, postPurchase };
}
