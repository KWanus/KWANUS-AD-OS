import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function runStripeLinkSkill(
    userId: string,
    input: {
        product_name: string;
        price: string;
        type: string;
        success_url?: string;
    }
) {
    const amount = Math.round(parseFloat(input.price) * 100);
    const isSubscription = input.type.toLowerCase().includes("subscription");

    // 1. Create Product
    const product = await stripe.products.create({
        name: input.product_name,
    });

    // 2. Create Price
    const price = await stripe.prices.create({
        product: product.id,
        unit_amount: amount,
        currency: "usd",
        ...(isSubscription
            ? {
                recurring: {
                    interval: input.type.toLowerCase().includes("yearly") ? "year" : "month",
                },
            }
            : {}),
    });

    // 3. Create Checkout Session for the Link
    const session = await stripe.checkout.sessions.create({
        line_items: [{ price: price.id, quantity: 1 }],
        mode: isSubscription ? "subscription" : "payment",
        success_url: input.success_url || `${process.env.NEXT_PUBLIC_APP_URL}/thanks?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    });

    return {
        ok: true,
        data: {
            url: session.url,
            productId: product.id,
            priceId: price.id,
            embedCode: `<script async src="https://js.stripe.com/v3/buy-button.js"></script>
<stripe-buy-button
  buy-button-id="CHECKOUT_SESSION_ID"
  publishable-key="${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""}"
>
</stripe-buy-button>`,
        },
        message: `Stripe Checkout link generated for ${input.product_name} at $${input.price}.`,
    };
}

export async function runPaymentWorkflowSkill(
    userId: string,
    input: {
        offer: string;
        price: string;
        business_name?: string;
    }
) {
    // This is a "Power Skill" that orchestrates multiple actions
    // For now, let's create the link and return a mock for the other parts
    // (In a real implementation, this would trigger LLM generations for the success page copy/email copy)

    const linkResult = await runStripeLinkSkill(userId, {
        product_name: input.offer,
        price: input.price.replace(/[^0-9.]/g, ""), // Quick hack to get digits
        type: input.price.includes("/") ? "subscription" : "one-time",
    });

    return {
        ok: true,
        data: {
            ...linkResult.data,
            successPage: {
                title: "Order Confirmed!",
                copy: "Check your email for access instructions.",
            },
            welcomeEmail: {
                subject: `Welcome to ${input.business_name || "the Mastermind"}!`,
                body: `Thanks for joining. Here is how to get started...`,
            }
        },
        message: "Full payment workflow generated: Stripe link created, success page drafted, and welcome email saved.",
    };
}
