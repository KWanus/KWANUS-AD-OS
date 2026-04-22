import { prisma } from "@/lib/prisma";

export type AnalyticsEvent = {
  siteId: string;
  visitorId: string;
  event: "page_view" | "form_start" | "form_submit" | "cta_click" | "checkout_start" | "checkout_complete" | "scroll_25" | "scroll_50" | "scroll_75" | "scroll_100" | "time_on_page" | "outbound_click" | "video_play" | "return_visit";
  page?: string;
  metadata?: Record<string, unknown>;
};

export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  try {
    await prisma.himalayaFunnelEvent.create({
      data: {
        userId: event.siteId, // site-level events stored under siteId
        event: `site_${event.event}`,
        metadata: {
          siteId: event.siteId,
          visitorId: event.visitorId,
          page: event.page,
          ...event.metadata,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch {
    // Fire and forget
  }
}

export async function getEventCounts(siteId: string, days: number = 30): Promise<{
  pageViews: number;
  uniqueVisitors: number;
  formStarts: number;
  formSubmits: number;
  ctaClicks: number;
  checkoutStarts: number;
  checkoutCompletes: number;
  avgScrollDepth: number;
  conversionRate: number;
  checkoutConversion: number;
}> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const events = await prisma.himalayaFunnelEvent.findMany({
    where: {
      event: { startsWith: "site_" },
      createdAt: { gte: since },
    },
    select: { event: true, metadata: true },
  });

  // Filter to this site
  const siteEvents = events.filter(e => {
    const meta = e.metadata as Record<string, unknown> | null;
    return meta?.siteId === siteId;
  });

  const pageViews = siteEvents.filter(e => e.event === "site_page_view").length;
  const visitors = new Set(siteEvents.map(e => (e.metadata as Record<string, unknown>)?.visitorId as string).filter(Boolean));
  const formStarts = siteEvents.filter(e => e.event === "site_form_start").length;
  const formSubmits = siteEvents.filter(e => e.event === "site_form_submit").length;
  const ctaClicks = siteEvents.filter(e => e.event === "site_cta_click").length;
  const checkoutStarts = siteEvents.filter(e => e.event === "site_checkout_start").length;
  const checkoutCompletes = siteEvents.filter(e => e.event === "site_checkout_complete").length;

  // Scroll depth
  const scrollEvents = siteEvents.filter(e => e.event.startsWith("site_scroll_"));
  let totalScroll = 0;
  for (const se of scrollEvents) {
    const depth = parseInt(se.event.replace("site_scroll_", ""), 10);
    if (!isNaN(depth)) totalScroll += depth;
  }
  const avgScrollDepth = scrollEvents.length > 0 ? Math.round(totalScroll / scrollEvents.length) : 0;

  const conversionRate = pageViews > 0 ? Math.round((formSubmits / pageViews) * 10000) / 100 : 0;
  const checkoutConversion = checkoutStarts > 0 ? Math.round((checkoutCompletes / checkoutStarts) * 10000) / 100 : 0;

  return {
    pageViews,
    uniqueVisitors: visitors.size,
    formStarts,
    formSubmits,
    ctaClicks,
    checkoutStarts,
    checkoutCompletes,
    avgScrollDepth,
    conversionRate,
    checkoutConversion,
  };
}

export async function getFunnelData(siteId: string, days: number = 30): Promise<{
  steps: { name: string; count: number; rate: number }[];
  dailyBreakdown: { date: string; views: number; leads: number; sales: number }[];
  topPages: { page: string; views: number }[];
  sources: { source: string; count: number }[];
}> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const events = await prisma.himalayaFunnelEvent.findMany({
    where: {
      event: { startsWith: "site_" },
      createdAt: { gte: since },
    },
    select: { event: true, metadata: true, createdAt: true },
  });

  const siteEvents = events.filter(e => {
    const meta = e.metadata as Record<string, unknown> | null;
    return meta?.siteId === siteId;
  });

  const views = siteEvents.filter(e => e.event === "site_page_view").length;
  const ctaClicks = siteEvents.filter(e => e.event === "site_cta_click").length;
  const formStarts = siteEvents.filter(e => e.event === "site_form_start").length;
  const formSubmits = siteEvents.filter(e => e.event === "site_form_submit").length;
  const checkouts = siteEvents.filter(e => e.event === "site_checkout_start").length;
  const sales = siteEvents.filter(e => e.event === "site_checkout_complete").length;

  const steps = [
    { name: "Page Views", count: views, rate: 100 },
    { name: "CTA Clicks", count: ctaClicks, rate: views > 0 ? Math.round((ctaClicks / views) * 100) : 0 },
    { name: "Form Started", count: formStarts, rate: views > 0 ? Math.round((formStarts / views) * 100) : 0 },
    { name: "Form Submitted", count: formSubmits, rate: views > 0 ? Math.round((formSubmits / views) * 100) : 0 },
    { name: "Checkout Started", count: checkouts, rate: views > 0 ? Math.round((checkouts / views) * 100) : 0 },
    { name: "Sale Completed", count: sales, rate: views > 0 ? Math.round((sales / views) * 100) : 0 },
  ];

  // Daily breakdown
  const dailyMap = new Map<string, { views: number; leads: number; sales: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap.set(d.toISOString().split("T")[0], { views: 0, leads: 0, sales: 0 });
  }
  for (const ev of siteEvents) {
    const day = ev.createdAt.toISOString().split("T")[0];
    const entry = dailyMap.get(day);
    if (!entry) continue;
    if (ev.event === "site_page_view") entry.views++;
    if (ev.event === "site_form_submit") entry.leads++;
    if (ev.event === "site_checkout_complete") entry.sales++;
  }
  const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, data]) => ({ date, ...data }));

  // Top pages
  const pageMap = new Map<string, number>();
  for (const ev of siteEvents.filter(e => e.event === "site_page_view")) {
    const page = ((ev.metadata as Record<string, unknown>)?.page as string) ?? "/";
    pageMap.set(page, (pageMap.get(page) ?? 0) + 1);
  }
  const topPages = Array.from(pageMap.entries()).map(([page, views]) => ({ page, views })).sort((a, b) => b.views - a.views).slice(0, 10);

  // Sources
  const sourceMap = new Map<string, number>();
  for (const ev of siteEvents.filter(e => e.event === "site_page_view")) {
    const src = ((ev.metadata as Record<string, unknown>)?.source as string) ?? "direct";
    sourceMap.set(src, (sourceMap.get(src) ?? 0) + 1);
  }
  const sources = Array.from(sourceMap.entries()).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);

  return { steps, dailyBreakdown, topPages, sources };
}
