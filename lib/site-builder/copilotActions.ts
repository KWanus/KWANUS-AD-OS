import type { Block, BlockType } from "@/components/site-builder/BlockRenderer";

export type CopilotAction =
  | "improve_hero"
  | "add_testimonials"
  | "add_faq"
  | "add_cta"
  | "add_trust"
  | "apply_booking_template"
  | "apply_local_service_template"
  | "create_services_page"
  | "create_faq_page"
  | "unknown";

export type AiPageTemplate =
  | "about"
  | "services"
  | "faq"
  | "contact"
  | "landing";

export function getAiPageTemplateLabel(template: AiPageTemplate) {
  switch (template) {
    case "about":
      return "About";
    case "services":
      return "Services";
    case "faq":
      return "FAQ";
    case "contact":
      return "Contact";
    case "landing":
      return "Landing";
    default:
      return "Page";
  }
}

export function getMissingSiteStructurePages(pageSlugs: string[]): AiPageTemplate[] {
  const existing = new Set(pageSlugs);
  const recommended: AiPageTemplate[] = [];
  if (!existing.has("about")) recommended.push("about");
  if (!existing.has("services")) recommended.push("services");
  if (!existing.has("faq")) recommended.push("faq");
  if (!existing.has("contact")) recommended.push("contact");
  return recommended;
}

function makeId(type: BlockType) {
  return `${type}-${Math.random().toString(36).slice(2, 10)}`;
}

function makeBlock(type: BlockType, props: Record<string, unknown>): Block {
  return {
    id: makeId(type),
    type,
    props,
  };
}

export function hasBlock(blocks: Block[], type: BlockType) {
  return blocks.some((block) => block.type === type);
}

export function getCopilotDiagnostics(blocks: Block[]) {
  return {
    hasHero: hasBlock(blocks, "hero"),
    hasCta: hasBlock(blocks, "cta"),
    hasFaq: hasBlock(blocks, "faq"),
    hasTestimonials: hasBlock(blocks, "testimonials"),
    hasTrust: hasBlock(blocks, "trust_badges"),
    hasProcess: hasBlock(blocks, "process"),
    blockCount: blocks.length,
  };
}

export function interpretCopilotInstruction(input: string): CopilotAction {
  const normalized = input.toLowerCase();

  if (normalized.includes("hero")) return "improve_hero";
  if (normalized.includes("testimonial") || normalized.includes("review") || normalized.includes("proof")) return "add_testimonials";
  if (normalized.includes("faq")) return "add_faq";
  if (normalized.includes("cta") || normalized.includes("call to action")) return "add_cta";
  if (normalized.includes("trust") || normalized.includes("badge") || normalized.includes("guarantee")) return "add_trust";
  if (normalized.includes("booking template") || normalized.includes("consultation template")) return "apply_booking_template";
  if (normalized.includes("local service template") || normalized.includes("lead gen template")) return "apply_local_service_template";
  if (normalized.includes("services page") || normalized.includes("service page")) return "create_services_page";
  if (normalized.includes("faq page")) return "create_faq_page";

  return "unknown";
}

export function improveHero(blocks: Block[], siteName: string) {
  const next = [...blocks];
  const index = next.findIndex((block) => block.type === "hero");

  const replacement = makeBlock("hero", {
    eyebrow: "Conversion-first rebuild",
    headline: `${siteName} made clearer, stronger, and easier to say yes to`,
    subheadline: "Use a sharper promise, clearer trust, and a more visible next step above the fold so more visitors turn into real leads.",
    buttonText: "Get Started",
    secondaryButtonText: "See How It Works",
    textAlign: "center",
    socialProofText: "Built to convert better",
    trustItems: ["Clear offer", "Visible trust", "Stronger CTA"],
  });

  if (index === -1) return [replacement, ...next];

  next[index] = {
    ...next[index],
    props: {
      ...next[index].props,
      eyebrow: "Conversion-first rebuild",
      headline: `${siteName} made clearer, stronger, and easier to say yes to`,
      subheadline: "Use a sharper promise, clearer trust, and a more visible next step above the fold so more visitors turn into real leads.",
      buttonText: (next[index].props.buttonText as string) || "Get Started",
      secondaryButtonText: (next[index].props.secondaryButtonText as string) || "See How It Works",
      socialProofText: "Built to convert better",
      trustItems: ["Clear offer", "Visible trust", "Stronger CTA"],
    },
  };

  return next;
}

