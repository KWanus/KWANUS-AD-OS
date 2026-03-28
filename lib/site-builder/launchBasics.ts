type BusinessProfileLike = {
  niche?: string | null;
  location?: string | null;
  mainGoal?: string | null;
};

type SiteLike = {
  name: string;
  slug: string;
  description?: string | null;
  faviconEmoji?: string | null;
  customDomain?: string | null;
};

type SitePageLike = {
  title: string;
  slug: string;
  seoTitle?: string | null;
  seoDesc?: string | null;
};

function hasText(value?: string | null) {
  return Boolean(value && value.trim().length > 0);
}

function clip(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1).trim()}…`;
}

export function normalizeCustomDomain(value?: string | null) {
  if (!value?.trim()) return null;
  return value.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

export function inferFaviconEmoji(site: SiteLike, profile?: BusinessProfileLike | null) {
  const haystack = `${site.name} ${profile?.niche ?? ""}`.toLowerCase();

  if (/(roof|contractor|repair|hvac|plumb|electric|landscap|clean|pest)/.test(haystack)) return "🔧";
  if (/(med spa|spa|beauty|skin|esthetic|salon|cosmetic)/.test(haystack)) return "✨";
  if (/(law|legal|attorney|injury)/.test(haystack)) return "⚖️";
  if (/(dental|dentist|ortho|clinic|medical|health)/.test(haystack)) return "🩺";
  if (/(real estate|realtor|property|home)/.test(haystack)) return "🏠";
  if (/(coach|consult|agency|marketing|growth)/.test(haystack)) return "🚀";
  if (/(store|shop|ecommerce|fashion|product)/.test(haystack)) return "🛍️";
  return "🚀";
}

export function buildSiteDescription(site: SiteLike, profile?: BusinessProfileLike | null) {
  const niche = profile?.niche?.trim();
  const location = profile?.location?.trim();
  const goal = profile?.mainGoal?.trim().replaceAll("_", " ");

  const segments = [
    niche ? `${site.name} helps customers with ${niche.toLowerCase()}` : `${site.name} helps customers take the next step`,
    location ? `in ${location}` : "",
  ].filter(Boolean);

  const closer = goal
    ? `Built to support ${goal.toLowerCase()} with a cleaner, higher-converting online presence.`
    : "Built to convert visitors into qualified leads, calls, and booked opportunities.";

  return clip(`${segments.join(" ")}. ${closer}`.replace(/\s+\./g, "."), 155);
}

export function buildSeoTitle(site: SiteLike, page: SitePageLike, profile?: BusinessProfileLike | null) {
  const niche = profile?.niche?.trim();
  const location = profile?.location?.trim();
  const pageName = /^(home)$/i.test(page.slug) ? "" : page.title.trim();
  const parts = [
    pageName,
    site.name.trim(),
    niche,
    location,
  ].filter(Boolean);

  return clip(parts.join(" | "), 60);
}

export function buildSeoDescription(site: SiteLike, page: SitePageLike, profile?: BusinessProfileLike | null) {
  const niche = profile?.niche?.trim();
  const location = profile?.location?.trim();
  const pageName = /^(home)$/i.test(page.slug) ? "homepage" : page.title.trim().toLowerCase();
  const base = niche
    ? `Explore ${pageName} details for ${site.name}, a ${niche.toLowerCase()} business${location ? ` in ${location}` : ""}.`
    : `Explore ${pageName} details for ${site.name}${location ? ` in ${location}` : ""}.`;

  return clip(`${base} Clear messaging, stronger trust, and a direct next step for visitors.`, 155);
}

export function needsLaunchBasics(site: SiteLike, pages: SitePageLike[]) {
  return (
    !hasText(site.description) ||
    !hasText(site.faviconEmoji) ||
    normalizeCustomDomain(site.customDomain) !== site.customDomain ||
    pages.some((page) => !hasText(page.seoTitle) || !hasText(page.seoDesc))
  );
}
