import { prisma } from "@/lib/prisma";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  originalPrice: string | null;
  imageUrl: string | null;
  productUrl: string;
  affiliateUrl: string | null;
  category: string | null;
  platform: string;
  status: string;
  createdAt: Date;
  orderCount?: number;
}

interface PurchaseProfile {
  favoriteCategories: { category: string; count: number }[];
  averageOrderValue: number;
  priceSensitivity: "low" | "medium" | "high";
  purchaseFrequency: { totalOrders: number; avgDaysBetween: number | null };
  productsPurchased: ProductData[];
}

type BlockStyle = "grid" | "list" | "hero" | "carousel";
type SortOption =
  | "best_selling"
  | "price_low"
  | "price_high"
  | "newest"
  | "trending";

interface FeedOptions {
  sort?: SortOption;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  limit?: number;
  offset?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parsePrice(p: string | null | undefined): number {
  if (!p) return 0;
  const n = parseFloat(p.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function productLink(p: ProductData): string {
  return p.affiliateUrl || p.productUrl;
}

/** Get all siteIds owned by a user */
async function userSiteIds(userId: string): Promise<string[]> {
  const sites = await prisma.site.findMany({
    where: { userId },
    select: { id: true },
  });
  return sites.map((s) => s.id);
}

// ─── 1. Product Catalog Sync ─────────────────────────────────────────────────

/** Refresh / fetch all active products for a user */
export async function syncProducts(userId: string): Promise<ProductData[]> {
  const products = await prisma.product.findMany({
    where: { userId, status: "active" },
    orderBy: { createdAt: "desc" },
  });
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    originalPrice: p.originalPrice,
    imageUrl: p.imageUrl,
    productUrl: p.productUrl,
    affiliateUrl: p.affiliateUrl,
    category: p.category,
    platform: p.platform,
    status: p.status,
    createdAt: p.createdAt,
  }));
}

/** Filter products by category */
export async function getProductsByCategory(
  userId: string,
  category: string
): Promise<ProductData[]> {
  const products = await prisma.product.findMany({
    where: { userId, category, status: "active" },
    orderBy: { createdAt: "desc" },
  });
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    originalPrice: p.originalPrice,
    imageUrl: p.imageUrl,
    productUrl: p.productUrl,
    affiliateUrl: p.affiliateUrl,
    category: p.category,
    platform: p.platform,
    status: p.status,
    createdAt: p.createdAt,
  }));
}

/** Top products by completed order count */
export async function getBestSellers(
  userId: string,
  limit = 10
): Promise<ProductData[]> {
  const siteIds = await userSiteIds(userId);
  if (siteIds.length === 0) return [];

  const orders = await prisma.siteOrder.groupBy({
    by: ["productId"],
    where: { siteId: { in: siteIds }, status: "completed" },
    _count: { productId: true },
    orderBy: { _count: { productId: "desc" } },
    take: limit,
  });

  if (orders.length === 0) return [];

  const productIds = orders.map((o) => o.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, userId, status: "active" },
  });

  const countMap = new Map(
    orders.map((o) => [o.productId, o._count.productId])
  );

  return products
    .map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      imageUrl: p.imageUrl,
      productUrl: p.productUrl,
      affiliateUrl: p.affiliateUrl,
      category: p.category,
      platform: p.platform,
      status: p.status,
      createdAt: p.createdAt,
      orderCount: countMap.get(p.id) ?? 0,
    }))
    .sort((a, b) => (b.orderCount ?? 0) - (a.orderCount ?? 0));
}

/** Products added in the last 30 days */
export async function getNewArrivals(
  userId: string,
  limit = 10
): Promise<ProductData[]> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const products = await prisma.product.findMany({
    where: { userId, status: "active", createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    originalPrice: p.originalPrice,
    imageUrl: p.imageUrl,
    productUrl: p.productUrl,
    affiliateUrl: p.affiliateUrl,
    category: p.category,
    platform: p.platform,
    status: p.status,
    createdAt: p.createdAt,
  }));
}

