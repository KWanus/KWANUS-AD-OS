type StarterContext = {
  businessType?: string | null;
  niche?: string | null;
  location?: string | null;
  executionTier?: "core" | "elite";
  draft?: any;
};

const siteNamePlaceholder = "__SITE_NAME__";

export type StarterTemplateId =
  | "starter-local-service"
  | "starter-consultant"
  | "starter-store"
  | "starter-generic"
  | "starter-landing"
  | "starter-blank";

function labelBusinessType(type?: string | null) {
  return type?.replace(/_/g, " ") ?? "business";
}

function serviceCta(niche?: string | null) {
  if (!niche) return "Request Service";
  if (/hvac|plumb|roof|electric|clean|pest|landscap/i.test(niche)) return "Request a Quote";
  if (/law|attorney|legal/i.test(niche)) return "Book a Free Consultation";
  if (/med spa|spa|clinic|dental|ortho|doctor|health/i.test(niche)) return "Book a Consultation";
  if (/coach|consult/i.test(niche)) return "Book a Strategy Call";
  return "Get Started";
}

function localServiceProfile(niche?: string | null, location?: string | null) {
  const nicheLabel = niche || "local service";
  const market = location || "your area";

  if (/law|attorney|legal/i.test(nicheLabel)) {
    return {
      trustTitle: "What legal buyers need before they contact you",
      trustBadges: [
        { icon: "⚖️", label: "Practice-area clarity" },
        { icon: "⭐", label: "Client trust signals" },
        { icon: "📍", label: "Local jurisdiction fit" },
        { icon: "🛡️", label: "Confidential consult path" },
      ],
      featuresTitle: "Built for higher-trust legal lead conversion",
      features: [
        { icon: "📞", title: "Consultation-first CTA", body: "The page leads with a clear consultation path instead of generic contact friction." },
        { icon: "⚖️", title: "Credibility before contact", body: "Practice fit, client reassurance, and authority cues appear before the form ask." },
        { icon: "📍", title: `Relevant to ${market}`, body: "Location and service-area fit help local prospects know you can actually help them." },
      ],
      processTitle: "From search click to booked consultation",
      processSteps: [
        { icon: "1", title: "See the practice fit", body: `Visitors instantly understand that ${siteNamePlaceholder} helps ${market} clients with ${nicheLabel.toLowerCase()} matters.` },
        { icon: "2", title: "Build confidence", body: "Trust signals, professionalism, and clarity reduce the fear of reaching out." },
        { icon: "3", title: "Book the consult", body: "A direct consultation CTA keeps the next step obvious for serious prospects." },
      ],
      testimonialRoleA: market,
      testimonialQuoteA: "The site felt credible right away and made it easy to take the next step with confidence.",
      testimonialRoleB: "Legal Client",
      testimonialQuoteB: "The consultation path was clear, and the trust signals made this feel like the right firm to contact first.",
      faqTitle: "Questions people ask before contacting a law firm",
      faqs: [
        { q: `Do you work with clients in ${market}?`, a: `Yes. The page makes local service fit and jurisdiction relevance obvious for people in ${market}.` },
        { q: "Can I request a consultation now?", a: "Yes. The consultation path stays visible so prospects can move forward quickly." },
        { q: "Why does this page convert better?", a: "It builds trust before asking for contact, which matters more in legal services than a generic landing page." },
      ],
      ctaHeadline: `Turn ${market} legal traffic into qualified consultations`,
      ctaTrust: ["Consultation-first", "Higher-trust framing", "Local fit"],
      eliteStats: [
        { value: "Credible", label: "First impression" },
        { value: "Clear", label: "Practice fit" },
        { value: market, label: "Location trust" },
      ],
      eliteGuarantee: {
        title: "Reduce hesitation before the consultation request",
        body: "Use clearer expectations, stronger professionalism, and lower-friction intake to make the first contact feel safer.",
        badges: ["Trust-first", "Clear intake", "Professional positioning"],
      },
    };
  }

  if (/med spa|spa|clinic|dental|ortho|doctor|health/i.test(nicheLabel)) {
    return {
      trustTitle: "What appointment-driven buyers need before they book",
      trustBadges: [
        { icon: "✨", label: "Results-focused trust" },
        { icon: "⭐", label: "Review-led confidence" },
        { icon: "📍", label: "Local appointment fit" },
        { icon: "🩺", label: "Professional care framing" },
      ],
      featuresTitle: "Built for consultation and booking conversion",
      features: [
        { icon: "📅", title: "Consult-first booking path", body: "The page makes the consultation or booking action obvious above the fold." },
        { icon: "✨", title: "Trust before appearance anxiety", body: "Proof, reassurance, and care language appear before the ask." },
        { icon: "📍", title: `Relevant to ${market}`, body: "Location, offer fit, and the booking path are tuned to the local market you serve." },
      ],
      processTitle: "From discovery to booked appointment",
      processSteps: [
        { icon: "1", title: "See the treatment fit", body: `Visitors instantly understand that ${siteNamePlaceholder} helps ${market} clients with ${nicheLabel.toLowerCase()} services.` },
        { icon: "2", title: "Feel safe booking", body: "Reviews, before/after confidence, and care-focused framing reduce hesitation." },
        { icon: "3", title: "Book the consultation", body: "A clean consultation CTA keeps the next step obvious for ready prospects." },
      ],
      testimonialRoleA: market,
      testimonialQuoteA: "The page made the practice feel trustworthy and the consultation flow felt simple and safe.",
      testimonialRoleB: "Booked Client",
      testimonialQuoteB: "The proof and care language made it much easier to book instead of waiting.",
      faqTitle: "Questions people ask before booking treatment",
      faqs: [
        { q: `Do you serve clients in ${market}?`, a: `Yes. The page is structured to make your local booking fit obvious to people in ${market}.` },
        { q: "Can I book a consultation right away?", a: "Yes. The consultation CTA stays visible so motivated visitors can act quickly." },
        { q: "What helps this page convert better?", a: "It combines trust, care language, and a clearer booking path before visitors second-guess the next step." },
      ],
      ctaHeadline: `Turn ${market} interest into booked consultations`,
      ctaTrust: ["Appointment-ready", "Care-first framing", "Local fit"],
      eliteStats: [
        { value: "Safe", label: "Booking feel" },
        { value: "Visible", label: "Proof placement" },
        { value: market, label: "Local trust" },
      ],
      eliteGuarantee: {
        title: "Reduce booking hesitation before the click",
        body: "Use reassurance, care language, and lower-friction consultation framing so more treatment interest becomes actual appointments.",
        badges: ["Care-first", "Consult clarity", "Lower friction"],
      },
    };
  }

  return {
    trustTitle: "Why local buyers trust this business",
    trustBadges: [
      { icon: "⭐", label: "Review-driven trust" },
      { icon: "📍", label: "Serves your area" },
      { icon: "⚡", label: "Rapid response" },
      { icon: "🛡️", label: "Licensed / insured framing" },
    ],
    featuresTitle: "Built for local lead conversion",
    features: [
      { icon: "📞", title: "Immediate contact path", body: "Phone-first CTA and quote flow for ready-to-book visitors." },
      { icon: "🧰", title: "Trust before price anxiety", body: "Guarantees, credentials, and reassurance show up before visitors leave for another quote." },
      { icon: "🏡", title: `Relevant to ${market}`, body: "Messaging and proof are tuned to the neighborhoods and service area you actually cover." },
    ],
    processTitle: "From search click to booked job",
    processSteps: [
      { icon: "1", title: "See the service fit", body: `Visitors instantly see that ${siteNamePlaceholder} helps ${market} with ${nicheLabel.toLowerCase()} needs.` },
      { icon: "2", title: "Build trust fast", body: "Reviews, trust badges, and response expectations reduce quote-shopping hesitation." },
      { icon: "3", title: "Call or request a quote", body: `The page keeps the '${serviceCta(nicheLabel)}' path visible so high-intent visitors can act immediately.` },
    ],
    testimonialRoleA: market,
    testimonialQuoteA: `The site made ${siteNamePlaceholder} feel legitimate right away and the quote request was easy.`,
    testimonialRoleB: nicheLabel,
    testimonialQuoteB: "The reviews, guarantees, and fast-response promise made it obvious who to contact first.",
    faqTitle: "Questions before they call",
    faqs: [
      { q: `Do you serve ${market}?`, a: `Yes. The page is structured to make your service area obvious to buyers in ${market}.` },
      { q: "Can I call or request a quote right now?", a: `Yes. Use the '${serviceCta(nicheLabel)}' button or call path to take the fastest next step.` },
      { q: "What reduces hesitation here?", a: "Reviews, response-time framing, trust badges, and visible service fit all appear before the ask." },
    ],
    ctaHeadline: `Turn ${market} traffic into booked ${nicheLabel.toLowerCase()} leads`,
    ctaTrust: ["Built for lead gen", "Faster follow-up", "Local fit"],
    eliteStats: [
      { value: "<60s", label: "Response expectation" },
      { value: "5-Star", label: "Trust framing" },
      { value: market, label: "Market specificity" },
    ],
    eliteGuarantee: {
      title: "Remove hesitation before the click",
      body: "Use guarantees, response-time promises, and visible reassurance so buyers feel safer contacting you now.",
      badges: ["Fast response", "Clear next step", "Trust-first positioning"],
    },
  };
}

