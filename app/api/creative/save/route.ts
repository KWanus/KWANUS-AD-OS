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

        if (!body.name?.trim()) {
            return NextResponse.json({ ok: false, error: "name is required" }, { status: 400 });
        }
        if (!["image", "video"].includes(body.type)) {
            return NextResponse.json({ ok: false, error: "type must be 'image' or 'video'" }, { status: 400 });
        }

        const creative = await prisma.creativeWork.create({
            data: {
                name: body.name.trim(),
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
        console.error("Creative error:", err);
        return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
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
            take: 100,
        });

        return NextResponse.json({ ok: true, creatives });
    } catch (err) {
        console.error("Creative error:", err);
        return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
    }
}
