import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://himalaya.co";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/sign-in`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/sign-up`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  // Published sites
  try {
    const sites = await prisma.site.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    });

    const sitePages: MetadataRoute.Sitemap = sites.map((site) => ({
      url: `${baseUrl}/s/${site.slug}`,
      lastModified: site.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [...staticPages, ...sitePages];
  } catch {
    return staticPages;
  }
}
