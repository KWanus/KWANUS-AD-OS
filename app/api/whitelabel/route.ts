import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import {
  getWhiteLabelConfig, saveWhiteLabelConfig, getSubAccounts,
  createSubAccount, getDefaultPricingTiers,
} from "@/lib/agents/whitelabelEngine";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const config = await getWhiteLabelConfig(user.id);
    const subAccounts = await getSubAccounts(user.id);
    const defaultTiers = getDefaultPricingTiers();

    return NextResponse.json({
      ok: true,
      config: config ?? { enabled: false, brandName: "", primaryColor: "#06b6d4", hideHimalayaBranding: false },
      subAccounts,
      defaultTiers,
    });
  } catch (err) {
    console.error("White-label error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { action: string; [key: string]: unknown };

    if (body.action === "save_config") {
      await saveWhiteLabelConfig(user.id, body.config as any);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "create_subaccount") {
      const result = await createSubAccount({
        agencyUserId: user.id,
        clientName: body.clientName as string,
        clientEmail: body.clientEmail as string,
        tier: (body.tier as string) ?? "starter",
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("White-label error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
