// ---------------------------------------------------------------------------
// Post-Purchase Engine — everything that happens after someone pays
//
// Handles gaps 71-74:
// 71. Order status page (customer-facing)
// 72. Automatic refund processing
// 73. Customer loyalty program
// 74. Cross-sell recommendations based on purchase history
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { sendEmailUnified, getFromAddressUnified } from "@/lib/integrations/emailSender";
import { generateAI } from "@/lib/integrations/aiInference";
import { sendTestimonialRequest } from "./growthAutomations";

// ── 71. Order Status ─────────────────────────────────────────────────────────

export type OrderStatus = {
  orderNumber: string;
  status: "pending" | "paid" | "processing" | "fulfilled" | "refunded";
  customerName: string;
  customerEmail: string;
  productName: string;
  amount: string;
  purchasedAt: string;
  statusHistory: { status: string; timestamp: string; note?: string }[];
  estimatedDelivery?: string;
  trackingUrl?: string;
};

export async function getOrderStatus(orderId: string): Promise<OrderStatus | null> {
  const order = await prisma.siteOrder.findUnique({ where: { id: orderId } });
  if (!order) return null;

  const product = await prisma.siteProduct.findUnique({ where: { id: order.productId } }).catch(() => null);

  return {
    orderNumber: order.id.slice(-8).toUpperCase(),
    status: order.status as OrderStatus["status"],
    customerName: order.customerName ?? "Customer",
    customerEmail: order.customerEmail,
    productName: product?.name ?? "Product",
    amount: `$${(order.amountCents / 100).toFixed(2)}`,
    purchasedAt: order.createdAt.toISOString(),
    statusHistory: [
      { status: "paid", timestamp: order.createdAt.toISOString(), note: "Payment confirmed" },
      ...(order.status === "fulfilled" ? [{ status: "fulfilled", timestamp: order.updatedAt.toISOString(), note: "Order delivered" }] : []),
      ...(order.status === "refunded" ? [{ status: "refunded", timestamp: order.updatedAt.toISOString(), note: "Refund processed" }] : []),
    ],
    estimatedDelivery: product?.status === "active" ? "Instant access" : undefined,
  };
}

// ── 72. Automatic Refund Processing ──────────────────────────────────────────

