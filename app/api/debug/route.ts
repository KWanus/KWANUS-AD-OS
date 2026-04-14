import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    return NextResponse.json({ ok: true, db: "connected", result });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      dbUrl: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.slice(0, 30)}...` : "NOT SET",
    });
  }
}
