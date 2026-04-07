// ---------------------------------------------------------------------------
// White-Label SaaS Engine
// Agencies can resell Himalaya under their own brand.
// Custom domain, logo, colors, and pricing.
// This is the GoHighLevel business model — now in Himalaya.
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";

export type WhiteLabelConfig = {
  enabled: boolean;
  brandName: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  domain?: string;           // Custom domain for white-label
  hideHimalayaBranding: boolean;
  customSupportEmail?: string;
  pricingTiers?: PricingTier[];
};

export type PricingTier = {
  name: string;
  price: number;
  interval: "monthly" | "yearly";
  features: string[];
  limits: {
    sites: number;
    campaigns: number;
    emailFlows: number;
    contacts: number;
    deploysPerMonth: number;
  };
};

export type SubAccount = {
  id: string;
  name: string;
  email: string;
  tier: string;
  createdAt: string;
  active: boolean;
  usage: {
    sites: number;
    campaigns: number;
    contacts: number;
  };
};

/** Get white-label config for a user */
export async function getWhiteLabelConfig(userId: string): Promise<WhiteLabelConfig | null> {
  const event = await prisma.himalayaFunnelEvent.findFirst({
    where: { userId, event: "whitelabel_config" },
    orderBy: { createdAt: "desc" },
  });

  if (!event) return null;
  return event.metadata as unknown as WhiteLabelConfig;
}

/** Save white-label config */
export async function saveWhiteLabelConfig(userId: string, config: WhiteLabelConfig): Promise<void> {
  await prisma.himalayaFunnelEvent.create({
    data: {
      userId,
      event: "whitelabel_config",
      metadata: JSON.parse(JSON.stringify(config)),
    },
  });
}

/** Create a sub-account (client account under the agency) */
export async function createSubAccount(input: {
  agencyUserId: string;
  clientName: string;
  clientEmail: string;
  tier: string;
}): Promise<{ ok: boolean; subAccountId?: string; error?: string }> {
  try {
    const event = await prisma.himalayaFunnelEvent.create({
      data: {
        userId: input.agencyUserId,
        event: "subaccount_created",
        metadata: {
          clientName: input.clientName,
          clientEmail: input.clientEmail,
          tier: input.tier,
          active: true,
          createdAt: new Date().toISOString(),
          usage: { sites: 0, campaigns: 0, contacts: 0 },
        },
      },
    });

    return { ok: true, subAccountId: event.id };
  } catch {
    return { ok: false, error: "Failed to create sub-account" };
  }
}

/** Get all sub-accounts for an agency */
export async function getSubAccounts(agencyUserId: string): Promise<SubAccount[]> {
  const events = await prisma.himalayaFunnelEvent.findMany({
    where: { userId: agencyUserId, event: "subaccount_created" },
    orderBy: { createdAt: "desc" },
  });

  return events.map((e) => {
    const meta = e.metadata as Record<string, unknown>;
    const usage = (meta.usage as Record<string, number>) ?? {};
    return {
      id: e.id,
      name: (meta.clientName as string) ?? "",
      email: (meta.clientEmail as string) ?? "",
      tier: (meta.tier as string) ?? "basic",
      createdAt: e.createdAt.toISOString(),
      active: (meta.active as boolean) ?? true,
      usage: {
        sites: usage.sites ?? 0,
        campaigns: usage.campaigns ?? 0,
        contacts: usage.contacts ?? 0,
      },
    };
  });
}

/** Generate the default pricing tiers for a white-label setup */
export function getDefaultPricingTiers(): PricingTier[] {
  return [
    {
      name: "Starter",
      price: 97,
      interval: "monthly",
      features: ["1 website", "1 campaign", "500 contacts", "Basic email flows", "5 AI generations/month"],
      limits: { sites: 1, campaigns: 1, emailFlows: 2, contacts: 500, deploysPerMonth: 2 },
    },
    {
      name: "Growth",
      price: 197,
      interval: "monthly",
      features: ["3 websites", "5 campaigns", "5,000 contacts", "Unlimited email flows", "50 AI generations/month", "SMS included", "Ad manager"],
      limits: { sites: 3, campaigns: 5, emailFlows: 10, contacts: 5000, deploysPerMonth: 10 },
    },
    {
      name: "Scale",
      price: 497,
      interval: "monthly",
      features: ["Unlimited websites", "Unlimited campaigns", "25,000 contacts", "All features", "White-label for your clients", "Priority support", "Custom domain"],
      limits: { sites: 100, campaigns: 100, emailFlows: 100, contacts: 25000, deploysPerMonth: 100 },
    },
  ];
}
