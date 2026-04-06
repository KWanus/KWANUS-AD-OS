// ---------------------------------------------------------------------------
// Smart Block Defaults — contextualize block content from business data
// When a user adds a new block in the editor, we pre-fill it with their
// actual niche, audience, offer, and business data. No generic placeholders.
// ---------------------------------------------------------------------------

type BusinessData = {
  businessName?: string;
  niche?: string;
  audience?: string;
  painPoint?: string;
  outcome?: string;
  offer?: string;
  pricing?: string;
  guarantee?: string;
  location?: string;
};

/**
 * Merge generic block defaults with business-specific content.
 * Returns a new props object — does not mutate the original.
 */
export function contextualizeBlockProps(
  blockType: string,
  defaultProps: Record<string, unknown>,
  biz: BusinessData
): Record<string, unknown> {
  if (!biz.niche && !biz.audience) return defaultProps;

  const name = biz.businessName ?? biz.niche ?? "Your Business";
  const audience = biz.audience ?? "your customers";
  const pain = biz.painPoint ?? "their biggest challenge";
  const outcome = biz.outcome ?? "the results they want";
  const offer = biz.offer ?? "what you offer";
  const niche = biz.niche ?? "your industry";

  switch (blockType) {
    case "hero":
      return {
        ...defaultProps,
        headline: `Get ${outcome} — Without the Guesswork`,
        subheadline: `Built for ${audience} who are done with ${pain}. ${name} gives you a clear path forward.`,
        buttonText: `Get My ${outcome.split(" ").slice(0, 3).join(" ")}`,
        buttonUrl: "#payment",
        socialProofText: `Trusted by ${audience} across ${niche}`,
        trustItems: [
          biz.guarantee ?? "Results guaranteed",
          "No long-term contracts",
          "Setup in minutes",
        ],
      };

    case "features":
      return {
        ...defaultProps,
        eyebrow: `Why ${audience} choose us`,
        title: "Everything You Need to Succeed",
        items: [
          { icon: "🎯", title: `Solves ${pain}`, body: `Directly addresses the core issue ${audience} face — no workarounds, no band-aids.` },
          { icon: "⚡", title: "Fast Results", body: `See measurable improvement quickly. Our approach to ${niche} is built for speed.` },
          { icon: "💎", title: `${outcome}`, body: `The end result: ${outcome}. That's what this is built to deliver.` },
        ],
      };

    case "cta":
      return {
        ...defaultProps,
        eyebrow: "Ready?",
        headline: `Stop Dealing with ${pain}`,
        subheadline: `Join ${audience} who are already getting ${outcome}. Start today.`,
        buttonText: `Get Started${biz.pricing ? ` — ${biz.pricing}` : ""}`,
        trustItems: [
          biz.guarantee ?? "Money-back guarantee",
          "No credit card required",
          "Cancel anytime",
        ],
      };

    case "testimonials":
      return {
        ...defaultProps,
        eyebrow: `Real ${audience} — real results`,
        title: `Why ${audience} Trust ${name}`,
        items: [
          {
            name: "[Customer Name]",
            role: audience,
            company: "",
            quote: `I was dealing with ${pain} for months. After working with ${name}, I saw ${outcome} faster than I expected. Wish I'd started sooner.`,
            stars: 5,
            result: outcome.split(" ").slice(0, 3).join(" "),
            verified: true,
          },
          {
            name: "[Customer Name]",
            role: audience,
            company: "",
            quote: `Finally something that actually works for ${niche}. The difference was obvious within the first week.`,
            stars: 5,
            result: "Visible Results",
            verified: true,
          },
        ],
      };

    case "faq":
      return {
        ...defaultProps,
        eyebrow: "Common questions",
        title: `Questions ${audience} Ask Before Starting`,
        items: [
          { q: "Will this work for my specific situation?", a: `Yes — our approach to ${niche} is designed to address ${pain} regardless of where you're starting from. If it's not the right fit, ${biz.guarantee ?? "you're protected by our guarantee"}.` },
          { q: "How quickly will I see results?", a: `Most ${audience} see noticeable improvement within the first 2 weeks. Full ${outcome} typically develops over 30-60 days.` },
          { q: "What if it doesn't work?", a: biz.guarantee ?? "We offer a full money-back guarantee. If you don't see results, we refund every penny — no questions asked." },
          { q: `How is this different from other ${niche} solutions?`, a: `Most approaches to ${pain} treat the symptoms. We address the root cause, which is why ${audience} see ${outcome} faster and more consistently.` },
          { q: "What exactly do I get?", a: offer || `A complete system designed for ${audience} to achieve ${outcome}. Everything you need — nothing you don't.` },
        ],
      };

    case "guarantee":
      return {
        ...defaultProps,
        icon: "🛡️",
        headline: biz.guarantee ?? "100% Money-Back Guarantee",
        body: `We're confident that ${name} will deliver ${outcome} for you. If it doesn't — for any reason — we'll refund every penny. No questions, no hassle, no risk. You either get results or you get your money back.`,
      };

    case "pricing":
      if (biz.pricing) {
        return {
          ...defaultProps,
          eyebrow: "Investment",
          title: "Simple Pricing",
          tiers: [
            {
              label: name,
              price: biz.pricing,
              period: "",
              description: offer ?? `Everything you need to achieve ${outcome}.`,
              features: [
                `Solve ${pain}`,
                `Achieve ${outcome}`,
                `Built for ${audience}`,
                biz.guarantee ?? "Money-back guarantee",
              ],
              buttonText: "Get Started Now",
              highlight: true,
            },
          ],
          guarantee: biz.guarantee ?? "30-day money-back guarantee",
        };
      }
      return defaultProps;

    case "process":
      return {
        ...defaultProps,
        eyebrow: "How it works",
        title: `3 Steps to ${outcome}`,
        steps: [
          { icon: "1", title: "Tell Us About You", body: `Share where you are with ${pain} and what ${outcome} looks like for you.` },
          { icon: "2", title: "We Build Your Plan", body: `Get a custom strategy designed specifically for ${audience} in ${niche}.` },
          { icon: "3", title: "See Results", body: `Follow the plan, track your progress, and experience ${outcome}.` },
        ],
      };

    case "before_after":
      return {
        ...defaultProps,
        title: "The Difference",
        beforeLabel: `Without ${name}`,
        afterLabel: `With ${name}`,
        beforeItems: [
          `Stuck with ${pain}`,
          "Wasting time on things that don't work",
          "Falling behind competitors",
          "No clear path forward",
        ],
        afterItems: [
          outcome,
          "Proven approach that works",
          `Ahead of other ${audience}`,
          "Clear roadmap to results",
        ],
      };

    case "urgency":
      return {
        ...defaultProps,
        text: `Limited availability — ${audience} are joining now`,
        items: [
          biz.pricing ? `Current pricing: ${biz.pricing}` : "Special launch pricing",
          "Spots are filling up",
        ],
      };

    case "stats":
      return {
        ...defaultProps,
        stats: [
          { number: "500+", label: `${audience} Served` },
          { number: "98%", label: "Satisfaction Rate" },
          { number: "5★", label: "Average Rating" },
          { number: "24h", label: "Response Time" },
        ],
      };

    case "text":
      return {
        ...defaultProps,
        content: `${name} helps ${audience} overcome ${pain} and achieve ${outcome}. Our approach to ${niche} is different — we focus on what actually works, not what sounds good.`,
      };

    default:
      return defaultProps;
  }
}
