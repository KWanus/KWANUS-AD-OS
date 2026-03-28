import type { Block } from "@/components/site-builder/BlockRenderer";

type AuditPageInput = {
  id: string;
  title: string;
  slug: string;
  published?: boolean;
  blocks?: Block[];
  seoTitle?: string | null;
  seoDesc?: string | null;
};

type AuditSiteInput = {
  published?: boolean;
  pages: AuditPageInput[];
  productCount?: number;
};

export type PageAudit = {
  id: string;
  title: string;
  slug: string;
  score: number;
  blockCount: number;
  issues: string[];
  wins: string[];
  hasHero: boolean;
  hasPrimaryCta: boolean;
  hasTrust: boolean;
  hasFaq: boolean;
  seoReady: boolean;
};

export type SitePublishAudit = {
  score: number;
  readiness: "strong" | "needs-work" | "critical";
  blockers: string[];
  wins: string[];
  recommendations: string[];
  pageAudits: PageAudit[];
  summary: {
    visiblePages: number;
    hiddenPages: number;
    pagesMissingSeo: number;
    pagesMissingCta: number;
    pagesMissingTrust: number;
    pagesMissingHero: number;
  };
};

const CTA_TYPES = new Set(["hero", "cta", "pricing", "checkout", "form"]);
const TRUST_TYPES = new Set(["testimonials", "trust_badges", "stats", "before_after", "guarantee"]);

function safeBlocks(blocks: Block[] | undefined) {
  return Array.isArray(blocks) ? blocks : [];
}

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function unique(items: string[]) {
  return Array.from(new Set(items));
}

function scoreToReadiness(score: number): SitePublishAudit["readiness"] {
  if (score >= 80) return "strong";
  if (score >= 60) return "needs-work";
  return "critical";
}

export function auditSitePage(page: AuditPageInput): PageAudit {
  const blocks = safeBlocks(page.blocks);
  const blockTypes = new Set(blocks.map((block) => block.type));
  const hasHero = blockTypes.has("hero");
  const hasPrimaryCta = blocks.some((block) => CTA_TYPES.has(block.type));
  const hasTrust = blocks.some((block) => TRUST_TYPES.has(block.type));
  const hasFaq = blockTypes.has("faq");
  const seoReady = hasText(page.seoTitle) && hasText(page.seoDesc);

  const issues: string[] = [];
  const wins: string[] = [];

  if (!hasHero) issues.push("No hero section to establish the offer immediately.");
  else wins.push("Has a hero section to frame the offer quickly.");

  if (!hasPrimaryCta) issues.push("No strong CTA or form block is present.");
  else wins.push("Has at least one clear conversion action.");

  if (!hasTrust) issues.push("Missing trust proof like testimonials, badges, stats, or guarantees.");
  else wins.push("Includes visible trust-building proof.");

  if (!seoReady) issues.push("SEO title or meta description is still missing.");
  else wins.push("SEO title and meta description are set.");

  if (blocks.length < 4) issues.push("Page is still thin and may feel incomplete to visitors.");
  else wins.push("Page has enough depth to feel more complete.");

  if (!hasFaq && blocks.length >= 5) {
    issues.push("A FAQ could help handle objections before visitors drop.");
  }

  const score = Math.max(
    30,
    100
      - (hasHero ? 0 : 18)
      - (hasPrimaryCta ? 0 : 18)
      - (hasTrust ? 0 : 16)
      - (seoReady ? 0 : 14)
      - (blocks.length >= 4 ? 0 : 12)
      - (hasFaq ? 0 : 6)
  );

  return {
    id: page.id,
    title: page.title,
    slug: page.slug,
    score,
    blockCount: blocks.length,
    issues,
    wins,
    hasHero,
    hasPrimaryCta,
    hasTrust,
    hasFaq,
    seoReady,
  };
}

