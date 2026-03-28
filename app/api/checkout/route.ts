import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

function getStripe() {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) return null;

    return new Stripe(stripeKey);
}

export async function POST(req: NextRequest) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        const user = await getOrCreateUser();
        if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

        const stripe = getStripe();
        if (!stripe) {
            return NextResponse.json({ ok: false, error: "Stripe is not configured" }, { status: 503 });
        }

        const body = await req.json();
        const { siteId, productId, returnUrl } = body;

        if (!siteId || !productId) {
            return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
        }

        const site = await prisma.site.findUnique({ where: { id: siteId } });
        if (!site) return NextResponse.json({ ok: false, error: "Site not found" }, { status: 404 });

        const product = await prisma.siteProduct.findUnique({ where: { id: productId } });
        if (!product) return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });

        if (product.siteId !== siteId) {
            return NextResponse.json({ ok: false, error: "Product does not belong to site" }, { status: 403 });
        }

        // Set up Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: product.name,
                            images: product.images.length > 0 ? [product.images[0]] : undefined,
                            description: product.description || undefined,
                        },
                        unit_amount: product.price,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${returnUrl || `https://${site.slug}.kwanus.co`}?success=true`,
            cancel_url: `${returnUrl || `https://${site.slug}.kwanus.co`}?canceled=true`,
            metadata: {
                siteId,
                productId,
            },
            // IMPORTANT: No application_fee_amount means 0% transaction fees for KWANUS
            // Users keep 100% of their revenue
        });

        return NextResponse.json({ ok: true, url: session.url });
    } catch (err) {
        console.error("Checkout POST error:", err);
        return NextResponse.json({ ok: false, error: "Failed to create checkout session" }, { status: 500 });
    }
}
