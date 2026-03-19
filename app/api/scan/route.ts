import { NextRequest, NextResponse } from "next/server";
import { executeBusinessScan, executeProductScan } from "@/lib/scanOrchestrator";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, url, productInput } = body;

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
            payloadJson: result as object,
          },
        });
      } catch (dbErr) {
        console.error("DB write failed (non-fatal):", dbErr);
      }

      return NextResponse.json({ success: true, mode: "business", data: result });
    }

    if (mode === "product") {
      const input = productInput || "product scan";
      const result = await executeProductScan(input);

      try {
        await prisma.scanResult.create({
          data: {
            mode: "product",
            title: result.name,
            payloadJson: result as object,
          },
        });
      } catch (dbErr) {
        console.error("DB write failed (non-fatal):", dbErr);
      }

      return NextResponse.json({ success: true, mode: "product", data: result });
    }
  } catch (err) {
    console.error("Scan error:", err);
    return NextResponse.json(
      { success: false, error: "Internal scan error. Please try again." },
      { status: 500 }
    );
  }
}
