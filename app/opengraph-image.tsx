import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Himalaya — AI Marketing OS";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #050a14 0%, #0a1628 50%, #050a14 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            boxShadow: "0 0 60px rgba(6, 182, 212, 0.4)",
          }}
        >
          <span style={{ fontSize: 40, color: "white" }}>⚡</span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 56,
            fontWeight: 900,
            color: "white",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Himalaya
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 24,
            color: "rgba(255, 255, 255, 0.5)",
            margin: "8px 0 0",
            fontWeight: 600,
          }}
        >
          AI Marketing OS
        </p>

        {/* Features */}
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 40,
          }}
        >
          {["Scan & Analyze", "Build & Launch", "Track & Grow"].map((text) => (
            <div
              key={text}
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                border: "1px solid rgba(6, 182, 212, 0.3)",
                background: "rgba(6, 182, 212, 0.1)",
                color: "rgba(6, 182, 212, 0.9)",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              {text}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