export function addTestimonials(blocks: Block[]) {
  if (hasBlock(blocks, "testimonials")) return blocks;
  return [
    ...blocks,
    makeBlock("testimonials", {
      eyebrow: "Trusted by real customers",
      title: "Proof that builds confidence fast",
      items: [
        {
          name: "Jordan M.",
          role: "Customer",
          quote: "The new site made the offer clear right away and gave me enough trust to reach out immediately.",
          stars: 5,
        },
        {
          name: "Ashley R.",
          role: "Client",
          quote: "Everything felt cleaner, more credible, and easier to understand than before.",
          stars: 5,
        },
      ],
    }),
  ];
}

export function addFaq(blocks: Block[]) {
  if (hasBlock(blocks, "faq")) return blocks;
  return [
    ...blocks,
    makeBlock("faq", {
      eyebrow: "Questions answered",
      title: "FAQ",
      items: [
        { q: "What happens after I reach out?", a: "You get a clear response, next steps, and a low-friction path forward." },
        { q: "Why should I trust this business?", a: "This page now surfaces proof, clarity, and trust markers much earlier." },
        { q: "How quickly can I get started?", a: "The primary CTA is designed to make taking the next step simple and immediate." },
      ],
    }),
  ];
}

export function addCta(blocks: Block[]) {
  if (hasBlock(blocks, "cta")) return blocks;
  return [
    ...blocks,
    makeBlock("cta", {
      eyebrow: "Ready to take the next step?",
      headline: "Move forward with confidence",
      subheadline: "Use the primary call to action below to get started without friction.",
      buttonText: "Get Started",
      secondaryButtonText: "Ask a Question",
      trustItems: ["Clear next step", "Low friction", "Built to convert"],
    }),
  ];
}

export function addTrust(blocks: Block[]) {
  if (hasBlock(blocks, "trust_badges")) return blocks;
  return [
    ...blocks,
    makeBlock("trust_badges", {
      title: "Why visitors feel safer saying yes",
      badges: [
        { icon: "✅", label: "Clear next steps" },
        { icon: "⭐", label: "Proof and testimonials" },
        { icon: "📍", label: "Local relevance" },
        { icon: "🛡️", label: "Trust-first positioning" },
      ],
    }),
  ];
}