function localServiceGolden(siteName: string, niche?: string | null, location?: string | null, executionTier: "core" | "elite" = "core") {
  const cta = serviceCta(niche);
  const nicheLabel = niche || "local service";
  const market = location || "your area";
  const profile = localServiceProfile(niche, location);
  const processSteps = profile.processSteps.map((step) => ({
    ...step,
    body: step.body.replaceAll(siteNamePlaceholder, siteName),
  }));
  const testimonialQuoteA = profile.testimonialQuoteA.replaceAll(siteNamePlaceholder, siteName);
  const base = [
    { id: "hero-1", type: "hero", props: { eyebrow: `${nicheLabel} in ${market}`, headline: `${siteName} helps ${market} customers solve ${nicheLabel.toLowerCase()} problems fast`, subheadline: "Lead with fast response, visible reviews, and one clear call-or-quote path so local buyers can act without hesitation.", buttonText: cta, secondaryButtonText: "Call Now", textAlign: "center", socialProofText: `Built for ${market} lead conversion`, trustItems: ["Fast response", "Reviews up front", "Clear next step"] } },
    { id: "trust-1", type: "trust_badges", props: { title: profile.trustTitle, badges: profile.trustBadges } },
    { id: "features-1", type: "features", props: { eyebrow: "What drives more calls", title: profile.featuresTitle, columns: 3, items: profile.features } },
    { id: "process-1", type: "process", props: { eyebrow: "How it works", title: profile.processTitle, steps: processSteps } },
    { id: "testimonials-1", type: "testimonials", props: { eyebrow: "Proof", title: "The kind of trust local buyers need", items: [{ name: "Local Client", role: profile.testimonialRoleA, quote: testimonialQuoteA, stars: 5 }, { name: "Booked Customer", role: profile.testimonialRoleB, quote: profile.testimonialQuoteB, stars: 5 }] } },
    { id: "faq-1", type: "faq", props: { eyebrow: "Objections handled", title: profile.faqTitle, items: profile.faqs } },
    { id: "cta-1", type: "cta", props: { eyebrow: "Ready to get help?", headline: profile.ctaHeadline, subheadline: "Use the stronger conversion path below to turn visits into calls, forms, and booked work.", buttonText: cta, secondaryButtonText: "Call Now", trustItems: profile.ctaTrust } },
    { id: "footer-1", type: "footer", props: { copyright: `© 2026 ${siteName}. All rights reserved.`, links: [{ label: "Privacy Policy", url: "#" }, { label: "Terms", url: "#" }], showPoweredBy: true } },
  ];

  if (executionTier !== "elite") return base;

  return [
    base[0],
    { id: "stats-1", type: "stats", props: { title: "What conversion-first local sites make obvious", items: profile.eliteStats } },
    base[1],
    base[2],
    { id: "process-1", type: "process", props: { eyebrow: "How it works", title: "A no-friction path from visit to booking", steps: [{ icon: "1", title: "See the local proof", body: "Visitors immediately see who you help, where you work, and why they should trust you." }, { icon: "2", title: "Take the fastest next step", body: "Call, quote, or booking CTAs appear before hesitation builds." }, { icon: "3", title: "Move into follow-up", body: "The site is structured to support quick response and higher lead close rate." }] } },
    { id: "guarantee-1", type: "guarantee", props: profile.eliteGuarantee },
    base[3],
    base[4],
    base[5],
    base[6],
  ];
}

