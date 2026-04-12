import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { browseMarketplace, listOnMarketplace, purchaseMarketplaceItem } from "@/lib/agents/marketplaceEngine";

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type") ?? undefined;
    const category = req.nextUrl.searchParams.get("category") ?? undefined;
    const sortBy = (req.nextUrl.searchParams.get("sort") ?? "newest") as "newest" | "popular" | "rating";
    const maxPrice = req.nextUrl.searchParams.get("maxPrice") ? parseFloat(req.nextUrl.searchParams.get("maxPrice")!) : undefined;

    const items = await browseMarketplace({ type, category, sortBy, maxPrice });
    return NextResponse.json({ ok: true, items, total: items.length });
  } catch (err) {
    console.error("Marketplace error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      action: "list" | "purchase";
      // For listing
      type?: string;
      title?: string;
      description?: string;
      price?: number;
      sourceId?: string;
      category?: string;
      tags?: string[];
      // For purchase
      itemId?: string;
    };

    if (body.action === "list") {
      const result = await listOnMarketplace({
        userId: user.id,
        type: (body.type ?? "funnel") as any,
        title: body.title ?? "",
        description: body.description ?? "",
        price: body.price ?? 0,
        sourceId: body.sourceId ?? "",
        category: body.category ?? "general",
        tags: body.tags ?? [],
      });
      return NextResponse.json(result);
    }

    if (body.action === "purchase" && body.itemId) {
      const result = await purchaseMarketplaceItem({ buyerId: user.id, itemId: body.itemId });
      return NextResponse.json(result);
    }

    return NextResponse.json({ ok: false, error: "action required (list or purchase)" }, { status: 400 });
  } catch (err) {
    console.error("Marketplace error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