export function applyLocalServiceTemplate(siteName: string) {
  return [
    makeBlock("hero", {
      eyebrow: "Local service lead generation",
      headline: `${siteName} for people who want a trusted local expert`,
      subheadline: "A clearer promise, stronger proof, and a more obvious next step for people ready to reach out.",
      buttonText: "Request a Quote",
      secondaryButtonText: "Call Now",
      socialProofText: "Built for local conversion",
      trustItems: ["Local relevance", "Clear offer", "Visible CTA"],
    }),
    makeBlock("text", {
      content: "## Why this page converts better\n\nThe new structure removes vague filler and replaces it with a clearer promise, stronger proof, and a more direct path to action.",
    }),
    makeBlock("features", {
      eyebrow: "Why choose us",
      title: "What visitors need to know fast",
      columns: 3,
      items: [
        { icon: "⚡", title: "Fast response", body: "Make the speed and next step obvious right away." },
        { icon: "✅", title: "Clear trust", body: "Show proof, confidence, and reassurance earlier." },
        { icon: "📍", title: "Local fit", body: "Anchor the page to the exact market you serve." },
      ],
    }),
    makeBlock("trust_badges", {
      title: "Trust built into the page",
      badges: [
        { icon: "⭐", label: "Real proof" },
        { icon: "🛡️", label: "Lower risk" },
        { icon: "📞", label: "Direct contact" },
        { icon: "📍", label: "Local relevance" },
      ],
    }),
    makeBlock("process", {
      eyebrow: "How it works",
      title: "Simple next steps",
      steps: [
        { icon: "1", title: "Reach out", body: "Use the primary CTA to contact the business." },
        { icon: "2", title: "Get clarity", body: "Receive a clear answer and next-step recommendation." },
        { icon: "3", title: "Move forward", body: "Take action with less doubt and more confidence." },
      ],
    }),
    makeBlock("faq", {
      eyebrow: "Frequently asked",
      title: "Questions before people convert",
      items: [
        { q: "How quickly can I get started?", a: "The page makes the next step direct and easy to take." },
        { q: "Why should I trust this business?", a: "Proof, clarity, and reassurance are placed earlier in the page flow." },
        { q: "What happens after I submit?", a: "Visitors know exactly what comes next, which lowers hesitation." },
      ],
    }),
    makeBlock("cta", {
      eyebrow: "Ready to take the next step?",
      headline: `Let ${siteName} turn more visits into action`,
      subheadline: "This page is designed to reduce doubt and increase response.",
      buttonText: "Request a Quote",
      secondaryButtonText: "Call Now",
      trustItems: ["Built for conversion", "Clear CTA", "Lower friction"],
    }),
    makeBlock("footer", {
      copyright: `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`,
      links: [{ label: "Privacy Policy", url: "#" }, { label: "Terms", url: "#" }],
      showPoweredBy: true,
    }),
  ] satisfies Block[];
}

export function applyBookingTemplate(siteName: string) {
  return [
    makeBlock("hero", {
      eyebrow: "Booking-first template",
      headline: `Book with ${siteName} without the usual friction`,
      subheadline: "A page structure built to make consultation and appointment requests feel easy, credible, and worth taking now.",
      buttonText: "Book Consultation",
      secondaryButtonText: "See Availability",
      socialProofText: "Built for appointments",
      trustItems: ["Clear booking path", "Reduced doubt", "Stronger trust"],
    }),
    makeBlock("features", {
      eyebrow: "Why this works",
      title: "What pushes more visitors to book",
      columns: 3,
      items: [
        { icon: "📅", title: "Easy next step", body: "The page guides visitors straight toward booking." },
        { icon: "💬", title: "Stronger clarity", body: "The offer is framed clearly around the result they want." },
        { icon: "⭐", title: "Visible trust", body: "Proof and reassurance appear before the ask." },
      ],
    }),
    makeBlock("testimonials", {
      eyebrow: "Client confidence",
      title: "Why people feel good about booking",
      items: [
        { name: "Taylor", role: "Client", quote: "The page answered my questions fast and made booking feel easy.", stars: 5 },
        { name: "Morgan", role: "Client", quote: "I knew what to expect before I even clicked the CTA.", stars: 5 },
      ],
    }),
    makeBlock("process", {
      eyebrow: "What happens next",
      title: "From visitor to booked call",
      steps: [
        { icon: "1", title: "Review the offer", body: "The page makes the value and fit clear immediately." },
        { icon: "2", title: "Choose the next step", body: "Booking becomes the most obvious action to take." },
        { icon: "3", title: "Show up prepared", body: "The visitor knows what happens after they submit." },
      ],
    }),
    makeBlock("faq", {
      eyebrow: "Before they book",
      title: "Questions that stop people from booking",
      items: [
        { q: "What is included in the consultation?", a: "The page should answer this directly so the CTA feels safer." },
        { q: "How long does it take?", a: "Set the expectation clearly before the visitor hesitates." },
        { q: "What happens after I submit?", a: "Tell them exactly what comes next to lower friction." },
      ],
    }),
    makeBlock("cta", {
      eyebrow: "Ready to book?",
      headline: `Make the next step with ${siteName}`,
      subheadline: "Clear, confident, and designed to convert more interested visitors into booked conversations.",
      buttonText: "Book Consultation",
      secondaryButtonText: "Ask a Question",
      trustItems: ["Built for bookings", "Clear expectations", "Lower friction"],
    }),
    makeBlock("footer", {
      copyright: `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`,
      links: [{ label: "Privacy Policy", url: "#" }, { label: "Terms", url: "#" }],
      showPoweredBy: true,
    }),
  ] satisfies Block[];
}

