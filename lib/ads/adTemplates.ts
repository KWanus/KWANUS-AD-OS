// ---------------------------------------------------------------------------
// Ad Templates — pre-designed layouts that users customize
//
// Each template is an SVG blueprint with editable fields.
// Users change the text, colors, and it renders instantly.
// No external API needed — pure frontend rendering.
// ---------------------------------------------------------------------------

export type AdTemplate = {
  id: string;
  name: string;
  category: "product" | "testimonial" | "before_after" | "stat" | "hook" | "offer" | "urgency";
  aspectRatio: "1:1" | "4:5" | "9:16" | "16:9";
  platform: "instagram" | "facebook" | "tiktok" | "story" | "universal";
  fields: {
    name: string;
    type: "text" | "color" | "number" | "image" | "select";
    default: string;
    placeholder: string;
    maxLength?: number;
    options?: string[];
  }[];
  render: (values: Record<string, string>) => string; // Returns SVG string
};

// ── Helper ───────────────────────────────────────────────────────────────────

function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrapText(text: string, x: number, y: number, fontSize: number, maxWidth: number, fill: string, weight: string = "900"): string {
  const charsPerLine = Math.floor(maxWidth / (fontSize * 0.52));
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > charsPerLine) { lines.push(current.trim()); current = word; }
    else current += " " + word;
  }
  if (current.trim()) lines.push(current.trim());
  const lineHeight = fontSize * 1.25;
  return lines.map((line, i) =>
    `<text x="${x}" y="${y + i * lineHeight}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="${weight}" fill="${fill}" letter-spacing="-0.5">${esc(line)}</text>`
  ).join("\n");
}

// ── Templates ────────────────────────────────────────────────────────────────

