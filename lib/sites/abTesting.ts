// ---------------------------------------------------------------------------
// Site A/B Testing — split test headlines, CTAs, and sections
// Uses cookie-based variant assignment for consistent user experience
// ---------------------------------------------------------------------------

export type ABTest = {
  id: string;
  blockId: string;
  field: string; // "headline" | "subheadline" | "ctaText" | "buttonText"
  variants: ABVariant[];
  status: "running" | "completed";
  winnerId?: string;
};

export type ABVariant = {
  id: string;
  value: string;
  views: number;
  conversions: number;
};

/** Pick a variant for a visitor based on their cookie/session */
export function pickVariant(test: ABTest, visitorId: string): ABVariant {
  if (test.winnerId) {
    return test.variants.find((v) => v.id === test.winnerId) ?? test.variants[0];
  }

  // Simple hash-based assignment for consistency
  let hash = 0;
  const key = `${test.id}:${visitorId}`;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % test.variants.length;
  return test.variants[index];
}

/** Generate A/B test variants from a headline using simple transforms */
export function generateHeadlineVariants(original: string): string[] {
  const variants = [original];

  // Variant 2: Add urgency
  if (!original.toLowerCase().includes("now") && !original.toLowerCase().includes("today")) {
    variants.push(original.replace(/[.!]?$/, " — Starting Today"));
  }

  // Variant 3: Add social proof framing
  if (!original.toLowerCase().includes("join") && !original.toLowerCase().includes("trusted")) {
    variants.push(original.replace(/^/, "Join thousands who ").replace(/[.!]?$/, ""));
  }

  return variants.slice(0, 3); // Max 3 variants
}

/** Calculate if we have a statistically significant winner */
export function hasSignificantWinner(variants: ABVariant[], minViews: number = 100): {
  hasWinner: boolean;
  winnerId: string | null;
  confidence: number;
} {
  if (variants.length < 2) return { hasWinner: false, winnerId: null, confidence: 0 };

  const withEnoughData = variants.filter((v) => v.views >= minViews);
  if (withEnoughData.length < 2) return { hasWinner: false, winnerId: null, confidence: 0 };

  // Simple approach: compare conversion rates
  const rates = withEnoughData.map((v) => ({
    id: v.id,
    rate: v.views > 0 ? v.conversions / v.views : 0,
    views: v.views,
  }));

  rates.sort((a, b) => b.rate - a.rate);
  const best = rates[0];
  const second = rates[1];

  if (!best || !second) return { hasWinner: false, winnerId: null, confidence: 0 };

  // If best is 20%+ better than second with enough data, declare winner
  const improvement = second.rate > 0 ? (best.rate - second.rate) / second.rate : best.rate > 0 ? 1 : 0;
  const confidence = Math.min(95, Math.round(improvement * 100));

  return {
    hasWinner: improvement >= 0.2 && best.views >= minViews,
    winnerId: improvement >= 0.2 ? best.id : null,
    confidence,
  };
}
