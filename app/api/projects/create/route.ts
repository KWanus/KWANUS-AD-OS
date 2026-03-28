import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const BODY_SIZE_LIMIT = 16 * 1024; // 16 KB
const ALLOWED_SOURCE_TYPES = ["url", "product", "niche", "business", "affiliate", "local", "saas", "ecom"] as const;

export async function POST(req: NextRequest) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

        // Body size guard
        const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
        if (contentLength > BODY_SIZE_LIMIT) {
            return NextResponse.json({ ok: false, error: "Request body too large" }, { status: 413 });
        }

        const { name, sourceUrl, sourceType, executionTier } = await req.json() as {
            name?: string;
            sourceUrl?: string;
            sourceType?: string;
            executionTier?: "core" | "elite";
        };

        // Validate sourceUrl is a plausible URL if provided
        if (sourceUrl) {
            try { new URL(sourceUrl); } catch {
                return NextResponse.json({ ok: false, error: "Invalid source URL" }, { status: 400 });
            }
        }

        const lane = executionTier === "core" ? "core" : "elite";
        const safeName = name?.trim().slice(0, 200) || `Project: ${sourceUrl?.slice(0, 40) ?? "New"}`;
        const safeType = ALLOWED_SOURCE_TYPES.includes(sourceType as never) ? sourceType : undefined;

        const user = await prisma.user.findUnique({ where: { clerkId } });
        if (!user) return NextResponse.json({ ok: false, error: "User not synced" }, { status: 400 });

        const project = await prisma.campaign.create({
            data: {
                userId: user.id,
                name: safeName,
                mode: "saas",
                sourceUrl,
                sourceType: safeType,
                currentPhase: 1,
                workflowState: {
                    executionTier: lane,
                    source: { url: sourceUrl, type: safeType, timestamp: new Date() },
                    audit: null,
                    strategy: null,
                    produce: null,
                    deploy: null,
                },
            },
        });

        return NextResponse.json({ ok: true, projectId: project.id });
    } catch (err) {
        console.error("Project creation failed:", err instanceof Error ? err.message : err);
        return NextResponse.json({ ok: false, error: "Project creation failed" }, { status: 500 });
    }
}