/** Products whose order velocity is increasing (recent 7d vs prior 7d) */
export async function getTrendingProducts(
  userId: string,
  limit = 10
): Promise<ProductData[]> {
  const siteIds = await userSiteIds(userId);
  if (siteIds.length === 0) return [];

  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 86400000);
  const d14 = new Date(now.getTime() - 14 * 86400000);

  const [recent, prior] = await Promise.all([
    prisma.siteOrder.groupBy({
      by: ["productId"],
      where: {
        siteId: { in: siteIds },
        status: "completed",
        createdAt: { gte: d7 },
      },
      _count: { productId: true },
    }),
    prisma.siteOrder.groupBy({
      by: ["productId"],
      where: {
        siteId: { in: siteIds },
        status: "completed",
        createdAt: { gte: d14, lt: d7 },
      },
      _count: { productId: true },
    }),
  ]);

  const recentMap = new Map(
    recent.map((r) => [r.productId, r._count.productId])
  );
  const priorMap = new Map(
    prior.map((r) => [r.productId, r._count.productId])
  );

  // Calculate velocity increase: recent count - prior count, only keep positive
  const allIds = new Set([...recentMap.keys(), ...priorMap.keys()]);
  const scored: { id: string; delta: number }[] = [];
  for (const id of allIds) {
    const r = recentMap.get(id) ?? 0;
    const p = priorMap.get(id) ?? 0;
    const delta = r - p;
    if (delta > 0 || (delta === 0 && r > 0)) {
      scored.push({ id, delta: delta === 0 ? r : delta });
    }
  }
  scored.sort((a, b) => b.delta - a.delta);
  const topIds = scored.slice(0, limit).map((s) => s.id);
  if (topIds.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: topIds }, userId, status: "active" },
  });

  const deltaMap = new Map(scored.map((s) => [s.id, s.delta]));
  return products
    .map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      imageUrl: p.imageUrl,
      productUrl: p.productUrl,
      affiliateUrl: p.affiliateUrl,
      category: p.category,
      platform: p.platform,
      status: p.status,
      createdAt: p.createdAt,
      orderCount: deltaMap.get(p.id) ?? 0,
    }))
    .sort((a, b) => (b.orderCount ?? 0) - (a.orderCount ?? 0));
}

// ─── 2. Recommendation Engine ────────────────────────────────────────────────

