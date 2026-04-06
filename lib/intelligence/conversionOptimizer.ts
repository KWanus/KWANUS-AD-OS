// ---------------------------------------------------------------------------
// Conversion Rate Optimizer — analyzes site performance and suggests fixes
// Based on real metrics: views, form submissions, purchases
// ---------------------------------------------------------------------------

export type OptimizationSuggestion = {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  category: "conversion" | "traffic" | "email" | "trust" | "speed";
  title: string;
  description: string;
  action: string;
  expectedImpact: string;
};

export function analyzeConversionRate(input: {
  totalViews: number;
  formSubmissions: number;
  purchases: number;
  emailEnrolled: number;
  emailSent: number;
  emailOpens: number;
  emailClicks: number;
  hasPaymentLink: boolean;
  hasTracking: boolean;
  sitePublished: boolean;
}): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  const {
    totalViews, formSubmissions, purchases,
    emailEnrolled, emailSent, emailOpens, emailClicks,
    hasPaymentLink, hasTracking, sitePublished,
  } = input;

  // Not published
  if (!sitePublished) {
    suggestions.push({
      id: "publish-site",
      priority: "critical",
      category: "traffic",
      title: "Your site isn't published",
      description: "Nobody can visit your site until you publish it.",
      action: "Go to your site and click Publish",
      expectedImpact: "Required for any traffic or revenue",
    });
  }

  // No tracking
  if (!hasTracking && totalViews > 0) {
    suggestions.push({
      id: "add-tracking",
      priority: "high",
      category: "traffic",
      title: "No tracking pixels configured",
      description: "Without Meta Pixel or Google Analytics, ad platforms can't optimize your ads.",
      action: "Add your pixel IDs in Settings → Ad & Analytics Pixels",
      expectedImpact: "2-3x better ad performance with conversion data",
    });
  }

  // No payment link
  if (!hasPaymentLink && totalViews > 50) {
    suggestions.push({
      id: "add-payment",
      priority: "high",
      category: "conversion",
      title: "No payment option on your site",
      description: "Visitors can't buy anything. You're leaving money on the table.",
      action: "Add pricing to your offer and redeploy — Stripe payment link will be created automatically",
      expectedImpact: "Direct revenue from site visitors",
    });
  }

  // Low form conversion rate
  if (totalViews >= 100 && formSubmissions > 0) {
    const formRate = (formSubmissions / totalViews) * 100;
    if (formRate < 2) {
      suggestions.push({
        id: "improve-form-rate",
        priority: "high",
        category: "conversion",
        title: `Form conversion rate is ${formRate.toFixed(1)}% (below 2%)`,
        description: "Most visitors leave without filling out the form. Your headline or CTA may not be compelling enough.",
        action: "Test a new headline using the AI Generate tab. Focus on a clearer outcome statement.",
        expectedImpact: "Doubling form rate from 1% to 2% doubles your leads",
      });
    }
  }

  // Zero form submissions
  if (totalViews >= 50 && formSubmissions === 0) {
    suggestions.push({
      id: "zero-forms",
      priority: "critical",
      category: "conversion",
      title: "No form submissions yet",
      description: `${totalViews} visitors but zero submissions. Your form may be hidden, broken, or the offer isn't compelling.`,
      action: "Check that your form is visible above the fold. Make the CTA more specific ('Get My Free Audit' > 'Submit').",
      expectedImpact: "Even 1% conversion on 50 views = new leads",
    });
  }

  // Low email open rate
  if (emailSent >= 20) {
    const openRate = (emailOpens / emailSent) * 100;
    if (openRate < 20) {
      suggestions.push({
        id: "improve-open-rate",
        priority: "medium",
        category: "email",
        title: `Email open rate is ${openRate.toFixed(0)}% (below 20%)`,
        description: "Your subject lines may not be compelling enough, or emails are landing in spam.",
        action: "Use the AI Generate tab to create new subject lines. Check your Resend sending domain is verified.",
        expectedImpact: "Every 10% open rate increase = 10% more people seeing your offers",
      });
    }
  }

  // Low email click rate
  if (emailOpens >= 20) {
    const clickRate = (emailClicks / emailOpens) * 100;
    if (clickRate < 5) {
      suggestions.push({
        id: "improve-click-rate",
        priority: "medium",
        category: "email",
        title: `Email click rate is ${clickRate.toFixed(0)}% (below 5%)`,
        description: "People open your emails but don't click. Your CTAs or email content may need work.",
        action: "Make your email CTA more specific and place it earlier in the email body.",
        expectedImpact: "More clicks = more site visits = more conversions",
      });
    }
  }

  // No revenue yet
  if (formSubmissions >= 5 && purchases === 0 && hasPaymentLink) {
    suggestions.push({
      id: "no-revenue",
      priority: "high",
      category: "conversion",
      title: "Leads coming in but zero purchases",
      description: `${formSubmissions} leads but no purchases. Your offer, pricing, or follow-up may need adjustment.`,
      action: "Check your email sequence — is it guiding leads toward the payment link? Test a different price point.",
      expectedImpact: "Converting even 5% of leads = first revenue",
    });
  }

  // Good metrics — celebrate
  if (totalViews >= 100 && formSubmissions >= 5 && purchases >= 1) {
    suggestions.push({
      id: "scaling",
      priority: "low",
      category: "traffic",
      title: "Your funnel is working — time to scale",
      description: `${totalViews} views → ${formSubmissions} leads → ${purchases} sales. The machine works.`,
      action: "Increase ad budget 2x on your winning variation. Generate more content with the AI tab.",
      expectedImpact: "2x budget = ~2x revenue if conversion rate holds",
    });
  }

  return suggestions.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });
}
