// ---------------------------------------------------------------------------
// POST /api/tools/competitor-spy
// Fetches a competitor URL and extracts strategic signals
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { url: string };
    if (!body.url) return NextResponse.json({ ok: false, error: "URL required" }, { status: 400 });

    const targetUrl = body.url.startsWith("http") ? body.url : `https://${body.url}`;

    const controller = new AbortController();
    setTimeout(() => controller.abort(), 15000);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Himalaya/1.0)" },
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `Failed to fetch: ${res.status}` }, { status: 400 });
    }

    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch?.[1]?.trim() ?? "";

    // Extract headline (H1)
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const headline = h1Match?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";

    // Extract CTAs (button text, link text with action words)
    const ctaPattern = /<(?:button|a)[^>]*>([\s\S]*?)<\/(?:button|a)>/gi;
    const ctaMatches = [...html.matchAll(ctaPattern)];
    const ctas = ctaMatches
      .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
      .filter((t) => t.length >= 3 && t.length <= 50 && /get|start|try|buy|sign|join|book|schedule|learn|shop|order|claim|download|free|contact/i.test(t))
      .slice(0, 8);

    // Extract trust signals
    const trustPatterns = [
      /(\d+[k+]?\+?\s*(?:customers?|clients?|users?|businesses|reviews?|ratings?))/gi,
      /(rated\s+\d+(?:\.\d+)?(?:\s*\/\s*5|\s*stars?))/gi,
      /(money.?back\s*guarantee|satisfaction\s*guarantee|risk.?free|no.?risk)/gi,
      /(trusted\s+by|as\s+seen\s+in|featured\s+in|certified|accredited)/gi,
      /(SSL|secure|encrypted|HIPAA|GDPR|SOC\s*2)/gi,
    ];
    const trustSignals: string[] = [];
    for (const pattern of trustPatterns) {
      const matches = html.match(pattern);
      if (matches) trustSignals.push(...matches.slice(0, 3));
    }

    // Extract benefits (list items, feature text)
    const liMatches = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
    const benefits = liMatches
      .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
      .filter((t) => t.length >= 10 && t.length <= 100)
      .slice(0, 8);

    // Detect pricing
    const priceMatch = html.match(/\$\d+(?:\.\d{2})?(?:\s*\/\s*(?:mo|month|yr|year))?/i);
    const pricing = priceMatch?.[0] ?? null;

    // Detect weaknesses
    const weaknesses: string[] = [];
    if (!html.match(/<meta[^>]*name=["']description["']/i)) weaknesses.push("No meta description — poor SEO");
    if (!headline) weaknesses.push("No H1 tag — unclear page focus");
    if (trustSignals.length === 0) weaknesses.push("No visible trust signals or social proof");
    if (ctas.length <= 1) weaknesses.push("Weak or missing CTAs — low conversion potential");
    if (!pricing) weaknesses.push("No visible pricing — creates friction");
    if (!html.match(/testimonial|review|case.?study/i)) weaknesses.push("No testimonials or case studies visible");
    if (!html.match(/guarantee|risk.?free|money.?back/i)) weaknesses.push("No guarantee — higher perceived risk");
    if (!html.match(/faq|frequently.?asked/i)) weaknesses.push("No FAQ section — objections unaddressed");

    // Detect tech stack
    const techStack: string[] = [];
    if (/wordpress/i.test(html)) techStack.push("WordPress");
    if (/shopify/i.test(html)) techStack.push("Shopify");
    if (/wix/i.test(html)) techStack.push("Wix");
    if (/squarespace/i.test(html)) techStack.push("Squarespace");
    if (/react/i.test(html) || /__next/i.test(html)) techStack.push("React/Next.js");
    if (/stripe/i.test(html)) techStack.push("Stripe");
    if (/mailchimp/i.test(html)) techStack.push("Mailchimp");
    if (/hubspot/i.test(html)) techStack.push("HubSpot");
    if (/google-analytics|gtag|GA4/i.test(html)) techStack.push("Google Analytics");
    if (/fbevents|facebook.*pixel/i.test(html)) techStack.push("Meta Pixel");
    if (/tiktok.*pixel|ttq/i.test(html)) techStack.push("TikTok Pixel");
    if (/intercom/i.test(html)) techStack.push("Intercom");
    if (/crisp/i.test(html)) techStack.push("Crisp Chat");
    if (/calendly/i.test(html)) techStack.push("Calendly");

    // Social links
    const socialPatterns = [
      /href=["'](https?:\/\/(?:www\.)?(?:facebook|fb)\.com\/[^"']+)["']/gi,
      /href=["'](https?:\/\/(?:www\.)?instagram\.com\/[^"']+)["']/gi,
      /href=["'](https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^"']+)["']/gi,
      /href=["'](https?:\/\/(?:www\.)?linkedin\.com\/[^"']+)["']/gi,
      /href=["'](https?:\/\/(?:www\.)?tiktok\.com\/@[^"']+)["']/gi,
      /href=["'](https?:\/\/(?:www\.)?youtube\.com\/[^"']+)["']/gi,
    ];
    const socialLinks: string[] = [];
    for (const pattern of socialPatterns) {
      const match = html.match(pattern);
      if (match) socialLinks.push(match[0].replace(/href=["']/g, "").replace(/["']/g, ""));
    }

    return NextResponse.json({
      ok: true,
      result: {
        url: targetUrl,
        title,
        headline,
        ctas: [...new Set(ctas)],
        trustSignals: [...new Set(trustSignals)].slice(0, 6),
        benefits: [...new Set(benefits)].slice(0, 8),
        pricing,
        weaknesses,
        techStack,
        socialLinks: [...new Set(socialLinks)].slice(0, 6),
      },
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : "Analysis failed",
    }, { status: 500 });
  }
}
