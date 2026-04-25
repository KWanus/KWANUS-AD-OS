import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { createInvoice } from "@/lib/payments/stripe";

/** POST — Create a Stripe invoice */
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      clientId: string;
      lineItems: Array<{ description: string; amount: number }>;
      dueDate?: string;
    };

    const result = await createInvoice({
      userId: user.id,
      clientId: body.clientId,
      lineItems: body.lineItems,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Create invoice error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