export function createServicesPageBlocks(siteName: string) {
  return [
    makeBlock("hero", {
      eyebrow: "Services",
      headline: `What ${siteName} helps with`,
      subheadline: "A simple services page that makes the offer categories and next steps easier to understand.",
      buttonText: "Request a Quote",
      secondaryButtonText: "Contact Us",
      textAlign: "left",
    }),
    makeBlock("features", {
      title: "Core services",
      columns: 3,
      items: [
        { icon: "⚡", title: "Primary Service", body: "Describe the main service offer clearly and directly." },
        { icon: "🎯", title: "Secondary Service", body: "Show another service path without overwhelming the page." },
        { icon: "✅", title: "Support Service", body: "Highlight trust-building or add-on help visitors often need." },
      ],
    }),
    makeBlock("cta", {
      headline: "Need help choosing the right service?",
      subheadline: "Use the CTA below to get clarity on the best next step.",
      buttonText: "Contact Us",
    }),
  ] satisfies Block[];
}

export function createFaqPageBlocks(siteName: string) {
  return [
    makeBlock("hero", {
      eyebrow: "Frequently Asked Questions",
      headline: `Questions people ask before choosing ${siteName}`,
      subheadline: "Use this page to remove hesitation, explain what happens next, and make the offer easier to trust.",
      buttonText: "Contact Us",
      secondaryButtonText: "Get Started",
      textAlign: "left",
    }),
    makeBlock("faq", {
      title: "Common questions",
      items: [
        { q: `What is it like to work with ${siteName}?`, a: "The process is designed to feel clear, low-friction, and easy to say yes to." },
        { q: "How quickly can I get started?", a: "The next step should be visible and simple, with clear expectations after you submit." },
        { q: "Why should I trust this business?", a: "This page should answer that through clarity, proof, and confidence-building messaging." },
      ],
      ctaText: "Still unsure?",
      ctaButtonText: "Contact Us",
    }),
    makeBlock("cta", {
      headline: "Still have a question?",
      subheadline: "Reach out directly and get a clear answer before you move forward.",
      buttonText: "Contact Us",
    }),
  ] satisfies Block[];
}

export function createAboutPageBlocks(siteName: string, niche?: string, location?: string) {
  return [
    makeBlock("hero", {
      eyebrow: "About",
      headline: `Why ${siteName} exists`,
      subheadline: `A trust-first introduction to the team, philosophy, and reason people choose ${siteName}${location ? ` in ${location}` : ""}.`,
      buttonText: "Work With Us",
      secondaryButtonText: "Contact Us",
      textAlign: "left",
    }),
    makeBlock("text", {
      content: `## A clearer story\n\n${siteName} is built to help people feel more confident choosing a ${niche ?? "service"} partner. This page should make the mission, values, and difference easier to trust.`,
    }),
    makeBlock("features", {
      eyebrow: "What people value",
      title: `What makes ${siteName} different`,
      columns: 3,
      items: [
        { icon: "✅", title: "Clear communication", body: "Visitors understand the value and next step faster." },
        { icon: "📍", title: location ? `Built for ${location}` : "Market-aware positioning", body: "The brand feels relevant to the people it serves." },
        { icon: "⭐", title: "Trust-first approach", body: "The page creates confidence before asking for action." },
      ],
    }),
    makeBlock("testimonials", {
      eyebrow: "What clients say",
      title: "Why people feel confident moving forward",
      items: [
        { name: "Client", role: "Customer", quote: `${siteName} felt clearer, more trustworthy, and easier to choose than the alternatives.`, stars: 5 },
        { name: "Customer", role: "Local buyer", quote: "The brand story and next step both felt strong enough to act on.", stars: 5 },
      ],
    }),
    makeBlock("cta", {
      headline: `Ready to see if ${siteName} is the right fit?`,
      subheadline: "Use the next step below to start the conversation.",
      buttonText: "Work With Us",
    }),
  ] satisfies Block[];
}

