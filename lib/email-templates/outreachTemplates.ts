/**
 * Email template system for personalized outreach
 * Templates support variables: {{name}}, {{business}}, {{niche}}, {{city}}, etc.
 */

export interface EmailTemplate {
  id: string;
  name: string;
  category: "cold_outreach" | "followup" | "proposal" | "check_in";
  subject: string;
  body: string;
  variables: string[]; // Required variables for this template
  description: string;
}

/**
 * Replace template variables with actual values
 */
export function renderTemplate(template: string, variables: Record<string, string>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    rendered = rendered.replace(regex, value || "");
  }
  return rendered;
}

/**
 * Pre-built email templates for common scenarios
 */
export const EMAIL_TEMPLATES: EmailTemplate[] = [
  // Cold Outreach Templates
  {
    id: "cold_1",
    name: "Problem-Solution Opener",
    category: "cold_outreach",
    subject: "Quick question about {{business}}",
    body: `Hi {{name}},

I noticed {{business}} is doing well in {{city}} ({{rating}} stars - impressive!), but I had a quick question.

Most {{niche}} businesses we work with struggle with getting consistent leads without expensive ads. We help fix that with a proven system that's generated over $2M for our clients.

Would it make sense to hop on a quick 15-minute call this week to see if we can help {{business}} get more qualified leads?

No pressure - just want to share what's working for other {{niche}} businesses in {{city}}.

Best,
{{sender_name}}`,
    variables: ["name", "business", "city", "rating", "niche", "sender_name"],
    description: "Direct problem-solution approach with social proof",
  },
  {
    id: "cold_2",
    name: "Competitor Comparison",
    category: "cold_outreach",
    subject: "Noticed your competitors are doing this...",
    body: `{{name}},

Just looked at {{business}} and wanted to reach out about something I noticed.

Your top 3 competitors in {{city}} are all using automated lead generation systems. They're pulling in 20-30 qualified leads per month while spending $0 on ads.

Not trying to pressure you, but wanted to make sure you knew this was happening in your market.

Happy to show you what they're doing (takes 10 minutes) - no strings attached.

Interested?

{{sender_name}}`,
    variables: ["name", "business", "city", "sender_name"],
    description: "Creates urgency through competitive pressure",
  },
  {
    id: "cold_3",
    name: "Value-First Audit",
    category: "cold_outreach",
    subject: "Free {{niche}} marketing audit for {{business}}",
    body: `Hi {{name}},

I'm doing free marketing audits for {{niche}} businesses in {{city}} this week, and {{business}} came up on my list.

I'll analyze:
• Your current lead generation (and where you're losing money)
• 3 quick wins you can implement this week
• How to get 20+ qualified leads/month without ads

No cost, no obligation. Just want to help {{niche}} owners like you grow.

Want me to send you the audit? Takes me about 15 minutes to put together.

{{sender_name}}`,
    variables: ["name", "business", "city", "niche", "sender_name"],
    description: "Offers free value upfront to build trust",
  },

  // Follow-up Templates
  {
    id: "followup_1",
    name: "Gentle Check-in",
    category: "followup",
    subject: "Re: {{original_subject}}",
    body: `{{name}},

Following up on my last email about helping {{business}} get more leads.

I know you're busy running the business, so I'll keep this short:

We've helped {{niche}} businesses in {{city}} add $10k-$50k/month in revenue using our system. No ads required.

If you're interested in learning how, just reply with "Yes" and I'll send you a quick video showing exactly how it works.

If not, no worries - I won't bother you again.

{{sender_name}}`,
    variables: ["name", "business", "niche", "city", "original_subject", "sender_name"],
    description: "Polite follow-up with clear next step",
  },
  {
    id: "followup_2",
    name: "Breakup Email",
    category: "followup",
    subject: "Should I close your file?",
    body: `{{name}},

I've reached out a couple times about helping {{business}} with lead generation, but haven't heard back.

I'm going to assume this isn't a priority right now, so I'll close your file.

If I'm wrong and you want to see how we've helped other {{niche}} businesses grow, just reply "interested" and I'll send over some details.

Either way, best of luck with {{business}}!

{{sender_name}}`,
    variables: ["name", "business", "niche", "sender_name"],
    description: "Final attempt that often gets responses",
  },

  // Proposal Templates
  {
    id: "proposal_1",
    name: "Service Proposal",
    category: "proposal",
    subject: "Proposal for {{business}} - {{service}}",
    body: `Hi {{name}},

Great speaking with you earlier! As discussed, here's what we'll deliver for {{business}}:

**What You'll Get:**
• {{deliverable_1}}
• {{deliverable_2}}
• {{deliverable_3}}

**Timeline:** {{timeline}}
**Investment:** ${{price}}

This system has generated over ${{roi}} for our {{niche}} clients in the past 6 months alone.

Ready to move forward? Just reply "Let's do it" and I'll send over the agreement.

Questions? Happy to jump on a quick call.

{{sender_name}}`,
    variables: ["name", "business", "service", "deliverable_1", "deliverable_2", "deliverable_3", "timeline", "price", "roi", "niche", "sender_name"],
    description: "Clear proposal with deliverables and pricing",
  },

  // Check-in Templates
  {
    id: "checkin_1",
    name: "Results Check-in",
    category: "check_in",
    subject: "How's {{project}} going?",
    body: `Hi {{name}},

Just wanted to check in on {{project}} - we're about {{weeks}} weeks in now.

Quick questions:
• Are you seeing the results we discussed?
• Is there anything we should adjust or improve?
• Any questions or concerns?

I want to make sure {{business}} is getting maximum value from our work together.

Let me know!

{{sender_name}}`,
    variables: ["name", "project", "weeks", "business", "sender_name"],
    description: "Proactive client check-in for retention",
  },
];

/**
 * Get template by ID
 */
export function getTemplate(templateId: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find((t) => t.id === templateId);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: EmailTemplate["category"]): EmailTemplate[] {
  return EMAIL_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Extract variables from a template string
 */
export function extractVariables(template: string): string[] {
  const regex = /{{(.*?)}}/g;
  const matches = template.matchAll(regex);
  return Array.from(matches, (m) => m[1]);
}

/**
 * Validate that all required variables are provided
 */
export function validateVariables(
  template: EmailTemplate,
  providedVariables: Record<string, string>
): { valid: boolean; missing: string[] } {
  const missing = template.variables.filter((v) => !providedVariables[v]);
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Generate personalized email from template
 */
export function generateEmail(
  templateId: string,
  variables: Record<string, string>
): { subject: string; body: string } | null {
  const template = getTemplate(templateId);
  if (!template) return null;

  const validation = validateVariables(template, variables);
  if (!validation.valid) {
    console.warn(`Missing variables for template ${templateId}:`, validation.missing);
  }

  return {
    subject: renderTemplate(template.subject, variables),
    body: renderTemplate(template.body, variables),
  };
}
