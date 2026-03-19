import type { BusinessScanResult } from "@/engines/businessScanEngine";
import type { ProductScanResult } from "@/engines/productScanEngine";

export function scorePhaseOne(
  business: BusinessScanResult,
  product: ProductScanResult
): number {
  return Math.round((business.overallScore + product.score) / 2);
}
