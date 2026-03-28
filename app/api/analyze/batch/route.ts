import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * POST /api/analyze/batch
 * Scan multiple URLs in sequence. Returns results for each URL.
 * Max 5 URLs per batch to prevent abuse.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      urls: string[];
      mode?: string;
      executionTier?: string;
    };

    if (!body.urls?.length) {
      return NextResponse.json({ ok: false, error: "URLs array is required" }, { status: 400 });
    }

    if (body.urls.length > 5) {
      return NextResponse.json({ ok: false, error: "Maximum 5 URLs per batch" }, { status: 400 });
    }

    const baseUrl = req.headers.get("origin") ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const results: {
      url: string;
      ok: boolean;
      score?: number;
      verdict?: string;
      title?: string;
      analysisId?: string;
      error?: string;
    }[] = [];

    for (const url of body.urls) {
      const trimmed = url.trim();
      if (!trimmed) {
        results.push({ url: trimmed, ok: false, error: "Empty URL" });
        continue;
      }

      try {
        const res = await fetch(`${baseUrl}/api/analyze`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: req.headers.get("cookie") ?? "",
          },
          body: JSON.stringify({
            url: trimmed,
            mode: body.mode ?? "operator",
            executionTier: body.executionTier ?? "elite",
          }),
        });

        const data = await res.json() as {
          ok: boolean;
          analysis?: { id?: string; score?: number; verdict?: string; title?: string };
          error?: string;
        };

        if (data.ok && data.analysis) {
          results.push({
            url: trimmed,
            ok: true,
            score: data.analysis.score,
            verdict: data.analysis.verdict,
            title: data.analysis.title,
            analysisId: data.analysis.id ?? undefined,
          });
        } else {
          results.push({ url: trimmed, ok: false, error: data.error ?? "Analysis failed" });
        }
      } catch (err) {
        results.push({ url: trimmed, ok: false, error: "Request failed" });
      }
    }

    const successful = results.filter(r => r.ok).length;
    const avgScore = successful > 0
      ? Math.round(results.filter(r => r.ok).reduce((s, r) => s + (r.score ?? 0), 0) / successful)
      : 0;

    return NextResponse.json({
      ok: true,
      results,
      summary: {
        total: results.length,
        successful,
        failed: results.length - successful,
        avgScore,
      },
    });
  } catch (err) {
    console.error("Batch analyze error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
