/**
 * Ad Template Library
 * Pre-written ad hooks and copy for Facebook, Instagram, Google Ads
 * Similar to email templates but optimized for paid advertising
 */

export interface AdTemplate {
  id: string;
  name: string;
  platform: "facebook" | "instagram" | "google" | "linkedin" | "universal";
  category: "attention" | "benefit" | "urgency" | "social_proof" | "problem_solution";
  hook: string;
  primaryText: string;
  headline: string;
  cta: string;
  variables: string[];
  description: string;
}

export const AD_TEMPLATES: AdTemplate[] = [
  // ═══ ATTENTION-GRABBING ═══
  {
    id: "attention_1",
    name: "Bold Claim Opener",
    platform: "facebook",
    category: "attention",
    hook: "{{niche}} owners: This changes everything.",
    primaryText: "Most {{niche}} businesses are wasting ${{amount}}/month on marketing that doesn't work.\n\nWe've helped {{count}}+ {{niche}} businesses in {{city}} get {{result}} in {{timeframe}} using our proven {{service}} system.\n\nNo guesswork. No wasted ad spend. Just results.",
    headline: "Get {{result}} in {{timeframe}} - Guaranteed",
    cta: "Learn How",
    variables: ["niche", "amount", "count", "city", "result", "timeframe", "service"],
    description: "Bold opener with specific promise - great for cold audiences",
  },
  {
    id: "attention_2",
    name: "Provocative Question",
    platform: "facebook",
    category: "attention",
    hook: "Still struggling to {{pain_point}}?",
    primaryText: "If you're a {{niche}} owner in {{city}} still dealing with {{pain_point}}, you're not alone.\n\nBut here's the truth: your competitors who solved this problem are getting {{result}} while you're stuck.\n\nWe can fix this in {{timeframe}}. Here's how...",
    headline: "From {{pain_point}} to {{result}} in {{timeframe}}",
    cta: "Show Me How",
    variables: ["pain_point", "niche", "city", "result", "timeframe"],
    description: "Question-based hook that identifies the pain point immediately",
  },

  // ═══ BENEFIT-FOCUSED ═══
  {
    id: "benefit_1",
    name: "Clear Value Proposition",
    platform: "universal",
    category: "benefit",
    hook: "{{niche}} owners: {{result}} in {{timeframe}}.",
    primaryText: "You're busy running your {{niche}} business. You don't have time to figure out {{challenge}}.\n\nThat's why we built {{service}} specifically for {{niche}} businesses in {{city}}.\n\n✓ {{benefit_1}}\n✓ {{benefit_2}}\n✓ {{benefit_3}}\n\nNo long contracts. No hidden fees. Just {{result}}.",
    headline: "{{service}} Built for {{niche}} Owners",
    cta: "Get Started",
    variables: ["niche", "result", "timeframe", "challenge", "service", "city", "benefit_1", "benefit_2", "benefit_3"],
    description: "Benefit-driven with 3 clear value props - works for warm audiences",
  },
  {
    id: "benefit_2",
    name: "Before/After Transformation",
    platform: "instagram",
    category: "benefit",
    hook: "From {{before_state}} to {{after_state}}.",
    primaryText: "{{client_type}} in {{city}} went from {{before_state}} to {{after_state}} in just {{timeframe}}.\n\nHow? Our {{service}} system:\n\n→ {{step_1}}\n→ {{step_2}}\n→ {{step_3}}\n\nYour turn. Ready?",
    headline: "See How {{client_type}} Did It",
    cta: "Start Now",
    variables: ["client_type", "city", "before_state", "after_state", "timeframe", "service", "step_1", "step_2", "step_3"],
    description: "Transformation story - great for retargeting engaged audiences",
  },

  // ═══ URGENCY-DRIVEN ═══
  {
    id: "urgency_1",
    name: "Limited Spots Available",
    platform: "facebook",
    category: "urgency",
    hook: "Only {{count}} spots left for {{niche}} owners in {{city}}.",
    primaryText: "We only work with {{max_clients}} {{niche}} businesses at a time to ensure quality results.\n\nRight now we have {{count}} openings for {{month}}.\n\nIf you want {{result}}, this is your chance.\n\nFirst come, first served.",
    headline: "{{count}} Spots Left for {{month}}",
    cta: "Claim Your Spot",
    variables: ["count", "niche", "city", "max_clients", "result", "month"],
    description: "Scarcity-based urgency - creates FOMO for qualified leads",
  },
  {
    id: "urgency_2",
    name: "Seasonal Opportunity",
    platform: "google",
    category: "urgency",
    hook: "{{niche}} owners: {{season}} is your biggest opportunity.",
    primaryText: "{{season}} is when {{niche}} businesses make {{percentage}}% of their annual revenue.\n\nBut if your {{service_type}} isn't ready NOW, you'll miss it.\n\nWe can get you ready in {{timeframe}}. But you need to start today.",
    headline: "Get Ready for {{season}} - {{timeframe}} Setup",
    cta: "Start Today",
    variables: ["niche", "season", "percentage", "service_type", "timeframe"],
    description: "Seasonal urgency - capitalizes on timely opportunities",
  },

  // ═══ SOCIAL PROOF ═══
  {
    id: "social_proof_1",
    name: "Case Study Results",
    platform: "linkedin",
    category: "social_proof",
    hook: "How {{client_name}} got {{result}} in {{timeframe}}.",
    primaryText: "{{client_name}}, a {{niche}} business in {{city}}, was struggling with {{pain_point}}.\n\nAfter implementing our {{service}} system:\n\n📈 {{metric_1}}\n📈 {{metric_2}}\n📈 {{metric_3}}\n\nAll in {{timeframe}}.\n\nYour business could be next.",
    headline: "{{client_name}}'s Success Story",
    cta: "See Full Results",
    variables: ["client_name", "result", "timeframe", "niche", "city", "pain_point", "service", "metric_1", "metric_2", "metric_3"],
    description: "Detailed case study - builds credibility with specific results",
  },
  {
    id: "social_proof_2",
    name: "Customer Count Social Proof",
    platform: "facebook",
    category: "social_proof",
    hook: "Join {{count}}+ {{niche}} owners getting {{result}}.",
    primaryText: "Over {{count}} {{niche}} businesses trust us to {{service_description}}.\n\nWhy? Because we deliver:\n\n✓ {{proof_point_1}}\n✓ {{proof_point_2}}\n✓ {{proof_point_3}}\n\nDon't take our word for it - see what {{client_name}} from {{city}} says:",
    headline: "{{count}}+ {{niche}} Businesses Can't Be Wrong",
    cta: "Join Them",
    variables: ["count", "niche", "result", "service_description", "proof_point_1", "proof_point_2", "proof_point_3", "client_name", "city"],
    description: "Crowd validation - leverages customer count for credibility",
  },

  // ═══ PROBLEM-SOLUTION ═══
  {
    id: "problem_solution_1",
    name: "Common Mistake Callout",
    platform: "google",
    category: "problem_solution",
    hook: "{{niche}} owners: Stop making this {{mistake}}.",
    primaryText: "Most {{niche}} businesses waste money on {{mistake}}.\n\nThe problem? {{why_its_wrong}}.\n\nThe solution? Our {{service}} system:\n\n1. {{solution_step_1}}\n2. {{solution_step_2}}\n3. {{solution_step_3}}\n\nGet {{result}} instead of {{negative_outcome}}.",
    headline: "Fix {{mistake}} in {{timeframe}}",
    cta: "Fix It Now",
    variables: ["niche", "mistake", "why_its_wrong", "service", "solution_step_1", "solution_step_2", "solution_step_3", "result", "negative_outcome", "timeframe"],
    description: "Mistake identification + solution - educates while selling",
  },
  {
    id: "problem_solution_2",
    name: "Pain Point Agitation",
    platform: "facebook",
    category: "problem_solution",
    hook: "Tired of {{pain_point}}? Here's why it keeps happening.",
    primaryText: "{{niche}} owners deal with {{pain_point}} every day.\n\nIt's frustrating. It's expensive. And it's completely preventable.\n\nThe root cause? {{root_cause}}.\n\nOur {{service}} fixes this permanently:\n\n→ {{fix_1}}\n→ {{fix_2}}\n→ {{fix_3}}\n\nNo more {{pain_point}}. Ever.",
    headline: "Eliminate {{pain_point}} in {{timeframe}}",
    cta: "End This Now",
    variables: ["pain_point", "niche", "root_cause", "service", "fix_1", "fix_2", "fix_3", "timeframe"],
    description: "Pain agitation + permanent solution - creates emotional urgency",
  },
];

