// ---------------------------------------------------------------------------
// Stripe Payments — create payment links + checkout sessions for generated sites
// ---------------------------------------------------------------------------

import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not set");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export type CreatePaymentLinkInput = {
  productName: string;
  description?: string;
  priceInCents: number;
  currency?: string;
  successUrl: string;
  imageUrl?: string;
  recurring?: { interval: "month" | "year"; intervalCount?: number };
  metadata?: Record<string, string>;
};

export type PaymentLinkResult = {
  ok: boolean;
  url?: string;
  paymentLinkId?: string;
  error?: string;
};

/** Create a Stripe Payment Link for a product/service */
export async function createPaymentLink(
  input: CreatePaymentLinkInput
): Promise<PaymentLinkResult> {
  try {
    const stripe = getStripe();

    const lineItem: Stripe.PaymentLinkCreateParams.LineItem = {
      quantity: 1,
      price_data: {
        currency: input.currency ?? "usd",
        unit_amount: input.priceInCents,
        product_data: {
          name: input.productName,
          ...(input.description && { description: input.description }),
          ...(input.imageUrl && { images: [input.imageUrl] }),
        },
        ...(input.recurring && {
          recurring: {
            interval: input.recurring.interval,
            interval_count: input.recurring.intervalCount ?? 1,
          },
        }),
      },
    };

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [lineItem],
      after_completion: {
        type: "redirect",
        redirect: { url: input.successUrl },
      },
      metadata: input.metadata ?? {},
    });

    return {
      ok: true,
      url: paymentLink.url,
      paymentLinkId: paymentLink.id,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Payment link creation failed",
    };
  }
}

/** Create a Stripe Checkout Session for one-time purchase */
export async function createCheckoutSession(input: {
  productName: string;
  priceInCents: number;
  currency?: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}): Promise<{ ok: boolean; url?: string; sessionId?: string; error?: string }> {
  try {
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency ?? "usd",
            unit_amount: input.priceInCents,
            product_data: { name: input.productName },
          },
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      customer_email: input.customerEmail,
      metadata: input.metadata ?? {},
    });

    return {
      ok: true,
      url: session.url ?? undefined,
      sessionId: session.id,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Checkout session creation failed",
    };
  }
}

/** Parse price string (e.g., "$49", "$99/mo", "199") into cents */
export function parsePriceToCents(priceStr: string): number | null {
  if (!priceStr) return null;
  const cleaned = priceStr.replace(/[^0-9.]/g, "");
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return null;
  return Math.round(parsed * 100);
}
