import { runBusinessScan, type BusinessScanResult } from "@/engines/businessScanEngine";
import { runProductScan, type ProductScanResult } from "@/engines/productScanEngine";

export type ScanApiResponse = {
  success: boolean;
  mode: "business" | "product";
  data: BusinessScanResult | ProductScanResult;
  error?: string;
};

export async function executeBusinessScan(url: string): Promise<BusinessScanResult> {
  return runBusinessScan(url);
}

export async function executeProductScan(input: string): Promise<ProductScanResult> {
  return runProductScan(input);
}