/** Personalized product recommendations for a contact */
export async function getRecommendationsForContact(
  userId: string,
  contactEmail: string,
  limit = 6
): Promise<ProductData[]> {
  const siteIds = await userSiteIds(userId);
  const profile = await getContactPurchaseProfile(userId, contactEmail);

  // Get products they already purchased to exclude them
  const purchasedIds = new Set(profile.productsPurchased.map((p) => p.id));

  // Get all active products
  const allProducts = await prisma.product.findMany({
    where: { userId, status: "active" },
  });

  // Score each product
  const scored = allProducts
    .filter((p) => !purchasedIds.has(p.id))
    .map((p) => {
      let score = 0;

      // Category affinity: boost products in favorite categories
      const catRank = profile.favoriteCategories.findIndex(
        (c) => c.category === p.category
      );
      if (catRank >= 0) {
        score += (10 - catRank) * 3; // top category = +30
      }

      // Price range affinity: prefer products near their AOV
      const price = parsePrice(p.price);
      if (price > 0 && profile.averageOrderValue > 0) {
        const ratio = price / profile.averageOrderValue;
        if (ratio >= 0.5 && ratio <= 1.5) score += 10;
        else if (ratio >= 0.3 && ratio <= 2.0) score += 5;
      }

      // Price sensitivity: budget shoppers prefer discounted items
      if (profile.priceSensitivity === "high" && p.originalPrice) {
        const orig = parsePrice(p.originalPrice);
        if (orig > price) score += 8;
      }

      // Clicked/viewed products from contact properties
      const contact = contactPropertiesCache.get(contactEmail);
      if (contact) {
        const props = contact as Record<string, unknown>;
        const viewedProducts = (props.viewedProducts ??
          props.viewed_products ??
          []) as string[];
        const clickedProducts = (props.clickedProducts ??
          props.clicked_products ??
          []) as string[];
        if (Array.isArray(viewedProducts) && viewedProducts.includes(p.id))
          score += 5;
        if (Array.isArray(clickedProducts) && clickedProducts.includes(p.id))
          score += 8;

        // Category from viewed
        const viewedCategories = (props.viewedCategories ??
          props.viewed_categories ??
          []) as string[];
        if (
          Array.isArray(viewedCategories) &&
          p.category &&
          viewedCategories.includes(p.category)
        )
          score += 4;
      }

      // Collaborative filtering (simplified): find products bought by people
      // who bought the same items. This is approximated by category overlap
      // with best sellers, since full CF is expensive without a cache layer.
      if (siteIds.length > 0) {
        // Boost best-selling products in their preferred categories
        if (catRank === 0) score += 5;
      }

      // Recency bonus
      const daysSinceCreation =
        (Date.now() - p.createdAt.getTime()) / 86400000;
      if (daysSinceCreation < 7) score += 6;
      else if (daysSinceCreation < 14) score += 3;

      return { product: p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((s) => ({
    id: s.product.id,
    name: s.product.name,
    description: s.product.description,
    price: s.product.price,
    originalPrice: s.product.originalPrice,
    imageUrl: s.product.imageUrl,
    productUrl: s.product.productUrl,
    affiliateUrl: s.product.affiliateUrl,
    category: s.product.category,
    platform: s.product.platform,
    status: s.product.status,
    createdAt: s.product.createdAt,
  }));
}

// Temp cache to avoid re-fetching contact properties within same call
const contactPropertiesCache = new Map<string, unknown>();

/** Products in the same category with similar price */
export async function getSimilarProducts(
  userId: string,
  productId: string,
  limit = 6
): Promise<ProductData[]> {
  const source = await prisma.product.findFirst({
    where: { id: productId, userId },
  });
  if (!source) return [];

  const sourcePrice = parsePrice(source.price);
  const minPrice = sourcePrice * 0.5;
  const maxPrice = sourcePrice * 1.5;

  const products = await prisma.product.findMany({
    where: {
      userId,
      status: "active",
      id: { not: productId },
      ...(source.category ? { category: source.category } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter by price range and sort by price proximity
  return products
    .map((p) => {
      const price = parsePrice(p.price);
      return { product: p, price, distance: Math.abs(price - sourcePrice) };
    })
    .filter(
      (p) =>
        p.price === 0 || (p.price >= minPrice && p.price <= maxPrice)
    )
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map((p) => ({
      id: p.product.id,
      name: p.product.name,
      description: p.product.description,
      price: p.product.price,
      originalPrice: p.product.originalPrice,
      imageUrl: p.product.imageUrl,
      productUrl: p.product.productUrl,
      affiliateUrl: p.product.affiliateUrl,
      category: p.product.category,
      platform: p.product.platform,
      status: p.product.status,
      createdAt: p.product.createdAt,
    }));
}

/** Products frequently bought together (co-purchased analysis) */
export async function getCrossSellProducts(
  userId: string,
  productId: string,
  limit = 4
): Promise<ProductData[]> {
  const siteIds = await userSiteIds(userId);
  if (siteIds.length === 0) return [];

  // Find all customers who bought this product
  const buyerOrders = await prisma.siteOrder.findMany({
    where: {
      siteId: { in: siteIds },
      productId,
      status: "completed",
    },
    select: { customerEmail: true },
  });

  const buyerEmails = [...new Set(buyerOrders.map((o) => o.customerEmail))];
  if (buyerEmails.length === 0) return [];

  // Find what else those customers bought
  const coPurchases = await prisma.siteOrder.groupBy({
    by: ["productId"],
    where: {
      siteId: { in: siteIds },
      customerEmail: { in: buyerEmails },
      productId: { not: productId },
      status: "completed",
    },
    _count: { productId: true },
    orderBy: { _count: { productId: "desc" } },
    take: limit,
  });

  if (coPurchases.length === 0) return [];

  const coProductIds = coPurchases.map((c) => c.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: coProductIds }, userId, status: "active" },
  });

  const countMap = new Map(
    coPurchases.map((c) => [c.productId, c._count.productId])
  );

  return products
    .map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      imageUrl: p.imageUrl,
      productUrl: p.productUrl,
      affiliateUrl: p.affiliateUrl,
      category: p.category,
      platform: p.platform,
      status: p.status,
      createdAt: p.createdAt,
      orderCount: countMap.get(p.id) ?? 0,
    }))
    .sort((a, b) => (b.orderCount ?? 0) - (a.orderCount ?? 0));
}

/** Products left in cart (pending orders) */
export async function getCartAbandonmentProducts(
  userId: string,
  contactEmail: string
): Promise<ProductData[]> {
  const siteIds = await userSiteIds(userId);
  if (siteIds.length === 0) return [];

  const pendingOrders = await prisma.siteOrder.findMany({
    where: {
      siteId: { in: siteIds },
      customerEmail: contactEmail,
      status: "pending",
    },
    orderBy: { createdAt: "desc" },
  });

  if (pendingOrders.length === 0) return [];

  const productIds = [...new Set(pendingOrders.map((o) => o.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: "active" },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    originalPrice: p.originalPrice,
    imageUrl: p.imageUrl,
    productUrl: p.productUrl,
    affiliateUrl: p.affiliateUrl,
    category: p.category,
    platform: p.platform,
    status: p.status,
    createdAt: p.createdAt,
  }));
}

