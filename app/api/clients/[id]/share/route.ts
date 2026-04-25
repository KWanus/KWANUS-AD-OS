import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

/** POST — generate a public share link for a client report */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    // Verify client belongs to user
    const client = await prisma.client.findFirst({ where: { id, userId: user.id } });
    if (!client) return NextResponse.json({ ok: false, error: "Client not found" }, { status: 404 });

    // Generate or retrieve share token
    const existing = await prisma.himalayaFunnelEvent.findFirst({
      where: { userId: user.id, event: "client_share_token" },
    });

    let token: string;
    const existingMeta = existing?.metadata as Record<string, unknown> | null;
    if (existingMeta?.clientId === id && existingMeta?.token) {
      token = existingMeta.token as string;
    } else {
      token = randomBytes(16).toString("hex");
      await prisma.himalayaFunnelEvent.create({
        data: {
          userId: user.id,
          event: "client_share_token",
          metadata: { clientId: id, token, createdAt: new Date().toISOString() },
        },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://himalaya.app";
    return NextResponse.json({ ok: true, shareUrl: `${appUrl}/report/${token}` });
  } catch (err) {
    console.error("Share error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
