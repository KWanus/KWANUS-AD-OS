import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import {
  getBestSellers, getNewArrivals, getTrendingProducts,
  getRecommendationsForContact, getSimilarProducts, getCrossSellProducts,
  generateRecommendationBlock, generateBestSellerBlock,
  getProductFeed, getContactPurchaseProfile,
} from "@/lib/email/productCatalog";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const action = req.nextUrl.searchParams.get("action");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "10");

    if (action === "best_sellers") {
      const products = await getBestSellers(user.id, limit);
      return NextResponse.json({ ok: true, products });
    }

    if (action === "new") {
      const products = await getNewArrivals(user.id, limit);
      return NextResponse.json({ ok: true, products });
    }

    if (action === "trending") {
      const products = await getTrendingProducts(user.id, limit);
      return NextResponse.json({ ok: true, products });
    }

    if (action === "recommend") {
      const email = req.nextUrl.searchParams.get("email");
      if (!email) return NextResponse.json({ ok: false, error: "email required" }, { status: 400 });
      const products = await getRecommendationsForContact(user.id, email, limit);
      return NextResponse.json({ ok: true, products });
    }

    if (action === "similar") {
      const productId = req.nextUrl.searchParams.get("productId");
      if (!productId) return NextResponse.json({ ok: false, error: "productId required" }, { status: 400 });
      const products = await getSimilarProducts(user.id, productId, limit);
      return NextResponse.json({ ok: true, products });
    }

    if (action === "cross_sell") {
      const productId = req.nextUrl.searchParams.get("productId");
      if (!productId) return NextResponse.json({ ok: false, error: "productId required" }, { status: 400 });
      const products = await getCrossSellProducts(user.id, productId, limit);
      return NextResponse.json({ ok: true, products });
    }

    if (action === "profile") {
      const email = req.nextUrl.searchParams.get("email");
      if (!email) return NextResponse.json({ ok: false, error: "email required" }, { status: 400 });
      const profile = await getContactPurchaseProfile(user.id, email);
      return NextResponse.json({ ok: true, profile });
    }

    if (action === "block") {
      const email = req.nextUrl.searchParams.get("email");
      const style = (req.nextUrl.searchParams.get("style") ?? "grid") as "grid" | "list" | "hero" | "carousel";
      if (email) {
        const html = await generateRecommendationBlock(user.id, email, limit, style);
        return NextResponse.json({ ok: true, html });
      }
      const html = await generateBestSellerBlock(user.id, limit);
      return NextResponse.json({ ok: true, html });
    }

    // Default: product feed
    const feed = await getProductFeed(user.id, {
      sort: (req.nextUrl.searchParams.get("sort") ?? "best_selling") as "best_selling" | "price_low" | "price_high" | "newest" | "trending",
      category: req.nextUrl.searchParams.get("category") ?? undefined,
      limit,
    });
    return NextResponse.json({ ok: true, ...feed });
  } catch (err) {
    console.error("Product catalog error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
