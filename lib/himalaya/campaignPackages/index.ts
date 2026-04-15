// ---------------------------------------------------------------------------
// Campaign Package Router — picks the right pre-built package per business type
// ---------------------------------------------------------------------------

import type { CampaignPackage } from "../campaignPackageGenerator";
import { getAffiliateCampaignPackage } from "./affiliate";
import { getCoachingCampaignPackage } from "./coaching";
import { getDropshippingCampaignPackage } from "./dropshipping";
import { getAgencyCampaignPackage } from "./agency";
import { getLocalServiceCampaignPackage } from "./localService";

export function getPreBuiltCampaignPackage(input: {
  businessType: string;
  subNiche?: string;
  targetIncome: number;
}): CampaignPackage | null {
  const type = input.businessType.toLowerCase();

  if (/affiliate|commission|clickbank|digistore/.test(type)) {
    return getAffiliateCampaignPackage(input);
  }

  if (/coach|consult|mentor|advisor|teach/.test(type)) {
    return getCoachingCampaignPackage(input);
  }

  if (/dropship|ecommerce|store|shopify|product/.test(type)) {
    return getDropshippingCampaignPackage(input);
  }

  if (/agency|client|marketing|seo|ads|social media/.test(type)) {
    return getAgencyCampaignPackage(input);
  }

  if (/local|plumb|hvac|roof|clean|lawn|electric|paint|mover|repair|dental|chiro/.test(type)) {
    return getLocalServiceCampaignPackage(input);
  }

  // Fallback: use AI-generated package from campaignPackageGenerator
  return null;
}

export { getAffiliateCampaignPackage } from "./affiliate";
export { getCoachingCampaignPackage } from "./coaching";
export { getDropshippingCampaignPackage } from "./dropshipping";
export { getAgencyCampaignPackage } from "./agency";
export { getLocalServiceCampaignPackage } from "./localService";
