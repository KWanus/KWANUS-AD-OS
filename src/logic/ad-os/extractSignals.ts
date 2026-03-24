import type { FetchedPage } from "./fetchPage";

export type ExtractedSignals = {
  productName: string;
  price: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  trustSignals: string[];
  benefits: string[];
  painLanguage: string[];
  offerComponents: string[];
  audienceHints: string[];
};

const PAIN_KEYWORDS = [
  "tired", "struggle", "pain", "problem", "frustrated", "stress", "anxiety",
  "fail", "broken", "slow", "hard", "difficult", "overwhelm", "stuck",
  "waste", "loss", "hate", "fear", "worry", "embarrass", "shame",
];

const BENEFIT_KEYWORDS = [
  "fast", "easy", "simple", "save", "gain", "grow", "boost", "increase",
  "improve", "results", "transform", "achieve", "success", "profit",
  "freedom", "solution", "fix", "relief", "confidence", "powerful",
];

const TRUST_KEYWORDS = [
  "guarantee", "proven", "trusted", "secure", "safe", "certified",
  "award", "reviews", "stars", "customers", "testimonial", "money back",
  "refund", "no risk", "verified", "official", "as seen",
];

const OFFER_KEYWORDS = [
  "free", "bonus", "bundle", "discount", "off", "limited", "exclusive",
  "today only", "expires", "save", "deal", "offer", "included",
];

const AUDIENCE_KEYWORDS: Record<string, string> = {
  "entrepreneur": "entrepreneurs / business owners",
  "business owner": "business owners",
  "men": "men",
  "women": "women",
  "mom": "mothers / parents",
  "dad": "fathers / parents",
  "student": "students",
  "professional": "professionals",
  "gym": "fitness enthusiasts",
  "fitness": "fitness enthusiasts",
  "weight": "people focused on weight/health",
  "sleep": "people with sleep issues",
  "senior": "seniors / older adults",
  "teen": "teenagers",
};

function findMatches(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  return [...new Set(keywords.filter((k) => lower.includes(k)))];
}

function extractPrice(text: string): string {
  const m = text.match(/\$[\d,]+(?:\.\d{2})?/);
  return m ? m[0] : "";
}

function inferAudience(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [keyword, label] of Object.entries(AUDIENCE_KEYWORDS)) {
    if (lower.includes(keyword) && !found.includes(label)) {
      found.push(label);
    }
  }
  return found.slice(0, 3);
}

export function extractSignals(page: FetchedPage): ExtractedSignals {
  const allText = [page.title, page.metaDescription, ...page.headings, page.bodyText].join(" ");

  const headline = page.headings[0] || page.title || "";
  const subheadline = page.headings[1] || page.metaDescription || "";
  const ctaText = page.ctas[0] || "";
  const price = extractPrice(allText);

  // Product name: first heading or title
  const productName = page.title.split("|")[0].split("-")[0].trim().slice(0, 80);

  const trustSignals = findMatches(allText, TRUST_KEYWORDS).slice(0, 5);
  const benefits = findMatches(allText, BENEFIT_KEYWORDS).slice(0, 6);
  const painLanguage = findMatches(allText, PAIN_KEYWORDS).slice(0, 5);
  const offerComponents = findMatches(allText, OFFER_KEYWORDS).slice(0, 5);
  const audienceHints = inferAudience(allText);

  return {
    productName,
    price,
    headline,
    subheadline,
    ctaText,
    trustSignals,
    benefits,
    painLanguage,
    offerComponents,
    audienceHints,
  };
}
