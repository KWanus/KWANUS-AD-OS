import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createVideo, generateVideoScripts, hasVideoSpokesperson } from "@/lib/agents/videoSpokesperson";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.businessProfile.findUnique({ where: { userId: user.id } });
    const scripts = generateVideoScripts({
      businessName: profile?.businessName ?? "Your Business",
      niche: profile?.niche ?? "business",
      ownerName: user.name?.split(" ")[0] ?? "there",
      audience: profile?.targetAudience ?? "customers",
      outcome: profile?.mainOffer ?? "results",
    });

    return NextResponse.json({ ok: true, scripts, configured: hasVideoSpokesperson() });
  } catch (err) {
    console.error("Video scripts error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!hasVideoSpokesperson()) {
      return NextResponse.json({ ok: false, error: "HeyGen not configured. Set HEYGEN_API_KEY." }, { status: 400 });
    }

    const body = await req.json() as { script: string; outputSize?: string; avatarId?: string };
    if (!body.script) return NextResponse.json({ ok: false, error: "script required" }, { status: 400 });

    const result = await createVideo({
      script: body.script,
      outputSize: (body.outputSize as "landscape" | "portrait" | "square") ?? "landscape",
      avatarId: body.avatarId,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Video creation error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
