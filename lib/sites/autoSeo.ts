// ---------------------------------------------------------------------------
// Auto-SEO Generator — generates SEO metadata for site pages from content
// No user input needed. Runs at publish time.
// ---------------------------------------------------------------------------

import type { Block } from "@/components/site-builder/BlockRenderer";

export type SeoMeta = {
  title: string;
  description: string;
};

/** Extract text content from blocks to build SEO metadata */
export function generateSeoFromBlocks(
  siteName: string,
  blocks: Block[]
): SeoMeta {
  // Find hero block for headline
  const hero = blocks.find((b) => b.type === "hero");
  const headline = (hero?.props?.headline as string) ?? "";
  const subheadline = (hero?.props?.subheadline as string) ?? "";

  // Find text blocks for description content
  const textBlocks = blocks.filter((b) => b.type === "text");
  const bodyText = textBlocks
    .map((b) => (b.props?.body as string) ?? (b.props?.content as string) ?? "")
    .filter(Boolean)
    .join(" ");

  // Find features for keywords
  const features = blocks.find((b) => b.type === "features");
  const featureItems = (features?.props?.items as { title: string }[]) ?? [];
  const featureKeywords = featureItems.map((f) => f.title).join(", ");

  // Find CTA for action words
  const cta = blocks.find((b) => b.type === "cta");
  const ctaHeadline = (cta?.props?.headline as string) ?? "";

  // Build title (under 60 chars)
  let title = headline;
  if (title.length > 55) title = title.slice(0, 52) + "...";
  if (!title) title = siteName;
  if (title.length < 30 && siteName && !title.includes(siteName)) {
    title = `${title} | ${siteName}`;
  }

  // Build description (under 155 chars)
  let description = subheadline || ctaHeadline || "";
  if (!description && bodyText) {
    // Take first meaningful sentence
    const sentences = bodyText.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    description = sentences[0]?.trim() ?? "";
  }
  if (featureKeywords && description.length < 100) {
    description += ` ${featureKeywords}`;
  }
  if (description.length > 152) description = description.slice(0, 149) + "...";
  if (!description) description = `${siteName} — professional services and solutions`;

  return { title, description };
}

/** Auto-fill SEO on all pages of a site that are missing it */
export function shouldAutoFillSeo(page: {
  seoTitle?: string | null;
  seoDesc?: string | null;
}): boolean {
  return !page.seoTitle?.trim() || !page.seoDesc?.trim();
}