function consultantGolden(siteName: string, niche?: string | null, executionTier: "core" | "elite" = "core") {
  const nicheLabel = niche || "consulting";
  const base = [
    { id: "hero-1", type: "hero", props: { eyebrow: nicheLabel, headline: `${siteName} turns expertise into a clearer, higher-converting offer`, subheadline: "Position the transformation, proof, and call-booking path faster so qualified visitors know why they should talk to you.", buttonText: "Book a Strategy Call", secondaryButtonText: "See Client Results", textAlign: "center", socialProofText: "Built for authority-based conversion", trustItems: ["Stronger positioning", "Transformation proof", "Clear booking CTA"] } },
    { id: "before-after-1", type: "before_after", props: { title: "What changes for the client", beforeLabel: "Before", afterLabel: "After", beforeItems: ["Offer feels vague", "Trust builds too slowly", "Calls are inconsistent"], afterItems: ["Clear outcome positioning", "Proof appears early", "More qualified calls booked"] } },
    { id: "testimonials-1", type: "testimonials", props: { eyebrow: "Results", title: "Authority needs proof", items: [{ name: "Client One", role: nicheLabel, quote: `${siteName} made the offer feel specific, credible, and worth booking a call for.`, stars: 5 }, { name: "Client Two", role: "Consulting Client", quote: "The site finally matched the quality of the service being sold.", stars: 5 }] } },
    { id: "process-1", type: "process", props: { eyebrow: "How it works", title: "From visit to booked call", steps: [{ icon: "1", title: "See the positioning", body: "Visitors immediately understand the transformation and fit." }, { icon: "2", title: "Build confidence", body: "The page shows authority, process, and proof before the ask." }, { icon: "3", title: "Book the call", body: "A direct strategy-call CTA moves warm visitors into your pipeline." }] } },
    { id: "cta-1", type: "cta", props: { eyebrow: "Next step", headline: "Turn authority into booked conversations", subheadline: "Use a stronger positioning stack and clearer call path to convert more qualified traffic.", buttonText: "Book a Strategy Call", secondaryButtonText: "View Offer", trustItems: ["Specific offer", "Visible proof", "Clear booking flow"] } },
    { id: "footer-1", type: "footer", props: { copyright: `© 2026 ${siteName}. All rights reserved.`, links: [{ label: "Privacy Policy", url: "#" }, { label: "Terms", url: "#" }], showPoweredBy: true } },
  ];

  if (executionTier !== "elite") return base;

  return [
    base[0],
    { id: "stats-1", type: "stats", props: { title: "What high-ticket buyers need before they book", items: [{ value: "Specific", label: "Outcome framing" }, { value: "Visible", label: "Proof and authority" }, { value: "Low-friction", label: "Call path" }] } },
    base[1],
    base[2],
    { id: "guarantee-1", type: "guarantee", props: { title: "Lower perceived risk before the call", body: "Use explicit expectations, process clarity, and risk-reversal language so better-fit prospects book faster.", badges: ["Clear process", "High-trust offer", "Actionable next step"] } },
    base[3],
    { id: "faq-1", type: "faq", props: { eyebrow: "Objections", title: "Questions serious buyers ask before booking", items: [{ q: "Is this right for me?", a: "The page should quickly make fit, outcomes, and who it serves obvious." }, { q: "Why not keep doing it myself?", a: "Show the cost of delay and the value of an expert-guided path." }, { q: "What happens after I book?", a: "Spell out the call process so the first step feels safer." }] } },
    base[4],
    base[5],
  ];
}

