// ---------------------------------------------------------------------------
// POST /api/tools/seo-audit
// Fetches a URL and analyzes it for SEO issues
// Returns score, issues, and Google preview
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
      headers: { "User-Agent": "Himalaya-SEO-Audit/1.0" },
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `Failed to fetch: ${res.status}` }, { status: 400 });
    }

    const html = await res.text();
    const issues: { severity: "error" | "warning" | "pass"; message: string }[] = [];
    let score = 100;

    // Title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch?.[1]?.trim() ?? "";
    const titleLength = title.length;

    if (!title) { issues.push({ severity: "error", message: "Missing title tag" }); score -= 20; }
    else if (titleLength < 30) { issues.push({ severity: "warning", message: `Title too short (${titleLength} chars). Aim for 30-60.` }); score -= 5; }
    else if (titleLength > 60) { issues.push({ severity: "warning", message: `Title too long (${titleLength} chars). May be truncated in search.` }); score -= 3; }
    else { issues.push({ severity: "pass", message: `Title tag present (${titleLength} chars)` }); }

    // Meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i)
      ?? html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i);
    const description = descMatch?.[1]?.trim() ?? "";
    const descLength = description.length;

    if (!description) { issues.push({ severity: "error", message: "Missing meta description" }); score -= 15; }
    else if (descLength < 120) { issues.push({ severity: "warning", message: `Description too short (${descLength} chars). Aim for 120-160.` }); score -= 5; }
    else if (descLength > 160) { issues.push({ severity: "warning", message: `Description too long (${descLength} chars). Will be truncated.` }); score -= 2; }
    else { issues.push({ severity: "pass", message: `Meta description present (${descLength} chars)` }); }

    // H1
    const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) ?? [];
    const h1Count = h1Matches.length;
    const h1Text = h1Matches[0]?.replace(/<[^>]+>/g, "").trim() ?? "";

    if (h1Count === 0) { issues.push({ severity: "error", message: "No H1 tag found" }); score -= 10; }
    else if (h1Count > 1) { issues.push({ severity: "warning", message: `Multiple H1 tags (${h1Count}). Use only one per page.` }); score -= 5; }
    else { issues.push({ severity: "pass", message: "Single H1 tag present" }); }

    // Canonical
    const hasCanonical = /<link[^>]*rel=["']canonical["']/i.test(html);
    if (!hasCanonical) { issues.push({ severity: "warning", message: "No canonical URL set" }); score -= 3; }
    else { issues.push({ severity: "pass", message: "Canonical URL present" }); }

    // Viewport
    const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(html);
    if (!hasViewport) { issues.push({ severity: "error", message: "Missing viewport meta tag (not mobile-friendly)" }); score -= 10; }
    else { issues.push({ severity: "pass", message: "Viewport meta tag present" }); }

    // OG tags
    const hasOgTitle = /<meta[^>]*property=["']og:title["']/i.test(html);
    const hasOgImage = /<meta[^>]*property=["']og:image["']/i.test(html);
    if (!hasOgTitle) { issues.push({ severity: "warning", message: "Missing og:title (poor social sharing)" }); score -= 3; }
    if (!hasOgImage) { issues.push({ severity: "warning", message: "Missing og:image (no image when shared on social)" }); score -= 3; }
    if (hasOgTitle && hasOgImage) { issues.push({ severity: "pass", message: "Open Graph tags present" }); }

    // Images
    const imgMatches = html.match(/<img[^>]*>/gi) ?? [];
    const imageCount = imgMatches.length;
    const imagesWithoutAlt = imgMatches.filter((img) => !(/alt=["'][^"']+["']/i.test(img))).length;
    if (imagesWithoutAlt > 0) { issues.push({ severity: "warning", message: `${imagesWithoutAlt} of ${imageCount} images missing alt text` }); score -= Math.min(imagesWithoutAlt * 2, 10); }
    else if (imageCount > 0) { issues.push({ severity: "pass", message: `All ${imageCount} images have alt text` }); }

    // Word count
    const textContent = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const wordCount = textContent.split(/\s+/).length;
    if (wordCount < 300) { issues.push({ severity: "warning", message: `Thin content (${wordCount} words). Aim for 300+ for ranking.` }); score -= 5; }
    else { issues.push({ severity: "pass", message: `Content length: ${wordCount} words` }); }

    // Links
    const linkCount = (html.match(/<a[^>]*href/gi) ?? []).length;
    issues.push({ severity: "pass", message: `${linkCount} links found on page` });

    score = Math.max(0, Math.min(100, score));

    return NextResponse.json({
      ok: true,
      audit: {
        url: targetUrl,
        title,
        titleLength,
        description,
        descLength,
        h1Count,
        h1Text,
        hasCanonical,
        hasViewport,
        hasOgTitle,
        hasOgImage,
        imageCount,
        imagesWithoutAlt,
        linkCount,
        wordCount,
        score,
        issues,
      },
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : "Audit failed",
    }, { status: 500 });
  }
}