// ─── 3. Dynamic Email Content Blocks ─────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function priceHtml(
  price: string | null,
  originalPrice: string | null
): string {
  const current = parsePrice(price);
  const original = parsePrice(originalPrice);
  const hasDiscount = original > 0 && original > current && current > 0;

  if (current === 0) return "";

  if (hasDiscount) {
    return `
      <span style="text-decoration:line-through;color:#999;font-size:14px;">$${original.toFixed(2)}</span>
      <span style="color:#e53e3e;font-weight:700;font-size:18px;margin-left:6px;">$${current.toFixed(2)}</span>
    `;
  }
  return `<span style="color:#1a1a1a;font-weight:700;font-size:18px;">$${current.toFixed(2)}</span>`;
}

function productCardHtml(p: ProductData): string {
  const img = p.imageUrl
    ? `<img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" style="width:100%;height:200px;object-fit:cover;border-radius:8px 8px 0 0;display:block;" />`
    : `<div style="width:100%;height:200px;background:#f0f0f0;border-radius:8px 8px 0 0;display:flex;align-items:center;justify-content:center;color:#999;font-size:14px;">No image</div>`;

  return `
    <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
      <a href="${escapeHtml(productLink(p))}" style="text-decoration:none;color:inherit;" target="_blank">
        ${img}
      </a>
      <div style="padding:12px 16px 16px;">
        <h3 style="margin:0 0 8px;font-size:16px;font-weight:600;color:#1a1a1a;line-height:1.3;">
          <a href="${escapeHtml(productLink(p))}" style="text-decoration:none;color:inherit;" target="_blank">${escapeHtml(p.name)}</a>
        </h3>
        <div style="margin-bottom:12px;">${priceHtml(p.price, p.originalPrice)}</div>
        <a href="${escapeHtml(productLink(p))}" target="_blank"
           style="display:inline-block;background:#06b6d4;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:14px;font-weight:600;text-align:center;">
          Shop Now
        </a>
      </div>
    </div>
  `;
}

/** Generate product HTML block in the specified style */
export function generateProductBlock(
  products: ProductData[],
  style: BlockStyle = "grid"
): string {
  if (products.length === 0) {
    return `<div style="text-align:center;padding:20px;color:#999;font-family:Arial,Helvetica,sans-serif;">No products to display</div>`;
  }

  switch (style) {
    case "hero":
      return heroBlock(products[0]);
    case "list":
      return listBlock(products);
    case "carousel":
      return carouselBlock(products);
    case "grid":
    default:
      return gridBlock(products);
  }
}

