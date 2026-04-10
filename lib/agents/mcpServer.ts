// ---------------------------------------------------------------------------
// MCP Server — Model Context Protocol for Himalaya
// Lets external AI agents (Claude, ChatGPT, etc.) use Himalaya as a tool.
//
// This turns Himalaya from a product into INFRASTRUCTURE.
// Any AI agent can: deploy businesses, generate content, scrape competitors,
// analyze performance, and manage campaigns through Himalaya.
//
// MCP spec: https://modelcontextprotocol.io/
// ---------------------------------------------------------------------------

export type MCPTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export type MCPToolResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};

/** Define all tools that external AI agents can use */
export function getMCPTools(): MCPTool[] {
  return [
    {
      name: "himalaya_deploy_business",
      description: "Deploy a complete business: website, email flows, ad campaign, and tracking. Specify a niche and business path (affiliate, consultant, local, dropship, agency, digital_product).",
      inputSchema: {
        type: "object",
        properties: {
          niche: { type: "string", description: "The business niche (e.g., 'dental practices in Houston')" },
          path: { type: "string", enum: ["affiliate", "consultant", "local", "dropship", "agency", "digital_product"], description: "Business model type" },
          config: { type: "object", description: "Path-specific configuration" },
        },
        required: ["niche", "path"],
      },
    },
    {
      name: "himalaya_scrape_competitor",
      description: "Analyze a competitor's website: extract headline, CTAs, pricing, trust signals, benefits, weaknesses, tech stack.",
      inputSchema: {
        type: "object",
        properties: { url: { type: "string", description: "Competitor website URL" } },
        required: ["url"],
      },
    },
    {
      name: "himalaya_generate_ad_copy",
      description: "Generate ad copy for a specific platform and audience.",
      inputSchema: {
        type: "object",
        properties: {
          platform: { type: "string", enum: ["facebook", "tiktok", "instagram", "google", "linkedin"] },
          audience: { type: "string" },
          niche: { type: "string" },
          angle: { type: "string", description: "The hook angle (pain, proof, curiosity, etc.)" },
        },
        required: ["platform", "audience", "niche"],
      },
    },
    {
      name: "himalaya_find_products",
      description: "Search affiliate networks for products to promote in a given niche. Returns scored recommendations with commission rates.",
      inputSchema: {
        type: "object",
        properties: { niche: { type: "string", description: "Product niche to search" } },
        required: ["niche"],
      },
    },
    {
      name: "himalaya_analyze_seo",
      description: "Run a full SEO audit on any URL. Returns score, issues, and Google preview.",
      inputSchema: {
        type: "object",
        properties: { url: { type: "string", description: "URL to audit" } },
        required: ["url"],
      },
    },
    {
      name: "himalaya_generate_content_calendar",
      description: "Generate 7 days of social media content for a niche.",
      inputSchema: {
        type: "object",
        properties: {
          niche: { type: "string" },
          platforms: { type: "array", items: { type: "string" }, description: "Target platforms" },
        },
        required: ["niche"],
      },
    },
    {
      name: "himalaya_find_pain_points",
      description: "Scrape Reddit and Quora for real pain points and desires of a target audience.",
      inputSchema: {
        type: "object",
        properties: {
          audience: { type: "string", description: "Target audience description" },
          niche: { type: "string" },
        },
        required: ["audience"],
      },
    },
    {
      name: "himalaya_simulate_campaign",
      description: "Use the Digital Twin simulator to predict how a headline, ad, or email would perform with a target audience.",
      inputSchema: {
        type: "object",
        properties: {
          asset: { type: "string", description: "The text to simulate (headline, ad copy, email subject)" },
          assetType: { type: "string", enum: ["headline", "email_subject", "ad_hook", "price", "offer", "cta"] },
          audience: { type: "string" },
          niche: { type: "string" },
        },
        required: ["asset", "assetType", "audience", "niche"],
      },
    },
    {
      name: "himalaya_get_revenue_report",
      description: "Get revenue report: total revenue, orders, email ROI, site performance.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "himalaya_get_daily_actions",
      description: "Get today's highest-impact tasks based on business performance data.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "himalaya_generate_proposal",
      description: "Generate a professional client proposal from analysis data.",
      inputSchema: {
        type: "object",
        properties: {
          clientName: { type: "string" },
          runId: { type: "string", description: "Analysis run ID to base proposal on" },
        },
        required: ["clientName"],
      },
    },
    {
      name: "himalaya_find_local_businesses",
      description: "Search Google Maps for businesses in a specific niche and location.",
      inputSchema: {
        type: "object",
        properties: {
          niche: { type: "string", description: "Business type (e.g., 'dentist', 'plumber')" },
          location: { type: "string", description: "City or area (e.g., 'Houston, TX')" },
        },
        required: ["niche", "location"],
      },
    },
    {
      name: "himalaya_analyze_creative_dna",
      description: "Analyze an ad creative to understand WHY it works across 50+ parameters. Returns winning formula.",
      inputSchema: {
        type: "object",
        properties: {
          adText: { type: "string", description: "The ad copy to analyze" },
          performance: { type: "number", description: "Optional: known performance score 0-100" },
        },
        required: ["adText"],
      },
    },
  ];
}

/** Format for MCP discovery response */
export function getMCPManifest(): Record<string, unknown> {
  return {
    name: "himalaya",
    version: "1.0.0",
    description: "Himalaya Marketing OS — deploy businesses, generate content, analyze competitors, and manage campaigns via AI.",
    tools: getMCPTools(),
    capabilities: {
      tools: { listChanged: false },
    },
  };
}