export function createContactPageBlocks(siteName: string, location?: string) {
  return [
    makeBlock("hero", {
      eyebrow: "Contact",
      headline: `Get in touch with ${siteName}`,
      subheadline: `A focused contact page that makes reaching out feel easy${location ? ` for people in ${location}` : ""}.`,
      buttonText: "Send Message",
      secondaryButtonText: "Call Now",
      textAlign: "left",
    }),
    makeBlock("trust_badges", {
      title: "Why reaching out feels safe",
      badges: [
        { icon: "⚡", label: "Fast response" },
        { icon: "✅", label: "Clear next steps" },
        { icon: "📍", label: location ? `${location} coverage` : "Market-aware service" },
        { icon: "🛡️", label: "Low-friction contact" },
      ],
    }),
    makeBlock("form", {
      eyebrow: "Start here",
      title: "Tell us what you need",
      subtitle: "Use the form below and we will guide you to the right next step.",
      buttonText: "Send Message",
      privacyText: "Your details stay private and are only used to respond to your request.",
      fields: [
        { name: "name", type: "text", placeholder: "Your Name", required: true },
        { name: "email", type: "email", placeholder: "Your Email", required: true },
        { name: "phone", type: "tel", placeholder: "Phone Number" },
        { name: "message", type: "textarea", placeholder: "How can we help?", required: true },
      ],
    }),
  ] satisfies Block[];
}

export function createLandingPageBlocks(siteName: string, niche?: string, location?: string) {
  return [
    makeBlock("hero", {
      eyebrow: "Landing Page",
      headline: `${siteName} for people who want better ${niche ?? "results"}`,
      subheadline: `A focused conversion page built to make the offer, trust, and next step feel obvious${location ? ` in ${location}` : ""}.`,
      buttonText: "Get Started",
      secondaryButtonText: "Learn More",
      socialProofText: "Built to convert",
      trustItems: ["Clear offer", "Visible trust", "Stronger CTA"],
      textAlign: "center",
    }),
    makeBlock("before_after", {
      title: "Why this page converts better",
      beforeLabel: "Generic Page",
      afterLabel: "Focused Landing Page",
      beforeItems: [
        "Weak first-screen promise",
        "Too much friction before the CTA",
        "Trust and proof arrive too late",
      ],
      afterItems: [
        "Clearer offer and stronger positioning",
        "CTA visible much earlier",
        "Trust and reassurance built into the flow",
      ],
    }),
    makeBlock("features", {
      eyebrow: "Built for action",
      title: "What this page is designed to do",
      columns: 3,
      items: [
        { icon: "🎯", title: "Clarify the offer", body: "Make the value easier to understand immediately." },
        { icon: "✅", title: "Build trust", body: "Reduce hesitation with proof and reassurance." },
        { icon: "⚡", title: "Drive action", body: "Make the next step obvious and easy to take." },
      ],
    }),
    makeBlock("cta", {
      headline: `Ready to move forward with ${siteName}?`,
      subheadline: "Use the CTA below to turn attention into action.",
      buttonText: "Get Started",
      secondaryButtonText: "Ask a Question",
    }),
  ] satisfies Block[];
}

export function createAiPageBlocks(input: {
  template: AiPageTemplate;
  siteName: string;
  niche?: string;
  location?: string;
}) {
  switch (input.template) {
    case "about":
      return createAboutPageBlocks(input.siteName, input.niche, input.location);
    case "services":
      return createServicesPageBlocks(input.siteName);
    case "faq":
      return createFaqPageBlocks(input.siteName);
    case "contact":
      return createContactPageBlocks(input.siteName, input.location);
    case "landing":
      return createLandingPageBlocks(input.siteName, input.niche, input.location);
    default:
      return createServicesPageBlocks(input.siteName);
  }
}
