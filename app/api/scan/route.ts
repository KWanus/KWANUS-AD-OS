import { NextRequest, NextResponse } from "next/server";
import { executeBusinessScan, executeProductScan } from "@/lib/scanOrchestrator";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

type ExecutionTier = "core" | "elite";

export async function POST(req: NextRequest) {
  try {
    // Auth is optional for scans — allow unauthenticated usage
    let user = null;
    try {
      const { userId: clerkId } = await auth();
      if (clerkId) {
        user = await getOrCreateUser();
      }
    } catch (_authErr) {
      // Auth failed — continue without user
    }

    const body = await req.json();
    const { mode, url, productInput } = body;
    const executionTier: ExecutionTier = body?.executionTier === "core" ? "core" : "elite";

    if (!mode || (mode !== "business" && mode !== "product")) {
      return NextResponse.json(
        { success: false, error: "Invalid mode. Use 'business' or 'product'." },
        { status: 400 }
      );
    }

    if (mode === "business") {
      if (!url || typeof url !== "string" || !url.trim()) {
        return NextResponse.json(
          { success: false, error: "URL is required for business scan." },
          { status: 400 }
        );
      }
      const result = await executeBusinessScan(url.trim());

      // Persist - graceful fallback if DB unavailable
      try {
        await prisma.scanResult.create({
          data: {
            mode: "business",
            title: result.url,
            payloadJson: { ...result, executionTier } as object,
          },
        });
      } catch (dbErr) {
        console.error("DB write failed (non-fatal):", dbErr);
      }

      return NextResponse.json({ success: true, mode: "business", data: result, executionTier });
    }

    if (mode === "product") {
      const input = productInput || "product scan";
      const result = await executeProductScan(input);

      try {
        await prisma.scanResult.create({
          data: {
            mode: "product",
            title: result.name,
            payloadJson: { ...result, executionTier } as object,
          },
        });
      } catch (dbErr) {
        console.error("DB write failed (non-fatal):", dbErr);
      }

      return NextResponse.json({ success: true, mode: "product", data: result, executionTier });
    }
  } catch (err) {
    console.error("Scan error:", err);
    return NextResponse.json(
      { success: false, error: "Internal scan error. Please try again." },
      { status: 500 }
    );
  }
}
