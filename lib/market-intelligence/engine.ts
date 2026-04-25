import { discoverProducts, suggestSearchUrls } from "./discovery";
import { analyzeWinner, analyzeTopProducts } from "./analyzer";
import { synthesizeMarket, generateLaunchAssets } from "./synthesizer";
import { fetchPage } from "@/src/logic/ad-os/fetchPage";
import { extractSignals } from "@/src/logic/ad-os/extractSignals";
import type {
  MarketIntelligenceInput,
  MarketIntelligenceResult,
  DiscoveredProduct,
  WinnerProfile,
} from "./types";

// ---------------------------------------------------------------------------
// Market Intelligence Engine — Full pipeline
// ---------------------------------------------------------------------------

export type ProgressCallback = (status: string, detail?: string) => void;

export async function runMarketIntelligence(
  input: MarketIntelligenceInput,
  onProgress?: ProgressCallback
): Promise<MarketIntelligenceResult> {
  const {
    niche,
    subNiche,
    vertical = "affiliate",
    executionTier = "elite",
    maxProducts = 5,
    includeAdIntelligence = true,
    generateAssets = true,
    specificUrls,
  } = input;

  const result: MarketIntelligenceResult = {
    niche,
    subNiche,
    vertical,
    executionTier,
    status: "pending",
    discoveredProducts: [],
    winnerProfiles: [],
    synthesis: null,
    generatedAssets: {},
    score: 0,
  };

  try {
    // ── Stage 1: Product Discovery ──
    result.status = "discovering";
    onProgress?.("discovering", `Scanning ${niche} market for winning products...`);

    let products: DiscoveredProduct[];

    if (specificUrls && specificUrls.length > 0) {
      products = specificUrls.map((url, i) => ({
        name: `Product ${i + 1}`,
        url,
        platform: "direct" as const,
        niche,
        whySelected: "Manually provided URL",
      }));

      const enriched = await Promise.allSettled(
        products.map(async (p) => {
          try {
            const page = await fetchPage(p.url);
            if (page && !page.error) {
              const signals = extractSignals(page);
              return {
                ...p,
                name: signals.productName || page.title || p.name,
                price: signals.price ?? undefined,
              };
            }
          } catch { /* keep original */ }
          return p;
        })
      );

      products = enriched.map((r) =>
        r.status === "fulfilled" ? r.value : products[0]
      );
    } else {
      products = await discoverProducts(niche, {
        subNiche,
        vertical,
        executionTier,
        maxProducts,
      });
    }

    result.discoveredProducts = products;
    onProgress?.("discovering", `Found ${products.length} products to analyze`);

    // ── Stage 2: Winner Analysis ──
    result.status = "analyzing";
    onProgress?.("analyzing", `Deep-diving into top ${Math.min(products.length, 3)} products...`);

    const topProducts = products.slice(0, executionTier === "elite" ? 3 : 2);

    const scanUrls = await suggestSearchUrls(niche, topProducts[0]?.name);

    const additionalPages = await Promise.allSettled(
      scanUrls.slice(0, 3).map(async (url) => {
        try {
          const page = await fetchPage(url);
          return page && !page.error ? page : null;
        } catch {
          return null;
        }
      })
    );

    const extraContext = additionalPages
      .filter((r) => r.status === "fulfilled" && r.value)
      .map((r) => (r as PromiseFulfilledResult<NonNullable<Awaited<ReturnType<typeof fetchPage>>>>).value);

    if (extraContext.length > 0) {
      onProgress?.("analyzing", `Scanned ${extraContext.length} additional competitor pages`);
    }

    const winnerProfiles = await analyzeTopProducts(topProducts, executionTier, 2);
    result.winnerProfiles = winnerProfiles;

    onProgress?.("analyzing", `Analyzed ${winnerProfiles.length} winners — found ${winnerProfiles.reduce((sum, w) => sum + w.duplicableElements.length, 0)} duplicable elements`);

    // ── Stage 3: Market Synthesis ──
    result.status = "synthesizing";
    onProgress?.("synthesizing", "Building your personalized launch strategy...");

    const synthesis = await synthesizeMarket(niche, winnerProfiles, executionTier);
    result.synthesis = synthesis;

    onProgress?.("synthesizing", `Strategy ready: ${synthesis.bestProduct.name} — ${synthesis.bestProduct.estimatedEarningsPerDay}`);

    // ── Stage 4: Asset Generation ──
    if (generateAssets && synthesis) {
      result.status = "generating";
      onProgress?.("generating", "Creating your launch assets (hooks, ads, emails)...");

      const assets = await generateLaunchAssets(niche, synthesis, executionTier);
      result.generatedAssets = assets;

      onProgress?.("generating", `Generated ${assets.hooks?.length ?? 0} hooks, ${assets.adScripts?.length ?? 0} ad scripts, ${assets.emailSequence?.length ?? 0} emails`);
    }

    // ── Score the overall intelligence quality ──
    result.score = scoreIntelligence(result);
    result.status = "complete";
    onProgress?.("complete", `Market intelligence complete — Score: ${result.score}/100`);

  } catch (error) {
    result.status = "failed";
    onProgress?.("failed", error instanceof Error ? error.message : "Unknown error");
  }

  return result;
}

// ---------------------------------------------------------------------------
// Score the quality of the intelligence gathered
// ---------------------------------------------------------------------------

function scoreIntelligence(result: MarketIntelligenceResult): number {
  let score = 0;

  if (result.discoveredProducts.length > 0) score += 15;
  if (result.discoveredProducts.length >= 3) score += 5;

  if (result.winnerProfiles.length > 0) score += 15;
  for (const w of result.winnerProfiles) {
    if (w.customerAvatar.painPoints.length > 0) score += 3;
    if (w.conversionStrategy.hookApproach !== "Unknown") score += 3;
    if (w.adIntelligence.commonHooks.length > 0) score += 3;
    if (w.funnelStructure.length > 2) score += 2;
    if (w.duplicableElements.length > 0) score += 2;
  }
  score = Math.min(score, 50);

  if (result.synthesis) {
    score += 10;
    if (result.synthesis.bestProduct.confidenceLevel === "high") score += 5;
    if (result.synthesis.dayOnePlan.tasks.length >= 3) score += 5;
    if (result.synthesis.winningStrategy.primaryAngle) score += 5;
    if (result.synthesis.funnelBlueprint.steps.length > 0) score += 5;
  }

  const assets = result.generatedAssets;
  if (assets.hooks && assets.hooks.length > 0) score += 5;
  if (assets.adScripts && assets.adScripts.length > 0) score += 5;
  if (assets.emailSequence && assets.emailSequence.length > 0) score += 5;

  return Math.min(score, 100);
}

// ---------------------------------------------------------------------------
// Re-export
// ---------------------------------------------------------------------------

export { discoverProducts } from "./discovery";
export { analyzeWinner, analyzeTopProducts } from "./analyzer";
export { synthesizeMarket, generateLaunchAssets } from "./synthesizer";
export * from "./types";