export async function processRefund(input: {
  orderId: string;
  userId: string;
  reason?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const order = await prisma.siteOrder.findUnique({ where: { id: input.orderId } });
  if (!order) return { ok: false, error: "Order not found" };
  if (order.status === "refunded") return { ok: false, error: "Already refunded" };

  // Process Stripe refund if we have a payment ID
  if (order.stripePaymentId && process.env.STRIPE_SECRET_KEY) {
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      await stripe.refunds.create({ payment_intent: order.stripePaymentId });
    } catch (err) {
      return { ok: false, error: `Stripe refund failed: ${err instanceof Error ? err.message : "unknown"}` };
    }
  }

  // Update order status
  await prisma.siteOrder.update({
    where: { id: input.orderId },
    data: { status: "refunded", notes: `Refunded: ${input.reason ?? "Customer request"}. ${new Date().toISOString()}` },
  });

  // Send refund confirmation email
  const from = getFromAddressUnified({ sendingFromName: null, sendingFromEmail: null, sendingDomain: null });
  await sendEmailUnified({
    from,
    to: order.customerEmail,
    subject: "Your refund has been processed",
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;line-height:1.7;">
<p>Hey${order.customerName ? ` ${order.customerName.split(" ")[0]}` : ""},</p>
<p>Your refund of $${(order.amountCents / 100).toFixed(2)} has been processed. It should appear in your account within 5-10 business days.</p>
<p>If you have any questions, just reply to this email.</p>
<p>We wish you all the best.</p>
</div>`,
  }).catch(() => {});

  return { ok: true };
}

// ── 73. Customer Loyalty Program ─────────────────────────────────────────────

export type LoyaltyTier = {
  name: string;
  minPurchases: number;
  discount: string;
  perks: string[];
};

export const LOYALTY_TIERS: LoyaltyTier[] = [
  { name: "Member", minPurchases: 1, discount: "0%", perks: ["Access to community", "Email support"] },
  { name: "Silver", minPurchases: 2, discount: "10%", perks: ["10% off all future purchases", "Priority support", "Exclusive content"] },
  { name: "Gold", minPurchases: 5, discount: "20%", perks: ["20% off everything", "1-on-1 support", "Early access to new offers", "Free bonus products"] },
  { name: "Platinum", minPurchases: 10, discount: "30%", perks: ["30% off everything", "Direct access to founder", "White-glove service", "Free upgrades for life"] },
];

export async function getCustomerLoyaltyTier(customerEmail: string, siteIds: string[]): Promise<{
  tier: LoyaltyTier;
  totalPurchases: number;
  totalSpent: number;
  nextTier: LoyaltyTier | null;
  purchasesUntilNextTier: number;
}> {
  const orders = await prisma.siteOrder.findMany({
    where: { customerEmail, siteId: { in: siteIds }, status: { in: ["paid", "fulfilled"] } },
    select: { amountCents: true },
  });

  const totalPurchases = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + o.amountCents, 0) / 100;

  let currentTier = LOYALTY_TIERS[0];
  let nextTier: LoyaltyTier | null = null;

  for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
    if (totalPurchases >= LOYALTY_TIERS[i].minPurchases) {
      currentTier = LOYALTY_TIERS[i];
      nextTier = LOYALTY_TIERS[i + 1] ?? null;
      break;
    }
  }

  return {
    tier: currentTier,
    totalPurchases,
    totalSpent,
    nextTier,
    purchasesUntilNextTier: nextTier ? nextTier.minPurchases - totalPurchases : 0,
  };
}

// ── 74. Cross-Sell Recommendations ───────────────────────────────────────────

export async function getCrossSellRecommendations(input: {
  customerEmail: string;
  siteId: string;
  currentProductId: string;
}): Promise<{ productId: string; name: string; price: string; reason: string }[]> {
  // Get all products on this site
  const products = await prisma.siteProduct.findMany({
    where: { siteId: input.siteId, status: "active", id: { not: input.currentProductId } },
    select: { id: true, name: true, price: true, description: true },
    take: 5,
  });

  // Get what they've already bought
  const pastOrders = await prisma.siteOrder.findMany({
    where: { customerEmail: input.customerEmail, siteId: input.siteId, status: { in: ["paid", "fulfilled"] } },
    select: { productId: true },
  });
  const boughtIds = new Set(pastOrders.map(o => o.productId));

  // Filter out already purchased
  const recommendations = products
    .filter(p => !boughtIds.has(p.id))
    .map(p => ({
      productId: p.id,
      name: p.name,
      price: `$${(p.price / 100).toFixed(2)}`,
      reason: "Customers who bought your item also love this",
    }));

  return recommendations;
}

// ── Post-purchase automation runner ──────────────────────────────────────────

export async function runPostPurchaseAutomation(input: {
  orderId: string;
  userId: string;
  customerEmail: string;
  customerName?: string;
  productName: string;
  businessName: string;
  siteId: string;
}): Promise<void> {
  // 1. Send receipt
  const { generateReceipt } = await import("./growthAutomations");
  const order = await prisma.siteOrder.findUnique({ where: { id: input.orderId } });
  if (!order) return;

  const receiptHtml = generateReceipt({
    orderNumber: input.orderId.slice(-8).toUpperCase(),
    customerName: input.customerName ?? "Customer",
    customerEmail: input.customerEmail,
    productName: input.productName,
    amount: `$${(order.amountCents / 100).toFixed(2)}`,
    date: new Date().toLocaleDateString(),
    businessName: input.businessName,
    businessEmail: `support@${input.businessName.toLowerCase().replace(/\s+/g, "")}.com`,
  });

  const from = getFromAddressUnified({ sendingFromName: input.businessName, sendingFromEmail: null, sendingDomain: null });
  await sendEmailUnified({
    from,
    to: input.customerEmail,
    subject: `Receipt from ${input.businessName} — Order #${input.orderId.slice(-8).toUpperCase()}`,
    html: receiptHtml,
  }).catch(() => {});

  // 2. Get cross-sell recommendations
  const crossSells = await getCrossSellRecommendations({
    customerEmail: input.customerEmail,
    siteId: input.siteId,
    currentProductId: order.productId,
  });

  // 3. Send cross-sell email (day 3)
  if (crossSells.length > 0) {
    // Schedule via event — picked up by cron
    await prisma.himalayaFunnelEvent.create({
      data: {
        userId: input.userId,
        event: "scheduled_email",
        metadata: JSON.parse(JSON.stringify({
          sendAfter: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          to: input.customerEmail,
          subject: `You might also like these, ${input.customerName?.split(" ")[0] ?? "friend"}`,
          body: `Since you got ${input.productName}, we thought you'd love:\n\n${crossSells.map(c => `• ${c.name} — ${c.price}`).join("\n")}`,
          type: "cross_sell",
        })),
      },
    }).catch(() => {});
  }

  // 4. Schedule testimonial request (day 7)
  await prisma.himalayaFunnelEvent.create({
    data: {
      userId: input.userId,
      event: "scheduled_email",
      metadata: JSON.parse(JSON.stringify({
        sendAfter: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        action: "testimonial_request",
        customerEmail: input.customerEmail,
        customerName: input.customerName,
        productName: input.productName,
        businessName: input.businessName,
      })),
    },
  }).catch(() => {});

  // 5. Update loyalty tier
  const loyalty = await getCustomerLoyaltyTier(input.customerEmail, [input.siteId]);
  if (loyalty.tier.name !== "Member") {
    await sendEmailUnified({
      from,
      to: input.customerEmail,
      subject: `You've reached ${loyalty.tier.name} status! 🎉`,
      html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;line-height:1.7;">
<p>Congrats! You've unlocked <strong>${loyalty.tier.name}</strong> status with ${input.businessName}.</p>
<p>Your perks:</p>
<ul>${loyalty.tier.perks.map(p => `<li>${p}</li>`).join("")}</ul>
<p>Thank you for being a loyal customer. 🙏</p>
</div>`,
    }).catch(() => {});
  }
}
