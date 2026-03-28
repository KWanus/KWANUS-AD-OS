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

        switch (event.type) {
            case "checkout.session.completed": {
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
                    }
                }

                // Handle subscription checkout (credit purchases / plan upgrades)
                if (session.mode === "subscription" && session.customer) {
                    const customerId = typeof session.customer === "string"
                        ? session.customer
                        : session.customer.id;
                    const user = await prisma.user.findFirst({
                        where: { stripeCustomerId: customerId },
                    });
                    if (user) {
                        const plan = session.metadata?.plan ?? "pro";
                        await prisma.user.update({
                            where: { id: user.id },
                            data: {
                                plan,
                                planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                            },
                        });
                    }
                }

                // Handle one-time credit purchases
                if (session.mode === "payment" && session.metadata?.credits) {
                    const customerId = typeof session.customer === "string"
                        ? session.customer
                        : session.customer?.id;
                    if (customerId) {
                        const user = await prisma.user.findFirst({
                            where: { stripeCustomerId: customerId },
                        });
                        if (user) {
                            const creditsToAdd = parseInt(session.metadata.credits, 10);
                            if (creditsToAdd > 0) {
                                await prisma.$transaction([
                                    prisma.user.update({
                                        where: { id: user.id },
                                        data: { credits: { increment: creditsToAdd } },
                                    }),
                                    prisma.creditLog.create({
                                        data: {
                                            userId: user.id,
                                            amount: creditsToAdd,
                                            balance: user.credits + creditsToAdd,
                                            action: "purchase",
                                            detail: session.metadata?.detail ?? `Purchased ${creditsToAdd} credits`,
                                        },
                                    }),
                                ]);
                            }
                        }
                    }
                }
                break;
            }

            case "customer.subscription.updated": {
                const sub = event.data.object as Stripe.Subscription;
                const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
                const user = await prisma.user.findFirst({
                    where: { stripeCustomerId: customerId },
                });
                if (user) {
                    const isActive = sub.status === "active" || sub.status === "trialing";
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            plan: isActive ? (sub.metadata?.plan ?? "pro") : "free",
                            planExpiresAt: isActive
                                ? new Date(sub.current_period_end * 1000)
                                : null,
                        },
                    });
                }
                break;
            }

            case "customer.subscription.deleted": {
                const sub = event.data.object as Stripe.Subscription;
                const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
                const user = await prisma.user.findFirst({
                    where: { stripeCustomerId: customerId },
                });
                if (user) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { plan: "free", planExpiresAt: null },
                    });
                }
                break;
            }

            case "charge.refunded": {
                const charge = event.data.object as Stripe.Charge;
                const orderId = charge.metadata?.orderId;
                if (orderId) {
                    await prisma.siteOrder.updateMany({
                        where: { stripePaymentId: charge.payment_intent as string },
                        data: { status: "refunded" },
                    });
                }
                break;
            }

            default:
                // Unhandled event type — log for debugging
                console.log(`Unhandled Stripe event: ${event.type}`);
        }

        // Log webhook for debugging
        await prisma.webhookLog.create({
            data: {
                source: "stripe",
                workflow: event.type,
                status: "processed",
                payload: { id: event.id, type: event.type },
            },
        }).catch(() => {}); // Fire-and-forget

        return NextResponse.json({ received: true });
    } catch (err) {
        console.error("Stripe Webhook Error:", err);
        // Return 500 to tell Stripe to retry
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
