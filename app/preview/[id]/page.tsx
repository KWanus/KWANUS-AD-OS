import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BlockRenderer, { Block } from "@/components/site-builder/BlockRenderer";
import PublicSiteShell from "@/components/site-builder/PublicSiteShell";
import { Metadata } from "next";
import Script from "next/script";
import { auth } from "@clerk/nextjs/server";

type PublicProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compareAt: number | null;
  images: string[];
  slug: string;
};

export const dynamic = "force-dynamic"; // Always fresh preview

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Preview Mode",
    description: "Preview your site before publishing",
    robots: "noindex, nofollow", // Don't index preview pages
  };
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();

  // Fetch site (no published filter - preview mode!)
  let site = null;
  try {
    site = await prisma.site.findUnique({
      where: { id },
      include: {
        pages: { orderBy: { order: "asc" } }, // All pages, not just published
        products: { where: { status: "active" } },
        user: {
          select: {
            id: true,
            metaPixelId: true,
            googleAnalyticsId: true,
            tiktokPixelId: true,
            googleAdsId: true,
          },
        },
      },
    });
  } catch {
    notFound();
  }

  // Only allow owner to preview their own site
  if (!site || !userId || site.userId !== userId) {
    notFound();
  }

  if (site.pages.length === 0) {
    return (
      <div className="min-h-screen bg-[#0c0a08] flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="text-6xl">🎨</div>
          <h1 className="text-2xl font-black text-white">No Pages Yet</h1>
          <p className="text-white/60">
            Add some pages to your site to see the preview.
          </p>
        </div>
      </div>
    );
  }

  const page = site.pages.find((entry) => entry.slug === "home") || site.pages[0];
  const theme = (site.theme as { primaryColor?: string; font?: string; mode?: "dark" | "light" }) || {};

  // Inject siteId into form/payment blocks for lead capture
  const rawBlocks = (page.blocks as unknown as Block[]) || [];
  const blocks = rawBlocks.map((block) => {
    if ((block.type === "form" || block.type === "payment") && block.props && !block.props.siteId) {
      return { ...block, props: { ...block.props, siteId: site.id, submitUrl: "/api/forms/submit" } };
    }
    return block;
  });
  const products = (site.products as unknown as PublicProduct[]) || [];

  const bodyBg = theme.mode === "dark" ? "#020509" : "#f8fafc";
  const bodyColor = theme.mode === "dark" ? "#ffffff" : "#0f172a";
  const fontFamily = theme.font === "inter" ? "Inter, sans-serif" : "inherit";

  return (
    <>
      {/* ── Global styles ── */}
      <style>{`body{margin:0;padding:0;font-family:${fontFamily};background-color:${bodyBg};color:${bodyColor}}`}</style>

      {/* ── Preview Banner ── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: "linear-gradient(135deg, #8b5cf6, #f59e0b)",
          color: "#fff",
          padding: "12px 20px",
          fontSize: "13px",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>👁️</span>
          <span>PREVIEW MODE - This is how your site will look to visitors</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <a
            href={`/websites/${site.id}/edit`}
            style={{
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.3)",
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: "bold",
              color: "#fff",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            ← Edit Site
          </a>
          <a
            href={`/websites/${site.id}`}
            style={{
              background: "rgba(255,255,255,0.9)",
              border: "none",
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: "bold",
              color: "#8b5cf6",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Exit Preview
          </a>
        </div>
      </div>

      {/* ── Push content down to avoid preview banner overlap ── */}
      <div style={{ height: "48px" }} />

      {/* ── Site content ── */}
      <PublicSiteShell
        siteName={site.name}
        siteSlug={site.slug}
        customDomain={site.customDomain}
        currentPageSlug={page.slug}
        faviconEmoji={site.faviconEmoji}
        theme={theme}
        pages={site.pages.map((entry) => ({ id: entry.id, title: entry.title, slug: entry.slug }))}
      >
        <div className="flex-1">
          {blocks.length === 0 ? (
            <div className="flex items-center justify-center min-h-[50vh] text-center px-4">
              <div className="space-y-4">
                <div className="text-6xl opacity-20">🎨</div>
                <h1 className="text-2xl font-black opacity-30">No content yet</h1>
                <p className="text-sm opacity-20">Click "Edit Site" to add sections</p>
              </div>
            </div>
          ) : (
            blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} theme={theme} preview={true} products={products} siteId={site.id} />
            ))
          )}
        </div>
      </PublicSiteShell>

      {/* ── Disable analytics/pixels in preview mode ── */}
      <Script id="preview-mode-notice" strategy="afterInteractive">{`
        console.log('%c👁️ PREVIEW MODE', 'background: linear-gradient(135deg, #8b5cf6, #f59e0b); color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; font-size: 14px;');
        console.log('Analytics and tracking pixels are disabled in preview mode.');
      `}</Script>
    </>
  );
}
