// ---------------------------------------------------------------------------
// All Himalaya Scrapers — 15 core + future-proof extensions
// Each scraper uses the core engine. No external dependencies.
// ---------------------------------------------------------------------------

import { scrapeUrl, fetchPage, parseHTML, extractPatterns, detectTechStack, extractStructuredData } from "./core";

// ═══════════════════════════════════════════════════════════════════════
// 1. COMPETITOR SITE ANALYZER
// ═══════════════════════════════════════════════════════════════════════

export type CompetitorAnalysis = {
  url: string;
  title: string;
  headline: string;
  description: string;
  ctas: string[];
  pricing: string[];
  trustSignals: string[];
  benefits: string[];
  weaknesses: string[];
  techStack: string[];
  socialLinks: string[];
  emails: string[];
  phones: string[];
  wordCount: number;
  hasChat: boolean;
  hasBooking: boolean;
  hasFAQ: boolean;
  hasTestimonials: boolean;
  hasVideo: boolean;
  schemaTypes: string[];
};

export async function analyzeCompetitor(url: string): Promise<CompetitorAnalysis | null> {
  const page = await scrapeUrl(url);
  if (!page) return null;

  const $ = page.$;
  const html = $.html();
  const patterns = extractPatterns(page.textContent);
  const tech = detectTechStack(html, $);
  const schemas = extractStructuredData($);

  // Extract CTAs
  const ctas: string[] = [];
  $("button, a.btn, a.cta, [class*='cta'], [class*='button']").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length >= 3 && text.length <= 50) ctas.push(text);
  });

  // Extract trust signals
  const trustSignals: string[] = [];
  const trustPatterns = [
    /(\d+[k+]?\+?\s*(?:customers?|clients?|users?|businesses?|reviews?|ratings?))/gi,
    /(money.?back\s*guarantee|satisfaction\s*guarantee|risk.?free)/gi,
    /(trusted\s+by|as\s+seen\s+in|featured\s+in|certified|accredited)/gi,
    /(BBB|SSL|secure|encrypted|HIPAA|GDPR|SOC)/gi,
    /((\d+)\s*(?:years?|yrs?)\s*(?:experience|in business))/gi,
  ];
  for (const pattern of trustPatterns) {
    const matches = page.textContent.match(pattern);
    if (matches) trustSignals.push(...matches.slice(0, 3));
  }

  // Extract benefits (from lists)
  const benefits: string[] = [];
  $("li, [class*='benefit'], [class*='feature']").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length >= 15 && text.length <= 150 && !text.includes("{") && benefits.length < 10) {
      benefits.push(text);
    }
  });

  // Detect weaknesses
  const weaknesses: string[] = [];
  if (!page.description) weaknesses.push("No meta description");
  if (!page.h1) weaknesses.push("No H1 tag");
  if (trustSignals.length === 0) weaknesses.push("No trust signals");
  if (ctas.length <= 1) weaknesses.push("Weak CTAs");
  if (patterns.prices.length === 0) weaknesses.push("No visible pricing");
  if (!html.match(/testimonial|review|case.?study/i)) weaknesses.push("No testimonials");
  if (!html.match(/guarantee|risk.?free|money.?back/i)) weaknesses.push("No guarantee");
  if (!html.match(/faq|frequently/i)) weaknesses.push("No FAQ");
  if (page.wordCount < 300) weaknesses.push("Thin content");
  if (page.images.filter((i) => !i.alt).length > page.images.length * 0.5) weaknesses.push("Images missing alt text");

  return {
    url: page.url,
    title: page.title,
    headline: page.h1,
    description: page.description,
    ctas: [...new Set(ctas)].slice(0, 10),
    pricing: patterns.prices,
    trustSignals: [...new Set(trustSignals)].slice(0, 8),
    benefits: [...new Set(benefits)].slice(0, 10),
    weaknesses,
    techStack: tech,
    socialLinks: patterns.socialLinks,
    emails: patterns.emails,
    phones: patterns.phones,
    wordCount: page.wordCount,
    hasChat: /intercom|crisp|drift|tawk|livechat|chat.?widget/i.test(html),
    hasBooking: /calendly|booking|schedule|appointment/i.test(html),
    hasFAQ: /faq|frequently.?asked/i.test(html),
    hasTestimonials: /testimonial|review|case.?study|".*said/i.test(html),
    hasVideo: $("video, iframe[src*='youtube'], iframe[src*='vimeo']").length > 0,
    schemaTypes: schemas.map((s) => (s["@type"] as string) ?? "unknown"),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 2. GOOGLE MAPS BUSINESS SCRAPER
// ═══════════════════════════════════════════════════════════════════════

export type GoogleMapsResult = {
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  reviewCount: number;
  category: string;
};

export async function scrapeGoogleMaps(niche: string, location: string): Promise<GoogleMapsResult[]> {
  const serpApiKey = process.env.SERPAPI_KEY;
  if (!serpApiKey) return [];

  try {
    const query = encodeURIComponent(`${niche} in ${location}`);
    const url = `https://serpapi.com/search.json?engine=google_maps&q=${query}&api_key=${serpApiKey}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];

    const data = await res.json();
    const results = (data.local_results ?? []) as Record<string, unknown>[];

    return results.slice(0, 20).map((r) => ({
      name: String(r.title ?? ""),
      address: String(r.address ?? ""),
      phone: String(r.phone ?? ""),
      website: String(r.website ?? ""),
      rating: Number(r.rating ?? 0),
      reviewCount: Number(r.reviews ?? 0),
      category: String(r.type ?? ""),
    }));
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 3. REVIEW SCRAPER
// ═══════════════════════════════════════════════════════════════════════

export type ScrapedReview = {
  author: string;
  rating: number;
  text: string;
  date: string;
  platform: string;
  verified: boolean;
};

export async function scrapeReviews(url: string): Promise<ScrapedReview[]> {
  const page = await scrapeUrl(url);
  if (!page) return [];

  const $ = page.$;
  const reviews: ScrapedReview[] = [];

  // Generic review extraction (works across many sites)
  $("[class*='review'], [class*='testimonial'], [itemtype*='Review']").each((_, el) => {
    const text = $(el).find("[class*='text'], [class*='body'], [class*='content'], p").first().text().trim();
    const author = $(el).find("[class*='author'], [class*='name'], [class*='reviewer']").first().text().trim();
    const ratingEl = $(el).find("[class*='rating'], [class*='star']").first();
    const ratingText = ratingEl.attr("aria-label") ?? ratingEl.text();
    const ratingMatch = ratingText?.match(/(\d(?:\.\d)?)/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 5;

    if (text.length >= 20 && text.length <= 500) {
      reviews.push({
        author: author || "Customer",
        rating,
        text,
        date: "",
        platform: new URL(url).hostname,
        verified: false,
      });
    }
  });

  return reviews.slice(0, 20);
}

// ═══════════════════════════════════════════════════════════════════════
// 4. AD LIBRARY SCRAPER (Meta Ad Library)
// ═══════════════════════════════════════════════════════════════════════

export type ScrapedAd = {
  advertiser: string;
  adText: string;
  platform: string;
  startDate: string;
  status: string;
  mediaType: string;
};

export async function scrapeMetaAdLibrary(query: string): Promise<ScrapedAd[]> {
  // Meta Ad Library requires API access token
  // For now, use SerpAPI to find ad examples
  const serpApiKey = process.env.SERPAPI_KEY;
  if (!serpApiKey) return [];

  try {
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(`"${query}" facebook ad`)}&api_key=${serpApiKey}&num=10`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];

    const data = await res.json();
    return ((data.organic_results ?? []) as Record<string, string>[]).slice(0, 5).map((r) => ({
      advertiser: query,
      adText: r.snippet ?? "",
      platform: "meta",
      startDate: "",
      status: "active",
      mediaType: "text",
    }));
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 5. REDDIT/QUORA PAIN POINT SCRAPER
// ═══════════════════════════════════════════════════════════════════════

export type PainPointResult = {
  source: string;
  title: string;
  text: string;
  upvotes: number;
  url: string;
  sentiment: "pain" | "desire" | "question";
};

export async function scrapePainPoints(niche: string): Promise<PainPointResult[]> {
  const results: PainPointResult[] = [];

  // Scrape Google for Reddit/Quora posts about the niche
  const serpApiKey = process.env.SERPAPI_KEY;
  if (!serpApiKey) return [];

  const queries = [
    `site:reddit.com "${niche}" frustrated OR struggling OR "help me" OR "how do I"`,
    `site:quora.com "${niche}" best way OR recommend OR advice`,
  ];

  for (const query of queries) {
    try {
      const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${serpApiKey}&num=10`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;

      const data = await res.json();
      for (const r of ((data.organic_results ?? []) as Record<string, string>[]).slice(0, 5)) {
        const text = r.snippet ?? "";
        const sentiment: PainPointResult["sentiment"] =
          /frustrated|struggling|hate|tired|sick of|can't|won't|problem/i.test(text) ? "pain" :
          /want|wish|dream|hope|looking for|need/i.test(text) ? "desire" : "question";

        results.push({
          source: r.link?.includes("reddit") ? "reddit" : "quora",
          title: r.title ?? "",
          text,
          upvotes: 0,
          url: r.link ?? "",
          sentiment,
        });
      }
    } catch {
      continue;
    }
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════
// 6. SEO DATA SCRAPER
// ═══════════════════════════════════════════════════════════════════════

export type SEOData = {
  url: string;
  title: string;
  titleLength: number;
  description: string;
  descLength: number;
  h1: string;
  h1Count: number;
  canonicalUrl: string | null;
  hasViewport: boolean;
  hasOgTags: boolean;
  hasTwitterCards: boolean;
  hasSchema: boolean;
  schemaTypes: string[];
  imageCount: number;
  imagesWithoutAlt: number;
  internalLinks: number;
  externalLinks: number;
  wordCount: number;
  loadTimeMs: number;
  techStack: string[];
  score: number;
};

export async function scrapeSEOData(url: string): Promise<SEOData | null> {
  const result = await fetchPage(url);
  if (!result.ok) return null;

  const page = parseHTML(result.html, result.url);
  const $ = page.$;
  const html = result.html;

  const canonical = $('link[rel="canonical"]').attr("href") ?? null;
  const hasViewport = $('meta[name="viewport"]').length > 0;
  const hasOg = $('meta[property^="og:"]').length > 0;
  const hasTwitter = $('meta[name^="twitter:"]').length > 0;
  const schemas = extractStructuredData($);
  const tech = detectTechStack(html, $);

  const imagesWithoutAlt = page.images.filter((i) => !i.alt || i.alt.length < 3).length;

  const baseHost = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  const internal = page.links.filter((l) => { try { return new URL(l.href).hostname === baseHost; } catch { return false; } });
  const external = page.links.filter((l) => { try { return new URL(l.href).hostname !== baseHost; } catch { return false; } });

  const h1Count = page.headings.filter((h) => h.level === 1).length;

  // Score
  let score = 50;
  if (page.title && page.title.length >= 30 && page.title.length <= 60) score += 10;
  else if (!page.title) score -= 15;
  if (page.description && page.description.length >= 120 && page.description.length <= 160) score += 10;
  else if (!page.description) score -= 10;
  if (h1Count === 1) score += 5; else if (h1Count === 0) score -= 10;
  if (hasViewport) score += 5; else score -= 10;
  if (hasOg) score += 3;
  if (schemas.length > 0) score += 5;
  if (imagesWithoutAlt === 0 && page.images.length > 0) score += 5;
  else if (imagesWithoutAlt > 3) score -= 5;
  if (page.wordCount >= 300) score += 5; else score -= 5;
  if (canonical) score += 3;
  score = Math.max(0, Math.min(100, score));

  return {
    url: page.url,
    title: page.title,
    titleLength: page.title.length,
    description: page.description,
    descLength: page.description.length,
    h1: page.h1,
    h1Count,
    canonicalUrl: canonical,
    hasViewport,
    hasOgTags: hasOg,
    hasTwitterCards: hasTwitter,
    hasSchema: schemas.length > 0,
    schemaTypes: schemas.map((s) => String(s["@type"] ?? "unknown")),
    imageCount: page.images.length,
    imagesWithoutAlt,
    internalLinks: internal.length,
    externalLinks: external.length,
    wordCount: page.wordCount,
    loadTimeMs: result.responseTimeMs,
    techStack: tech,
    score,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 7. EMAIL/CONTACT FINDER
// ═══════════════════════════════════════════════════════════════════════

export type ContactInfo = {
  url: string;
  emails: string[];
  phones: string[];
  socialLinks: string[];
  contactPageUrl: string | null;
};

export async function findContacts(url: string): Promise<ContactInfo> {
  const page = await scrapeUrl(url);
  if (!page) return { url, emails: [], phones: [], socialLinks: [], contactPageUrl: null };

  const patterns = extractPatterns(page.textContent);

  // Also check /contact and /about pages
  const contactLinks = page.links.filter((l) =>
    /contact|about|reach|connect/i.test(l.text) || /contact|about/i.test(l.href)
  );

  let contactPageUrl = contactLinks[0]?.href ?? null;

  // Scrape contact page for more info
  if (contactPageUrl) {
    const contactPage = await scrapeUrl(contactPageUrl);
    if (contactPage) {
      const contactPatterns = extractPatterns(contactPage.textContent);
      patterns.emails.push(...contactPatterns.emails);
      patterns.phones.push(...contactPatterns.phones);
      patterns.socialLinks.push(...contactPatterns.socialLinks);
    }
  }

  return {
    url: page.url,
    emails: [...new Set(patterns.emails)].slice(0, 5),
    phones: [...new Set(patterns.phones)].slice(0, 3),
    socialLinks: [...new Set(patterns.socialLinks)].slice(0, 6),
    contactPageUrl,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 8. TREND SCRAPER (Google Trends via SerpAPI)
// ═══════════════════════════════════════════════════════════════════════

export type TrendData = {
  keyword: string;
  interest: number;       // 0-100
  trend: "rising" | "stable" | "declining";
  relatedQueries: string[];
};

export async function scrapeTrends(keyword: string): Promise<TrendData | null> {
  const serpApiKey = process.env.SERPAPI_KEY;
  if (!serpApiKey) return null;

  try {
    const url = `https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(keyword)}&api_key=${serpApiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;

    const data = await res.json();
    const timeline = data.interest_over_time?.timeline_data ?? [];
    const recent = timeline.slice(-4);
    const older = timeline.slice(-8, -4);

    const recentAvg = recent.reduce((s: number, t: Record<string, unknown[]>) => {
      const vals = t.values as { value: string }[];
      return s + parseInt(vals?.[0]?.value ?? "0");
    }, 0) / Math.max(recent.length, 1);

    const olderAvg = older.reduce((s: number, t: Record<string, unknown[]>) => {
      const vals = t.values as { value: string }[];
      return s + parseInt(vals?.[0]?.value ?? "0");
    }, 0) / Math.max(older.length, 1);

    const trend: TrendData["trend"] =
      recentAvg > olderAvg * 1.15 ? "rising" :
      recentAvg < olderAvg * 0.85 ? "declining" : "stable";

    const related = ((data.related_queries?.rising ?? []) as Record<string, string>[])
      .slice(0, 10).map((q) => q.query ?? "");

    return {
      keyword,
      interest: Math.round(recentAvg),
      trend,
      relatedQueries: related,
    };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 9. PRICE MONITOR
// ═══════════════════════════════════════════════════════════════════════

export type PriceSnapshot = {
  url: string;
  prices: string[];
  scrapedAt: string;
};

export async function scrapePrices(url: string): Promise<PriceSnapshot | null> {
  const page = await scrapeUrl(url);
  if (!page) return null;

  const patterns = extractPatterns(page.textContent);

  return {
    url: page.url,
    prices: patterns.prices,
    scrapedAt: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 10. PAGE PERFORMANCE SCRAPER
// ═══════════════════════════════════════════════════════════════════════

export type PerformanceData = {
  url: string;
  loadTimeMs: number;
  pageSize: number;        // bytes
  resourceCount: number;
  hasViewport: boolean;
  score: number;           // 0-100 simplified performance score
};

export async function scrapePerformance(url: string): Promise<PerformanceData | null> {
  const result = await fetchPage(url);
  if (!result.ok) return null;

  const pageSize = new Blob([result.html]).size;
  const $ = parseHTML(result.html, result.url).$;
  const resources = $("script[src], link[rel='stylesheet'], img[src]").length;
  const hasViewport = $('meta[name="viewport"]').length > 0;

  let score = 70;
  if (result.responseTimeMs < 1000) score += 15;
  else if (result.responseTimeMs < 2000) score += 5;
  else if (result.responseTimeMs > 5000) score -= 20;
  if (pageSize < 500000) score += 5;
  else if (pageSize > 2000000) score -= 10;
  if (resources < 30) score += 5;
  else if (resources > 80) score -= 10;
  if (hasViewport) score += 5;
  score = Math.max(0, Math.min(100, score));

  return {
    url: result.url,
    loadTimeMs: result.responseTimeMs,
    pageSize,
    resourceCount: resources,
    hasViewport,
    score,
  };
}
