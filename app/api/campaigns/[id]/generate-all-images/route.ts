// ---------------------------------------------------------------------------
// POST /api/campaigns/[id]/generate-all-images
// Generates images for ALL ad hooks in a campaign at once
// Uses the prompt engine to create platform-specific prompts
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { generateImages, type ImageGenInput } from "@/lib/integrations/imageGeneration";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const campaign = await prisma.campaign.findFirst({
      where: { id, userId: user.id },
      include: { adVariations: true, analysisRun: true },
    });

    if (!campaign) return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });

    const hooks = campaign.adVariations.filter(
      (v) => v.type === "hook" && !((v.content as Record<string, unknown>).imageBase64)
    );

    if (hooks.length === 0) {
      return NextResponse.json({ ok: true, generated: 0, message: "All hooks already have images" });
    }

    // Get business context from analysis run
    const packet = campaign.analysisRun?.decisionPacket as Record<string, unknown> | null;
    const audience = (packet?.audience as string)?.split(",")[0]?.trim() ?? "customers";
    const painDesire = (packet?.painDesire as string) ?? "";
    const painPoint = painDesire.split("→")[0]?.trim() ?? "their problem";
    const outcome = painDesire.split("→")[1]?.trim() ?? "results";

    // Generate one image per hook
    const prompts: ImageGenInput[] = hooks.map((hook, i) => {
      const content = hook.content as Record<string, unknown>;
      const hookText = String(content.hook ?? "");
      const platform = hook.platform?.toLowerCase() ?? "facebook";

      const size: "1024x1024" | "1792x1024" | "1024x1792" =
        platform.includes("tiktok") || platform.includes("instagram") ? "1024x1792" :
        platform.includes("facebook") || platform.includes("google") ? "1792x1024" :
        "1024x1024";

      return {
        prompt: `Professional ad creative for ${audience}. Hook: "${hookText.slice(0, 100)}".
Pain point: ${painPoint}. Outcome: ${outcome}.
Style: ${i % 3 === 0 ? "bold product shot on premium dark background" : i % 3 === 1 ? "lifestyle photo showing transformation" : "high-contrast graphic with social proof elements"}.
Platform: ${platform}. No text overlays. Commercial photography quality.`,
        size,
        quality: "standard" as const,
      };
    });

    const result = await generateImages(prompts);

    // Attach images to variations
    let attached = 0;
    for (let i = 0; i < hooks.length && i < result.images.length; i++) {
      const img = result.images[i];
      if (img?.base64) {
        const content = hooks[i].content as Record<string, unknown>;
        await prisma.adVariation.update({
          where: { id: hooks[i].id },
          data: {
            content: {
              ...content,
              imageBase64: img.base64,
              imageModel: img.model,
            },
          },
        });
        attached++;
      }
    }

    return NextResponse.json({
      ok: true,
      generated: result.images.length,
      attached,
      total: hooks.length,
    });
  } catch (err) {
    console.error("Bulk image generation error:", err);
    return NextResponse.json({ ok: false, error: "Generation failed" }, { status: 500 });
  }
}
