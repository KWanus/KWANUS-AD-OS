export type ProductScanResult = {
  id: string;
  name: string;
  score: number;
  demandScore: number;
  competitionScore: number;
  reasoning: string;
  source: "phase1-product-scan";
  createdAt: string;
};

export function runProductScan(input: string): ProductScanResult {
  const name = input.trim().slice(0, 60);

  // Extract keywords: words > 2 chars, lowercased, deduped, max 8
  const keywords = Array.from(
    new Set(
      input
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 2)
    )
  ).slice(0, 8);

  const demandScore = Math.min(100, keywords.length * 12);
  const competitionScore = 50;
  const score = Math.min(100, Math.round((demandScore + (100 - competitionScore)) / 2));

  const reasoning = `Based on keyword analysis: ${keywords.join(", ")}. Demand signals detected: ${demandScore}. Competition estimate: moderate.`;

  return {
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    name,
    score,
    demandScore,
    competitionScore,
    reasoning,
    source: "phase1-product-scan",
    createdAt: new Date().toISOString(),
  };
}
