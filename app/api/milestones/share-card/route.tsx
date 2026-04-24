import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title") ?? "First Sale!";
  const amount = req.nextUrl.searchParams.get("amount") ?? "$0";
  const days = req.nextUrl.searchParams.get("days") ?? "1";
  const level = req.nextUrl.searchParams.get("level") ?? "Starter";
  const name = req.nextUrl.searchParams.get("name") ?? "Entrepreneur";

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #0c0a08 0%, #1a1510 50%, #0c0a08 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        {/* Gold accent */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: "linear-gradient(90deg, #f5a623, #e07850)" }} />

        {/* Badge */}
        <div style={{
          width: 80, height: 80, borderRadius: 20,
          background: "linear-gradient(135deg, #f5a623, #e07850)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 24, boxShadow: "0 0 60px rgba(245, 166, 35, 0.3)",
        }}>
          <span style={{ fontSize: 40 }}>🏆</span>
        </div>

        {/* Title */}
        <div style={{ fontSize: 48, fontWeight: 900, color: "#f5a623", textAlign: "center", marginBottom: 8 }}>
          {title}
        </div>

        {/* Amount */}
        <div style={{ fontSize: 72, fontWeight: 900, color: "#f5f0e8", textAlign: "center", marginBottom: 16 }}>
          {amount}
        </div>

        {/* Details */}
        <div style={{ fontSize: 20, color: "rgba(245, 240, 232, 0.4)", textAlign: "center", marginBottom: 32 }}>
          in {days} days · Level: {level}
        </div>

        {/* User */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 24px", borderRadius: 100,
          border: "1px solid rgba(245, 166, 35, 0.2)",
          background: "rgba(245, 166, 35, 0.06)",
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#f5a623" }}>{name}</span>
          <span style={{ fontSize: 14, color: "rgba(245, 240, 232, 0.3)" }}>built with Himalaya</span>
        </div>

        {/* Brand */}
        <div style={{
          position: "absolute", bottom: 24, fontSize: 14, fontWeight: 800,
          color: "rgba(245, 240, 232, 0.1)", letterSpacing: 6,
        }}>
          HIMALAYA
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
