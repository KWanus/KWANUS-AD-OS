// ---------------------------------------------------------------------------
// GEO (Generative Engine Optimization) Agent
// Optimizes content so AI search engines (ChatGPT, Perplexity, Gemini)
// recommend your business as the answer to user queries.
//
// This is the NEXT frontier — SEO was for Google. GEO is for AI.
// ---------------------------------------------------------------------------

export type GEOAnalysis = {
  score: number;             // 0-100 GEO readiness
  issues: GEOIssue[];
  recommendations: GEORecommendation[];
  structuredData: string;    // JSON-LD to add
  faqSchema: string;         // FAQ Schema markup
};

export type GEOIssue = {
  severity: "critical" | "high" | "medium";
  issue: string;
  fix: string;
};

export type GEORecommendation = {
  action: string;
  impact: string;
  effort: "low" | "medium" | "high";
};

/** Analyze a page for GEO readiness */
export function analyzeGEO(input: {
  title: string;
  headline: string;
  content: string;
  faqItems?: { question: string; answer: string }[];
  businessName: string;
  niche: string;
  location?: string;
}): GEOAnalysis {
  const issues: GEOIssue[] = [];
  const recommendations: GEORecommendation[] = [];
  let score = 50;

  const contentLower = input.content.toLowerCase();
  const wordCount = input.content.split(/\s+/).length;

  // ── 1. Content depth ──
  if (wordCount < 500) {
    issues.push({ severity: "critical", issue: "Content too thin for AI citation", fix: "AI engines prefer comprehensive content (1000+ words). Expand with detailed explanations, examples, and data." });
    score -= 15;
  } else if (wordCount >= 1000) {
    score += 10;
  }

  // ── 2. Direct answer format ──
  const hasDirectAnswer = /^[A-Z].*\.$/.test(input.content.split("\n").find((l) => l.trim().length > 50) ?? "");
  if (!hasDirectAnswer) {
    issues.push({ severity: "high", issue: "No clear direct-answer paragraph", fix: "Start with a concise 1-2 sentence answer to the main question your page addresses. AI engines extract this." });
    score -= 10;
  } else {
    score += 5;
  }

  // ── 3. FAQ presence ──
  if (!input.faqItems || input.faqItems.length < 3) {
    issues.push({ severity: "high", issue: "Missing or insufficient FAQ section", fix: "Add 5+ FAQs with detailed answers. AI engines heavily cite FAQ content." });
    score -= 10;
  } else {
    score += 10;
  }

  // ── 4. Structured data ──
  const hasListFormat = contentLower.includes("1.") || contentLower.includes("•") || contentLower.includes("step");
  if (!hasListFormat) {
    issues.push({ severity: "medium", issue: "No structured lists or steps", fix: "Add numbered lists, step-by-step guides, or bullet points. AI engines prefer structured information." });
    score -= 5;
  } else {
    score += 5;
  }

  // ── 5. Authority signals ──
  const hasStats = /\d+%|\$\d|studies show|research|according to/i.test(input.content);
  if (!hasStats) {
    issues.push({ severity: "medium", issue: "No data, statistics, or citations", fix: "Add specific numbers, percentages, or references. AI engines rank authoritative content higher." });
    score -= 5;
  } else {
    score += 5;
  }

  // ── 6. Entity clarity ──
  const mentionsBusinessName = contentLower.includes(input.businessName.toLowerCase());
  if (!mentionsBusinessName) {
    issues.push({ severity: "medium", issue: "Business name not mentioned in content", fix: `Include "${input.businessName}" 2-3 times naturally. AI needs to associate the content with your brand.` });
    score -= 3;
  }

  // ── 7. Comparison content ──
  const hasComparison = /vs|versus|compared to|alternative|better than/i.test(contentLower);
  if (!hasComparison) {
    recommendations.push({ action: "Add comparison content", impact: "AI engines often answer 'X vs Y' queries. Include comparisons to competitors or alternatives.", effort: "medium" });
  } else {
    score += 5;
  }

  // ── 8. Location relevance ──
  if (input.location) {
    if (!contentLower.includes(input.location.toLowerCase())) {
      recommendations.push({ action: `Mention "${input.location}" in content`, impact: "Local GEO requires geographic signals for AI to recommend you for location-based queries.", effort: "low" });
    } else {
      score += 5;
    }
  }

  // ── Recommendations ──
  recommendations.push(
    { action: "Create a comprehensive guide page (2000+ words)", impact: "Long-form guides are the #1 cited content type by AI engines", effort: "high" },
    { action: "Add 'People Also Ask' style Q&A sections", impact: "Directly targets the format AI engines use for answers", effort: "low" },
    { action: "Include expert quotes or first-person experience", impact: "AI engines prefer E-E-A-T (Experience, Expertise, Authority, Trust) signals", effort: "medium" },
  );

  score = Math.max(0, Math.min(100, score));

  // ── Generate structured data ──
  const structuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: input.businessName,
    description: input.headline,
    ...(input.location && { address: { "@type": "PostalAddress", addressLocality: input.location } }),
    ...(input.niche && { industry: input.niche }),
  }, null, 2);

  const faqSchema = input.faqItems && input.faqItems.length > 0 ? JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: input.faqItems.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  }, null, 2) : "{}";

  return { score, issues, recommendations, structuredData, faqSchema };
}