export const AD_CATEGORIES = [
  { id: "attention", label: "Attention-Grabbing", description: "Bold hooks for cold audiences" },
  { id: "benefit", label: "Benefit-Focused", description: "Clear value propositions" },
  { id: "urgency", label: "Urgency-Driven", description: "FOMO and scarcity tactics" },
  { id: "social_proof", label: "Social Proof", description: "Case studies and testimonials" },
  { id: "problem_solution", label: "Problem-Solution", description: "Pain points and fixes" },
] as const;

export const AD_PLATFORMS = [
  { id: "facebook", label: "Facebook", color: "blue" },
  { id: "instagram", label: "Instagram", color: "pink" },
  { id: "google", label: "Google Ads", color: "yellow" },
  { id: "linkedin", label: "LinkedIn", color: "indigo" },
  { id: "universal", label: "Universal", color: "gray" },
] as const;

/**
 * Render ad template with variables
 */
export function renderAdTemplate(template: string, variables: Record<string, string>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    rendered = rendered.replace(regex, value || `[${key}]`);
  }
  return rendered;
}

/**
 * Extract variables from template
 */
export function extractAdVariables(template: string): string[] {
  const matches = template.match(/{{([^}]+)}}/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map(m => m.replace(/{{|}}/g, ""))));
}

/**
 * Generate complete ad from template
 */
export function generateAd(templateId: string, variables: Record<string, string>) {
  const template = AD_TEMPLATES.find(t => t.id === templateId);
  if (!template) return null;

  return {
    hook: renderAdTemplate(template.hook, variables),
    primaryText: renderAdTemplate(template.primaryText, variables),
    headline: renderAdTemplate(template.headline, variables),
    cta: template.cta,
    platform: template.platform,
    category: template.category,
  };
}
