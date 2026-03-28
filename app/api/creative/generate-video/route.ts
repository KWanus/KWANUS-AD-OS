import { NextRequest, NextResponse } from "next/server";
import { deductCredits, getOrCreateUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";

// Runway Gen-3 Alpha Turbo via REST API
// Docs: https://docs.dev.runwayml.com/

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
    };

    // Credit check
    try {
      await deductCredits(5); // 5 credits per video
    } catch (cErr) {
      return NextResponse.json({ ok: false, error: "insufficient_credits", message: "You need 5 credits to generate a video." }, { status: 402 });
    }

    const payload: Record<string, unknown> = {
      model: "gen3a_turbo",
      promptText: body.prompt,
      duration: body.duration ?? 5,
      ratio: body.ratio ?? "768:1344", // 9:16
    };

    if (body.imageUrl) {
      payload.promptImage = body.imageUrl;
    }

    const res = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
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
      console.error("Runway API error:", errText);
      return NextResponse.json({ ok: false, error: `Runway API error: ${res.status}` }, { status: 500 });
    }

    const data = await res.json() as { id: string; status: string };
    return NextResponse.json({ ok: true, jobId: data.id, status: data.status });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Video generation failed";
    console.error("Video generation error:", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
