// ---------------------------------------------------------------------------
// Custom Conversion Events — track beyond Stripe (signups, trials, custom events)
// Webhook system to push events to external systems
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/db";
import { attributeRevenueToCampaign } from "@/lib/analytics/revenueAttribution";

export type ConversionEventType =
  | "purchase"           // Stripe purchase
  | "signup"            // User registration
  | "trial_start"       // Trial subscription started
  | "trial_end"         // Trial ended
  | "subscription"      // Paid subscription
  | "lead_form"         // Lead form submission
  | "add_to_cart"       // Added to cart
  | "page_view"         // Important page viewed
  | "video_watch"       // Video watched
  | "download"          // File downloaded
  | "custom";           // Custom event

export interface ConversionEvent {
  type: ConversionEventType;
  userId?: string;
  leadId?: string;
  leadEmail?: string;
  value?: number;
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

export interface WebhookEndpoint {
  id: string;
  userId: string;
  url: string;
  events: ConversionEventType[];
  enabled: boolean;
  secret?: string;
}

/**
 * Track custom conversion event
 */
export async function trackConversionEvent(event: ConversionEvent): Promise<void> {
  try {
    // Find or create lead
    let lead = event.leadId
      ? await prisma.lead.findUnique({ where: { id: event.leadId } })
      : event.leadEmail
      ? await prisma.lead.findFirst({ where: { email: event.leadEmail } })
      : null;

    if (!lead && event.leadEmail) {
      lead = await prisma.lead.create({
        data: {
          email: event.leadEmail,
          source: "custom_event",
          status: "new",
        },
      });
    }

    // Create conversion record
    const conversion = await prisma.conversion.create({
      data: {
        leadId: lead?.id,
        type: event.type,
        value: event.value || 0,
        source: "custom_event",
        metadata: event.metadata || {},
        createdAt: event.timestamp || new Date(),
      },
    });

    // Attribute revenue if there's value
    if (lead && event.value && event.value > 0) {
      await attributeRevenueToCampaign(lead.id, conversion.id, event.value);
    }

    // Trigger webhooks
    if (event.userId) {
      await triggerWebhooks(event.userId, event);
    }

    console.log(`[Conversion Event] Tracked ${event.type}: ${event.leadEmail || lead?.id || "anonymous"}`);
  } catch (err) {
    console.error("[Conversion Event] Error tracking:", err);
  }
}

/**
 * Track signup conversion
 */
export async function trackSignup(params: {
  email: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await trackConversionEvent({
    type: "signup",
    userId: params.userId,
    leadEmail: params.email,
    value: 0, // Signups have no immediate value
    metadata: {
      ...params.metadata,
      eventTime: new Date().toISOString(),
    },
  });
}

/**
 * Track trial start
 */
export async function trackTrialStart(params: {
  email: string;
  userId?: string;
  planName?: string;
  trialDays?: number;
}): Promise<void> {
  await trackConversionEvent({
    type: "trial_start",
    userId: params.userId,
    leadEmail: params.email,
    value: 0,
    metadata: {
      planName: params.planName,
      trialDays: params.trialDays,
      eventTime: new Date().toISOString(),
    },
  });
}

/**
 * Track subscription (paid)
 */
export async function trackSubscription(params: {
  email: string;
  userId?: string;
  planName: string;
  mrr: number; // Monthly recurring revenue
}): Promise<void> {
  await trackConversionEvent({
    type: "subscription",
    userId: params.userId,
    leadEmail: params.email,
    value: params.mrr,
    metadata: {
      planName: params.planName,
      mrr: params.mrr,
      eventTime: new Date().toISOString(),
    },
  });
}

/**
 * Create webhook endpoint
 */
export async function createWebhookEndpoint(params: {
  userId: string;
  url: string;
  events: ConversionEventType[];
  secret?: string;
}): Promise<WebhookEndpoint> {
  const endpoint = await prisma.webhookEndpoint.create({
    data: {
      userId: params.userId,
      url: params.url,
      events: params.events,
      enabled: true,
      secret: params.secret || generateWebhookSecret(),
    },
  });

  return endpoint as unknown as WebhookEndpoint;
}

/**
 * Trigger webhooks for an event
 */
async function triggerWebhooks(userId: string, event: ConversionEvent): Promise<void> {
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: {
        userId,
        enabled: true,
        events: { has: event.type },
      },
    });

    for (const endpoint of endpoints) {
      await sendWebhook(endpoint as unknown as WebhookEndpoint, event);
    }
  } catch (err) {
    console.error("[Webhooks] Error triggering:", err);
  }
}

/**
 * Send webhook to external endpoint
 */
async function sendWebhook(endpoint: WebhookEndpoint, event: ConversionEvent): Promise<void> {
  try {
    const payload = {
      type: event.type,
      leadEmail: event.leadEmail,
      value: event.value,
      metadata: event.metadata,
      timestamp: event.timestamp || new Date(),
    };

    const signature = endpoint.secret
      ? await generateSignature(JSON.stringify(payload), endpoint.secret)
      : undefined;

    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature || "",
        "User-Agent": "Himalaya-Webhooks/1.0",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`[Webhook] Failed to send to ${endpoint.url}: ${response.status}`);

      // Log failed webhook
      await prisma.webhookLog.create({
        data: {
          endpointId: endpoint.id,
          event: event.type,
          status: "failed",
          statusCode: response.status,
          payload,
        },
      });
    } else {
      // Log successful webhook
      await prisma.webhookLog.create({
        data: {
          endpointId: endpoint.id,
          event: event.type,
          status: "success",
          statusCode: response.status,
          payload,
        },
      });
    }
  } catch (err) {
    console.error("[Webhook] Error sending:", err);
  }
}

/**
 * Generate webhook secret
 */
function generateWebhookSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let secret = "whsec_";
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

/**
 * Generate HMAC signature for webhook
 */
async function generateSignature(payload: string, secret: string): Promise<string> {
  // In production, use crypto.createHmac
  // For now, return a simple hash
  return Buffer.from(`${secret}:${payload}`).toString("base64");
}

/**
 * Verify webhook signature
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await generateSignature(payload, secret);
  return signature === expectedSignature;
}

/**
 * Get conversion funnel metrics
 */
export async function getConversionFunnel(userId: string): Promise<{
  signups: number;
  trials: number;
  subscriptions: number;
  purchases: number;
  conversionRates: {
    signupToTrial: number;
    trialToSubscription: number;
    signupToPurchase: number;
  };
}> {
  const signups = await prisma.conversion.count({
    where: { lead: { campaign: { userId } }, type: "signup" },
  });

  const trials = await prisma.conversion.count({
    where: { lead: { campaign: { userId } }, type: "trial_start" },
  });

  const subscriptions = await prisma.conversion.count({
    where: { lead: { campaign: { userId } }, type: "subscription" },
  });

  const purchases = await prisma.conversion.count({
    where: { lead: { campaign: { userId } }, type: "purchase" },
  });

  return {
    signups,
    trials,
    subscriptions,
    purchases,
    conversionRates: {
      signupToTrial: signups > 0 ? (trials / signups) * 100 : 0,
      trialToSubscription: trials > 0 ? (subscriptions / trials) * 100 : 0,
      signupToPurchase: signups > 0 ? (purchases / signups) * 100 : 0,
    },
  };
}
