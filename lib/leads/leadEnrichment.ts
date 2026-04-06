// ---------------------------------------------------------------------------
// Lead Enrichment — enhance lead data from available signals
// Auto-fills missing data from email domain, existing contacts, etc.
// ---------------------------------------------------------------------------

export type EnrichedLead = {
  domain: string | null;
  companyGuess: string | null;
  isBusinessEmail: boolean;
  industry: string | null;
  sizeEstimate: "solo" | "small" | "medium" | "enterprise" | null;
  leadQuality: "high" | "medium" | "low";
};

const PERSONAL_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com",
  "icloud.com", "mail.com", "protonmail.com", "live.com", "msn.com",
  "ymail.com", "gmx.com", "zoho.com", "fastmail.com",
]);

/** Enrich a lead from their email address */
export function enrichFromEmail(email: string): EnrichedLead {
  const domain = email.split("@")[1]?.toLowerCase() ?? null;
  const isBusinessEmail = domain ? !PERSONAL_DOMAINS.has(domain) : false;

  let companyGuess: string | null = null;
  if (isBusinessEmail && domain) {
    companyGuess = domain
      .replace(/\.(com|net|org|io|co|app|ai|dev|agency|consulting|digital|marketing|studio|solutions|services|group|team|pro|tech|cloud|software)$/i, "")
      .replace(/\./g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Industry guess from domain keywords
  let industry: string | null = null;
  if (domain) {
    if (/dental|dentist|ortho/i.test(domain)) industry = "dental";
    else if (/law|legal|attorney/i.test(domain)) industry = "legal";
    else if (/health|medical|clinic|wellness/i.test(domain)) industry = "healthcare";
    else if (/real.?estate|realty|property/i.test(domain)) industry = "real estate";
    else if (/market|agency|digital|creative/i.test(domain)) industry = "marketing";
    else if (/tech|software|dev|code/i.test(domain)) industry = "technology";
    else if (/finance|invest|capital/i.test(domain)) industry = "finance";
    else if (/fitness|gym|train/i.test(domain)) industry = "fitness";
    else if (/beauty|salon|spa/i.test(domain)) industry = "beauty";
    else if (/food|restaurant|chef|cook/i.test(domain)) industry = "food";
    else if (/construct|build|contract/i.test(domain)) industry = "construction";
    else if (/consult|coach|mentor/i.test(domain)) industry = "consulting";
  }

  // Quality assessment
  let leadQuality: EnrichedLead["leadQuality"] = "medium";
  if (isBusinessEmail) leadQuality = "high";
  else if (!domain || PERSONAL_DOMAINS.has(domain)) leadQuality = "low";

  const sizeEstimate: EnrichedLead["sizeEstimate"] = isBusinessEmail ? "small" : "solo";

  return {
    domain,
    companyGuess,
    isBusinessEmail,
    industry,
    sizeEstimate,
    leadQuality,
  };
}

/** Score a lead for priority based on enrichment data */
export function priorityScore(enrichment: EnrichedLead, hasPhone: boolean, hasMessage: boolean): number {
  let score = 0;
  if (enrichment.isBusinessEmail) score += 30;
  if (enrichment.industry) score += 10;
  if (hasPhone) score += 20;
  if (hasMessage) score += 15;
  if (enrichment.leadQuality === "high") score += 15;
  else if (enrichment.leadQuality === "medium") score += 5;
  return Math.min(100, score);
}
