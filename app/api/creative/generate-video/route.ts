import { NextRequest, NextResponse } from "next/server";
import { deductCredits, getOrCreateUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";

// Runway Gen-4 Turbo via REST API
// Docs: https://docs.dev.runwayml.com/

function buildVideoPrompt(prompt: string, executionTier: "core" | "elite") {
  if (executionTier === "elite") {
    return `Create a premium commercial video shot with top-operator ad polish, stronger product readability, cleaner motion discipline, sharper focal hierarchy, richer buyer emotion, and a conversion-first finish.\n\nOriginal brief:\n${prompt}`;
  }
  return `Create a strong performance-marketing video shot with clear motion, practical composition, and ad-ready clarity.\n\nOriginal brief:\n${prompt}`;
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.RUNWAY_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      error: "no_key",
      message: "Add RUNWAY_API_KEY to your .env file to enable AI video generation.",
    }, { status: 402 });
  }

  try {
    const body = await req.json() as {
      prompt: string;
      imageUrl?: string;
      duration?: 5 | 10;
      ratio?: "768:1344" | "1344:768" | "1024:1024";
      executionTier?: "core" | "elite";
    };
    const executionTier = body.executionTier === "core" ? "core" : "elite";

    // Credit check
    try {
      await deductCredits(5); // 5 credits per video
    } catch (cErr) {
      return NextResponse.json({ ok: false, error: "insufficient_credits", message: "You need 5 credits to generate a video." }, { status: 402 });
    }

    const payload: Record<string, unknown> = {
      model: "gen4_turbo",
      promptText: buildVideoPrompt(body.prompt, executionTier),
      duration: body.duration ?? 5,
      ratio: body.ratio === "768:1344" ? "9:16" : (body.ratio ?? "9:16"),
    };

    if (body.imageUrl) {
      payload.promptImage = body.imageUrl;
    }

    // Use image_to_video when an image is provided, otherwise text_to_video
    const endpoint = body.imageUrl
      ? "https://api.dev.runwayml.com/v1/image_to_video"
      : "https://api.dev.runwayml.com/v1/text_to_video";

    console.log("Runway Request Payload:", JSON.stringify(payload, null, 2));

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Runway API Error Response (" + res.status + "):", errText);
      return NextResponse.json({
        ok: false,
        error: `Runway API error: ${res.status}`,
        message: errText
      }, { status: 500 });
    }

    const data = await res.json() as { id: string; status: string };
    return NextResponse.json({ ok: true, jobId: data.id, status: data.status, executionTier });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Video generation failed";
    console.error("Video generation error:", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
