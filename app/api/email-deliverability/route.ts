import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { checkDomainHealth, getDomainSetupInstructions, checkSpamScore, getListHealth, suggestListCleanup, previewEmail, getBounceRate } from "@/lib/email/deliverability";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const action = req.nextUrl.searchParams.get("action");

    if (action === "domain") {
      const domain = req.nextUrl.searchParams.get("domain");
      if (!domain) return NextResponse.json({ ok: false, error: "Domain required" }, { status: 400 });
      const health = await checkDomainHealth(domain);
      return NextResponse.json({ ok: true, health });
    }

    if (action === "setup") {
      const domain = req.nextUrl.searchParams.get("domain") ?? "";
      const provider = req.nextUrl.searchParams.get("provider") ?? "resend";
      const instructions = getDomainSetupInstructions(domain, provider as "resend" | "gmail" | "smtp");
      return NextResponse.json({ ok: true, instructions });
    }

    if (action === "list_health") {
      const health = await getListHealth(user.id);
      return NextResponse.json({ ok: true, health });
    }

    if (action === "cleanup") {
      const suggestions = await suggestListCleanup(user.id);
      return NextResponse.json({ ok: true, suggestions });
    }

    if (action === "bounce_rate") {
      const rate = await getBounceRate(user.id);
      return NextResponse.json({ ok: true, ...rate });
    }

    // Default: list health
    const health = await getListHealth(user.id);
    return NextResponse.json({ ok: true, health });
  } catch (err) {
    console.error("Deliverability error:", err);
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

    if (body.action === "spam_check") {
      const result = checkSpamScore(body.subject ?? "", body.body ?? "");
      return NextResponse.json({ ok: true, ...result });
    }

    if (body.action === "preview") {
      const preview = previewEmail(body.subject ?? "", body.previewText ?? "", body.fromName ?? "", body.body ?? "");
      return NextResponse.json({ ok: true, preview });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Deliverability error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
