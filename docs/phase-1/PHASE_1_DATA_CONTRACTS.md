# PHASE 1 DATA CONTRACTS

## BusinessScanInput
```ts
export type BusinessScanInput = {
  url: string;
};
```

## BusinessScanResult
```ts
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
```

## ProductScanResult
```ts
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
```

## ScanApiResponse
```ts
export type ScanApiResponse = {
  success: boolean;
  mode: "business" | "product";
  data: BusinessScanResult | ProductScanResult[];
  error?: string;
};
```

## Rule
All responses must conform to these shapes.