function ecommerceStarter(siteName: string, niche?: string | null, executionTier: "core" | "elite" = "core") {
  const nicheLabel = niche || "products";
  const base = [
    { id: "hero-1", type: "hero", props: { eyebrow: nicheLabel, headline: `${siteName} is ready to sell ${nicheLabel.toLowerCase()} with a cleaner storefront`, subheadline: "Start from a tighter product-first baseline with stronger trust, clearer merchandising, and a sharper conversion path.", buttonText: "Shop Now", secondaryButtonText: "See Featured Products", textAlign: "center", socialProofText: "Built for product conversion", trustItems: ["Stronger product framing", "Trust before checkout", "Cleaner storefront"] } },
    { id: "features-1", type: "features", props: { eyebrow: "What shoppers need before they buy", title: "Merchandising that reduces friction", columns: 3, items: [{ icon: "🛍️", title: "Product discovery first", body: "Featured products and offers are easy to scan above the fold." }, { icon: "🚚", title: "Shipping and return clarity", body: "Delivery, returns, and checkout reassurance appear before shoppers hesitate." }, { icon: "⭐", title: "Proof before purchase", body: "Ratings and trust framing appear early so the buy path feels safer." }] } },
    { id: "products-1", type: "products", props: { title: "Featured Products", columns: 3 } },
    { id: "trust-1", type: "trust_badges", props: { title: "Why shoppers feel safer buying", badges: [{ icon: "🔒", label: "Secure checkout" }, { icon: "⭐", label: "Customer proof" }, { icon: "🚚", label: "Shipping clarity" }, { icon: "↩️", label: "Return confidence" }] } },
    { id: "faq-1", type: "faq", props: { eyebrow: "Remove checkout hesitation", title: "What shoppers usually want answered", items: [{ q: "How fast is shipping?", a: "Use this section to make delivery expectations obvious before the cart step." }, { q: "What if it is not the right fit?", a: "Returns, exchanges, and guarantees should appear before checkout friction builds." }, { q: "Why trust this store?", a: "Bring ratings, proof, and security reassurance into the buy path earlier." }] } },
    { id: "cta-1", type: "cta", props: { eyebrow: "Shop the store", headline: "Turn product interest into more completed checkouts", subheadline: "This storefront starts with better structure, better trust, and clearer product discovery.", buttonText: "Shop Now", secondaryButtonText: "Browse Collection", trustItems: ["Shop-ready", "Trust-first", "Checkout path"] } },
  ];

  if (executionTier !== "elite") return base;

  return [
    base[0],
    { id: "stats-1", type: "stats", props: { title: "What better product pages make obvious", items: [{ value: "Fast", label: "Value recognition" }, { value: "Visible", label: "Trust and policy framing" }, { value: "Easy", label: "Buy path clarity" }] } },
    base[1],
    base[2],
    { id: "testimonials-1", type: "testimonials", props: { eyebrow: "Shopper proof", title: "The kind of reassurance shoppers look for", items: [{ name: "Verified Buyer", role: nicheLabel, quote: "The delivery and return info was obvious, which made buying feel much safer.", stars: 5 }, { name: "Repeat Customer", role: "Online Store", quote: "The store felt trustworthy, easy to browse, and clear about what happened after purchase.", stars: 5 }] } },
    base[3],
    { id: "guarantee-1", type: "guarantee", props: { title: "Give shoppers fewer reasons to bounce", body: "Use return, shipping, and quality reassurance before the final CTA so more product interest turns into purchases.", badges: ["Secure checkout", "Shipping clarity", "Lower risk"] } },
    base[4],
  ];
}

