// ---------------------------------------------------------------------------
// GET /api/paths/affiliate/find-products?niche=xxx
// Searches affiliate networks and returns scored product recommendations
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { findProducts } from "@/lib/paths/productFinder";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const niche = req.nextUrl.searchParams.get("niche");
    if (!niche) return NextResponse.json({ ok: false, error: "niche required" }, { status: 400 });

    const results = await findProducts(niche);
    return NextResponse.json({ ok: true, ...results });
  } catch (err) {
    console.error("Product finder error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
