// ---------------------------------------------------------------------------
// POST /api/himalaya/tools
// Execute any of the 300 systems on demand
// Body: { tool: "webinar" | "vsl" | "case_study" | ... , params: {} }
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const { tool, params } = await req.json() as { tool: string; params: Record<string, unknown> };

    let result: unknown = null;

    switch (tool) {
      case "webinar": {
        const { generateWebinarSystem } = await import("@/lib/himalaya/scalingSystems");
        result = await generateWebinarSystem({
          niche: (params.niche as string) ?? "business",
          offer: (params.offer as string) ?? "coaching program",
          price: (params.price as string) ?? "$997",
          targetAudience: (params.audience as string) ?? "professionals",
        });
        break;
      }
      case "vsl": {
        const { generateVSL } = await import("@/lib/himalaya/scalingSystems");
        result = await generateVSL({
          niche: (params.niche as string) ?? "business",
          offer: (params.offer as string) ?? "program",
          price: (params.price as string) ?? "$997",
          targetAudience: (params.audience as string) ?? "professionals",
          painPoints: (params.painPoints as string[]) ?? ["struggling to get results"],
        });
        break;
      }
      case "challenge": {
        const { generateChallengeFunnel } = await import("@/lib/himalaya/scalingSystems");
        result = generateChallengeFunnel({
          niche: (params.niche as string) ?? "business",
          duration: (params.duration as 5 | 7 | 30) ?? 7,
          offer: (params.offer as string) ?? "program",
          price: (params.price as string) ?? "$997",
        });
        break;
      }
      case "case_study": {
        const { generateCaseStudy } = await import("@/lib/himalaya/advancedSystems");
        result = await generateCaseStudy({
          clientName: (params.clientName as string) ?? "Client",
          niche: (params.niche as string) ?? "business",
          challenge: (params.challenge as string) ?? "Struggling with growth",
          solution: (params.solution as string) ?? "Implemented new system",
          results: (params.results as string) ?? "3x revenue in 90 days",
          timeframe: (params.timeframe as string) ?? "90 days",
        });
        break;
      }
      case "blog_post": {
        const { generateBlogPost } = await import("@/lib/himalaya/advancedSystems");
        result = await generateBlogPost({
          niche: (params.niche as string) ?? "business",
          targetKeyword: (params.keyword as string) ?? "how to grow your business",
          businessName: (params.businessName as string) ?? "My Business",
        });
        break;
      }
      case "offer_stack": {
        const { buildOfferStack } = await import("@/lib/himalaya/advancedSystems");
        result = await buildOfferStack({
          niche: (params.niche as string) ?? "business",
          coreOffer: (params.offer as string) ?? "program",
          corePrice: (params.price as string) ?? "$997",
          targetAudience: (params.audience as string) ?? "professionals",
        });
        break;
      }
      case "quiz_funnel": {
        const { generateQuizFunnel } = await import("@/lib/himalaya/conversionSystems");
        result = await generateQuizFunnel({
          niche: (params.niche as string) ?? "business",
          offer: (params.offer as string) ?? "program",
          outcomes: (params.outcomes as string[]) ?? ["beginner", "intermediate", "advanced"],
        });
        break;
      }
      case "sales_script": {
        const { generateSalesScript } = await import("@/lib/himalaya/siteHardening");
        result = await generateSalesScript({
          niche: (params.niche as string) ?? "business",
          offer: (params.offer as string) ?? "program",
          price: (params.price as string) ?? "$997",
          targetAudience: (params.audience as string) ?? "professionals",
        });
        break;
      }
      case "sop": {
        const { generateSOP } = await import("@/lib/himalaya/scalingSystems");
        result = await generateSOP({
          processName: (params.processName as string) ?? "Client Onboarding",
          niche: (params.niche as string) ?? "business",
        });
        break;
      }
      case "proposal": {
        const { generateProposal } = await import("@/lib/himalaya/scalingSystems");
        result = await generateProposal({
          clientName: (params.clientName as string) ?? "Client",
          niche: (params.niche as string) ?? "business",
          service: (params.service as string) ?? "Marketing",
          price: (params.price as string) ?? "$3,000",
          deliverables: (params.deliverables as string[]) ?? ["Strategy", "Implementation", "Reporting"],
          timeline: (params.timeline as string) ?? "90 days",
          businessName: (params.businessName as string) ?? "My Business",
        });
        break;
      }
      case "influencer_outreach": {
        const { generateInfluencerOutreach } = await import("@/lib/himalaya/scalingSystems");
        result = generateInfluencerOutreach({
          niche: (params.niche as string) ?? "business",
          businessName: (params.businessName as string) ?? "My Business",
          offer: (params.offer as string) ?? "program",
        });
        break;
      }
      case "flash_sale": {
        const { generateFlashSale } = await import("@/lib/himalaya/scalingSystems");
        result = generateFlashSale({
          productName: (params.productName as string) ?? "Product",
          originalPrice: (params.originalPrice as string) ?? "$997",
          salePrice: (params.salePrice as string) ?? "$497",
          duration: (params.duration as number) ?? 48,
          reason: (params.reason as string) ?? "Celebrating our anniversary",
        });
        break;
      }
      case "launch_sequence": {
        const { generateLaunchSequence } = await import("@/lib/himalaya/scalingSystems");
        result = generateLaunchSequence({
          productName: (params.productName as string) ?? "Product",
          launchDate: (params.launchDate as string) ?? "Next month",
          niche: (params.niche as string) ?? "business",
          price: (params.price as string) ?? "$997",
        });
        break;
      }
      case "partnerships": {
        const { findPartnerships } = await import("@/lib/himalaya/operationsEngine");
        result = await findPartnerships({
          niche: (params.niche as string) ?? "business",
          businessType: (params.businessType as string) ?? "coaching",
          targetAudience: (params.audience as string) ?? "professionals",
        });
        break;
      }
      case "market_trends": {
        const { detectMarketTrends } = await import("@/lib/himalaya/testingEngine");
        result = await detectMarketTrends((params.niche as string) ?? "business");
        break;
      }
      case "profit_margins": {
        const { calculateProfitMargins } = await import("@/lib/himalaya/advancedSystems");
        result = calculateProfitMargins({
          revenue: (params.revenue as number) ?? 10000,
          costs: (params.costs as { adSpend: number; tools: number; cogs: number; labor: number; other: number }) ?? { adSpend: 2000, tools: 200, cogs: 1000, labor: 0, other: 300 },
        });
        break;
      }
      case "cash_flow": {
        const { projectCashFlow } = await import("@/lib/himalaya/advancedSystems");
        result = projectCashFlow({
          currentMonthlyRevenue: (params.revenue as number) ?? 5000,
          monthlyGrowthRate: (params.growthRate as number) ?? 0.15,
          monthlyCosts: (params.costs as number) ?? 2000,
          startingCash: (params.cash as number) ?? 1000,
        });
        break;
      }
      case "valuation": {
        const { estimateBusinessValue } = await import("@/lib/himalaya/advancedSystems");
        result = estimateBusinessValue({
          monthlyRevenue: (params.revenue as number) ?? 10000,
          monthlyProfit: (params.profit as number) ?? 6000,
          monthsOfData: (params.months as number) ?? 12,
          isGrowing: (params.growing as boolean) ?? true,
          hasRecurring: (params.recurring as boolean) ?? false,
          hasEmail: (params.email as boolean) ?? true,
          hasTraffic: (params.traffic as boolean) ?? true,
        });
        break;
      }
      case "brand_guide": {
        const { generateBrandGuide } = await import("@/lib/himalaya/expansionSystems");
        result = await generateBrandGuide({
          businessName: (params.businessName as string) ?? "My Business",
          niche: (params.niche as string) ?? "business",
          primaryColor: (params.color as string) ?? "#f5a623",
          tone: (params.tone as string) ?? "bold and direct",
        });
        break;
      }
      case "pitch_deck": {
        const { generatePitchDeck } = await import("@/lib/himalaya/expansionSystems");
        result = await generatePitchDeck({
          businessName: (params.businessName as string) ?? "My Business",
          niche: (params.niche as string) ?? "business",
          revenue: (params.revenue as string) ?? "$10K/month",
          growth: (params.growth as string) ?? "25% MoM",
          askAmount: (params.ask as string) ?? "$500K",
          useOfFunds: (params.use as string) ?? "Product development + marketing",
        });
        break;
      }
      default:
        return NextResponse.json({ ok: false, error: `Unknown tool: ${tool}` }, { status: 400 });
    }

    return NextResponse.json({ ok: true, tool, result });
  } catch (err) {
    console.error("Tool error:", err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
