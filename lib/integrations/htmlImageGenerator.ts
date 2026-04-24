// ---------------------------------------------------------------------------
// HTML Image Generator — creates ad-ready graphics with ZERO external APIs
//
// When fal.ai and OpenAI are both down or not configured, this generates
// professional ad images using pure HTML/CSS rendered as data URIs.
//
// These aren't stock photos — they're branded graphics with:
// - The ad hook text overlaid
// - Brand colors
// - Professional typography
// - Platform-sized (1:1, 4:5, 9:16)
//
// Good enough to post on social media immediately.
// ---------------------------------------------------------------------------

export type HtmlAdImage = {
  base64: string;    // SVG data URI
  prompt: string;    // What the image represents
  model: string;     // "html-generator"
  width: number;
  height: number;
};

const GRADIENTS = [
  "linear-gradient(135deg, #0c0a08, #1c1916)",
  "linear-gradient(135deg, #1a1a2e, #16213e)",
  "linear-gradient(135deg, #0f3460, #16213e)",
  "linear-gradient(135deg, #533483, #0f3460)",
  "linear-gradient(135deg, #2d132c, #801336)",
  "linear-gradient(135deg, #1b4332, #081c15)",
  "linear-gradient(135deg, #3c1642, #086375)",
  "linear-gradient(135deg, #1f1a15, #3d2914)",
];

const ACCENT_COLORS = ["#f5a623", "#e07850", "#f5a623", "#e07850", "#ec4899", "#10b981", "#f59e0b", "#ef4444"];

export function generateHtmlAdImage(input: {
  hookText: string;
  subText?: string;
  brandColor?: string;
  businessName?: string;
  aspectRatio?: "1:1" | "4:5" | "9:16" | "16:9";
  style?: "dark" | "gradient" | "bold" | "minimal";
}): HtmlAdImage {
  const ar = input.aspectRatio ?? "1:1";
  const sizes: Record<string, { w: number; h: number }> = {
    "1:1": { w: 1080, h: 1080 },
    "4:5": { w: 1080, h: 1350 },
    "9:16": { w: 1080, h: 1920 },
    "16:9": { w: 1920, h: 1080 },
  };
  const { w, h } = sizes[ar] ?? sizes["1:1"];

  const gradient = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
  const accent = input.brandColor ?? ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
  const hookSize = input.hookText.length > 60 ? 42 : input.hookText.length > 30 ? 54 : 64;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0c0a08"/>
      <stop offset="100%" style="stop-color:#1c1916"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>

  <!-- Accent bar -->
  <rect x="0" y="0" width="${w}" height="6" fill="${accent}"/>

  <!-- Business name -->
  ${input.businessName ? `<text x="${w / 2}" y="${h * 0.12}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="24" font-weight="700" fill="${accent}" letter-spacing="4">${escapeXml(input.businessName.toUpperCase())}</text>` : ""}

  <!-- Hook text -->
  ${wrapSvgText(input.hookText, w / 2, h * 0.42, hookSize, w - 120, "#ffffff")}

  <!-- Sub text -->
  ${input.subText ? `<text x="${w / 2}" y="${h * 0.72}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="26" fill="rgba(255,255,255,0.5)">${escapeXml(input.subText)}</text>` : ""}

  <!-- CTA button -->
  <rect x="${w / 2 - 140}" y="${h * 0.82}" width="280" height="56" rx="12" fill="${accent}"/>
  <text x="${w / 2}" y="${h * 0.82 + 37}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="20" font-weight="700" fill="#0c0a08">Learn More →</text>

  <!-- Bottom accent -->
  <rect x="0" y="${h - 4}" width="${w}" height="4" fill="${accent}" opacity="0.5"/>
</svg>`;

  const base64 = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return {
    base64,
    prompt: input.hookText,
    model: "html-generator",
    width: w,
    height: h,
  };
}

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrapSvgText(text: string, x: number, startY: number, fontSize: number, maxWidth: number, fill: string): string {
  const charsPerLine = Math.floor(maxWidth / (fontSize * 0.55));
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length > charsPerLine) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += " " + word;
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim());

  const lineHeight = fontSize * 1.3;
  const totalHeight = lines.length * lineHeight;
  const adjustedStartY = startY - totalHeight / 2;

  return lines.map((line, i) =>
    `<text x="${x}" y="${adjustedStartY + i * lineHeight}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="900" fill="${fill}" letter-spacing="-1">${escapeXml(line)}</text>`
  ).join("\n  ");
}

/** Generate multiple ad images from hooks — works offline, zero API calls */
export function generateAdImageSet(input: {
  hooks: string[];
  brandColor?: string;
  businessName?: string;
}): HtmlAdImage[] {
  const ratios: ("1:1" | "4:5" | "9:16")[] = ["1:1", "4:5", "9:16"];

  return input.hooks.map((hook, i) => generateHtmlAdImage({
    hookText: hook,
    brandColor: input.brandColor,
    businessName: input.businessName,
    aspectRatio: ratios[i % ratios.length],
  }));
}
