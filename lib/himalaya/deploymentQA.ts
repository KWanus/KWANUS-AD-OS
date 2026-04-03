// ---------------------------------------------------------------------------
// Deployment QA — validates every deployed site against conversion basics
// ---------------------------------------------------------------------------

export type QACheckResult = {
  id: string;
  label: string;
  category: "conversion" | "content" | "trust" | "technical";
  status: "pass" | "warn" | "fail";
  detail: string;
};

export type DeploymentQAReport = {
  siteId: string;
  siteName: string;
  score: number; // 0-100
  checks: QACheckResult[];
  passCount: number;
  warnCount: number;
  failCount: number;
  summary: string;
};

type Block = {
  type: string;
  data: Record<string, unknown>;
};

export function runDeploymentQA(
  siteName: string,
  siteId: string,
  blocks: Block[],
): DeploymentQAReport {
  const checks: QACheckResult[] = [];

  const heroBlock = blocks.find(b => b.type === "hero");
  const trustBlock = blocks.find(b => b.type === "trust");
  const ctaBlock = blocks.find(b => b.type === "cta");
  const formBlock = blocks.find(b => b.type === "form");
  const textBlocks = blocks.filter(b => b.type === "text");
  const featuresBlock = blocks.find(b => b.type === "features");

  // ── CONVERSION CHECKS ─────────────────────────────────────────

  // Headline exists and is strong
  const headline = (heroBlock?.data?.headline as string) ?? "";
  checks.push({
    id: "headline",
    label: "Headline present",
    category: "conversion",
    status: headline.length > 10 ? "pass" : headline.length > 0 ? "warn" : "fail",
    detail: headline.length > 10 ? `"${headline.slice(0, 60)}..."` : headline.length > 0 ? "Headline is too short" : "No headline found",
  });

  // CTA above the fold (hero has CTA)
  const heroCta = (heroBlock?.data?.ctaText as string) ?? "";
  checks.push({
    id: "hero_cta",
    label: "CTA above the fold",
    category: "conversion",
    status: heroCta.length > 0 ? "pass" : "fail",
    detail: heroCta ? `CTA: "${heroCta}"` : "No CTA in hero section",
  });

  // Urgency/scarcity element
  checks.push({
    id: "urgency",
    label: "Urgency element present",
    category: "conversion",
    status: ctaBlock ? "pass" : "warn",
    detail: ctaBlock ? "Urgency CTA section found" : "No urgency section — consider adding one",
  });

  // Contact form exists
  checks.push({
    id: "form",
    label: "Contact form present",
    category: "conversion",
    status: formBlock ? "pass" : "fail",
    detail: formBlock ? "Contact form found" : "No contact form — visitors can't convert",
  });

  // ── CONTENT CHECKS ────────────────────────────────────────────

  // ICP / audience section
  const icpBlock = textBlocks.find(b => ((b.data?.headline as string) ?? "").toLowerCase().includes("who"));
  checks.push({
    id: "icp",
    label: "Target audience section",
    category: "content",
    status: icpBlock ? "pass" : "warn",
    detail: icpBlock ? "ICP section found" : "No 'Who This Is For' section — visitors may not self-identify",
  });

  // Offer clarity
  const offerBlock = textBlocks.find(b => ((b.data?.headline as string) ?? "").toLowerCase().includes("get") || ((b.data?.headline as string) ?? "").toLowerCase().includes("offer"));
  checks.push({
    id: "offer",
    label: "Offer/deliverable visible",
    category: "content",
    status: offerBlock ? "pass" : "warn",
    detail: offerBlock ? "Offer section found" : "No clear offer section — what does the visitor get?",
  });

  // Pricing visible
  const allText = blocks.map(b => JSON.stringify(b.data)).join(" ").toLowerCase();
  const hasPricing = allText.includes("$") || allText.includes("price") || allText.includes("invest") || allText.includes("/mo") || allText.includes("per month");
  checks.push({
    id: "pricing",
    label: "Pricing visible",
    category: "content",
    status: hasPricing ? "pass" : "warn",
    detail: hasPricing ? "Pricing information found" : "No pricing visible — may reduce conversion for price-sensitive visitors",
  });

  // Features section
  checks.push({
    id: "features",
    label: "Features/benefits section",
    category: "content",
    status: featuresBlock ? "pass" : "warn",
    detail: featuresBlock ? "Features section found" : "No features/benefits section",
  });

  // ── TRUST CHECKS ──────────────────────────────────────────────

  // Trust bar
  const trustItems = (trustBlock?.data?.items as string[]) ?? [];
  checks.push({
    id: "trust",
    label: "Trust signals present",
    category: "trust",
    status: trustItems.length >= 2 ? "pass" : trustItems.length > 0 ? "warn" : "fail",
    detail: trustItems.length >= 2 ? `${trustItems.length} trust elements` : trustItems.length > 0 ? "Only 1 trust element — add more" : "No trust signals — critical for conversion",
  });

  // Guarantee
  const guaranteeBlock = textBlocks.find(b => ((b.data?.headline as string) ?? "").toLowerCase().includes("guarantee"));
  checks.push({
    id: "guarantee",
    label: "Guarantee present",
    category: "trust",
    status: guaranteeBlock ? "pass" : "warn",
    detail: guaranteeBlock ? "Guarantee section found" : "No guarantee — reduces risk-reversal",
  });

  // ── TECHNICAL CHECKS ──────────────────────────────────────────

  // No blank sections
  const blankBlocks = blocks.filter(b => {
    const data = b.data;
    if (!data) return true;
    const values = Object.values(data).filter(v => typeof v === "string");
    return values.every(v => !(v as string).trim());
  });
  checks.push({
    id: "no_blanks",
    label: "No blank sections",
    category: "technical",
    status: blankBlocks.length === 0 ? "pass" : "fail",
    detail: blankBlocks.length === 0 ? "All sections have content" : `${blankBlocks.length} blank section(s) found`,
  });

  // Minimum section count
  checks.push({
    id: "section_count",
    label: "Sufficient page sections",
    category: "technical",
    status: blocks.length >= 5 ? "pass" : blocks.length >= 3 ? "warn" : "fail",
    detail: `${blocks.length} sections — ${blocks.length >= 5 ? "good depth" : "consider adding more content"}`,
  });

  // No placeholder text
  const hasPlaceholder = allText.includes("lorem ipsum") || allText.includes("placeholder") || allText.includes("coming soon") || allText.includes("tbd");
  checks.push({
    id: "no_placeholder",
    label: "No placeholder text",
    category: "technical",
    status: hasPlaceholder ? "fail" : "pass",
    detail: hasPlaceholder ? "Placeholder text detected — replace before publishing" : "No placeholder text found",
  });

  // ── SCORE ─────────────────────────────────────────────────────

  const passCount = checks.filter(c => c.status === "pass").length;
  const warnCount = checks.filter(c => c.status === "warn").length;
  const failCount = checks.filter(c => c.status === "fail").length;
  const score = Math.round((passCount / checks.length) * 100);

  const summary = failCount > 0
    ? `${failCount} critical issue${failCount > 1 ? "s" : ""} found — fix before publishing`
    : warnCount > 0
      ? `Ready with ${warnCount} suggestion${warnCount > 1 ? "s" : ""} for improvement`
      : "All checks passed — ready to publish";

  return { siteId, siteName, score, checks, passCount, warnCount, failCount, summary };
}
