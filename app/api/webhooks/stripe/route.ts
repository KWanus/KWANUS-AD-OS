import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

function getStripe() {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) return null;

    return new Stripe(stripeKey);
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
    try {
        const stripe = getStripe();
        if (!stripe) {
            return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
        }

        const rawBody = await req.text();
        const signature = req.headers.get("stripe-signature");

        if (!signature || !webhookSecret) {
            return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
        }

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        } catch (err: any) {
            console.error(`Webhook signature verification failed: ${err.message}`);
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            const { siteId, productId } = session.metadata || {};

            if (siteId && productId) {
                const customerEmail = session.customer_details?.email || "unknown@example.com";
                const customerName  = session.customer_details?.name  || "Unknown Customer";
                const [firstName, ...rest] = customerName.split(" ");
                const lastName = rest.join(" ");

                // Wrap all DB writes in a transaction so partial failures don't corrupt state
                await prisma.$transaction(async (tx) => {
                    await tx.siteOrder.create({
                        data: {
                            siteId,
                            productId,
                            customerEmail,
                            customerName,
                            amountCents: session.amount_total || 0,
                            currency: session.currency || "usd",
                            status: "paid",
                            stripePaymentId: session.payment_intent as string,
                        },
                    });

                    const product = await tx.siteProduct.findUnique({
                        where: { id: productId },
                        include: { site: true },
                    });

                    // Save customer to Email Contacts for the automations engine
                    if (product?.site?.userId) {
                        await tx.emailContact.upsert({
                            where: { userId_email: { userId: product.site.userId, email: customerEmail } },
                            update:  { firstName, lastName, status: "subscribed" },
                            create:  { userId: product.site.userId, email: customerEmail, firstName, lastName, status: "subscribed", source: "purchase" },
                        });
                    }
                });
            }
        }

        return NextResponse.json({ received: true });
    } catch (err) {
        console.error("Stripe Webhook Error:", err);
        // Return 500 to tell Stripe to retry
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
