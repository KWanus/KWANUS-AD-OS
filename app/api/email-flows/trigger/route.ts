import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { fireTrigger, type TriggerEvent } from "@/lib/email-flows/triggerEngine";

/**
 * POST /api/email-flows/trigger
 *
 * Fire a trigger event to enroll contacts in matching flows.
 * Can be called from:
 * - Internal app events (form submission, purchase webhook)
 * - External webhooks (Stripe, Shopify, Zapier)
 * - Himalaya deploy (auto-enroll after email flow creation)
 */
export async function POST(req: NextRequest) {
  try {
    // Try auth first (internal calls)
    let userId: string | null = null;
    try {
      const { userId: clerkId } = await auth();
      if (clerkId) {
        const user = await getOrCreateUser();
        userId = user?.id ?? null;
      }
    } catch {
      // Auth optional for webhook calls
    }

    const body = (await req.json()) as {
      type: string;
      email: string;
      firstName?: string;
      lastName?: string;
      userId?: string; // for webhook calls that pass userId in body
      metadata?: Record<string, unknown>;
      tags?: string[];
    };

    if (!body.type || !body.email) {
      return NextResponse.json({ ok: false, error: "type and email are required" }, { status: 400 });
    }

    // Use authenticated userId or body userId
    const effectiveUserId = userId ?? body.userId;
    if (!effectiveUserId) {
      return NextResponse.json({ ok: false, error: "Unauthorized — no userId" }, { status: 401 });
    }

    const event: TriggerEvent = {
      type: body.type as TriggerEvent["type"],
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      userId: effectiveUserId,
      metadata: body.metadata,
      tags: body.tags,
    };

    const result = await fireTrigger(event);

    return NextResponse.json({
      ok: true,
      enrolled: result.enrolled,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (err) {
    console.error("Trigger error:", err);
    return NextResponse.json({ ok: false, error: "Trigger failed" }, { status: 500 });
  }
}
