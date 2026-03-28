import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BlockRenderer, { Block } from "@/components/site-builder/BlockRenderer";
import PublicSiteShell from "@/components/site-builder/PublicSiteShell";
import { Metadata } from "next";
import Script from "next/script";

type PublicProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compareAt: number | null;
  images: string[];
  slug: string;
};

export const revalidate = 10; // ISR for blazing fast loads

function getPublicSiteUrl(site: { slug: string; customDomain?: string | null }) {
  if (site.customDomain?.trim()) {
    const normalized = site.customDomain.trim().replace(/^https?:\/\//, "");
    return `https://${normalized}`;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://himalaya.app";
  return `${appUrl}/s/${site.slug}`;
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  let site = null;
  try {
    site = await prisma.site.findUnique({
      where: { slug },
      include: { pages: { where: { published: true }, orderBy: { order: "asc" } } },
    });
  } catch {
    return { title: "Not Found" };
  }

  if (!site || site.pages.length === 0) return { title: "Not Found" };

  const home = site.pages.find((page) => page.slug === "home");
  if (!home) return { title: "Not Found" };
  const title = home.seoTitle || site.name;
  const description = home.seoDesc || site.description || "";
  const publicUrl = getPublicSiteUrl(site);

  return {
    title,
    description,
    icons: {
      icon: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${site.faviconEmoji || "🚀"}</text></svg>`,
    },
    openGraph: {
      title,
      description,
      url: publicUrl,
      siteName: site.name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: publicUrl,
    },
  };
}

export default async function PublicSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let site = null;
  try {
    site = await prisma.site.findUnique({
      where: { slug },
      include: {
        pages: { where: { published: true }, orderBy: { order: "asc" } },
        products: { where: { status: "active" } },
        user: {
          select: {
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

  if (!site || !site.published || site.pages.length === 0) notFound();

  const page = site.pages.find((entry) => entry.slug === "home");
  if (!page) notFound();
  const theme = (site.theme as { primaryColor?: string; font?: string; mode?: "dark" | "light" }) || {};
  const blocks = (page.blocks as unknown as Block[]) || [];
  const products = (site.products as unknown as PublicProduct[]) || [];
  const pixels = site.user;

  // Track view async (fire-and-forget)
  prisma.site.update({ where: { id: site.id }, data: { totalViews: { increment: 1 } } }).catch(() => {});
  prisma.sitePage.update({ where: { id: page.id }, data: { views: { increment: 1 } } }).catch(() => {});

  const bodyBg = theme.mode === "dark" ? "#020509" : "#f8fafc";
  const bodyColor = theme.mode === "dark" ? "#ffffff" : "#0f172a";
  const fontFamily = theme.font === "inter" ? "Inter, sans-serif" : "inherit";

  return (
    <>
      {/* ── Global styles ── */}
      <style>{`body{margin:0;padding:0;font-family:${fontFamily};background-color:${bodyBg};color:${bodyColor}}`}</style>

      {/* ── Meta (Facebook/Instagram) Pixel ── */}
      {pixels?.metaPixelId && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">{`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixels.metaPixelId}');
            fbq('track', 'PageView');
          `}</Script>
          <noscript><img height="1" width="1" style={{ display: "none" }} src={`https://www.facebook.com/tr?id=${pixels.metaPixelId}&ev=PageView&noscript=1`} alt="" /></noscript>
        </>
      )}

      {/* ── Google Analytics (GA4) ── */}
      {pixels?.googleAnalyticsId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${pixels.googleAnalyticsId}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${pixels.googleAnalyticsId}');
            ${pixels.googleAdsId ? `gtag('config', '${pixels.googleAdsId}');` : ""}
          `}</Script>
        </>
      )}

      {/* ── TikTok Pixel ── */}
      {pixels?.tiktokPixelId && (
        <Script id="tiktok-pixel" strategy="afterInteractive">{`
          !function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
            ttq.load('${pixels.tiktokPixelId}');
            ttq.page();
          }(window, document, 'ttq');
        `}</Script>
      )}

      {/* ── Site content ── */}
      <PublicSiteShell
        siteName={site.name}
        siteSlug={site.slug}
        customDomain={site.customDomain}
        currentPageSlug="home"
        faviconEmoji={site.faviconEmoji}
        theme={theme}
        pages={site.pages.map((entry) => ({ id: entry.id, title: entry.title, slug: entry.slug }))}
      >
        <div className="flex-1">
          {blocks.length === 0 ? (
            <div className="flex items-center justify-center min-h-[50vh] text-center px-4">
              <h1 className="text-2xl font-black opacity-30">This site has no content yet.</h1>
            </div>
          ) : (
            blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} theme={theme} preview={false} products={products} />
            ))
          )}
        </div>
      </PublicSiteShell>
    </>
  );
}