export function auditPublishedSite(site: AuditSiteInput): SitePublishAudit {
  const pageAudits = site.pages.map((page) => auditSitePage(page));
  const visiblePages = site.pages.filter((page) => page.published !== false);
  const hiddenPages = site.pages.filter((page) => page.published === false);
  const visibleAudits = pageAudits.filter((audit) => visiblePages.some((page) => page.id === audit.id));
  const homeAudit = pageAudits.find((page) => page.slug === "home") ?? pageAudits[0];
  const hasLandingPage = pageAudits.some((page) => page.slug === "landing" || /landing/i.test(page.title));
  const hasCoreStructure = ["services", "faq"].every((slug) => pageAudits.some((page) => page.slug === slug));

  const pagesMissingSeo = visibleAudits.filter((page) => !page.seoReady).length;
  const pagesMissingCta = visibleAudits.filter((page) => !page.hasPrimaryCta).length;
  const pagesMissingTrust = visibleAudits.filter((page) => !page.hasTrust).length;
  const pagesMissingHero = visibleAudits.filter((page) => !page.hasHero).length;
  const averageVisibleScore = visibleAudits.length
    ? Math.round(visibleAudits.reduce((sum, page) => sum + page.score, 0) / visibleAudits.length)
    : 40;

  const blockers: string[] = [];
  const wins: string[] = [];
  const recommendations: string[] = [];

  if (!site.published) blockers.push("The site is still in draft, so nobody can see it live yet.");
  else wins.push("The site is already published.");

  if (visiblePages.length < 2) blockers.push("The public site still looks thin because too few pages are visible.");
  else wins.push("Visitors can move through multiple live pages.");

  if (!homeAudit?.hasHero) blockers.push("The homepage still needs a strong hero to explain the offer above the fold.");
  if (!homeAudit?.hasPrimaryCta) blockers.push("The homepage still needs a clear CTA or form.");
  if (!homeAudit?.hasTrust) blockers.push("The homepage needs stronger trust proof before traffic is sent to it.");

  if (!hasCoreStructure) blockers.push("The site is still missing core structure pages like Services or FAQ.");
  else wins.push("The core site structure is in place.");

  if (!hasLandingPage) recommendations.push("Add a focused landing page for paid traffic or special offers.");
  else wins.push("There is already a landing-style page for focused campaigns.");

  if (pagesMissingSeo > 0) blockers.push(`${pagesMissingSeo} visible page${pagesMissingSeo > 1 ? "s are" : " is"} missing SEO metadata.`);
  if (pagesMissingTrust > 0) recommendations.push(`Improve trust on ${pagesMissingTrust} page${pagesMissingTrust > 1 ? "s" : ""} with testimonials, badges, stats, or guarantees.`);
  if (pagesMissingCta > 0) recommendations.push(`Add clearer CTAs on ${pagesMissingCta} page${pagesMissingCta > 1 ? "s" : ""}.`);
  if (pagesMissingHero > 0) recommendations.push(`Add or improve hero sections on ${pagesMissingHero} page${pagesMissingHero > 1 ? "s" : ""}.`);
  if (hiddenPages.length > 0) recommendations.push(`${hiddenPages.length} page${hiddenPages.length > 1 ? "s are" : " is"} hidden. Decide whether they should stay draft or go live.`);
  if ((site.productCount ?? 0) > 0) wins.push("The site already has products connected to it.");

  const score = Math.max(
    35,
    averageVisibleScore
      - (site.published ? 0 : 14)
      - (visiblePages.length >= 2 ? 0 : 10)
      - (hasCoreStructure ? 0 : 10)
      - (hasLandingPage ? 0 : 6)
      - pagesMissingSeo * 4
      - pagesMissingTrust * 4
      - pagesMissingCta * 4
  );

  return {
    score,
    readiness: scoreToReadiness(score),
    blockers: unique(blockers),
    wins: unique(wins),
    recommendations: unique(recommendations),
    pageAudits,
    summary: {
      visiblePages: visiblePages.length,
      hiddenPages: hiddenPages.length,
      pagesMissingSeo,
      pagesMissingCta,
      pagesMissingTrust,
      pagesMissingHero,
    },
  };
}
