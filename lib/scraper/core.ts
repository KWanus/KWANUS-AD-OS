// ---------------------------------------------------------------------------
// Himalaya Scraper Core — our own scraping engine
// No Apify dependency. No monthly cost. Full control.
//
// Architecture:
// - fetchPage(): raw HTTP fetch with retry, rotation, timeout
// - parseHTML(): cheerio-based extraction
// - scrapeUrl(): combines fetch + parse
// - Each scraper module uses core for its specific extraction
// ---------------------------------------------------------------------------

import * as cheerio from "cheerio";

export type FetchOptions = {
  timeout?: number;
  retries?: number;
  userAgent?: string;
  headers?: Record<string, string>;
  followRedirects?: boolean;
};

export type FetchResult = {
  ok: boolean;
  status: number;
  html: string;
  url: string;           // Final URL after redirects
  error?: string;
  responseTimeMs: number;
};

export type ExtractedPage = {
  url: string;
  title: string;
  description: string;
  h1: string;
  headings: { level: number; text: string }[];
  links: { text: string; href: string }[];
  images: { src: string; alt: string }[];
  textContent: string;
  wordCount: number;
  $: cheerio.CheerioAPI;  // For custom extraction
};

// Rotating user agents to avoid blocks
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/** Fetch a page with retry and timeout */
export async function fetchPage(url: string, options?: FetchOptions): Promise<FetchResult> {
  const timeout = options?.timeout ?? 15000;
  const retries = options?.retries ?? 2;
  const targetUrl = url.startsWith("http") ? url : `https://${url}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const res = await fetch(targetUrl, {
        signal: controller.signal,
        redirect: options?.followRedirects === false ? "manual" : "follow",
        headers: {
          "User-Agent": options?.userAgent ?? randomUA(),
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate",
          ...options?.headers,
        },
      });

      clearTimeout(timer);

      const html = await res.text();
      return {
        ok: res.ok,
        status: res.status,
        html,
        url: res.url || targetUrl,
        responseTimeMs: Date.now() - start,
      };
    } catch (err) {
      if (attempt === retries) {
        return {
          ok: false,
          status: 0,
          html: "",
          url: targetUrl,
          error: err instanceof Error ? err.message : "Fetch failed",
          responseTimeMs: Date.now() - start,
        };
      }
      // Wait before retry (exponential backoff)
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  return { ok: false, status: 0, html: "", url: targetUrl, error: "Max retries exceeded", responseTimeMs: 0 };
}

/** Parse HTML and extract common elements */
export function parseHTML(html: string, url: string): ExtractedPage {
  const $ = cheerio.load(html);

  // Remove script/style for text extraction
  const cleanHtml = $.html();
  const $clean = cheerio.load(cleanHtml);
  $clean("script, style, noscript").remove();

  const title = $("title").first().text().trim();
  const description = $('meta[name="description"]').attr("content")?.trim() ?? $('meta[property="og:description"]').attr("content")?.trim() ?? "";
  const h1 = $("h1").first().text().trim();

  const headings: ExtractedPage["headings"] = [];
  $("h1, h2, h3, h4").each((_, el) => {
    const level = parseInt(el.tagName.replace("h", ""));
    const text = $(el).text().trim();
    if (text.length > 2 && text.length < 200) {
      headings.push({ level, text });
    }
  });

  const links: ExtractedPage["links"] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const text = $(el).text().trim();
    if (text.length > 1 && text.length < 100 && href.length > 1) {
      links.push({ text, href: resolveUrl(href, url) });
    }
  });

  const images: ExtractedPage["images"] = [];
  $("img[src]").each((_, el) => {
    const src = $(el).attr("src") ?? "";
    const alt = $(el).attr("alt")?.trim() ?? "";
    if (src.length > 5) {
      images.push({ src: resolveUrl(src, url), alt });
    }
  });

  const textContent = $clean.text().replace(/\s+/g, " ").trim();
  const wordCount = textContent.split(/\s+/).filter(Boolean).length;

  return { url, title, description, h1, headings, links, images, textContent, wordCount, $ };
}

/** Convenience: fetch + parse in one call */
export async function scrapeUrl(url: string, options?: FetchOptions): Promise<ExtractedPage | null> {
  const result = await fetchPage(url, options);
  if (!result.ok || !result.html) return null;
  return parseHTML(result.html, result.url);
}

/** Extract specific data patterns from text */
export function extractPatterns(text: string): {
  emails: string[];
  phones: string[];
  prices: string[];
  urls: string[];
  socialLinks: string[];
} {
  const emails = [...new Set(text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? [])];
  const phones = [...new Set(text.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) ?? [])];
  const prices = [...new Set(text.match(/\$\d+(?:,\d{3})*(?:\.\d{2})?(?:\s*\/\s*(?:mo|month|yr|year))?/gi) ?? [])];
  const urls = [...new Set(text.match(/https?:\/\/[^\s"'<>]+/g) ?? [])];
  const socialLinks = urls.filter((u) =>
    /facebook\.com|instagram\.com|twitter\.com|x\.com|linkedin\.com|tiktok\.com|youtube\.com/i.test(u)
  );

  return { emails, phones, prices, urls, socialLinks };
}

/** Extract structured data (JSON-LD) from page */
export function extractStructuredData($: cheerio.CheerioAPI): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() ?? "{}");
      if (data) results.push(data);
    } catch { /* invalid JSON */ }
  });
  return results;
}

/** Detect tech stack from HTML */
export function detectTechStack(html: string, $: cheerio.CheerioAPI): string[] {
  const tech: string[] = [];

  if (html.includes("__next") || html.includes("_next/static")) tech.push("Next.js");
  if (html.includes("__nuxt") || html.includes("nuxt")) tech.push("Nuxt.js");
  if (html.includes("wp-content") || html.includes("wordpress")) tech.push("WordPress");
  if (html.includes("shopify") || html.includes("myshopify")) tech.push("Shopify");
  if (html.includes("wix.com")) tech.push("Wix");
  if (html.includes("squarespace")) tech.push("Squarespace");
  if (html.includes("webflow")) tech.push("Webflow");
  if (html.includes("react")) tech.push("React");
  if (html.includes("vue") || html.includes("Vue.js")) tech.push("Vue.js");
  if (html.includes("angular")) tech.push("Angular");

  // Analytics & tracking
  if (html.includes("gtag") || html.includes("google-analytics") || html.includes("GA4")) tech.push("Google Analytics");
  if (html.includes("fbevents") || html.includes("facebook.net")) tech.push("Meta Pixel");
  if (html.includes("tiktok") && html.includes("pixel")) tech.push("TikTok Pixel");
  if (html.includes("hotjar")) tech.push("Hotjar");
  if (html.includes("clarity.ms")) tech.push("Microsoft Clarity");

  // Marketing
  if (html.includes("mailchimp")) tech.push("Mailchimp");
  if (html.includes("hubspot")) tech.push("HubSpot");
  if (html.includes("intercom")) tech.push("Intercom");
  if (html.includes("crisp")) tech.push("Crisp");
  if (html.includes("drift")) tech.push("Drift");
  if (html.includes("calendly")) tech.push("Calendly");
  if (html.includes("typeform")) tech.push("Typeform");

  // Payments
  if (html.includes("stripe")) tech.push("Stripe");
  if (html.includes("paypal")) tech.push("PayPal");
  if (html.includes("gumroad")) tech.push("Gumroad");

  // CDN / hosting
  if ($('link[href*="cloudflare"]').length > 0 || html.includes("cloudflare")) tech.push("Cloudflare");
  if (html.includes("vercel")) tech.push("Vercel");
  if (html.includes("netlify")) tech.push("Netlify");

  return [...new Set(tech)];
}

// ── Helpers ─────────────────────────────────────────────────────────────

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}
