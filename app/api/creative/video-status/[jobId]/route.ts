import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { config } from "@/lib/config";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { jobId } = await params;
  const apiKey = config.runwayApiKey;

  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "No Runway API key" }, { status: 402 });
  }

  try {
    const res = await fetch(`https://api.dev.runwayml.com/v1/tasks/${jobId}`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "X-Runway-Version": "2024-11-06",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `Status check failed: ${res.status}` }, { status: 500 });
    }

    const data = await res.json() as {
      id: string;
      status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";
      output?: string[];
      failure?: string;
      progress?: number;
    };

    return NextResponse.json({
      ok: true,
      jobId: data.id,
      status: data.status,
      videoUrl: data.output?.[0] ?? null,
      failure: data.failure ?? null,
      progress: data.progress ?? 0,
    });
  } catch (err) {
    console.error("Video status error:", err);
    return NextResponse.json({ ok: false, error: "Status check failed" }, { status: 500 });
  }
}
