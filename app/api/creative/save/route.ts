import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
    try {
        const user = await getOrCreateUser();
        if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

        const body = await req.json() as {
            name: string;
            type: "image" | "video";
            campaignId?: string;
            state: Record<string, unknown>;
            outputUrl?: string;
        };

        const creative = await prisma.creativeWork.create({
            data: {
                name: body.name,
                type: body.type,
                userId: user.id,
                campaignId: body.campaignId || null,
                state: body.state as Prisma.InputJsonValue,
                outputUrl: body.outputUrl || null,
            },
        });

        return NextResponse.json({ ok: true, id: creative.id });
    } catch (err) {
        console.error("Save creative error:", err);
        return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const user = await getOrCreateUser();
        if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const campaignId = searchParams.get("campaignId");

        const creatives = await prisma.creativeWork.findMany({
            where: {
                userId: user.id,
                ...(campaignId ? { campaignId } : {}),
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ ok: true, creatives });
    } catch (err) {
        return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
    }
}
