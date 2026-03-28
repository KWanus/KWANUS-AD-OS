import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET /api/analyses/export
 * Export all scan analyses as CSV.
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const analyses = await prisma.analysisRun.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        opportunityAssessments: { take: 1 },
      },
    });

    const headers = [
      "Title", "URL", "Mode", "Score", "Verdict", "Confidence",
      "Demand", "Offer", "Emotion", "Trust", "Conversion",
      "Ad Viability", "Email Potential", "SEO", "Differentiation", "Risk",
      "Top Gaps", "Top Strengths", "Recommended Path", "Date",
    ];

    const rows = analyses.map(a => {
      const opp = a.opportunityAssessments[0];
      return [
        escapeCsv(a.title ?? ""),
        escapeCsv(a.inputUrl),
        a.mode,
        String(a.score ?? ""),
        a.verdict ?? "",
        a.confidence ?? "",
        String(opp?.demandPotential ?? ""),
        String(opp?.offerStrength ?? ""),
        String(opp?.emotionalLeverage ?? ""),
        String(opp?.trustCredibility ?? ""),
        String(opp?.conversionReadiness ?? ""),
        String(opp?.adViability ?? ""),
        String(opp?.emailLifecyclePotential ?? ""),
        String(opp?.seoPotential ?? ""),
        String(opp?.differentiation ?? ""),
        String(opp?.risk ?? ""),
        escapeCsv(((opp?.topGaps ?? []) as string[]).join("; ")),
        escapeCsv(((opp?.topStrengths ?? []) as string[]).join("; ")),
        escapeCsv(opp?.recommendedPath ?? ""),
        new Date(a.createdAt).toISOString().split("T")[0],
      ];
    });

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="analyses-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (err) {
    console.error("Analyses export:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
