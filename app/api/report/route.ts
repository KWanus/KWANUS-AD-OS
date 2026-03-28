import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

type ExecutionTier = "core" | "elite";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();

    const reportType = formData.get("reportType");
    const notes = formData.get("notes");
    const tierValue = formData.get("executionTier");
    const files = formData.getAll("files") as File[];
    const executionTier: ExecutionTier = tierValue === "core" ? "core" : "elite";

    if (!reportType || typeof reportType !== "string" || !reportType.trim()) {
      return NextResponse.json(
        { success: false, error: "Report type is required." },
        { status: 400 }
      );
    }

    // Phase 1: store filename as placeholder (no cloud storage yet)
    const fileUrl =
      files.length > 0
        ? files.map((f) => f.name).join(", ")
        : null;

    try {
      const user = await getOrCreateUser().catch(() => null);
      const normalizedNotes = typeof notes === "string" && notes.trim() ? notes.trim() : null;
      await prisma.reportIntake.create({
        data: {
          userId: user?.id,
          reportType: reportType.trim(),
          fileUrl,
          notes: [`Execution Tier: ${executionTier.toUpperCase()}`, normalizedNotes].filter(Boolean).join("\n\n"),
          status: "submitted",
        },
      });
    } catch (dbErr) {
      console.error("DB write failed (non-fatal):", dbErr);
    }

    return NextResponse.json({
      success: true,
      executionTier,
      nextPath: `/analyze?execution_tier=${executionTier}`,
    });
  } catch (err) {
    console.error("Report intake error:", err);
    return NextResponse.json(
      { success: false, error: "Internal error. Please try again." },
      { status: 500 }
    );
  }
}