function heroBlock(p: ProductData): string {
  const img = p.imageUrl
    ? `<img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" style="width:100%;max-height:400px;object-fit:cover;border-radius:8px;display:block;" />`
    : "";

  const desc = p.description
    ? `<p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.5;">${escapeHtml(p.description.slice(0, 200))}${p.description.length > 200 ? "..." : ""}</p>`
    : "";

  return `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;">
      ${img}
      <div style="padding:20px 0;">
        <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a1a;">${escapeHtml(p.name)}</h2>
        ${desc}
        <div style="margin-bottom:16px;">${priceHtml(p.price, p.originalPrice)}</div>
        <a href="${escapeHtml(productLink(p))}" target="_blank"
           style="display:inline-block;background:#06b6d4;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;font-weight:700;text-align:center;">
          Shop Now
        </a>
      </div>
    </div>
  `;
}

function gridBlock(products: ProductData[]): string {
  // 2-column grid using table layout for email compatibility
  const rows: string[] = [];
  for (let i = 0; i < products.length; i += 2) {
    const left = products[i];
    const right = products[i + 1];
    rows.push(`
      <tr>
        <td style="width:50%;padding:8px;vertical-align:top;">
          ${productCardHtml(left)}
        </td>
        <td style="width:50%;padding:8px;vertical-align:top;">
          ${right ? productCardHtml(right) : ""}
        </td>
      </tr>
    `);
  }

  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;">
      <tbody>${rows.join("")}</tbody>
    </table>
  `;
}

function listBlock(products: ProductData[]): string {
  const items = products.map((p) => {
    const img = p.imageUrl
      ? `<td style="width:120px;padding-right:16px;vertical-align:top;">
           <a href="${escapeHtml(productLink(p))}" target="_blank">
             <img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" style="width:120px;height:120px;object-fit:cover;border-radius:6px;display:block;" />
           </a>
         </td>`
      : "";

    return `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;border-bottom:1px solid #eee;padding-bottom:16px;">
        <tr>
          ${img}
          <td style="vertical-align:top;">
            <h3 style="margin:0 0 6px;font-size:16px;font-weight:600;">
              <a href="${escapeHtml(productLink(p))}" style="text-decoration:none;color:#1a1a1a;" target="_blank">${escapeHtml(p.name)}</a>
            </h3>
            <div style="margin-bottom:10px;">${priceHtml(p.price, p.originalPrice)}</div>
            <a href="${escapeHtml(productLink(p))}" target="_blank"
               style="display:inline-block;background:#06b6d4;color:#ffffff;text-decoration:none;padding:8px 20px;border-radius:6px;font-size:13px;font-weight:600;">
              Shop Now
            </a>
          </td>
        </tr>
      </table>
    `;
  });

  return `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;">
      ${items.join("")}
    </div>
  `;
}

function carouselBlock(products: ProductData[]): string {
  // Email clients don't support real carousels, so we use a horizontal
  // scrollable table that degrades gracefully to a stacked layout.
  const cells = products
    .map(
      (p) => `
      <td style="width:220px;min-width:220px;padding:0 8px;vertical-align:top;">
        ${productCardHtml(p)}
      </td>
    `
    )
    .join("");

  return `
    <div style="max-width:600px;margin:0 auto;overflow-x:auto;-webkit-overflow-scrolling:touch;font-family:Arial,Helvetica,sans-serif;">
      <table cellpadding="0" cellspacing="0" border="0" style="min-width:${products.length * 236}px;">
        <tr>${cells}</tr>
      </table>
    </div>
  `;
}

/** Personalized recommendation HTML block */
export async function generateRecommendationBlock(
  userId: string,
  contactEmail: string,
  limit = 4,
  style: BlockStyle = "grid"
): Promise<string> {
  const products = await getRecommendationsForContact(
    userId,
    contactEmail,
    limit
  );
  if (products.length === 0) {
    // Fallback to best sellers
    const bestSellers = await getBestSellers(userId, limit);
    return wrapSection(
      "Recommended For You",
      generateProductBlock(bestSellers, style)
    );
  }
  return wrapSection(
    "Recommended For You",
    generateProductBlock(products, style)
  );
}

/** Best-sellers HTML block */
export async function generateBestSellerBlock(
  userId: string,
  limit = 4
): Promise<string> {
  const products = await getBestSellers(userId, limit);
  return wrapSection(
    "Best Sellers",
    generateProductBlock(products, "grid")
  );
}

function wrapSection(title: string, content: string): string {
  return `
    <div style="max-width:600px;margin:0 auto 24px;font-family:Arial,Helvetica,sans-serif;">
      <h2 style="text-align:center;font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 16px;padding-bottom:12px;border-bottom:2px solid #06b6d4;">
        ${escapeHtml(title)}
      </h2>
      ${content}
    </div>
  `;
}

// ─── 4. Product Feed for Emails ──────────────────────────────────────────────

export async function getProductFeed(
  userId: string,
  options: FeedOptions = {}
): Promise<{
  products: ProductData[];
  total: number;
  hasMore: boolean;
}> {
  const {
    sort = "newest",
    category,
    minPrice,
    maxPrice,
    inStockOnly = false,
    limit = 20,
    offset = 0,
  } = options;

  // Build the where clause
  const where: Record<string, unknown> = {
    userId,
    status: "active",
    ...(category ? { category } : {}),
    ...(inStockOnly ? { status: "active" } : {}),
  };

  // For price filtering and sorting by price, we need to fetch and filter
  // in memory since price is stored as a string.
  const needsPriceProcessing =
    minPrice !== undefined ||
    maxPrice !== undefined ||
    sort === "price_low" ||
    sort === "price_high";

  // Determine Prisma orderBy for non-price sorts
  let orderBy: Record<string, string> | undefined;
  if (sort === "newest") orderBy = { createdAt: "desc" };

  // For best_selling and trending, we need order data
  if (sort === "best_selling") {
    const bestSellers = await getBestSellers(userId, limit + offset);
    let filtered = bestSellers;
    if (category) filtered = filtered.filter((p) => p.category === category);
    if (minPrice !== undefined || maxPrice !== undefined) {
      filtered = filtered.filter((p) => {
        const price = parsePrice(p.price);
        if (minPrice !== undefined && price < minPrice) return false;
        if (maxPrice !== undefined && price > maxPrice) return false;
        return true;
      });
    }
    const total = filtered.length;
    const sliced = filtered.slice(offset, offset + limit);
    return { products: sliced, total, hasMore: offset + limit < total };
  }

  if (sort === "trending") {
    const trending = await getTrendingProducts(userId, limit + offset);
    let filtered = trending;
    if (category) filtered = filtered.filter((p) => p.category === category);
    if (minPrice !== undefined || maxPrice !== undefined) {
      filtered = filtered.filter((p) => {
        const price = parsePrice(p.price);
        if (minPrice !== undefined && price < minPrice) return false;
        if (maxPrice !== undefined && price > maxPrice) return false;
        return true;
      });
    }
    const total = filtered.length;
    const sliced = filtered.slice(offset, offset + limit);
    return { products: sliced, total, hasMore: offset + limit < total };
  }

  if (needsPriceProcessing) {
    // Fetch all and process in memory
    const allProducts = await prisma.product.findMany({
      where: where as never,
      orderBy: orderBy as never,
    });

    let processed = allProducts.map((p) => ({
      data: p,
      numPrice: parsePrice(p.price),
    }));

    if (minPrice !== undefined) {
      processed = processed.filter((p) => p.numPrice >= minPrice);
    }
    if (maxPrice !== undefined) {
      processed = processed.filter((p) => p.numPrice <= maxPrice);
    }

    if (sort === "price_low") {
      processed.sort((a, b) => a.numPrice - b.numPrice);
    } else if (sort === "price_high") {
      processed.sort((a, b) => b.numPrice - a.numPrice);
    }

    const total = processed.length;
    const sliced = processed.slice(offset, offset + limit);
    return {
      products: sliced.map((s) => ({
        id: s.data.id,
        name: s.data.name,
        description: s.data.description,
        price: s.data.price,
        originalPrice: s.data.originalPrice,
        imageUrl: s.data.imageUrl,
        productUrl: s.data.productUrl,
        affiliateUrl: s.data.affiliateUrl,
        category: s.data.category,
        platform: s.data.platform,
        status: s.data.status,
        createdAt: s.data.createdAt,
      })),
      total,
      hasMore: offset + limit < total,
    };
  }

  // Standard query with Prisma pagination
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: where as never,
      orderBy: orderBy as never,
      take: limit,
      skip: offset,
    }),
    prisma.product.count({ where: where as never }),
  ]);

  return {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      imageUrl: p.imageUrl,
      productUrl: p.productUrl,
      affiliateUrl: p.affiliateUrl,
      category: p.category,
      platform: p.platform,
      status: p.status,
      createdAt: p.createdAt,
    })),
    total,
    hasMore: offset + limit < total,
  };
}

// ─── 5. Purchase Pattern Analysis ────────────────────────────────────────────

export async function getContactPurchaseProfile(
  userId: string,
  contactEmail: string
): Promise<PurchaseProfile> {
  const siteIds = await userSiteIds(userId);

  // Load contact properties for recommendation engine cache
  const contact = await prisma.emailContact.findFirst({
    where: { userId, email: contactEmail },
    select: { properties: true },
  });
  if (contact?.properties) {
    contactPropertiesCache.set(contactEmail, contact.properties);
  }

  if (siteIds.length === 0) {
    return emptyProfile();
  }

  // All completed orders for this customer
  const orders = await prisma.siteOrder.findMany({
    where: {
      siteId: { in: siteIds },
      customerEmail: contactEmail,
      status: "completed",
    },
    orderBy: { createdAt: "asc" },
  });

  if (orders.length === 0) {
    return emptyProfile();
  }

  // Get associated products
  const productIds = [...new Set(orders.map((o) => o.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Favorite categories
  const categoryCounts = new Map<string, number>();
  for (const order of orders) {
    const product = productMap.get(order.productId);
    const cat = product?.category || "Uncategorized";
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
  }
  const favoriteCategories = [...categoryCounts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // Average order value (cents to dollars)
  const totalRevenue = orders.reduce((sum, o) => sum + o.amountCents, 0);
  const averageOrderValue = totalRevenue / orders.length / 100;

  // Price sensitivity
  let priceSensitivity: "low" | "medium" | "high";
  if (averageOrderValue >= 100) priceSensitivity = "low";
  else if (averageOrderValue >= 30) priceSensitivity = "medium";
  else priceSensitivity = "high";

  // Purchase frequency
  let avgDaysBetween: number | null = null;
  if (orders.length >= 2) {
    const first = orders[0].createdAt.getTime();
    const last = orders[orders.length - 1].createdAt.getTime();
    const spanDays = (last - first) / 86400000;
    avgDaysBetween = Math.round(spanDays / (orders.length - 1));
  }

  // Deduplicated products purchased
  const productsPurchased: ProductData[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    originalPrice: p.originalPrice,
    imageUrl: p.imageUrl,
    productUrl: p.productUrl,
    affiliateUrl: p.affiliateUrl,
    category: p.category,
    platform: p.platform,
    status: p.status,
    createdAt: p.createdAt,
  }));

  return {
    favoriteCategories,
    averageOrderValue,
    priceSensitivity,
    purchaseFrequency: { totalOrders: orders.length, avgDaysBetween },
    productsPurchased,
  };
}

function emptyProfile(): PurchaseProfile {
  return {
    favoriteCategories: [],
    averageOrderValue: 0,
    priceSensitivity: "medium",
    purchaseFrequency: { totalOrders: 0, avgDaysBetween: null },
    productsPurchased: [],
  };
}
