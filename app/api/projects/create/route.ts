import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

        const { name, sourceUrl, sourceType, executionTier } = await req.json() as {
            name?: string;
            sourceUrl?: string;
            sourceType?: string;
            executionTier?: "core" | "elite";
        };
        const lane = executionTier === "core" ? "core" : "elite";

        // Sync user
        const user = await prisma.user.findUnique({ where: { clerkId } });
        if (!user) return NextResponse.json({ ok: false, message: "User not synced" }, { status: 400 });

        const project = await prisma.campaign.create({
            data: {
                userId: user.id,
                name: name || `Project: ${sourceUrl?.slice(0, 20)}...`,
                mode: "saas",
                sourceUrl,
                sourceType,
                currentPhase: 1, // Phase 1: SOURCE
                workflowState: {
                    executionTier: lane,
                    source: { url: sourceUrl, type: sourceType, timestamp: new Date() },
                    audit: null,
                    strategy: null,
                    produce: null,
                    deploy: null
                }
            }
        });

        return NextResponse.json({ ok: true, projectId: project.id });
    } catch (error: any) {
        console.error("Project creation failed:", error);
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}
