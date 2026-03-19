export type BusinessScanResult = {
  id: string;
  url: string;
  overallScore: number;
  issues: string[];
  strengths: string[];
  suggestions: string[];
  source: "phase1-business-scan";
  createdAt: string;
};

export function runBusinessScan(urlInput: string): BusinessScanResult {
  const raw = urlInput.trim();
  const normalizedUrl = raw.startsWith("http") ? raw : `https://${raw}`;
  const parsed = new URL(normalizedUrl);

  const issues: string[] = [];
  const strengths: string[] = [];
  const suggestions: string[] = [];

  // Check HTTPS
  const usesHttps = parsed.protocol === "https:";
  if (!usesHttps) {
    issues.push("Site does not use HTTPS — this affects trust and SEO ranking.");
  } else {
    strengths.push("Site uses HTTPS — secure connection established.");
  }

  // Check path depth
  const pathDepth = parsed.pathname.split("/").filter(Boolean).length;
  if (pathDepth > 2) {
    suggestions.push("URL path is deeply nested (depth > 2). Consider simplifying URL structure for better crawlability.");
  }

  // Check hostname length
  const hostnameLength = parsed.hostname.length;
  if (hostnameLength > 20) {
    suggestions.push("Domain name is long (> 20 characters). A shorter domain is easier to remember and type.");
  }

  // Always ensure at least 1 suggestion
  if (suggestions.length === 0) {
    suggestions.push("Consider adding structured data (schema.org) to improve search engine result appearance.");
  }

  // Score calculation
  let score = 50;
  if (usesHttps) score += 20;
  if (pathDepth <= 2) score += 15;
  if (hostnameLength <= 20) score += 15;
  score = Math.min(100, score);

  return {
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    url: normalizedUrl,
    overallScore: score,
    issues,
    strengths,
    suggestions,
    source: "phase1-business-scan",
    createdAt: new Date().toISOString(),
  };
}
