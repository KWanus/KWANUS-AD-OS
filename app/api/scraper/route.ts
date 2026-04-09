// ---------------------------------------------------------------------------
// POST /api/scraper — unified scraping API
// One endpoint for all scrapers. Pass { type, params } and get data back.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  analyzeCompetitor,
  scrapeGoogleMaps,
  scrapeReviews,
  scrapeMetaAdLibrary,
  scrapePainPoints,
  scrapeSEOData,
  findContacts,
  scrapeTrends,
  scrapePrices,
  scrapePerformance,
} from "@/lib/scraper/scrapers";

type ScraperType =
  | "competitor"
  | "google_maps"
  | "reviews"
  | "ad_library"
  | "pain_points"
  | "seo"
  | "contacts"
  | "trends"
  | "prices"
  | "performance";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { type: ScraperType; params: Record<string, string> };
    if (!body.type) return NextResponse.json({ ok: false, error: "type required" }, { status: 400 });

    let result: unknown;

    switch (body.type) {
      case "competitor":
        if (!body.params.url) return NextResponse.json({ ok: false, error: "url required" }, { status: 400 });
        result = await analyzeCompetitor(body.params.url);
        break;

      case "google_maps":
        if (!body.params.niche || !body.params.location) return NextResponse.json({ ok: false, error: "niche and location required" }, { status: 400 });
        result = await scrapeGoogleMaps(body.params.niche, body.params.location);
        break;

      case "reviews":
        if (!body.params.url) return NextResponse.json({ ok: false, error: "url required" }, { status: 400 });
        result = await scrapeReviews(body.params.url);
        break;

      case "ad_library":
        if (!body.params.query) return NextResponse.json({ ok: false, error: "query required" }, { status: 400 });
        result = await scrapeMetaAdLibrary(body.params.query);
        break;

      case "pain_points":
        if (!body.params.niche) return NextResponse.json({ ok: false, error: "niche required" }, { status: 400 });
        result = await scrapePainPoints(body.params.niche);
        break;

      case "seo":
        if (!body.params.url) return NextResponse.json({ ok: false, error: "url required" }, { status: 400 });
        result = await scrapeSEOData(body.params.url);
        break;

      case "contacts":
        if (!body.params.url) return NextResponse.json({ ok: false, error: "url required" }, { status: 400 });
        result = await findContacts(body.params.url);
        break;

      case "trends":
        if (!body.params.keyword) return NextResponse.json({ ok: false, error: "keyword required" }, { status: 400 });
        result = await scrapeTrends(body.params.keyword);
        break;

      case "prices":
        if (!body.params.url) return NextResponse.json({ ok: false, error: "url required" }, { status: 400 });
        result = await scrapePrices(body.params.url);
        break;

      case "performance":
        if (!body.params.url) return NextResponse.json({ ok: false, error: "url required" }, { status: 400 });
        result = await scrapePerformance(body.params.url);
        break;

      default:
        return NextResponse.json({ ok: false, error: `Unknown scraper: ${body.type}` }, { status: 400 });
    }

    return NextResponse.json({ ok: true, type: body.type, data: result });
  } catch (err) {
    console.error("Scraper error:", err);
    return NextResponse.json({ ok: false, error: "Scraping failed" }, { status: 500 });
  }
}
