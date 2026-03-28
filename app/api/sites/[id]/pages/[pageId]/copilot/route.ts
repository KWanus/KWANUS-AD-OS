import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { runWebsiteCopilot } from "@/lib/site-builder/copilotEngine";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import type { Block } from "@/components/site-builder/BlockRenderer";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id: siteId, pageId } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const limited = rateLimit(`ai:${user.id}`, RATE_LIMITS.aiGeneration);
    if (limited) return limited;

    const site = await prisma.site.findFirst({
      where: { id: siteId, userId: user.id },
      include: {
        pages: {
          where: { id: pageId },
          take: 1,
        },
      },
    });
    if (!site || site.pages.length === 0) {
      return NextResponse.json({ ok: false, error: "Page not found" }, { status: 404 });
    }

    const page = site.pages[0];
    const body = await req.json() as {
      instruction?: string;
      blocks?: Block[];
      pageTitle?: string;
      siteName?: string;
      selectedBlockId?: string | null;
      executionTier?: "core" | "elite";
    };
    if (!body.instruction?.trim()) {
      return NextResponse.json({ ok: false, error: "Instruction is required" }, { status: 400 });
    }

    const { updatedBlocks, report } = await runWebsiteCopilot({
      instruction: body.instruction.trim(),
      siteName: body.siteName || site.name,
      pageTitle: body.pageTitle || page.title,
      blocks: body.blocks ?? ((page.blocks as unknown as Block[]) ?? []),
      selectedBlockId: body.selectedBlockId,
      executionTier: body.executionTier === "core" ? "core" : "elite",
      generationContext: typeof site.theme === "object" && site.theme && "generation" in (site.theme as Record<string, unknown>)
        ? ((site.theme as Record<string, unknown>).generation as {
            businessName?: string;
            niche?: string;
            location?: string;
            sourceUrl?: string;
            templateId?: string;
            pageType?: string;
            executionTier?: "core" | "elite";
            blueprintScore?: { overall?: number };
            conversionNotes?: { primary_goal?: string; trust_elements_used?: string[]; objections_addressed?: string[] };
          })
        : null,
    });

    return NextResponse.json({
      ok: true,
      updatedBlocks,
      report,
      executionTier: body.executionTier === "core" ? "core" : "elite",
    });
  } catch (error) {
    console.error("Website copilot route failed:", error);
    return NextResponse.json({ ok: false, error: "Failed to run website copilot" }, { status: 500 });
  }
}