export function inferStarterTemplateId(template: string, context: StarterContext = {}): StarterTemplateId {
  if (template === "blank") return "starter-blank";
  if (template === "landing") return "starter-landing";

  const type = context.businessType ?? "";
  const niche = context.niche ?? "";

  if (template === "store" || /ecommerce|dropship/i.test(type)) {
    return "starter-store";
  }
  if (/local_service|real_estate|financial/i.test(type) || /hvac|plumb|roof|electric|clean|pest|law|dental|med spa|clinic/i.test(niche)) {
    return "starter-local-service";
  }
  if (/consultant_coach|agency|content_creator/i.test(type) || /consult|coach|agency/i.test(niche)) {
    return "starter-consultant";
  }
  return "starter-generic";
}

export function getStarterTemplateNextMoves(templateId?: string | null) {
  switch (templateId) {
    case "starter-local-service":
      return {
        headline: "Next best move: tighten trust and launch lead capture",
        summary: "This starter is built for local lead generation, so the fastest win is getting reviews, local trust proof, and a strong quote/call path fully visible.",
        actions: [
          { label: "Add Service Pages", type: "build_pages" },
          { label: "Improve Trust Proof", type: "fix_trust" },
          { label: "Create Google Campaign", type: "launch_google" },
        ],
      };
    case "starter-consultant":
      return {
        headline: "Next best move: sharpen authority and booking flow",
        summary: "This starter is aimed at consultative selling, so the biggest gains come from case studies, stronger positioning, and a more obvious call-booking path.",
        actions: [
          { label: "Add Proof", type: "fix_trust" },
          { label: "Create Landing Page", type: "add_landing" },
          { label: "Launch Campaign", type: "launch_campaign" },
        ],
      };
    case "starter-store":
      return {
        headline: "Next best move: merchandise the store and prep traffic",
        summary: "This starter is built for product conversion, so the next wins are product depth, shopper trust, and a campaign path that can start sending traffic.",
        actions: [
          { label: "Open Store", type: "open_store" },
          { label: "Improve Trust Proof", type: "fix_trust" },
          { label: "Launch Campaign", type: "launch_campaign" },
        ],
      };
    case "starter-landing":
      return {
        headline: "Next best move: add proof and a stronger follow-up path",
        summary: "This lean landing starter is great for speed, but it usually needs trust and a stronger traffic destination before real spend.",
        actions: [
          { label: "Add Trust Proof", type: "fix_trust" },
          { label: "Create FAQ Page", type: "build_pages" },
          { label: "Launch Campaign", type: "launch_campaign" },
        ],
      };
    case "starter-blank":
      return {
        headline: "Next best move: build the conversion skeleton first",
        summary: "Blank starts give freedom, but the first wins come from adding a hero, trust, and CTA before polishing anything else.",
        actions: [
          { label: "Open Editor", type: "open_editor" },
          { label: "Add Landing Page", type: "add_landing" },
          { label: "Fix Launch Basics", type: "fix_basics" },
        ],
      };
    default:
      return {
        headline: "Next best move: finish the conversion baseline",
        summary: "This starter gives you a flexible foundation, so the fastest gains come from tightening structure, trust, and the next-step CTA.",
        actions: [
          { label: "Build Missing Pages", type: "build_pages" },
          { label: "Fix Launch Basics", type: "fix_basics" },
          { label: "Launch Campaign", type: "launch_campaign" },
        ],
      };
  }
}

