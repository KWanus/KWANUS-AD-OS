import Anthropic from "@anthropic-ai/sdk";
import type { DiscoveredProduct, ExecutionTier, MarketVertical, Platform } from "./types";

const anthropic = new Anthropic();

// ---------------------------------------------------------------------------
// Product Discovery — Uses Claude to identify winning products in a niche
// ---------------------------------------------------------------------------

export async function discoverProducts(
  niche: string,
  options: {
    subNiche?: string;
    vertical?: MarketVertical;
    executionTier?: ExecutionTier;
    maxProducts?: number;
    platforms?: Platform[];
  } = {}
): Promise<DiscoveredProduct[]> {
  const {
    subNiche,
    vertical = "affiliate",
    executionTier = "elite",
    maxProducts = 5,
    platforms = ["clickbank", "digistore24", "jvzoo", "warriorplus"],
  } = options;

  const nicheLabel = subNiche ? `${niche} > ${subNiche}` : niche;

  const systemPrompt = executionTier === "elite"
    ? `You are a world-class market researcher and affiliate marketing strategist. You have deep knowledge of digital product marketplaces (ClickBank, Digistore24, JVZoo, WarriorPlus, Amazon), trending niches, and what products convert well. You study gravity scores, sales velocity, commission structures, and market demand signals. You think like a top 1% affiliate who studies markets before promoting.`
    : `You are a market researcher who identifies profitable products across digital marketplaces. You focus on practical, proven products that beginners can promote successfully.`;

  const userPrompt = `Find the ${maxProducts} best products to promote in the "${nicheLabel}" niche across these platforms: ${platforms.join(", ")}.

For the "${vertical}" business model, identify products that:
1. Have PROVEN demand (high gravity/sales velocity)
2. Pay strong commissions ($20+ per sale minimum)
3. Have good sales pages that actually convert
4. Are actively being promoted by affiliates (competitive = demand)
5. Have recurring commission opportunities when possible

For each product, provide:
- name: The product name
- url: The most likely sales page URL (use real product URLs you know exist on these platforms)
- platform: Which marketplace it's on
- niche: "${niche}"
- subNiche: More specific category
- commission: Estimated commission per sale (e.g., "$47", "75%")
- price: Product price
- gravity: Estimated gravity/popularity score (1-500 for ClickBank style)
- avgEarningsPerSale: Average affiliate earnings per sale
- recurringCommission: Whether it has recurring payments
- competitionLevel: "low" | "medium" | "high" | "saturated"
- demandSignals: Array of reasons this product has demand
- whySelected: Why this is a good pick for the "${vertical}" model

CRITICAL: Only suggest products that actually exist or are highly likely to exist on these platforms. Base your suggestions on real market knowledge. If you're unsure a specific product exists, describe the TYPE of product that dominates this niche on that platform.

Return ONLY a JSON array of products. No markdown, no explanation.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content[0]?.type === "text" ? response.content[0].text : "";

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return buildFallbackProducts(niche, vertical, platforms);
    const products = JSON.parse(jsonMatch[0]) as DiscoveredProduct[];
    return products.slice(0, maxProducts);
  } catch {
    return buildFallbackProducts(niche, vertical, platforms);
  }
}

// ---------------------------------------------------------------------------
// Suggest Search URLs for a niche (for deeper scanning)
// ---------------------------------------------------------------------------

export async function suggestSearchUrls(
  niche: string,
  productName?: string
): Promise<string[]> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `For the "${niche}" niche${productName ? ` and specifically the product "${productName}"` : ""}, list 5 real URLs that would be worth scanning for competitive intelligence. Include:
- The product's sales page (if known)
- Top competitor sales pages
- Review/comparison sites
- Landing pages from top affiliates

Return ONLY a JSON array of URL strings. No markdown.`,
    }],
  });

  const text = response.content[0]?.type === "text" ? response.content[0].text : "";
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    return (JSON.parse(jsonMatch[0]) as string[]).filter(
      (u) => typeof u === "string" && u.startsWith("http")
    );
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Fallback
// ---------------------------------------------------------------------------

function buildFallbackProducts(
  niche: string,
  vertical: MarketVertical,
  platforms: Platform[]
): DiscoveredProduct[] {
  return [{
    name: `Top ${niche} Product`,
    url: `https://www.clickbank.com/search?query=${encodeURIComponent(niche)}`,
    platform: platforms[0] ?? "clickbank",
    niche,
    competitionLevel: "medium",
    demandSignals: ["Active marketplace listings", "Established niche with proven demand"],
    whySelected: `Default recommendation for ${vertical} in ${niche} — manual research recommended`,
  }];
}
