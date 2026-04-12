// ---------------------------------------------------------------------------
// Himalaya Marketplace — users sell their winning funnels to each other
// The network effect engine: more users = more templates = more value
//
// Sellers list: funnels, email sequences, ad hooks, site templates
// Buyers buy: one-click deploy of proven, winning assets
// Himalaya takes 20% of every sale
//
// This creates: passive income for creators, faster deployment for buyers,
// recurring revenue for the platform, and a competitive moat nobody can copy
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";

export type MarketplaceItem = {
  id: string;
  sellerId: string;
  sellerName: string;
  type: "funnel" | "email_sequence" | "ad_pack" | "site_template" | "prompt_pack" | "course_template";
  title: string;
  description: string;
  price: number;
  previewData: Record<string, unknown>; // Sanitized preview
  category: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  salesCount: number;
  revenue: number;
  featured: boolean;
  createdAt: string;
};

export type MarketplacePurchase = {
  itemId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  platformFee: number;      // 20%
  sellerEarnings: number;   // 80%
  deployedAssets?: string[]; // What was created from the purchase
};

/** List a winning asset on the marketplace */
export async function listOnMarketplace(input: {
  userId: string;
  type: MarketplaceItem["type"];
  title: string;
  description: string;
  price: number;
  sourceId: string;          // ID of the campaign/flow/site to export
  category: string;
  tags: string[];
}): Promise<{ ok: boolean; itemId?: string }> {
  try {
    // Get seller name
    const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { name: true, workspaceName: true } });

    // Export the asset data (sanitized — no personal info)
    let previewData: Record<string, unknown> = {};

    if (input.type === "email_sequence") {
      const flow = await prisma.emailFlow.findFirst({ where: { id: input.sourceId, userId: input.userId } });
      if (flow) {
        previewData = {
          name: flow.name,
          trigger: flow.trigger,
          nodeCount: (flow.nodes as unknown[]).length,
          enrolled: flow.enrolled,
          sent: flow.sent,
          openRate: flow.sent > 0 ? Math.round((flow.opens / flow.sent) * 100) : 0,
        };
      }
    }

    if (input.type === "ad_pack") {
      const campaign = await prisma.campaign.findFirst({
        where: { id: input.sourceId, userId: input.userId },
        include: { adVariations: { select: { name: true, type: true, platform: true } } },
      });
      if (campaign) {
        previewData = {
          name: campaign.name,
          variationCount: campaign.adVariations.length,
          platforms: [...new Set(campaign.adVariations.map((v) => v.platform).filter(Boolean))],
        };
      }
    }

    const event = await prisma.himalayaFunnelEvent.create({
      data: {
        userId: input.userId,
        event: "marketplace_listing",
        metadata: JSON.parse(JSON.stringify({
          type: input.type,
          title: input.title,
          description: input.description,
          price: input.price,
          sourceId: input.sourceId,
          category: input.category,
          tags: input.tags,
          sellerName: user?.workspaceName ?? user?.name ?? "Seller",
          previewData,
          rating: 0,
          reviewCount: 0,
          salesCount: 0,
          revenue: 0,
          featured: false,
          status: "active",
        })),
      },
    });

    return { ok: true, itemId: event.id };
  } catch {
    return { ok: false };
  }
}

/** Browse marketplace listings */
export async function browseMarketplace(filters?: {
  type?: string;
  category?: string;
  maxPrice?: number;
  sortBy?: "newest" | "popular" | "rating" | "price_low" | "price_high";
}): Promise<MarketplaceItem[]> {
  const events = await prisma.himalayaFunnelEvent.findMany({
    where: {
      event: "marketplace_listing",
      ...(filters?.type ? { metadata: { path: ["type"], equals: filters.type } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  let items: MarketplaceItem[] = events.map((e) => {
    const meta = e.metadata as Record<string, unknown>;
    return {
      id: e.id,
      sellerId: e.userId ?? "",
      sellerName: (meta.sellerName as string) ?? "Seller",
      type: (meta.type as MarketplaceItem["type"]) ?? "funnel",
      title: (meta.title as string) ?? "",
      description: (meta.description as string) ?? "",
      price: (meta.price as number) ?? 0,
      previewData: (meta.previewData as Record<string, unknown>) ?? {},
      category: (meta.category as string) ?? "general",
      tags: (meta.tags as string[]) ?? [],
      rating: (meta.rating as number) ?? 0,
      reviewCount: (meta.reviewCount as number) ?? 0,
      salesCount: (meta.salesCount as number) ?? 0,
      revenue: (meta.revenue as number) ?? 0,
      featured: (meta.featured as boolean) ?? false,
      createdAt: e.createdAt.toISOString(),
    };
  });

  // Apply filters
  if (filters?.maxPrice) items = items.filter((i) => i.price <= filters.maxPrice!);
  if (filters?.category) items = items.filter((i) => i.category === filters.category);

  // Sort
  if (filters?.sortBy === "popular") items.sort((a, b) => b.salesCount - a.salesCount);
  else if (filters?.sortBy === "rating") items.sort((a, b) => b.rating - a.rating);
  else if (filters?.sortBy === "price_low") items.sort((a, b) => a.price - b.price);
  else if (filters?.sortBy === "price_high") items.sort((a, b) => b.price - a.price);

  return items;
}

/** Purchase a marketplace item and deploy it */
export async function purchaseMarketplaceItem(input: {
  buyerId: string;
  itemId: string;
}): Promise<{ ok: boolean; purchase?: MarketplacePurchase; error?: string }> {
  try {
    const event = await prisma.himalayaFunnelEvent.findUnique({ where: { id: input.itemId } });
    if (!event) return { ok: false, error: "Item not found" };

    const meta = event.metadata as Record<string, unknown>;
    const price = (meta.price as number) ?? 0;
    const platformFee = Math.round(price * 0.20 * 100) / 100;
    const sellerEarnings = price - platformFee;

    // Record the purchase
    await prisma.himalayaFunnelEvent.create({
      data: {
        userId: input.buyerId,
        event: "marketplace_purchase",
        metadata: JSON.parse(JSON.stringify({
          itemId: input.itemId,
          sellerId: event.userId,
          price,
          platformFee,
          sellerEarnings,
          itemType: meta.type,
          itemTitle: meta.title,
        })),
      },
    });

    // Update sales count on the listing
    await prisma.himalayaFunnelEvent.update({
      where: { id: input.itemId },
      data: {
        metadata: {
          ...meta,
          salesCount: ((meta.salesCount as number) ?? 0) + 1,
          revenue: ((meta.revenue as number) ?? 0) + price,
        },
      },
    });

    return {
      ok: true,
      purchase: {
        itemId: input.itemId,
        buyerId: input.buyerId,
        sellerId: event.userId ?? "",
        price,
        platformFee,
        sellerEarnings,
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Purchase failed" };
  }
}
