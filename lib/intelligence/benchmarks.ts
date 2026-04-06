// ---------------------------------------------------------------------------
// Performance Benchmarks — compare site metrics against industry standards
// ---------------------------------------------------------------------------

export type Benchmark = {
  metric: string;
  yourValue: number;
  industryAvg: number;
  topPerformer: number;
  status: "above" | "average" | "below";
  suggestion: string;
};

// Industry averages (based on real aggregate data)
const BENCHMARKS = {
  formConversionRate: { avg: 2.5, top: 5.0, unit: "%", label: "Form Conversion Rate" },
  emailOpenRate: { avg: 21.5, top: 35.0, unit: "%", label: "Email Open Rate" },
  emailClickRate: { avg: 3.2, top: 7.0, unit: "%", label: "Email Click Rate" },
  siteConversionRate: { avg: 1.0, top: 3.0, unit: "%", label: "Site → Purchase Rate" },
  leadToCustomerRate: { avg: 5.0, top: 15.0, unit: "%", label: "Lead → Customer Rate" },
  avgRevenuePerVisitor: { avg: 0.5, top: 2.0, unit: "$", label: "Revenue Per Visitor" },
};

export function calculateBenchmarks(input: {
  totalViews: number;
  formSubmissions: number;
  purchases: number;
  revenue: number;
  emailSent: number;
  emailOpens: number;
  emailClicks: number;
  leads: number;
}): Benchmark[] {
  const results: Benchmark[] = [];

  // Form conversion rate
  if (input.totalViews >= 50) {
    const rate = (input.formSubmissions / input.totalViews) * 100;
    results.push(bench("formConversionRate", rate));
  }

  // Email open rate
  if (input.emailSent >= 20) {
    const rate = (input.emailOpens / input.emailSent) * 100;
    results.push(bench("emailOpenRate", rate));
  }

  // Email click rate
  if (input.emailSent >= 20) {
    const rate = (input.emailClicks / input.emailSent) * 100;
    results.push(bench("emailClickRate", rate));
  }

  // Site conversion rate
  if (input.totalViews >= 100) {
    const rate = (input.purchases / input.totalViews) * 100;
    results.push(bench("siteConversionRate", rate));
  }

  // Lead to customer rate
  if (input.leads >= 5) {
    const rate = (input.purchases / input.leads) * 100;
    results.push(bench("leadToCustomerRate", rate));
  }

  // Revenue per visitor
  if (input.totalViews >= 100) {
    const rpv = input.revenue / input.totalViews;
    results.push(bench("avgRevenuePerVisitor", rpv));
  }

  return results;
}

function bench(key: keyof typeof BENCHMARKS, value: number): Benchmark {
  const b = BENCHMARKS[key];
  const status: "above" | "average" | "below" =
    value >= b.top * 0.8 ? "above" :
    value >= b.avg * 0.8 ? "average" :
    "below";

  const suggestions: Record<string, Record<string, string>> = {
    formConversionRate: {
      below: "Your form conversion is low. Try a more specific headline, add social proof near the form, and reduce form fields to just email + name.",
      average: "Your form conversion is on par with industry. Test a stronger CTA ('Get My Free Audit' vs 'Submit') to push higher.",
      above: "Your form conversion is excellent. Focus on driving more traffic to maximize lead volume.",
    },
    emailOpenRate: {
      below: "Low open rate suggests subject lines aren't compelling or emails land in spam. Verify your Resend domain and try shorter, curiosity-driven subjects.",
      average: "Your open rate is healthy. A/B test subject lines to push toward top-performer territory.",
      above: "Excellent open rates. Your audience trusts your emails — capitalize by increasing send frequency.",
    },
    emailClickRate: {
      below: "People open but don't click. Place your CTA higher in the email, make it a button, and make the value proposition clearer.",
      average: "Decent click rate. Test more specific CTAs and add urgency elements.",
      above: "Strong click rate. Your email content is driving action effectively.",
    },
    siteConversionRate: {
      below: "Few visitors convert. Review your offer clarity, add a stronger guarantee, and ensure the payment process is smooth.",
      average: "Solid conversion rate. Optimize with testimonials and urgency elements.",
      above: "Top-tier conversion. Scale your traffic — every visitor is highly valuable.",
    },
    leadToCustomerRate: {
      below: "Leads aren't converting to customers. Your email sequence may need a stronger sales push, or your offer/pricing needs adjustment.",
      average: "Healthy lead-to-customer rate. Focus on nurture sequence quality and follow-up timing.",
      above: "Excellent close rate. Your funnel is well-optimized — focus on lead volume.",
    },
    avgRevenuePerVisitor: {
      below: "Low RPV. Increase your average order value (upsells, bundles) or improve conversion rate.",
      average: "Average RPV. Test higher price points or add post-purchase upsells.",
      above: "High RPV. Your traffic is extremely valuable — invest more in acquisition.",
    },
  };

  return {
    metric: b.label,
    yourValue: Math.round(value * 100) / 100,
    industryAvg: b.avg,
    topPerformer: b.top,
    status,
    suggestion: suggestions[key]?.[status] ?? "",
  };
}