export function getStarterBlocksForContext(template: string, siteName: string, context: StarterContext = {}): any[] {
  if (template === "blank") return [];

  const type = context.businessType ?? "";
  const niche = context.niche ?? "";
  const location = context.location ?? "";
  const executionTier = context.executionTier ?? "core";
  const draft = context.draft;

  if (template === "golden") {
    if (/local_service|real_estate|financial/i.test(type) || /hvac|plumb|roof|electric|clean|pest|law|dental|med spa|clinic/i.test(niche)) {
      return localServiceGolden(siteName, niche, location, executionTier);
    }
    if (/consultant_coach|agency|content_creator/i.test(type) || /consult|coach|agency/i.test(niche)) {
      return consultantGolden(siteName, niche, executionTier);
    }
  }

  if (template === "store" || /ecommerce|dropship/i.test(type)) {
    return ecommerceStarter(siteName, niche, executionTier);
  }

  const hero = {
    id: "hero-1",
    type: "hero",
    props: {
      headline: `Welcome to ${siteName}`,
      subheadline: `Built for ${niche || labelBusinessType(type)} conversion${location ? ` in ${location}` : ""}.`,
      buttonText: "Get Started",
      buttonUrl: "#",
      bgColor: "#0c0a08",
      textAlign: "center",
    },
  };

  const features = {
    id: "features-1",
    type: "features",
    props: {
      title: "Why Choose Us",
      columns: 3,
      items: [
        { icon: "⚡", title: "Conversion Ready", body: "Every section is arranged to move visitors forward." },
        { icon: "🎯", title: "Niche Aware", body: `Tailored to ${niche || labelBusinessType(type)} positioning rather than a generic shell.` },
        { icon: "📱", title: "Launch Friendly", body: "Built so you can edit, publish, and share quickly." },
      ],
    },
  };

  const cta = {
    id: "cta-1",
    type: "cta",
    props: {
      headline: "Ready to launch?",
      subheadline: "Use this stronger baseline to turn visits into the next action.",
      buttonText: "Get Started",
      buttonUrl: "#",
    },
  };

  if (template === "landing") return [hero, features, cta];

  if (template === "golden") {
    const h1 = draft?.headline || `A sharper site for ${siteName}`;
    const subh1 = draft?.subheadline || `Position the offer faster, add more trust, and give visitors a clearer next step${location ? ` in ${location}` : ""}.`;
    const base = [
      { id: "hero-1", type: "hero", props: { headline: h1, subheadline: subh1, buttonText: serviceCta(niche), buttonUrl: "#cta", textAlign: "center", bgColor: "#020509" } },
      features,
      { id: "test-1", type: "testimonials", props: { title: "Proof that builds confidence", items: [{ name: "Happy Client", role: niche || labelBusinessType(type), quote: `${siteName} feels clearer, stronger, and easier to trust with this structure.`, stars: 5 }] } },
      { id: "faq-1", type: "faq", props: { title: "Frequently Asked Questions", items: [{ q: "What makes this page better?", a: "It uses clearer messaging, earlier proof, and a stronger call to action." }, { q: "What should visitors do next?", a: `Use the '${serviceCta(niche)}' action to move forward.` }] } },
      { id: "cta-1", type: "cta", props: { headline: "Move visitors toward the next step", subheadline: "This baseline is designed to be finished quickly and launched with confidence.", buttonText: serviceCta(niche), bgColor: "#020509" } },
      { id: "footer-1", type: "footer", props: { copyright: `© 2026 ${siteName}. All rights reserved.`, links: [{ label: "Privacy Policy", url: "#" }, { label: "Terms of Service", url: "#" }], showPoweredBy: true } },
    ];

    if (executionTier !== "elite") return base;
    return [
      base[0],
      { id: "stats-1", type: "stats", props: { title: "Elite execution baseline", items: [{ value: "Clear", label: "Offer framing" }, { value: "Visible", label: "Trust placement" }, { value: "Focused", label: "CTA path" }] } },
      base[1],
      base[2],
      { id: "guarantee-1", type: "guarantee", props: { title: "Reduce hesitation before they act", body: "The elite layer adds reassurance, friction reduction, and stronger expectation-setting before the ask.", badges: ["Trust-first", "Low-friction", "Conversion-led"] } },
      base[3],
      base[4],
      base[5],
    ];
  }

  return [hero, features, cta];
}
