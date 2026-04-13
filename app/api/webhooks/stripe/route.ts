import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { fireTrigger } from "@/lib/email-flows/triggerEngine";

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

        let event: Stripe.Event;

        // In dev mode (no real webhook secret), parse the body directly
        const isDevMode = !webhookSecret || webhookSecret === "whsec_REPLACE_ME" || webhookSecret === "REPLACE_ME";

        if (isDevMode) {
            // Dev: trust the payload without signature verification
            event = JSON.parse(rawBody) as Stripe.Event;
        } else if (!signature) {
            return NextResponse.json({ error: "Missing signature" }, { status: 400 });
        } else {
            try {
                event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "Unknown";
                console.error(`Webhook signature verification failed: ${msg}`);
                return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
            }
        }

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            const { siteId, productId } = session.metadata || {};

            if (siteId && productId) {
                // Record the order for the store
                const customerEmail = session.customer_details?.email || "unknown@example.com";
                const customerName = session.customer_details?.name || "Unknown Customer";

                await prisma.siteOrder.create({
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

                const product = await prisma.siteProduct.findUnique({
                    where: { id: productId },
                    include: { site: true }
                });

                // Save customer to Email Contacts for the automations engine
                // IMPORTANT: The unified email CRM
                if (product && product.site?.userId) {
                    await prisma.emailContact.upsert({
                        where: { userId_email: { userId: product.site.userId, email: customerEmail } },
                        update: {
                            firstName: customerName.split(" ")[0],
                            lastName: customerName.split(" ").slice(1).join(" "),
                            status: "subscribed"
                        },
                        create: {
                            userId: product.site.userId,
                            email: customerEmail,
                            firstName: customerName.split(" ")[0],
                            lastName: customerName.split(" ").slice(1).join(" "),
                            status: "subscribed",
                            source: "purchase"
                        }
                    });

                    // Fire purchase trigger for email flows
                    fireTrigger({
                        type: "purchase",
                        email: customerEmail,
                        firstName: customerName.split(" ")[0],
                        lastName: customerName.split(" ").slice(1).join(" "),
                        userId: product.site.userId,
                        metadata: { productId, siteId, amount: session.amount_total },
                        tags: ["customer", "purchased"],
                    }).catch(() => {});

                    // Run post-purchase automation: receipt, cross-sell, testimonial request, loyalty
                    void import("@/lib/himalaya/postPurchaseEngine").then(({ runPostPurchaseAutomation }) => {
                        // Get order ID from the most recent order for this customer
                        prisma.siteOrder.findFirst({
                            where: { siteId, productId, customerEmail },
                            orderBy: { createdAt: "desc" },
                            select: { id: true },
                        }).then((order) => {
                            if (order) {
                                void runPostPurchaseAutomation({
                                    orderId: order.id,
                                    userId: product!.site!.userId,
                                    customerEmail,
                                    customerName,
                                    productName: product!.name,
                                    businessName: (product!.site as unknown as { name?: string })?.name ?? "Our Store",
                                    siteId,
                                });
                            }
                        }).catch(() => {});
                    }).catch(() => {});
                }
            }

            // Handle Himalaya subscription checkout
            const { userId: himalayaUserId, himalayaPlan } = session.metadata || {};
            if (himalayaUserId && himalayaPlan) {
                const tierLimits: Record<string, { runsLimit: number; deploysLimit: number }> = {
                    pro: { runsLimit: 50, deploysLimit: 20 },
                    business: { runsLimit: 999, deploysLimit: 999 },
                };
                const limits = tierLimits[himalayaPlan] ?? tierLimits.pro;

                await prisma.himalayaSubscription.upsert({
                    where: { userId: himalayaUserId },
                    create: {
                        userId: himalayaUserId,
                        tier: himalayaPlan,
                        runsLimit: limits.runsLimit,
                        deploysLimit: limits.deploysLimit,
                        stripeCustomerId: session.customer as string ?? null,
                        stripeSubId: session.subscription as string ?? null,
                    },
                    update: {
                        tier: himalayaPlan,
                        runsLimit: limits.runsLimit,
                        deploysLimit: limits.deploysLimit,
                        stripeCustomerId: session.customer as string ?? undefined,
                        stripeSubId: session.subscription as string ?? undefined,
                    },
                });
            }
        }

        // Handle subscription cancellation
        if (event.type === "customer.subscription.deleted") {
            const sub = event.data.object as Stripe.Subscription;
            const customerId = sub.customer as string;

            // Find subscription by Stripe customer ID and downgrade to free
            try {
                const himalayaSub = await prisma.himalayaSubscription.findFirst({
                    where: { stripeCustomerId: customerId },
                });
                if (himalayaSub) {
                    await prisma.himalayaSubscription.update({
                        where: { id: himalayaSub.id },
                        data: { tier: "free", runsLimit: 2, deploysLimit: 1, stripeSubId: null },
                    });
                }
            } catch {
                // non-fatal
            }
        }

        return NextResponse.json({ received: true });
    } catch (err) {
        console.error("Stripe Webhook Error:", err);
        // Return 500 to tell Stripe to retry
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
