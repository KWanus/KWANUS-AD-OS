// Phase 1 scoring — basic combined score from business + product scan engines.
// For the full configurable scoring system, see rules/truthEngine.ts (Phase 2).

import type { BusinessScanResult } from "@/engines/businessScanEngine";
import type { ProductScanResult } from "@/engines/productScanEngine";

export function scorePhaseOne(
  business: BusinessScanResult,
  product: ProductScanResult
): number {
  return Math.round((business.overallScore + product.score) / 2);
}

export function scoreBusinessOnly(business: BusinessScanResult): number {
  return business.overallScore;
}

export function scoreProductOnly(product: ProductScanResult): number {
  return product.score;
}

export function getPhaseOneVerdict(score: number): "Pursue" | "Consider" | "Reject" {
  if (score >= 70) return "Pursue";
  if (score >= 45) return "Consider";
  return "Reject";
}
