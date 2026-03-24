import type { FetchedPage } from "./fetchPage";

export type LinkType = "product" | "homepage" | "landing" | "unknown";

const PRODUCT_SIGNALS = [
  "add to cart", "buy now", "order now", "purchase", "shop now",
  "add to bag", "checkout", "price", "$", "quantity", "in stock",
  "free shipping", "returns", "product", "review",
];

const LANDING_SIGNALS = [
  "get started", "sign up", "claim", "limited", "exclusive",
  "free trial", "join now", "access", "download", "watch",
  "register", "book", "schedule", "apply now", "get instant",
];

const HOMEPAGE_SIGNALS = [
  "about us", "our services", "contact", "blog", "portfolio",
  "home", "welcome to", "what we do", "meet the team",
];

function countSignals(text: string, signals: string[]): number {
  const lower = text.toLowerCase();
  return signals.reduce((acc, s) => acc + (lower.includes(s) ? 1 : 0), 0);
}

export function classifyLink(url: string, page: FetchedPage): LinkType {
  const combined = [
    page.title,
    page.metaDescription,
    ...page.headings,
    ...page.ctas,
    page.bodyText.slice(0, 1000),
  ]
    .join(" ")
    .toLowerCase();

  // URL-based hints
  const urlLower = url.toLowerCase();
  if (urlLower.includes("/products/") || urlLower.includes("/item/") || urlLower.includes("/p/")) {
    return "product";
  }

  const productScore = countSignals(combined, PRODUCT_SIGNALS);
  const landingScore = countSignals(combined, LANDING_SIGNALS);
  const homepageScore = countSignals(combined, HOMEPAGE_SIGNALS);

  if (productScore >= 3) return "product";
  if (landingScore >= 3) return "landing";
  if (homepageScore >= 3) return "homepage";

  // Tiebreak: if URL is root domain, call it homepage
  try {
    const parsed = new URL(url);
    if (parsed.pathname === "/" || parsed.pathname === "") return "homepage";
  } catch {
    // ignore
  }

  return "unknown";
}
