import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AttributionModel = "last_touch" | "first_touch" | "linear" | "time_decay";

interface AttributedRevenue {
  orderId: string;
  amountCents: number;
  attributions: {
    type: "flow" | "broadcast";
    id: string;
    name: string;
    creditCents: number;
    creditPercent: number;
    touchDate: string;
  }[];
}

interface RevenueReport {
  totalRevenue: number;
  totalOrders: number;
  revenuePerContact: number;
  revenuePerEmailSent: number;
  conversionRate: number;
  flows: { id: string; name: string; revenue: number; conversions: number; revenuePerEmail: number }[];
  broadcasts: { id: string; name: string; revenue: number; conversions: number; revenuePerEmail: number }[];
  topPerformers: { type: string; id: string; name: string; revenue: number }[];
}

interface RevenueTimelineEntry {
  date: string;
  revenue: number;
  orders: number;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DEFAULT_ATTRIBUTION_WINDOW_DAYS = 5;
const DEFAULT_MODEL: AttributionModel = "last_touch";

// ---------------------------------------------------------------------------
// Internal: find email touches for a customer within attribution window
// ---------------------------------------------------------------------------

async function findEmailTouches(
  userId: string,
  customerEmail: string,
  purchaseDate: Date,
  windowDays: number = DEFAULT_ATTRIBUTION_WINDOW_DAYS
): Promise<{ type: "flow" | "broadcast"; id: string; name: string; date: Date }[]> {
  const windowStart = new Date(purchaseDate);
  windowStart.setDate(windowStart.getDate() - windowDays);

  const touches: { type: "flow" | "broadcast"; id: string; name: string; date: Date }[] = [];

  // Check flow enrollments
  const enrollments = await prisma.emailFlowEnrollment.findMany({
    where: {
      userId,
      contactEmail: customerEmail.toLowerCase(),
      createdAt: { gte: windowStart, lte: purchaseDate },
    },
    include: { flow: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  for (const enrollment of enrollments) {
    touches.push({
      type: "flow",
      id: enrollment.flow.id,
      name: enrollment.flow.name,
      date: enrollment.createdAt,
    });
  }

  // Check broadcasts sent before purchase within window
  const broadcasts = await prisma.emailBroadcast.findMany({
    where: {
      userId,
      status: "sent",
      sentAt: { gte: windowStart, lte: purchaseDate },
    },
    select: { id: true, name: true, sentAt: true },
    orderBy: { sentAt: "asc" },
  });

  for (const broadcast of broadcasts) {
    if (broadcast.sentAt) {
      touches.push({
        type: "broadcast",
        id: broadcast.id,
        name: broadcast.name,
        date: broadcast.sentAt,
      });
    }
  }

  // Sort by date
  return touches.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ---------------------------------------------------------------------------
// Internal: apply attribution model
// ---------------------------------------------------------------------------

function applyModel(
  touches: { type: "flow" | "broadcast"; id: string; name: string; date: Date }[],
  amountCents: number,
  model: AttributionModel
): AttributedRevenue["attributions"] {
  if (touches.length === 0) return [];

  if (model === "last_touch") {
    const last = touches[touches.length - 1];
    return [{
      type: last.type,
      id: last.id,
      name: last.name,
      creditCents: amountCents,
      creditPercent: 100,
      touchDate: last.date.toISOString(),
    }];
  }

  if (model === "first_touch") {
    const first = touches[0];
    return [{
      type: first.type,
      id: first.id,
      name: first.name,
      creditCents: amountCents,
      creditPercent: 100,
      touchDate: first.date.toISOString(),
    }];
  }

  if (model === "linear") {
    const creditEach = Math.floor(amountCents / touches.length);
    const remainder = amountCents - creditEach * touches.length;
    const percentEach = Math.round((100 / touches.length) * 100) / 100;

    return touches.map((t, i) => ({
      type: t.type,
      id: t.id,
      name: t.name,
      creditCents: creditEach + (i === touches.length - 1 ? remainder : 0),
      creditPercent: percentEach,
      touchDate: t.date.toISOString(),
    }));
  }

  // time_decay: more recent touches get more credit
  // Weight = 2^(position / total) — so the last touch gets roughly double the first
  const weights = touches.map((_, i) => Math.pow(2, (i + 1) / touches.length));
  const totalWeight = weights.reduce((s, w) => s + w, 0);

  let distributed = 0;
  return touches.map((t, i) => {
    const fraction = weights[i] / totalWeight;
    const isLast = i === touches.length - 1;
    const creditCents = isLast ? amountCents - distributed : Math.floor(amountCents * fraction);
    distributed += creditCents;

    return {
      type: t.type,
      id: t.id,
      name: t.name,
      creditCents,
      creditPercent: Math.round(fraction * 10000) / 100,
      touchDate: t.date.toISOString(),
    };
  });
}

// ---------------------------------------------------------------------------
// 1. Core Attribution
// ---------------------------------------------------------------------------

export async function attributeOrder(
  userId: string,
  order: { id: string; customerEmail: string; amountCents: number; createdAt: Date },
  model: AttributionModel = DEFAULT_MODEL,
  windowDays: number = DEFAULT_ATTRIBUTION_WINDOW_DAYS
): Promise<AttributedRevenue> {
  const touches = await findEmailTouches(userId, order.customerEmail, order.createdAt, windowDays);
  const attributions = applyModel(touches, order.amountCents, model);

  // Store attribution in contact properties
  try {
    const contact = await prisma.emailContact.findFirst({
      where: { userId, email: order.customerEmail.toLowerCase() },
    });

    if (contact) {
      const props = (contact.properties as Record<string, unknown>) ?? {};
      const history = (props.attributionHistory as unknown[]) ?? [];
      history.push({
        orderId: order.id,
        amountCents: order.amountCents,
        attributions,
        attributedAt: new Date().toISOString(),
        model,
      });

      await prisma.emailContact.update({
        where: { id: contact.id },
        data: {
          properties: {
            ...props,
            attributionHistory: history,
            totalRevenueCents: ((props.totalRevenueCents as number) ?? 0) + order.amountCents,
            totalOrders: ((props.totalOrders as number) ?? 0) + 1,
            lastPurchaseAt: order.createdAt.toISOString(),
          } as object,
        },
      });
    }
  } catch {
    // Non-critical — don't fail the attribution if contact update fails
  }

  // Update flow/broadcast revenue
  for (const attr of attributions) {
    try {
      if (attr.type === "flow") {
        await prisma.emailFlow.update({
          where: { id: attr.id },
          data: {
            revenue: { increment: attr.creditCents },
            conversions: { increment: 1 },
          },
        });
      }
    } catch {
      // Flow may not exist or lack revenue field
    }
  }

  return { orderId: order.id, amountCents: order.amountCents, attributions };
}

// ---------------------------------------------------------------------------
// 2. Revenue Queries
// ---------------------------------------------------------------------------

export async function getFlowRevenue(flowId: string): Promise<{
  flowId: string;
  name: string;
  totalRevenue: number;
  conversions: number;
  revenuePerEmail: number;
}> {
  const flow = await prisma.emailFlow.findUnique({
    where: { id: flowId },
    select: { id: true, name: true, revenue: true, conversions: true, sent: true },
  });

  if (!flow) return { flowId, name: "Unknown", totalRevenue: 0, conversions: 0, revenuePerEmail: 0 };

  const totalRevenue = flow.revenue ?? 0;
  const sent = flow.sent ?? 0;

  return {
    flowId: flow.id,
    name: flow.name,
    totalRevenue,
    conversions: flow.conversions ?? 0,
    revenuePerEmail: sent > 0 ? Math.round(totalRevenue / sent) : 0,
  };
}

export async function getBroadcastRevenue(broadcastId: string): Promise<{
  broadcastId: string;
  name: string;
  totalRevenue: number;
  conversions: number;
  revenuePerRecipient: number;
}> {
  const broadcast = await prisma.emailBroadcast.findUnique({
    where: { id: broadcastId },
    select: { id: true, name: true, recipients: true, clicks: true },
  });

  if (!broadcast) return { broadcastId, name: "Unknown", totalRevenue: 0, conversions: 0, revenuePerRecipient: 0 };

  // Look up orders that came through this broadcast via contact attribution history
  const contacts = await prisma.emailContact.findMany({
    where: {
      properties: { path: ["attributionHistory"], not: undefined },
    },
    select: { properties: true },
  });

  let totalRevenue = 0;
  let conversions = 0;

  for (const contact of contacts) {
    const props = contact.properties as Record<string, unknown> | null;
    const history = (props?.attributionHistory as { attributions: { id: string; creditCents: number }[] }[]) ?? [];
    for (const entry of history) {
      for (const attr of entry.attributions ?? []) {
        if (attr.id === broadcastId) {
          totalRevenue += attr.creditCents;
          conversions++;
        }
      }
    }
  }

  const recipients = broadcast.recipients ?? 0;

  return {
    broadcastId: broadcast.id,
    name: broadcast.name,
    totalRevenue,
    conversions,
    revenuePerRecipient: recipients > 0 ? Math.round(totalRevenue / recipients) : 0,
  };
}

export async function getEmailROI(
  userId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{
  totalRevenue: number;
  estimatedCost: number;
  roi: number;
  totalEmailsSent: number;
  revenuePerEmail: number;
}> {
  const broadcastWhere: Record<string, unknown> = { userId };
  if (dateRange) {
    broadcastWhere.sentAt = { gte: dateRange.start, lte: dateRange.end };
  }

  const [broadcasts, flows] = await Promise.all([
    prisma.emailBroadcast.findMany({
      where: broadcastWhere,
      select: { recipients: true },
    }),
    prisma.emailFlow.findMany({
      where: { userId },
      select: { revenue: true, sent: true },
    }),
  ]);

  const broadcastEmails = broadcasts.reduce((s, b) => s + (b.recipients ?? 0), 0);
  const flowEmails = flows.reduce((s, f) => s + (f.sent ?? 0), 0);
  const totalEmailsSent = broadcastEmails + flowEmails;

  const flowRevenue = flows.reduce((s, f) => s + (f.revenue ?? 0), 0);

  // Get broadcast revenue from attribution data
  const contacts = await prisma.emailContact.findMany({
    where: { userId },
    select: { properties: true },
  });

  let totalRevenue = flowRevenue;
  for (const contact of contacts) {
    const props = contact.properties as Record<string, unknown> | null;
    const history = (props?.attributionHistory as { amountCents: number; attributions: { type: string; creditCents: number }[] }[]) ?? [];
    for (const entry of history) {
      for (const attr of entry.attributions ?? []) {
        if (attr.type === "broadcast") {
          totalRevenue += attr.creditCents;
        }
      }
    }
  }

  // Estimated cost: $0.001 per email (rough Resend pricing)
  const estimatedCost = Math.round(totalEmailsSent * 0.1); // 0.1 cents per email

  return {
    totalRevenue,
    estimatedCost,
    roi: estimatedCost > 0 ? Math.round(((totalRevenue - estimatedCost) / estimatedCost) * 100) : 0,
    totalEmailsSent,
    revenuePerEmail: totalEmailsSent > 0 ? Math.round(totalRevenue / totalEmailsSent) : 0,
  };
}

export async function getRevenueByChannel(
  userId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{
  flows: { revenue: number; percentage: number };
  broadcasts: { revenue: number; percentage: number };
  total: number;
}> {
  const flows = await prisma.emailFlow.findMany({
    where: { userId },
    select: { revenue: true },
  });

  const flowRevenue = flows.reduce((s, f) => s + (f.revenue ?? 0), 0);

  // Broadcast revenue from contact attribution
  const contacts = await prisma.emailContact.findMany({
    where: { userId },
    select: { properties: true },
  });

  let broadcastRevenue = 0;
  for (const contact of contacts) {
    const props = contact.properties as Record<string, unknown> | null;
    const history = (props?.attributionHistory as { attributedAt?: string; attributions: { type: string; creditCents: number }[] }[]) ?? [];
    for (const entry of history) {
      if (dateRange && entry.attributedAt) {
        const entryDate = new Date(entry.attributedAt);
        if (entryDate < dateRange.start || entryDate > dateRange.end) continue;
      }
      for (const attr of entry.attributions ?? []) {
        if (attr.type === "broadcast") broadcastRevenue += attr.creditCents;
      }
    }
  }

  const total = flowRevenue + broadcastRevenue;

  return {
    flows: {
      revenue: flowRevenue,
      percentage: total > 0 ? Math.round((flowRevenue / total) * 10000) / 100 : 0,
    },
    broadcasts: {
      revenue: broadcastRevenue,
      percentage: total > 0 ? Math.round((broadcastRevenue / total) * 10000) / 100 : 0,
    },
    total,
  };
}

export async function getRevenueTimeline(
  userId: string,
  days: number = 30
): Promise<RevenueTimelineEntry[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Get all orders in the window
  const orders = await prisma.siteOrder.findMany({
    where: {
      createdAt: { gte: startDate },
      status: { in: ["paid", "completed"] },
    },
    select: { id: true, customerEmail: true, amountCents: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Build daily buckets
  const timeline: Record<string, { revenue: number; orders: number }> = {};
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const key = date.toISOString().split("T")[0];
    timeline[key] = { revenue: 0, orders: 0 };
  }

  // Check which orders have email attribution
  const contacts = await prisma.emailContact.findMany({
    where: { userId },
    select: { email: true, properties: true },
  });

  const contactMap = new Map<string, Record<string, unknown>>();
  for (const c of contacts) {
    const props = c.properties as Record<string, unknown> | null;
    if (props?.attributionHistory) {
      contactMap.set(c.email.toLowerCase(), props);
    }
  }

  for (const order of orders) {
    const props = contactMap.get(order.customerEmail.toLowerCase());
    if (!props) continue;

    const history = (props.attributionHistory as { orderId: string; amountCents: number }[]) ?? [];
    const attributed = history.find((h) => h.orderId === order.id);
    if (!attributed) continue;

    const dayKey = order.createdAt.toISOString().split("T")[0];
    if (timeline[dayKey]) {
      timeline[dayKey].revenue += attributed.amountCents;
      timeline[dayKey].orders += 1;
    }
  }

  return Object.entries(timeline).map(([date, data]) => ({
    date,
    revenue: data.revenue,
    orders: data.orders,
  }));
}

// ---------------------------------------------------------------------------
// 3. Attribution Report
// ---------------------------------------------------------------------------

export async function getAttributionReport(userId: string): Promise<RevenueReport> {
  const [flowsData, broadcastsData, contacts] = await Promise.all([
    prisma.emailFlow.findMany({
      where: { userId },
      select: { id: true, name: true, revenue: true, conversions: true, sent: true },
    }),
    prisma.emailBroadcast.findMany({
      where: { userId, status: "sent" },
      select: { id: true, name: true, recipients: true },
    }),
    prisma.emailContact.findMany({
      where: { userId },
      select: { properties: true },
    }),
  ]);

  // Aggregate broadcast revenue from attribution history
  const broadcastRevenueMap = new Map<string, { revenue: number; conversions: number }>();

  let totalRevenue = 0;
  let totalOrders = 0;

  for (const contact of contacts) {
    const props = contact.properties as Record<string, unknown> | null;
    const history = (props?.attributionHistory as { amountCents: number; attributions: { type: string; id: string; creditCents: number }[] }[]) ?? [];

    for (const entry of history) {
      totalOrders++;
      for (const attr of entry.attributions ?? []) {
        totalRevenue += attr.creditCents;
        if (attr.type === "broadcast") {
          const existing = broadcastRevenueMap.get(attr.id) ?? { revenue: 0, conversions: 0 };
          existing.revenue += attr.creditCents;
          existing.conversions++;
          broadcastRevenueMap.set(attr.id, existing);
        }
      }
    }
  }

  // Also count flow revenue from the flow records themselves
  const flowRevenueFromRecords = flowsData.reduce((s, f) => s + (f.revenue ?? 0), 0);
  // Avoid double-counting: use the larger of DB-stored flow revenue and attribution-derived
  if (flowRevenueFromRecords > totalRevenue) {
    totalRevenue = flowRevenueFromRecords;
  }

  const totalContacts = contacts.length;
  const totalEmailsSent = flowsData.reduce((s, f) => s + (f.sent ?? 0), 0) +
    broadcastsData.reduce((s, b) => s + (b.recipients ?? 0), 0);

  const flows = flowsData.map((f) => ({
    id: f.id,
    name: f.name,
    revenue: f.revenue ?? 0,
    conversions: f.conversions ?? 0,
    revenuePerEmail: (f.sent ?? 0) > 0 ? Math.round((f.revenue ?? 0) / (f.sent ?? 1)) : 0,
  }));

  const broadcasts = broadcastsData.map((b) => {
    const data = broadcastRevenueMap.get(b.id) ?? { revenue: 0, conversions: 0 };
    return {
      id: b.id,
      name: b.name,
      revenue: data.revenue,
      conversions: data.conversions,
      revenuePerEmail: (b.recipients ?? 0) > 0 ? Math.round(data.revenue / (b.recipients ?? 1)) : 0,
    };
  });

  // Top performers (combined, sorted by revenue)
  const allPerformers = [
    ...flows.map((f) => ({ type: "flow", id: f.id, name: f.name, revenue: f.revenue })),
    ...broadcasts.map((b) => ({ type: "broadcast", id: b.id, name: b.name, revenue: b.revenue })),
  ].sort((a, b) => b.revenue - a.revenue);

  return {
    totalRevenue,
    totalOrders,
    revenuePerContact: totalContacts > 0 ? Math.round(totalRevenue / totalContacts) : 0,
    revenuePerEmailSent: totalEmailsSent > 0 ? Math.round(totalRevenue / totalEmailsSent) : 0,
    conversionRate: totalEmailsSent > 0 ? Math.round((totalOrders / totalEmailsSent) * 10000) / 100 : 0,
    flows,
    broadcasts,
    topPerformers: allPerformers.slice(0, 10),
  };
}
