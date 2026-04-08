// ---------------------------------------------------------------------------
// Agency Path — COMPLETE automated pipeline for marketing agencies
// From "I run an agency" → service packages → client workspace →
// proposal system → white-label → client management → scale
//
// Different: manages MULTIPLE client businesses, white-label,
// client reporting, team collaboration, proposal automation
// ---------------------------------------------------------------------------

export type AgencyServicePackage = {
  name: string;
  tier: "basic" | "professional" | "enterprise";
  monthlyPrice: number;
  setupFee: number;
  services: string[];
  deliverables: string[];
  reportingFrequency: "weekly" | "biweekly" | "monthly";
  clientLimit: number;
};

export type AgencyConfig = {
  agencyName: string;
  niche: string;          // Industry they serve
  services: string[];      // What they offer
  targetClients: string;
  packages: AgencyServicePackage[];
};

/** Generate agency service packages */
export function generateAgencyPackages(niche: string, services: string[]): AgencyServicePackage[] {
  const serviceStr = services.join(", ");
  return [
    {
      name: "Starter",
      tier: "basic",
      monthlyPrice: 997,
      setupFee: 500,
      services: services.slice(0, 3),
      deliverables: [
        `Monthly ${niche} strategy session`,
        "Social media management (3x/week posting)",
        "Monthly performance report",
        "Email support",
      ],
      reportingFrequency: "monthly",
      clientLimit: 10,
    },
    {
      name: "Growth",
      tier: "professional",
      monthlyPrice: 2497,
      setupFee: 1000,
      services: services,
      deliverables: [
        `Weekly ${niche} strategy calls`,
        `Full ${serviceStr} management`,
        "Ad campaign management (Meta + Google)",
        "Email marketing setup and management",
        "Landing page creation and optimization",
        "Bi-weekly performance reports",
        "Slack channel for async communication",
      ],
      reportingFrequency: "biweekly",
      clientLimit: 20,
    },
    {
      name: "Enterprise",
      tier: "enterprise",
      monthlyPrice: 5000,
      setupFee: 2500,
      services: [...services, "White-label dashboard", "Custom reporting", "Priority support"],
      deliverables: [
        "Everything in Growth",
        `Custom ${niche} strategy + execution`,
        "Dedicated account manager",
        "White-label client portal",
        "Custom analytics dashboard",
        "Weekly strategy + execution calls",
        "Revenue-share aligned incentives",
      ],
      reportingFrequency: "weekly",
      clientLimit: 50,
    },
  ];
}

/** Generate agency website blocks */
export function generateAgencySiteBlocks(config: AgencyConfig): object[] {
  return [
    { type: "hero", data: {
      headline: `The ${config.niche} Growth Agency`,
      subheadline: `${config.agencyName} helps ${config.targetClients} grow revenue, acquire customers, and build sustainable businesses. We handle ${config.services.slice(0, 3).join(", ")} — you focus on delivery.`,
      ctaText: "Get a Free Audit",
      ctaUrl: "#audit",
    }},
    { type: "stats", data: { stats: [
      { number: "50+", label: "Clients Served" },
      { number: "3x", label: "Avg Revenue Growth" },
      { number: "98%", label: "Client Retention" },
      { number: "24h", label: "Response Time" },
    ]}},
    { type: "features", data: {
      eyebrow: "What We Do",
      title: "Services",
      items: config.services.map((s) => ({
        title: s,
        description: `Expert ${s.toLowerCase()} management tailored for ${config.niche} businesses.`,
      })),
    }},
    { type: "pricing", data: {
      eyebrow: "Investment",
      title: "Growth Plans",
      tiers: config.packages.map((pkg) => ({
        label: pkg.name,
        price: `$${pkg.monthlyPrice.toLocaleString()}`,
        period: "/mo",
        description: `${pkg.reportingFrequency} reporting. Setup: $${pkg.setupFee}.`,
        features: pkg.deliverables,
        buttonText: pkg.tier === "enterprise" ? "Schedule a Call" : "Get Started",
        highlight: pkg.tier === "professional",
        badge: pkg.tier === "professional" ? "Most Popular" : undefined,
      })),
    }},
    { type: "process", data: {
      eyebrow: "How It Works",
      title: "Onboarding Process",
      steps: [
        { icon: "1", title: "Free Audit", body: "We analyze your current marketing and identify the top 3 revenue opportunities." },
        { icon: "2", title: "Custom Strategy", body: "We build a 90-day growth plan tailored to your business, audience, and budget." },
        { icon: "3", title: "We Execute", body: "Our team implements everything while you focus on serving your customers." },
      ],
    }},
    { type: "testimonials", data: {
      eyebrow: "Results",
      title: "Client Success Stories",
      items: [
        { name: "[Client Name]", role: config.targetClients, quote: `${config.agencyName} transformed our marketing. Revenue up 3x in 90 days.`, stars: 5, result: "3x Revenue", verified: true },
        { name: "[Client Name]", role: config.targetClients, quote: "Finally an agency that actually delivers. Best investment we've made.", stars: 5, result: "ROI Positive Month 1", verified: true },
      ],
    }},
    { type: "form", data: {
      headline: "Get Your Free Audit",
      subtitle: `Find out where your ${config.niche} business is leaving money on the table.`,
      fields: [
        { name: "name", type: "text", placeholder: "Your Name", required: true },
        { name: "email", type: "email", placeholder: "Email Address", required: true },
        { name: "phone", type: "tel", placeholder: "Phone Number" },
        { name: "message", type: "textarea", placeholder: `Tell us about your ${config.niche} business...` },
      ],
      buttonText: "Request Free Audit",
      id: "audit",
    }},
  ];
}

/** Generate agency proposal template */
export function generateAgencyProposalTemplate(config: AgencyConfig, clientName: string): string {
  const pkg = config.packages[1]; // Default to middle tier
  return `# Growth Proposal for ${clientName}

Prepared by ${config.agencyName}

## Executive Summary
After analyzing ${clientName}'s current ${config.niche} presence, we've identified 3 key opportunities to accelerate growth. This proposal outlines our recommended approach.

## The Opportunity
${config.targetClients} in ${config.niche} are leaving significant revenue on the table due to:
1. Underoptimized conversion funnels
2. Inconsistent customer acquisition
3. Missed retention and upsell opportunities

## Our Solution: ${pkg?.name ?? "Growth"} Plan

### What We'll Do
${pkg?.deliverables.map((d) => `- ${d}`).join("\n") ?? "Full service marketing management"}

### Timeline
- **Week 1-2:** Audit + strategy
- **Week 3-4:** Implementation
- **Month 2-3:** Optimization + scaling

### Investment
${pkg ? `$${pkg.monthlyPrice}/month + $${pkg.setupFee} setup fee` : "Custom pricing"}

## Guarantee
If we don't deliver measurable results within 90 days, we'll work for free until we do.

## Next Steps
1. Reply to approve this proposal
2. We schedule a kickoff call
3. You share access to your accounts
4. We start building within 48 hours

---
*${config.agencyName} — ${config.services.join(" · ")}*`;
}
