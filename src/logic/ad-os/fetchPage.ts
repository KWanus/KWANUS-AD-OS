export type FetchedPage = {
  ok: boolean;
  title: string;
  metaDescription: string;
  headings: string[];
  bodyText: string;
  ctas: string[];
  images: string[];
  error?: string;
};

function extractBetweenTags(html: string, tag: string): string[] {
  const results: string[] = [];
  const pattern = new RegExp(`<${tag}[^>]*>([^<]+)<\\/${tag}>`, "gi");
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const text = match[1].trim();
    if (text.length > 2) results.push(text);
  }
  return results;
}

function stripTags(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMeta(html: string, name: string): string {
  const m = html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']+)["']`, "i"))
    || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${name}["']`, "i"));
  return m ? m[1].trim() : "";
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : "";
}

function resolveUrl(src: string, baseUrl: string): string | null {
  if (!src) return null;
  try {
    return new URL(src, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractImages(html: string, baseUrl: string): string[] {
  const results = new Set<string>();

  const metaMatches = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi) ?? [];
  for (const tag of metaMatches) {
    const match = tag.match(/content=["']([^"']+)["']/i);
    if (match?.[1]) {
      const resolved = resolveUrl(match[1], baseUrl);
      if (resolved) results.add(resolved);
    }
  }

  const imgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let imgMatch: RegExpExecArray | null;
  while ((imgMatch = imgPattern.exec(html)) !== null) {
    const resolved = resolveUrl(imgMatch[1], baseUrl);
    if (resolved && !resolved.startsWith("data:")) {
      results.add(resolved);
    }
    if (results.size >= 8) break;
  }

  return [...results].slice(0, 6);
}

// Real browser UA rotation — avoids bot blocks
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
];

// Extract niche keywords from URL path/domain when page is unreachable
function inferFromUrl(url: string): Partial<FetchedPage> {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace("www.", "");
    const path = parsed.pathname.replace(/[-_/]/g, " ").replace(/\.\w+$/, "").trim();
    const keywords = [domain, path].filter(Boolean).join(" ");
    return {
      title: keywords,
      bodyText: `Product page: ${keywords}`,
      metaDescription: `${keywords} — product or service`,
    };
  } catch {
    return {};
  }
}

async function tryFetch(url: string, ua: string): Promise<{ html: string; status: number } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return { html: "", status: res.status };
    const html = await res.text();
    return { html, status: res.status };
  } catch {
    return null;
  }
}

export async function fetchPage(url: string): Promise<FetchedPage> {
  // Try with each UA in rotation
  let html = "";
  let lastStatus = 0;

  for (const ua of USER_AGENTS) {
    const result = await tryFetch(url, ua);
    if (result && result.html.length > 100) {
      html = result.html;
      break;
    }
    if (result) lastStatus = result.status;
  }

  // If we got blocked/404 — fall back to URL inference so analysis still runs
  if (!html) {
    const urlSignals = inferFromUrl(url);
    if (urlSignals.title || urlSignals.bodyText) {
      return {
        ok: true, // partial — allows analysis to proceed with URL signals
        title: urlSignals.title ?? "",
        metaDescription: urlSignals.metaDescription ?? "",
        headings: [],
        bodyText: urlSignals.bodyText ?? "",
        ctas: [],
        images: [],
        error: lastStatus ? `HTTP ${lastStatus} — analyzing from URL signals` : "Page unreachable — analyzing from URL signals",
      };
    }
    return {
      ok: false,
      title: "",
      metaDescription: "",
      headings: [],
      bodyText: "",
      ctas: [],
      images: [],
      error: lastStatus ? `HTTP ${lastStatus}` : "Could not reach page — check the URL is publicly accessible",
    };
  }

  const title = extractTitle(html);
  const metaDescription = extractMeta(html, "description") || extractMeta(html, "og:description");
  const h1s = extractBetweenTags(html, "h1");
  const h2s = extractBetweenTags(html, "h2");
  const h3s = extractBetweenTags(html, "h3");
  const headings = [...h1s, ...h2s, ...h3s].slice(0, 12);
  const bodyText = stripTags(html).slice(0, 5000);
  const buttonTexts = extractBetweenTags(html, "button").slice(0, 6);
  const aTexts = extractBetweenTags(html, "a")
    .filter((t) => t.length < 60)
    .slice(0, 6);
  const ctas = [...new Set([...buttonTexts, ...aTexts])].slice(0, 8);
  const images = extractImages(html, url);

  return { ok: true, title, metaDescription, headings, bodyText, ctas, images };
}
