import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { createPaymentLink } from "@/lib/payments/stripe";

/** POST — Create a Stripe payment link */
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      clientId: string;
      amount: number;
      description: string;
    };

    const result = await createPaymentLink({
      userId: user.id,
      clientId: body.clientId,
      amount: body.amount,
      description: body.description,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Create payment link error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
