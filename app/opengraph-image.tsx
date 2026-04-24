import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Himalaya — Build a Business in 60 Seconds";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0c0a08 0%, #1a1510 50%, #0c0a08 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Gold accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #f5a623, #e07850)",
          }}
        />

        {/* Logo */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "linear-gradient(135deg, #f5a623, #e07850)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
            boxShadow: "0 0 60px rgba(245, 166, 35, 0.3)",
          }}
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            color: "#f5f0e8",
            textAlign: "center",
            lineHeight: 1.1,
            marginBottom: 16,
            letterSpacing: -2,
          }}
        >
          Build a Business in 60 Seconds
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: "rgba(245, 240, 232, 0.4)",
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          Website, ads, emails, scripts, funnels — built with AI. No skills required.
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 40,
          }}
        >
          {["Website", "Ads", "Emails", "Scripts", "Analytics", "CRM"].map((f) => (
            <div
              key={f}
              style={{
                padding: "8px 20px",
                borderRadius: 100,
                border: "1px solid rgba(245, 166, 35, 0.2)",
                background: "rgba(245, 166, 35, 0.06)",
                color: "#f5a623",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              {f}
            </div>
          ))}
        </div>

        {/* Brand name */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 18,
            fontWeight: 800,
            color: "rgba(245, 240, 232, 0.15)",
            letterSpacing: 6,
          }}
        >
          HIMALAYA
        </div>
      </div>
    ),
    { ...size }
  );
}
