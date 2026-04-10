// ---------------------------------------------------------------------------
// MCP Server Endpoint — Model Context Protocol
// External AI agents discover and use Himalaya tools through this endpoint
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { getMCPManifest, getMCPTools } from "@/lib/agents/mcpServer";

// Discovery endpoint — returns available tools
export async function GET() {
  return NextResponse.json(getMCPManifest());
}

// Tool execution endpoint — external agents call tools here
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { tool: string; arguments: Record<string, unknown> };

    if (!body.tool) {
      return NextResponse.json({ error: "tool name required" }, { status: 400 });
    }

    const tools = getMCPTools();
    const tool = tools.find((t) => t.name === body.tool);
    if (!tool) {
      return NextResponse.json({ error: `Unknown tool: ${body.tool}. Available: ${tools.map((t) => t.name).join(", ")}` }, { status: 400 });
    }

    // Route to the appropriate API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";
    const args = body.arguments ?? {};

    let apiUrl: string;
    let apiBody: Record<string, unknown>;

    switch (body.tool) {
      case "himalaya_deploy_business":
        apiUrl = `${baseUrl}/api/paths/deploy`;
        apiBody = { path: args.path, config: { niche: args.niche, ...(args.config as Record<string, unknown> ?? {}) } };
        break;
      case "himalaya_scrape_competitor":
        apiUrl = `${baseUrl}/api/scraper`;
        apiBody = { type: "competitor", params: { url: args.url as string } };
        break;
      case "himalaya_generate_ad_copy":
        apiUrl = `${baseUrl}/api/ai/generate-copy`;
        apiBody = { prompt: `Write a ${args.platform} ad for ${args.audience} in ${args.niche}. Angle: ${args.angle ?? "benefit-focused"}.`, context: args };
        break;
      case "himalaya_find_products":
        apiUrl = `${baseUrl}/api/paths/affiliate/find-products?niche=${encodeURIComponent(args.niche as string)}`;
        apiBody = {};
        break;
      case "himalaya_analyze_seo":
        apiUrl = `${baseUrl}/api/tools/seo-audit`;
        apiBody = { url: args.url as string };
        break;
      case "himalaya_generate_content_calendar":
        apiUrl = `${baseUrl}/api/ai/content-calendar`;
        apiBody = { niche: args.niche, platforms: args.platforms };
        break;
      case "himalaya_find_pain_points":
        apiUrl = `${baseUrl}/api/scraper`;
        apiBody = { type: "pain_points", params: { niche: args.niche ?? args.audience } };
        break;
      case "himalaya_simulate_campaign":
        apiUrl = `${baseUrl}/api/agents/simulate`;
        apiBody = { action: "single", niche: args.niche, audience: args.audience, asset: args.asset, assetType: args.assetType };
        break;
      case "himalaya_get_revenue_report":
        apiUrl = `${baseUrl}/api/revenue`;
        apiBody = {};
        break;
      case "himalaya_get_daily_actions":
        apiUrl = `${baseUrl}/api/intelligence/daily-actions`;
        apiBody = {};
        break;
      case "himalaya_generate_proposal":
        apiUrl = `${baseUrl}/api/ai/generate-proposal`;
        apiBody = { clientName: args.clientName, runId: args.runId };
        break;
      case "himalaya_find_local_businesses":
        apiUrl = `${baseUrl}/api/scraper`;
        apiBody = { type: "google_maps", params: { niche: args.niche as string, location: args.location as string } };
        break;
      case "himalaya_analyze_creative_dna":
        apiUrl = `${baseUrl}/api/agents/creative-dna`;
        apiBody = { action: "analyze", adText: args.adText, performance: args.performance };
        break;
      default:
        return NextResponse.json({ error: `Tool ${body.tool} not implemented` }, { status: 400 });
    }

    // Forward the request
    const method = Object.keys(apiBody).length > 0 ? "POST" : "GET";
    const res = await fetch(apiUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.get("cookie") ?? "",
      },
      ...(method === "POST" ? { body: JSON.stringify(apiBody) } : {}),
    });

    const data = await res.json();

    return NextResponse.json({
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    });
  } catch (err) {
    return NextResponse.json({
      content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : "Unknown error"}` }],
      isError: true,
    });
  }
}
