import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { createDiscountCode, listDiscountCodes, validateDiscountCode, toggleDiscountCode } from "@/lib/payments/discountCodes";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const codes = await listDiscountCodes(user.id);
    return NextResponse.json({ ok: true, codes });
  } catch (err) {
    console.error("Discounts error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    if (body.action === "create") {
      const code = await createDiscountCode(user.id, {
        code: body.code,
        type: body.type ?? "percentage",
        value: body.value,
        maxUses: body.maxUses,
        expiresAt: body.expiresAt,
      });
      return NextResponse.json({ ok: true, code });
    }

    if (body.action === "validate") {
      // Public validation — find site owner
      const result = await validateDiscountCode(body.userId ?? user.id, body.code);
      return NextResponse.json({ ok: true, ...result });
    }

    if (body.action === "toggle") {
      await toggleDiscountCode(body.discountId, body.active);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Discount error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
