import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

/**
 * Custom domain resolver — when a user points their domain at our app,
 * the middleware rewrites to /s/_domain/[domain]. This page looks up
 * which site has that custom domain and redirects to the slug-based page.
 */
export default async function CustomDomainPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;

  try {
    const site = await prisma.site.findFirst({
      where: { customDomain: domain, published: true },
      select: { slug: true },
    });

    if (site?.slug) {
      redirect(`/s/${site.slug}`);
    }
  } catch {
    // DB unavailable — fall through to notFound
  }

  notFound();
}
