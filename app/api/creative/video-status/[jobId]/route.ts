import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const apiKey = process.env.RUNWAY_API_KEY;

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
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
