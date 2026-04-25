// ---------------------------------------------------------------------------
// Stripe Payment Integration — Accept payments & manage subscriptions
//
// This allows users to:
// 1. Accept one-time payments from clients
// 2. Create subscription plans
// 3. Generate payment links
// 4. Track invoices
// 5. Auto-charge clients on retainer
//
// Uses Stripe API with webhook support for payment confirmations.
// ---------------------------------------------------------------------------

import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-12-18.acacia",
});

/** Create a Stripe customer for a client */
export async function createStripeCustomer(params: {
  userId: string;
  clientId: string;
  email: string;
  name: string;
}): Promise<{ ok: boolean; customerId?: string; error?: string }> {
  try {
    const customer = await stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: {
        userId: params.userId,
        clientId: params.clientId,
      },
    });

    // Store Stripe customer ID in client record
    await prisma.client.update({
      where: { id: params.clientId },
      data: { stripeCustomerId: customer.id },
    });

    return { ok: true, customerId: customer.id };
  } catch (err) {
    console.error("Create Stripe customer error:", err);
    return { ok: false, error: String(err) };
  }
}

/** Create a payment intent (one-time payment) */
export async function createPaymentIntent(params: {
  userId: string;
  clientId: string;
  amount: number; // in cents
  description: string;
  metadata?: Record<string, string>;
}): Promise<{ ok: boolean; clientSecret?: string; paymentIntentId?: string; error?: string }> {
  try {
    // Get or create Stripe customer
    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
      select: { stripeCustomerId: true, email: true, name: true },
    });

    if (!client) {
      return { ok: false, error: "Client not found" };
    }

    let customerId = client.stripeCustomerId;
    if (!customerId && client.email) {
      const result = await createStripeCustomer({
        userId: params.userId,
        clientId: params.clientId,
        email: client.email,
        name: client.name,
      });
      customerId = result.customerId;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: params.amount,
      currency: "usd",
      customer: customerId,
      description: params.description,
      metadata: {
        userId: params.userId,
        clientId: params.clientId,
        ...params.metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      ok: true,
      clientSecret: paymentIntent.client_secret ?? undefined,
      paymentIntentId: paymentIntent.id,
    };
  } catch (err) {
    console.error("Create payment intent error:", err);
    return { ok: false, error: String(err) };
  }
}

/** Create a payment link (shareable link for one-time payment) */
export async function createPaymentLink(params: {
  userId: string;
  clientId: string;
  amount: number; // in cents
  description: string;
}): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    // Create a product
    const product = await stripe.products.create({
      name: params.description,
      metadata: {
        userId: params.userId,
        clientId: params.clientId,
      },
    });

    // Create a price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: params.amount,
      currency: "usd",
    });

    // Create payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      after_completion: {
        type: "redirect",
        redirect: {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/success`,
        },
      },
      metadata: {
        userId: params.userId,
        clientId: params.clientId,
      },
    });

    return { ok: true, url: paymentLink.url };
  } catch (err) {
    console.error("Create payment link error:", err);
    return { ok: false, error: String(err) };
  }
}

/** Create a subscription */
export async function createSubscription(params: {
  userId: string;
  clientId: string;
  amount: number; // in cents, monthly
  description: string;
}): Promise<{ ok: boolean; subscriptionId?: string; error?: string }> {
  try {
    // Get or create Stripe customer
    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
      select: { stripeCustomerId: true, email: true, name: true },
    });

    if (!client) {
      return { ok: false, error: "Client not found" };
    }

    let customerId = client.stripeCustomerId;
    if (!customerId && client.email) {
      const result = await createStripeCustomer({
        userId: params.userId,
        clientId: params.clientId,
        email: client.email,
        name: client.name,
      });
      customerId = result.customerId;
    }

    if (!customerId) {
      return { ok: false, error: "No customer ID" };
    }

    // Create product + price
    const product = await stripe.products.create({
      name: params.description,
      metadata: {
        userId: params.userId,
        clientId: params.clientId,
      },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: params.amount,
      currency: "usd",
      recurring: { interval: "month" },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      metadata: {
        userId: params.userId,
        clientId: params.clientId,
      },
    });

    return { ok: true, subscriptionId: subscription.id };
  } catch (err) {
    console.error("Create subscription error:", err);
    return { ok: false, error: String(err) };
  }
}

/** Get subscription status */
export async function getSubscription(subscriptionId: string): Promise<{
  ok: boolean;
  status?: string;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    return {
      ok: true,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  } catch (err) {
    console.error("Get subscription error:", err);
    return { ok: false };
  }
}

/** Cancel a subscription */
export async function cancelSubscription(subscriptionId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await stripe.subscriptions.cancel(subscriptionId);
    return { ok: true };
  } catch (err) {
    console.error("Cancel subscription error:", err);
    return { ok: false, error: String(err) };
  }
}

/** Create an invoice */
export async function createInvoice(params: {
  userId: string;
  clientId: string;
  lineItems: Array<{ description: string; amount: number }>;
  dueDate?: Date;
}): Promise<{ ok: boolean; invoiceId?: string; invoiceUrl?: string; error?: string }> {
  try {
    // Get or create Stripe customer
    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
      select: { stripeCustomerId: true, email: true, name: true },
    });

    if (!client) {
      return { ok: false, error: "Client not found" };
    }

    let customerId = client.stripeCustomerId;
    if (!customerId && client.email) {
      const result = await createStripeCustomer({
        userId: params.userId,
        clientId: params.clientId,
        email: client.email,
        name: client.name,
      });
      customerId = result.customerId;
    }

    if (!customerId) {
      return { ok: false, error: "No customer ID" };
    }

    // Add invoice items
    for (const item of params.lineItems) {
      await stripe.invoiceItems.create({
        customer: customerId,
        amount: item.amount,
        currency: "usd",
        description: item.description,
      });
    }

    // Create invoice
    const invoice = await stripe.invoices.create({
      customer: customerId,
      auto_advance: true, // Auto-finalize
      collection_method: "send_invoice",
      days_until_due: params.dueDate
        ? Math.ceil((params.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 30,
      metadata: {
        userId: params.userId,
        clientId: params.clientId,
      },
    });

    // Finalize and send
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    return {
      ok: true,
      invoiceId: finalizedInvoice.id,
      invoiceUrl: finalizedInvoice.hosted_invoice_url ?? undefined,
    };
  } catch (err) {
    console.error("Create invoice error:", err);
    return { ok: false, error: String(err) };
  }
}

/** Get payment history for a client */
export async function getPaymentHistory(clientId: string): Promise<{
  ok: boolean;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    created: Date;
    description: string;
  }>;
}> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { stripeCustomerId: true },
    });

    if (!client?.stripeCustomerId) {
      return { ok: true, payments: [] };
    }

    const charges = await stripe.charges.list({
      customer: client.stripeCustomerId,
      limit: 50,
    });

    const payments = charges.data.map(charge => ({
      id: charge.id,
      amount: charge.amount,
      status: charge.status,
      created: new Date(charge.created * 1000),
      description: charge.description ?? "Payment",
    }));

    return { ok: true, payments };
  } catch (err) {
    console.error("Get payment history error:", err);
    return { ok: false, payments: [] };
  }
}