export const AD_TEMPLATES: AdTemplate[] = [
  // ── HOOK TEMPLATE (1:1) ──
  {
    id: "hook-bold",
    name: "Bold Hook",
    category: "hook",
    aspectRatio: "1:1",
    platform: "universal",
    fields: [
      { name: "headline", type: "text", default: "Stop doing this if you want results", placeholder: "Your hook headline", maxLength: 60 },
      { name: "subtext", type: "text", default: "The truth nobody tells you", placeholder: "Supporting text", maxLength: 40 },
      { name: "cta", type: "text", default: "Learn More →", placeholder: "Button text", maxLength: 20 },
      { name: "brandColor", type: "color", default: "#f5a623", placeholder: "Brand color" },
      { name: "bgColor", type: "color", default: "#0c0a08", placeholder: "Background" },
    ],
    render: (v) => {
      const w = 1080, h = 1080;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="${v.bgColor}"/>
        <rect x="0" y="0" width="${w}" height="8" fill="${v.brandColor}"/>
        <rect x="0" y="${h-8}" width="${w}" height="8" fill="${v.brandColor}" opacity="0.5"/>
        ${wrapText(v.headline, w/2, h*0.35, 64, w-120, "#ffffff")}
        <text x="${w/2}" y="${h*0.62}" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" fill="rgba(255,255,255,0.5)">${esc(v.subtext)}</text>
        <rect x="${w/2-140}" y="${h*0.75}" width="280" height="60" rx="14" fill="${v.brandColor}"/>
        <text x="${w/2}" y="${h*0.75+40}" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="800" fill="${v.bgColor}">${esc(v.cta)}</text>
      </svg>`;
    },
  },

  // ── TESTIMONIAL TEMPLATE (4:5) ──
  {
    id: "testimonial-quote",
    name: "Customer Quote",
    category: "testimonial",
    aspectRatio: "4:5",
    platform: "instagram",
    fields: [
      { name: "quote", type: "text", default: "This changed everything for me. I was skeptical but the results speak for themselves.", placeholder: "Customer quote", maxLength: 120 },
      { name: "name", type: "text", default: "Sarah K., 47", placeholder: "Customer name", maxLength: 30 },
      { name: "result", type: "text", default: "Lost 17 lbs in 2 months", placeholder: "Their result", maxLength: 40 },
      { name: "brandColor", type: "color", default: "#f5a623", placeholder: "Accent color" },
    ],
    render: (v) => {
      const w = 1080, h = 1350;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="#0c0a08"/>
        <text x="80" y="200" font-family="Georgia,serif" font-size="120" fill="${v.brandColor}" opacity="0.3">"</text>
        ${wrapText(v.quote, w/2, 340, 40, w-160, "rgba(255,255,255,0.8)", "400")}
        <text x="80" y="${h-280}" font-family="Arial,sans-serif" font-size="28" font-weight="700" fill="#ffffff">— ${esc(v.name)}</text>
        <rect x="80" y="${h-220}" width="200" height="4" rx="2" fill="${v.brandColor}"/>
        <text x="80" y="${h-180}" font-family="Arial,sans-serif" font-size="24" font-weight="700" fill="${v.brandColor}">${esc(v.result)}</text>
        <text x="${w/2}" y="${h-80}" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="rgba(255,255,255,0.25)">⭐⭐⭐⭐⭐ Verified Customer</text>
      </svg>`;
    },
  },

  // ── STAT TEMPLATE (1:1) ──
  {
    id: "stat-big-number",
    name: "Big Number Stat",
    category: "stat",
    aspectRatio: "1:1",
    platform: "universal",
    fields: [
      { name: "number", type: "text", default: "3x", placeholder: "The big number", maxLength: 10 },
      { name: "label", type: "text", default: "More Results Than Traditional Methods", placeholder: "What the number means", maxLength: 50 },
      { name: "subtext", type: "text", default: "Based on 2,000+ customers", placeholder: "Proof line", maxLength: 40 },
      { name: "brandColor", type: "color", default: "#f5a623", placeholder: "Number color" },
    ],
    render: (v) => {
      const w = 1080, h = 1080;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="#0c0a08"/>
        <text x="${w/2}" y="${h*0.42}" text-anchor="middle" font-family="Arial,sans-serif" font-size="200" font-weight="900" fill="${v.brandColor}">${esc(v.number)}</text>
        ${wrapText(v.label, w/2, h*0.58, 36, w-160, "#ffffff", "700")}
        <text x="${w/2}" y="${h*0.78}" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="rgba(255,255,255,0.35)">${esc(v.subtext)}</text>
      </svg>`;
    },
  },

  // ── OFFER TEMPLATE (9:16 for Stories/TikTok) ──
  {
    id: "offer-stack-story",
    name: "Offer Stack",
    category: "offer",
    aspectRatio: "9:16",
    platform: "story",
    fields: [
      { name: "headline", type: "text", default: "Everything You Need", placeholder: "Offer headline", maxLength: 30 },
      { name: "item1", type: "text", default: "✓ Full System Access", placeholder: "Item 1", maxLength: 30 },
      { name: "item2", type: "text", default: "✓ 10 Video Scripts", placeholder: "Item 2", maxLength: 30 },
      { name: "item3", type: "text", default: "✓ Email Automation", placeholder: "Item 3", maxLength: 30 },
      { name: "item4", type: "text", default: "✓ Daily Action Plan", placeholder: "Item 4", maxLength: 30 },
      { name: "price", type: "text", default: "$97", placeholder: "Price", maxLength: 10 },
      { name: "originalPrice", type: "text", default: "$497", placeholder: "Original price", maxLength: 10 },
      { name: "brandColor", type: "color", default: "#f5a623", placeholder: "Accent" },
    ],
    render: (v) => {
      const w = 1080, h = 1920;
      const items = [v.item1, v.item2, v.item3, v.item4].filter(Boolean);
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="#0c0a08"/>
        <rect x="0" y="0" width="${w}" height="8" fill="${v.brandColor}"/>
        <text x="${w/2}" y="300" text-anchor="middle" font-family="Arial,sans-serif" font-size="52" font-weight="900" fill="#ffffff">${esc(v.headline)}</text>
        ${items.map((item, i) =>
          `<text x="120" y="${520 + i * 100}" font-family="Arial,sans-serif" font-size="36" fill="rgba(255,255,255,0.8)">${esc(item)}</text>`
        ).join("\n")}
        <line x1="200" y1="${h*0.58}" x2="${w-200}" y2="${h*0.58}" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
        <text x="${w/2}" y="${h*0.65}" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" fill="rgba(255,255,255,0.4)" text-decoration="line-through">${esc(v.originalPrice)}</text>
        <text x="${w/2}" y="${h*0.72}" text-anchor="middle" font-family="Arial,sans-serif" font-size="80" font-weight="900" fill="${v.brandColor}">${esc(v.price)}</text>
        <rect x="${w/2-180}" y="${h*0.80}" width="360" height="70" rx="16" fill="${v.brandColor}"/>
        <text x="${w/2}" y="${h*0.80+48}" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="800" fill="#0c0a08">Get Started Now →</text>
      </svg>`;
    },
  },

  // ── BEFORE/AFTER (1:1) ──
  {
    id: "before-after",
    name: "Before / After",
    category: "before_after",
    aspectRatio: "1:1",
    platform: "universal",
    fields: [
      { name: "beforeText", type: "text", default: "Struggling with low conversions, wasted ad spend, no system", placeholder: "Before state", maxLength: 60 },
      { name: "afterText", type: "text", default: "3x revenue, automated funnel, predictable growth", placeholder: "After state", maxLength: 60 },
      { name: "timeframe", type: "text", default: "90 Days", placeholder: "How long", maxLength: 15 },
      { name: "brandColor", type: "color", default: "#f5a623", placeholder: "Accent" },
    ],
    render: (v) => {
      const w = 1080, h = 1080;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="#0c0a08"/>
        <rect x="0" y="0" width="${w/2}" height="${h}" fill="#1a0a0a" opacity="0.5"/>
        <rect x="${w/2}" y="0" width="${w/2}" height="${h}" fill="#0a1a0a" opacity="0.3"/>
        <text x="${w*0.25}" y="120" text-anchor="middle" font-family="Arial,sans-serif" font-size="36" font-weight="900" fill="#ef4444">BEFORE</text>
        <text x="${w*0.75}" y="120" text-anchor="middle" font-family="Arial,sans-serif" font-size="36" font-weight="900" fill="#22c55e">AFTER</text>
        <line x1="${w/2}" y1="60" x2="${w/2}" y2="${h-60}" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
        ${wrapText(v.beforeText, w*0.25, h*0.4, 30, w/2-80, "rgba(255,255,255,0.6)", "500")}
        ${wrapText(v.afterText, w*0.75, h*0.4, 30, w/2-80, "#ffffff", "700")}
        <text x="${w/2}" y="${h-100}" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="800" fill="${v.brandColor}">In just ${esc(v.timeframe)}</text>
      </svg>`;
    },
  },

  // ── URGENCY (9:16) ──
  {
    id: "urgency-countdown",
    name: "Urgency / Limited",
    category: "urgency",
    aspectRatio: "9:16",
    platform: "story",
    fields: [
      { name: "headline", type: "text", default: "Last Chance", placeholder: "Urgency headline", maxLength: 20 },
      { name: "offer", type: "text", default: "50% Off Everything", placeholder: "The offer", maxLength: 30 },
      { name: "deadline", type: "text", default: "Ends Tonight", placeholder: "When it ends", maxLength: 20 },
      { name: "brandColor", type: "color", default: "#ef4444", placeholder: "Urgency color" },
    ],
    render: (v) => {
      const w = 1080, h = 1920;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="#0c0a08"/>
        <rect x="0" y="0" width="${w}" height="12" fill="${v.brandColor}"/>
        <text x="${w/2}" y="${h*0.3}" text-anchor="middle" font-family="Arial,sans-serif" font-size="80" font-weight="900" fill="${v.brandColor}">⚡</text>
        <text x="${w/2}" y="${h*0.38}" text-anchor="middle" font-family="Arial,sans-serif" font-size="64" font-weight="900" fill="#ffffff">${esc(v.headline)}</text>
        <text x="${w/2}" y="${h*0.50}" text-anchor="middle" font-family="Arial,sans-serif" font-size="48" font-weight="700" fill="${v.brandColor}">${esc(v.offer)}</text>
        <rect x="${w/2-200}" y="${h*0.60}" width="400" height="80" rx="16" fill="${v.brandColor}"/>
        <text x="${w/2}" y="${h*0.60+54}" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" font-weight="800" fill="#ffffff">Claim Now →</text>
        <text x="${w/2}" y="${h*0.75}" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" fill="rgba(255,255,255,0.5)">⏰ ${esc(v.deadline)}</text>
      </svg>`;
    },
  },

  // ── PROBLEM/SOLUTION (1:1) ──
  {
    id: "problem-solution", name: "Problem → Solution", category: "hook", aspectRatio: "1:1", platform: "universal",
    fields: [
      { name: "problem", type: "text", default: "Tired of struggling with no results?", placeholder: "The problem", maxLength: 50 },
      { name: "solution", type: "text", default: "There's a better way.", placeholder: "The solution", maxLength: 40 },
      { name: "cta", type: "text", default: "See How →", placeholder: "Button text", maxLength: 20 },
      { name: "brandColor", type: "color", default: "#f5a623", placeholder: "Color" },
    ],
    render: (v) => {
      const w = 1080, h = 1080;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="#0c0a08"/>
        <rect width="${w}" height="${h/2}" fill="#1a0808" opacity="0.4"/>
        ${wrapText(v.problem, w/2, h*0.28, 48, w-120, "rgba(255,255,255,0.6)")}
        <line x1="${w*0.3}" y1="${h/2}" x2="${w*0.7}" y2="${h/2}" stroke="${v.brandColor}" stroke-width="3"/>
        <text x="${w/2}" y="${h/2+10}" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" fill="${v.brandColor}">↓</text>
        ${wrapText(v.solution, w/2, h*0.68, 52, w-120, "#ffffff")}
        <rect x="${w/2-120}" y="${h*0.85}" width="240" height="56" rx="14" fill="${v.brandColor}"/>
        <text x="${w/2}" y="${h*0.85+38}" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="800" fill="#0c0a08">${esc(v.cta)}</text>
      </svg>`;
    },
  },

  // ── LIST/TIPS (4:5) ──
  {
    id: "tips-list", name: "Tips List", category: "hook", aspectRatio: "4:5", platform: "instagram",
    fields: [
      { name: "title", type: "text", default: "3 Things You Must Know", placeholder: "List title", maxLength: 30 },
      { name: "tip1", type: "text", default: "1. Stop guessing — use data", placeholder: "Tip 1", maxLength: 40 },
      { name: "tip2", type: "text", default: "2. Start with one channel", placeholder: "Tip 2", maxLength: 40 },
      { name: "tip3", type: "text", default: "3. Consistency beats talent", placeholder: "Tip 3", maxLength: 40 },
      { name: "brandColor", type: "color", default: "#f5a623", placeholder: "Color" },
    ],
    render: (v) => {
      const w = 1080, h = 1350;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="#0c0a08"/>
        <rect x="0" y="0" width="${w}" height="6" fill="${v.brandColor}"/>
        <text x="${w/2}" y="200" text-anchor="middle" font-family="Arial,sans-serif" font-size="52" font-weight="900" fill="#ffffff">${esc(v.title)}</text>
        <text x="100" y="420" font-family="Arial,sans-serif" font-size="34" fill="rgba(255,255,255,0.8)">${esc(v.tip1)}</text>
        <text x="100" y="560" font-family="Arial,sans-serif" font-size="34" fill="rgba(255,255,255,0.8)">${esc(v.tip2)}</text>
        <text x="100" y="700" font-family="Arial,sans-serif" font-size="34" fill="rgba(255,255,255,0.8)">${esc(v.tip3)}</text>
        <text x="${w/2}" y="${h-120}" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="${v.brandColor}">Save this for later 📌</text>
      </svg>`;
    },
  },

  // ── SOCIAL PROOF (1:1) ──
  {
    id: "social-proof-count", name: "Social Proof Counter", category: "testimonial", aspectRatio: "1:1", platform: "universal",
    fields: [
      { name: "count", type: "text", default: "10,000+", placeholder: "Number", maxLength: 15 },
      { name: "label", type: "text", default: "People Already Getting Results", placeholder: "What are they doing", maxLength: 40 },
      { name: "cta", type: "text", default: "Join Them →", placeholder: "CTA", maxLength: 20 },
      { name: "brandColor", type: "color", default: "#f5a623", placeholder: "Color" },
    ],
    render: (v) => {
      const w = 1080, h = 1080;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="#0c0a08"/>
        <text x="${w/2}" y="${h*0.35}" text-anchor="middle" font-family="Arial,sans-serif" font-size="120" font-weight="900" fill="${v.brandColor}">${esc(v.count)}</text>
        ${wrapText(v.label, w/2, h*0.52, 36, w-160, "#ffffff", "700")}
        <rect x="${w/2-140}" y="${h*0.72}" width="280" height="56" rx="14" fill="${v.brandColor}"/>
        <text x="${w/2}" y="${h*0.72+38}" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="800" fill="#0c0a08">${esc(v.cta)}</text>
      </svg>`;
    },
  },

  // ── QUESTION HOOK (9:16) ──
  {
    id: "question-hook", name: "Question Hook", category: "hook", aspectRatio: "9:16", platform: "tiktok",
    fields: [
      { name: "question", type: "text", default: "Are you making this mistake?", placeholder: "The question", maxLength: 40 },
      { name: "answer", type: "text", default: "90% of people are. Here's the fix.", placeholder: "Teaser answer", maxLength: 50 },
      { name: "brandColor", type: "color", default: "#f5a623", placeholder: "Color" },
    ],
    render: (v) => {
      const w = 1080, h = 1920;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="#0c0a08"/>
        <text x="${w/2}" y="${h*0.30}" text-anchor="middle" font-family="Arial,sans-serif" font-size="140" fill="${v.brandColor}" opacity="0.15">?</text>
        ${wrapText(v.question, w/2, h*0.38, 56, w-120, "#ffffff")}
        <rect x="${w*0.15}" y="${h*0.52}" width="${w*0.7}" height="3" fill="${v.brandColor}" opacity="0.3"/>
        ${wrapText(v.answer, w/2, h*0.62, 36, w-120, "rgba(255,255,255,0.6)", "500")}
        <text x="${w/2}" y="${h*0.80}" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" fill="${v.brandColor}">Link in bio ↓</text>
      </svg>`;
    },
  },

  // ── GUARANTEE (1:1) ──
  {
    id: "guarantee-badge", name: "Guarantee Badge", category: "urgency", aspectRatio: "1:1", platform: "universal",
    fields: [
      { name: "guarantee", type: "text", default: "30-Day Money-Back Guarantee", placeholder: "Your guarantee", maxLength: 40 },
      { name: "subtext", type: "text", default: "If you don't see results, full refund. No questions.", placeholder: "Supporting text", maxLength: 60 },
      { name: "brandColor", type: "color", default: "#22c55e", placeholder: "Shield color" },
    ],
    render: (v) => {
      const w = 1080, h = 1080;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="#0c0a08"/>
        <text x="${w/2}" y="${h*0.32}" text-anchor="middle" font-family="Arial,sans-serif" font-size="100" fill="${v.brandColor}">🛡️</text>
        ${wrapText(v.guarantee, w/2, h*0.50, 44, w-160, "#ffffff")}
        ${wrapText(v.subtext, w/2, h*0.68, 26, w-160, "rgba(255,255,255,0.5)", "400")}
        <text x="${w/2}" y="${h*0.85}" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" fill="${v.brandColor}">Zero Risk. Full Protection.</text>
      </svg>`;
    },
  },

  // ── CAROUSEL SLIDE (1:1) ──
  {
    id: "carousel-slide", name: "Carousel Slide", category: "hook", aspectRatio: "1:1", platform: "instagram",
    fields: [
      { name: "slideNumber", type: "text", default: "01", placeholder: "Slide #", maxLength: 5 },
      { name: "title", type: "text", default: "The Foundation", placeholder: "Slide title", maxLength: 30 },
      { name: "body", type: "text", default: "Everything starts with understanding your audience. Who are they? What do they want?", placeholder: "Slide content", maxLength: 100 },
      { name: "brandColor", type: "color", default: "#f5a623", placeholder: "Color" },
    ],
    render: (v) => {
      const w = 1080, h = 1080;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="#0c0a08"/>
        <text x="80" y="160" font-family="Arial,sans-serif" font-size="100" font-weight="900" fill="${v.brandColor}" opacity="0.2">${esc(v.slideNumber)}</text>
        <text x="80" y="360" font-family="Arial,sans-serif" font-size="48" font-weight="900" fill="#ffffff">${esc(v.title)}</text>
        <rect x="80" y="390" width="80" height="4" rx="2" fill="${v.brandColor}"/>
        ${wrapText(v.body, w/2, 520, 30, w-160, "rgba(255,255,255,0.7)", "400")}
        <text x="${w-80}" y="${h-80}" text-anchor="end" font-family="Arial,sans-serif" font-size="18" fill="rgba(255,255,255,0.2)">Swipe →</text>
      </svg>`;
    },
  },

  // ── STORY GRADIENT (9:16) ──
  {
    id: "story-gradient",
    name: "Story Gradient",
    category: "hook",
    aspectRatio: "9:16",
    platform: "story",
    fields: [
      { name: "headline", type: "text", default: "Your Brand Deserves Better", placeholder: "Main headline", maxLength: 40 },
      { name: "brandColor", type: "color", default: "#f5a623", placeholder: "Gradient top color" },
      { name: "bgColor", type: "color", default: "#0c0a08", placeholder: "Gradient bottom color" },
      { name: "cta", type: "text", default: "Swipe Up →", placeholder: "CTA button text", maxLength: 20 },
    ],
    render: (v) => {
      const w = 1080, h = 1920;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${v.brandColor}"/>
            <stop offset="100%" stop-color="${v.bgColor}"/>
          </linearGradient>
        </defs>
        <rect width="${w}" height="${h}" fill="url(#sg)"/>
        ${wrapText(v.headline, w / 2, h * 0.42, 72, w - 140, "#ffffff")}
        <rect x="${w / 2 - 180}" y="${h * 0.78}" width="360" height="70" rx="16" fill="rgba(255,255,255,0.15)"/>
        <text x="${w / 2}" y="${h * 0.78 + 48}" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="800" fill="#ffffff">${esc(v.cta)}</text>
      </svg>`;
    },
  },

  // ── COMPARISON (1:1) ──
  {
    id: "comparison",
    name: "With vs Without",
    category: "before_after",
    aspectRatio: "1:1",
    platform: "universal",
    fields: [
      { name: "withoutText", type: "text", default: "Guessing. Wasting budget. No leads.", placeholder: "Without us", maxLength: 60 },
      { name: "withText", type: "text", default: "Data-driven. Profitable. Predictable.", placeholder: "With us", maxLength: 60 },
      { name: "headline", type: "text", default: "See the Difference", placeholder: "Headline", maxLength: 30 },
      { name: "brandColor", type: "color", default: "#f5a623", placeholder: "Brand color" },
    ],
    render: (v) => {
      const w = 1080, h = 1080;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="#0c0a08"/>
        <rect x="0" y="0" width="${w / 2}" height="${h}" fill="#1c1c1c" opacity="0.6"/>
        <rect x="${w / 2}" y="0" width="${w / 2}" height="${h}" fill="${v.brandColor}" opacity="0.08"/>
        <text x="${w * 0.25}" y="100" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" font-weight="900" fill="#888888">WITHOUT US</text>
        <text x="${w * 0.75}" y="100" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" font-weight="900" fill="${v.brandColor}">WITH US</text>
        <line x1="${w / 2}" y1="40" x2="${w / 2}" y2="${h - 160}" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
        ${wrapText(v.withoutText, w * 0.25, h * 0.4, 28, w / 2 - 80, "rgba(255,255,255,0.45)", "500")}
        ${wrapText(v.withText, w * 0.75, h * 0.4, 28, w / 2 - 80, "#ffffff", "700")}
        <text x="${w / 2}" y="${h - 80}" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" font-weight="900" fill="${v.brandColor}">${esc(v.headline)}</text>
      </svg>`;
    },
  },

  // ── COUNTDOWN SALE (1:1) ──
  {
    id: "countdown-sale",
    name: "Countdown Sale",
    category: "urgency",
    aspectRatio: "1:1",
    platform: "universal",
    fields: [
      { name: "hours", type: "text", default: "24", placeholder: "Hours left", maxLength: 5 },
      { name: "headline", type: "text", default: "FLASH SALE", placeholder: "Sale headline", maxLength: 20 },
      { name: "offerText", type: "text", default: "60% off all plans — today only", placeholder: "Offer details", maxLength: 50 },
      { name: "brandColor", type: "color", default: "#f5a623", placeholder: "Accent color" },
    ],
    render: (v) => {
      const w = 1080, h = 1080;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="#0c0a08"/>
        <text x="${w / 2}" y="${h * 0.22}" text-anchor="middle" font-family="Arial,sans-serif" font-size="40" font-weight="900" fill="${v.brandColor}">${esc(v.headline)}</text>
        <text x="${w / 2}" y="${h * 0.52}" text-anchor="middle" font-family="Arial,sans-serif" font-size="200" font-weight="900" fill="#ffffff">${esc(v.hours)}</text>
        <text x="${w / 2}" y="${h * 0.65}" text-anchor="middle" font-family="Arial,sans-serif" font-size="36" font-weight="700" fill="${v.brandColor}">HOURS LEFT</text>
        ${wrapText(v.offerText, w / 2, h * 0.78, 30, w - 160, "rgba(255,255,255,0.6)", "500")}
        <rect x="${w / 2 - 140}" y="${h * 0.88}" width="280" height="56" rx="14" fill="${v.brandColor}"/>
        <text x="${w / 2}" y="${h * 0.88 + 38}" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="800" fill="#0c0a08">Shop Now →</text>
      </svg>`;
    },
  },

  // ── TRIPLE PROOF (4:5) ──
  {
    id: "triple-proof",
    name: "Triple Proof Stats",
    category: "stat",
    aspectRatio: "4:5",
    platform: "universal",
    fields: [
      { name: "stat1", type: "text", default: "500+", placeholder: "Stat 1 number", maxLength: 10 },
      { name: "label1", type: "text", default: "Clients Served", placeholder: "Stat 1 label", maxLength: 25 },
      { name: "stat2", type: "text", default: "98%", placeholder: "Stat 2 number", maxLength: 10 },
      { name: "label2", type: "text", default: "Success Rate", placeholder: "Stat 2 label", maxLength: 25 },
      { name: "stat3", type: "text", default: "$2M+", placeholder: "Stat 3 number", maxLength: 10 },
      { name: "label3", type: "text", default: "Revenue Generated", placeholder: "Stat 3 label", maxLength: 25 },
      { name: "brandColor", type: "color", default: "#f5a623", placeholder: "Accent color" },
    ],
    render: (v) => {
      const w = 1080, h = 1350;
      const stats = [
        { num: v.stat1, lbl: v.label1 },
        { num: v.stat2, lbl: v.label2 },
        { num: v.stat3, lbl: v.label3 },
      ];
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="#0c0a08"/>
        <text x="${w / 2}" y="140" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="700" fill="${v.brandColor}">THE NUMBERS SPEAK</text>
        ${stats.map((s, i) => {
          const yCenter = 340 + i * 320;
          return `
            <rect x="120" y="${yCenter - 80}" width="${w - 240}" height="240" rx="20" fill="rgba(255,255,255,0.03)"/>
            <text x="${w / 2}" y="${yCenter + 20}" text-anchor="middle" font-family="Arial,sans-serif" font-size="100" font-weight="900" fill="${v.brandColor}">${esc(s.num)}</text>
            <text x="${w / 2}" y="${yCenter + 80}" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="500" fill="rgba(255,255,255,0.6)">${esc(s.lbl)}</text>`;
        }).join("\n")}
      </svg>`;
    },
  },

  // ── PAIN AGITATE (1:1) ──
  {
    id: "pain-agitate",
    name: "Pain → Agitate",
    category: "hook",
    aspectRatio: "1:1",
    platform: "universal",
    fields: [
      { name: "painPoint", type: "text", default: "wasting money on ads that don't convert", placeholder: "The pain point", maxLength: 50 },
      { name: "solution", type: "text", default: "We fix that in 7 days or you don't pay.", placeholder: "Your solution", maxLength: 50 },
      { name: "cta", type: "text", default: "Fix It Now →", placeholder: "CTA text", maxLength: 20 },
      { name: "brandColor", type: "color", default: "#f5a623", placeholder: "Accent color" },
    ],
    render: (v) => {
      const w = 1080, h = 1080;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="#0c0a08"/>
        <rect width="${w}" height="${h * 0.55}" fill="#1a0505" opacity="0.5"/>
        <text x="${w / 2}" y="${h * 0.18}" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" font-weight="700" fill="#ef4444">Tired of...</text>
        ${wrapText(v.painPoint, w / 2, h * 0.32, 48, w - 120, "rgba(255,255,255,0.7)")}
        <line x1="${w * 0.2}" y1="${h * 0.55}" x2="${w * 0.8}" y2="${h * 0.55}" stroke="${v.brandColor}" stroke-width="3"/>
        ${wrapText(v.solution, w / 2, h * 0.68, 40, w - 120, "#ffffff", "700")}
        <rect x="${w / 2 - 140}" y="${h * 0.84}" width="280" height="56" rx="14" fill="${v.brandColor}"/>
        <text x="${w / 2}" y="${h * 0.84 + 38}" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="800" fill="#0c0a08">${esc(v.cta)}</text>
      </svg>`;
    },
  },

  // ── MINIMAL QUOTE (1:1) ──
  {
    id: "minimal-quote",
    name: "Minimal Quote",
    category: "testimonial",
    aspectRatio: "1:1",
    platform: "universal",
    fields: [
      { name: "quote", type: "text", default: "This completely transformed the way I run my business.", placeholder: "The quote", maxLength: 100 },
      { name: "author", type: "text", default: "— James R., CEO", placeholder: "Author name", maxLength: 30 },
      { name: "brandColor", type: "color", default: "#f5a623", placeholder: "Accent color" },
    ],
    render: (v) => {
      const w = 1080, h = 1080;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="#ffffff"/>
        <text x="100" y="280" font-family="Georgia,serif" font-size="200" fill="${v.brandColor}" opacity="0.15">\u201C</text>
        ${wrapText(v.quote, w / 2, h * 0.4, 38, w - 200, "#1a1a1a", "400")}
        <rect x="${w / 2 - 40}" y="${h * 0.7}" width="80" height="4" rx="2" fill="${v.brandColor}"/>
        <text x="${w / 2}" y="${h * 0.78}" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" font-weight="600" fill="#666666">${esc(v.author)}</text>
      </svg>`;
    },
  },

  // ── FEATURE GRID (1:1) ──
  {
    id: "feature-grid",
    name: "Feature Grid",
    category: "product",
    aspectRatio: "1:1",
    platform: "universal",
    fields: [
      { name: "headline", type: "text", default: "Everything You Get", placeholder: "Grid headline", maxLength: 30 },
      { name: "feature1", type: "text", default: "Automated Funnels", placeholder: "Feature 1", maxLength: 25 },
      { name: "feature2", type: "text", default: "AI Ad Creative", placeholder: "Feature 2", maxLength: 25 },
      { name: "feature3", type: "text", default: "Lead Tracking", placeholder: "Feature 3", maxLength: 25 },
      { name: "feature4", type: "text", default: "24/7 Support", placeholder: "Feature 4", maxLength: 25 },
      { name: "brandColor", type: "color", default: "#f5a623", placeholder: "Accent color" },
    ],
    render: (v) => {
      const w = 1080, h = 1080;
      const features = [v.feature1, v.feature2, v.feature3, v.feature4];
      const positions = [
        { x: w * 0.25, y: h * 0.38 },
        { x: w * 0.75, y: h * 0.38 },
        { x: w * 0.25, y: h * 0.68 },
        { x: w * 0.75, y: h * 0.68 },
      ];
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="#0c0a08"/>
        <text x="${w / 2}" y="140" text-anchor="middle" font-family="Arial,sans-serif" font-size="48" font-weight="900" fill="#ffffff">${esc(v.headline)}</text>
        <rect x="${w / 2 - 40}" y="165" width="80" height="4" rx="2" fill="${v.brandColor}"/>
        ${features.map((f, i) => {
          const p = positions[i];
          return `
            <rect x="${p.x - 200}" y="${p.y - 80}" width="400" height="200" rx="16" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
            <text x="${p.x}" y="${p.y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="40" fill="${v.brandColor}">✓</text>
            <text x="${p.x}" y="${p.y + 50}" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" font-weight="700" fill="#ffffff">${esc(f)}</text>`;
        }).join("\n")}
      </svg>`;
    },
  },

  // ── VIDEO THUMBNAIL (16:9) ──
  {
    id: "video-thumbnail",
    name: "Video Thumbnail",
    category: "hook",
    aspectRatio: "16:9",
    platform: "facebook",
    fields: [
      { name: "headline", type: "text", default: "Watch This Before You Spend Another Dollar on Ads", placeholder: "Thumbnail headline", maxLength: 50 },
      { name: "subtext", type: "text", default: "3 min watch", placeholder: "Subtext", maxLength: 20 },
      { name: "brandColor", type: "color", default: "#f5a623", placeholder: "Accent color" },
    ],
    render: (v) => {
      const w = 1920, h = 1080;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <defs>
          <linearGradient id="vtg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="transparent"/>
            <stop offset="100%" stop-color="#0c0a08"/>
          </linearGradient>
        </defs>
        <rect width="${w}" height="${h}" fill="#1a1a1a"/>
        <rect width="${w}" height="${h}" fill="url(#vtg)"/>
        <circle cx="${w / 2}" cy="${h * 0.38}" r="60" fill="${v.brandColor}" opacity="0.9"/>
        <polygon points="${w / 2 - 18},${h * 0.38 - 25} ${w / 2 - 18},${h * 0.38 + 25} ${w / 2 + 28},${h * 0.38}" fill="#0c0a08"/>
        ${wrapText(v.headline, w / 2, h * 0.72, 52, w - 300, "#ffffff")}
        <text x="${w / 2}" y="${h * 0.9}" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" fill="rgba(255,255,255,0.4)">${esc(v.subtext)}</text>
      </svg>`;
    },
  },

  // ── RESULT SHOWCASE (4:5) ──
  {
    id: "result-showcase",
    name: "Result Showcase",
    category: "stat",
    aspectRatio: "4:5",
    platform: "universal",
    fields: [
      { name: "result", type: "text", default: "$147K", placeholder: "Big result number", maxLength: 15 },
      { name: "context", type: "text", default: "Generated in 90 days with our system", placeholder: "Context for the result", maxLength: 50 },
      { name: "proofLine", type: "text", default: "Verified by Stripe dashboard", placeholder: "Proof badge text", maxLength: 30 },
      { name: "brandColor", type: "color", default: "#f5a623", placeholder: "Accent color" },
    ],
    render: (v) => {
      const w = 1080, h = 1350;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="#0c0a08"/>
        <rect x="0" y="0" width="${w}" height="6" fill="${v.brandColor}"/>
        <text x="${w / 2}" y="${h * 0.32}" text-anchor="middle" font-family="Arial,sans-serif" font-size="160" font-weight="900" fill="${v.brandColor}">${esc(v.result)}</text>
        ${wrapText(v.context, w / 2, h * 0.48, 36, w - 160, "#ffffff", "600")}
        <rect x="${w / 2 - 180}" y="${h * 0.68}" width="360" height="50" rx="25" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
        <text x="${w / 2}" y="${h * 0.68 + 34}" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" font-weight="600" fill="rgba(255,255,255,0.5)">✓ ${esc(v.proofLine)}</text>
      </svg>`;
    },
  },

  // ── FOMO STRIP (1:1) ──
  {
    id: "fomo-strip",
    name: "FOMO Strip",
    category: "urgency",
    aspectRatio: "1:1",
    platform: "universal",
    fields: [
      { name: "quantity", type: "text", default: "7", placeholder: "Quantity left", maxLength: 5 },
      { name: "productName", type: "text", default: "Founding Member Spots", placeholder: "Product name", maxLength: 30 },
      { name: "originalPrice", type: "text", default: "$297", placeholder: "Original price", maxLength: 10 },
      { name: "salePrice", type: "text", default: "$97", placeholder: "Sale price", maxLength: 10 },
      { name: "brandColor", type: "color", default: "#f5a623", placeholder: "Accent color" },
    ],
    render: (v) => {
      const w = 1080, h = 1080;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="#0c0a08"/>
        <rect x="0" y="0" width="${w}" height="60" fill="#ef4444"/>
        <text x="${w / 2}" y="42" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="800" fill="#ffffff">⚡ LIMITED AVAILABILITY ⚡</text>
        <rect x="0" y="${h - 60}" width="${w}" height="60" fill="#ef4444"/>
        <text x="${w / 2}" y="${h - 20}" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="800" fill="#ffffff">DON'T MISS OUT</text>
        <text x="${w / 2}" y="${h * 0.28}" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="600" fill="rgba(255,255,255,0.5)">ONLY</text>
        <text x="${w / 2}" y="${h * 0.45}" text-anchor="middle" font-family="Arial,sans-serif" font-size="180" font-weight="900" fill="#ffffff">${esc(v.quantity)}</text>
        <text x="${w / 2}" y="${h * 0.56}" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="600" fill="rgba(255,255,255,0.5)">LEFT</text>
        ${wrapText(v.productName, w / 2, h * 0.66, 36, w - 160, "${v.brandColor}", "700")}
        <text x="${w / 2 - 60}" y="${h * 0.78}" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" fill="rgba(255,255,255,0.4)" text-decoration="line-through">${esc(v.originalPrice)}</text>
        <text x="${w / 2 + 60}" y="${h * 0.78}" text-anchor="middle" font-family="Arial,sans-serif" font-size="40" font-weight="900" fill="${v.brandColor}">${esc(v.salePrice)}</text>
      </svg>`;
    },
  },

  // ── AUTHORITY BADGE (1:1) ──
  {
    id: "authority-badge",
    name: "Authority Badge",
    category: "product",
    aspectRatio: "1:1",
    platform: "universal",
    fields: [
      { name: "badgeText", type: "text", default: "CERTIFIED", placeholder: "Badge label", maxLength: 20 },
      { name: "subtext", type: "text", default: "Trusted by 500+ businesses worldwide", placeholder: "Supporting text", maxLength: 40 },
      { name: "number", type: "text", default: "500+", placeholder: "Key number", maxLength: 10 },
      { name: "brandColor", type: "color", default: "#f5a623", placeholder: "Badge color" },
    ],
    render: (v) => {
      const w = 1080, h = 1080;
      const cx = w / 2, cy = h * 0.4;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <rect width="${w}" height="${h}" fill="#0c0a08"/>
        <circle cx="${cx}" cy="${cy}" r="180" fill="none" stroke="${v.brandColor}" stroke-width="4"/>
        <circle cx="${cx}" cy="${cy}" r="160" fill="none" stroke="${v.brandColor}" stroke-width="1" opacity="0.3"/>
        <text x="${cx}" y="${cy - 20}" text-anchor="middle" font-family="Arial,sans-serif" font-size="60" font-weight="900" fill="${v.brandColor}">${esc(v.number)}</text>
        <text x="${cx}" y="${cy + 30}" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="800" fill="#ffffff" letter-spacing="6">${esc(v.badgeText)}</text>
        ${wrapText(v.subtext, w / 2, h * 0.72, 28, w - 200, "rgba(255,255,255,0.5)", "500")}
      </svg>`;
    },
  },

  // ── STORY CTA (9:16) ──
  {
    id: "story-cta",
    name: "Story CTA",
    category: "hook",
    aspectRatio: "9:16",
    platform: "tiktok",
    fields: [
      { name: "headline", type: "text", default: "Ready to Scale?", placeholder: "Headline", maxLength: 30 },
      { name: "body", type: "text", default: "Join thousands who already automated their growth with our proven system.", placeholder: "Body text", maxLength: 100 },
      { name: "cta", type: "text", default: "Get Started Free →", placeholder: "CTA text", maxLength: 25 },
      { name: "brandColor", type: "color", default: "#f5a623", placeholder: "Accent color" },
    ],
    render: (v) => {
      const w = 1080, h = 1920;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <defs>
          <linearGradient id="scg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0c0a08"/>
            <stop offset="70%" stop-color="#0c0a08"/>
            <stop offset="100%" stop-color="${v.brandColor}" stop-opacity="0.3"/>
          </linearGradient>
        </defs>
        <rect width="${w}" height="${h}" fill="url(#scg)"/>
        ${wrapText(v.headline, w / 2, h * 0.35, 72, w - 140, "#ffffff")}
        ${wrapText(v.body, w / 2, h * 0.52, 32, w - 160, "rgba(255,255,255,0.6)", "400")}
        <rect x="${w / 2 - 200}" y="${h * 0.78}" width="400" height="70" rx="16" fill="${v.brandColor}"/>
        <text x="${w / 2}" y="${h * 0.78 + 48}" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" font-weight="800" fill="#0c0a08">${esc(v.cta)}</text>
        <text x="${w / 2}" y="${h * 0.88}" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" fill="rgba(255,255,255,0.3)">↑ Tap to get started</text>
      </svg>`;
    },
  },
];

export function getTemplatesByCategory(category?: string): AdTemplate[] {
  if (!category || category === "all") return AD_TEMPLATES;
  return AD_TEMPLATES.filter(t => t.category === category);
}

export function getTemplateById(id: string): AdTemplate | undefined {
  return AD_TEMPLATES.find(t => t.id === id);
}

export function renderTemplate(id: string, values: Record<string, string>): string | null {
  const template = getTemplateById(id);
  if (!template) return null;
  const svg = template.render(values);
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
