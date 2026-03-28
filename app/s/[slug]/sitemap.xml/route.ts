import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let site = null;
  try {
    site = await prisma.site.findUnique({
      where: { slug },
      include: {
        pages: { where: { published: true }, select: { slug: true, updatedAt: true } },
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!site || !site.published) {
    return new NextResponse("Not found", { status: 404 });
  }

  const normalizedDomain = site.customDomain?.trim().replace(/^https?:\/\//, "");
  const baseUrl = normalizedDomain
    ? `https://${normalizedDomain}`
    : `${process.env.NEXT_PUBLIC_APP_URL ?? "https://himalaya.app"}/s/${slug}`;

  const urls = site.pages.map((page: { slug: string; updatedAt: Date }) => {
    const loc = page.slug === "home" ? baseUrl : `${baseUrl}/${page.slug}`;
    const lastmod = page.updatedAt.toISOString().split("T")[0];
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.slug === "home" ? "1.0" : "0.8"}</priority>
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
