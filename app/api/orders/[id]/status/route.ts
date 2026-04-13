import { NextRequest, NextResponse } from "next/server";
import { getOrderStatus } from "@/lib/himalaya/postPurchaseEngine";

/** GET /api/orders/[id]/status — public order status page (no auth required) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const status = await getOrderStatus(id);
  if (!status) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  return NextResponse.json({ ok: true, order: status });
}
