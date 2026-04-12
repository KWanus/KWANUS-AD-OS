// ---------------------------------------------------------------------------
// Site Deployer — makes sites accessible on real URLs
//
// When a user publishes a site, this module:
// 1. Generates a unique public URL on the app domain
// 2. If custom domain is set, provides DNS instructions
// 3. Pings search engines to index the site
// 4. Generates and caches the sitemap
//
// Sites are served via Next.js dynamic routes at /s/[slug]
// In production (Vercel), these are ISR-cached and globally distributed
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/notify";

export type DeployResult = {
  ok: boolean;
  url: string;
  customDomainInstructions?: string;
  error?: string;
};

/** Deploy a site to a real, accessible URL */
export async function deploySiteToProduction(input: {
  siteId: string;
  userId: string;
}): Promise<DeployResult> {
  try {
    const site = await prisma.site.findFirst({
      where: { id: input.siteId, userId: input.userId },
      select: { id: true, slug: true, name: true, customDomain: true, published: true },
    });

    if (!site) return { ok: false, url: "", error: "Site not found" };

    // Ensure site is published
    if (!site.published) {
      await prisma.$transaction([
        prisma.site.update({ where: { id: site.id }, data: { published: true } }),
        prisma.sitePage.updateMany({ where: { siteId: site.id }, data: { published: true } }),
      ]);
    }

    // Build the real public URL
    const appUrl = getProductionUrl();
    const publicUrl = `${appUrl}/s/${site.slug}`;

    // Ping search engines to index (fire-and-forget)
    void pingSearchEngines(publicUrl, `${appUrl}/s/${site.slug}/sitemap.xml`);

    // If custom domain is set, provide DNS instructions
    let customDomainInstructions: string | undefined;
    if (site.customDomain) {
      customDomainInstructions = buildDnsInstructions(site.customDomain, appUrl);
    }

    // Notify user
    await createNotification({
      userId: input.userId,
      type: "system",
      title: `${site.name} is live!`,
      body: `Your site is now accessible at ${publicUrl}${site.customDomain ? `. Set up ${site.customDomain} with the DNS instructions.` : ""}`,
      href: publicUrl,
    }).catch(() => {});

    // Log deployment event
    await prisma.himalayaFunnelEvent.create({
      data: {
        userId: input.userId,
        event: "site_deployed",
        metadata: JSON.parse(JSON.stringify({
          siteId: site.id,
          slug: site.slug,
          url: publicUrl,
          customDomain: site.customDomain,
          deployedAt: new Date().toISOString(),
        })),
      },
    }).catch(() => {});

    return {
      ok: true,
      url: publicUrl,
      customDomainInstructions,
    };
  } catch (err) {
    console.error("Site deploy error:", err);
    return { ok: false, url: "", error: err instanceof Error ? err.message : "Deploy failed" };
  }
}

/** Get the production URL — uses NEXT_PUBLIC_APP_URL or detects Vercel */
function getProductionUrl(): string {
  // In production on Vercel, use the deployment URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Fallback to configured app URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";
  return appUrl;
}

/** Ping Google and Bing to index the site faster */
async function pingSearchEngines(siteUrl: string, sitemapUrl: string): Promise<void> {
  const pings = [
    `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
  ];

  await Promise.allSettled(
    pings.map((url) =>
      fetch(url, { method: "GET", signal: AbortSignal.timeout(5000) }).catch(() => {})
    )
  );
}

/** Build DNS instructions for custom domain setup */
function buildDnsInstructions(domain: string, appUrl: string): string {
  const isVercel = !!process.env.VERCEL;
  const vercelTarget = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "cname.vercel-dns.com";

  if (isVercel) {
    return [
      `To connect ${domain} to your site:`,
      ``,
      `1. Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)`,
      `2. Add a CNAME record:`,
      `   Name: ${domain.startsWith("www.") ? "www" : "@"}`,
      `   Value: ${vercelTarget}`,
      `   TTL: Auto`,
      ``,
      `3. If using a root domain (no www), add an A record:`,
      `   Name: @`,
      `   Value: 76.76.21.21`,
      ``,
      `4. Go to your Vercel dashboard → Project → Settings → Domains`,
      `5. Add ${domain}`,
      ``,
      `DNS changes usually take 5-30 minutes to propagate.`,
    ].join("\n");
  }

  return [
    `To connect ${domain} to your site:`,
    ``,
    `Point your domain to your hosting provider.`,
    `Your site is currently at: ${appUrl}/s/${domain}`,
  ].join("\n");
}

/** Get the public URL for a site */
export function getSitePublicUrl(slug: string, customDomain?: string | null): string {
  if (customDomain) {
    return `https://${customDomain}`;
  }
  const appUrl = getProductionUrl();
  return `${appUrl}/s/${slug}`;
}
