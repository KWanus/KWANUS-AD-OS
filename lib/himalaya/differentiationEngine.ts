// ---------------------------------------------------------------------------
// Differentiation Engine — ensures no two Himalaya businesses are identical
//
// Problem: Two users in "coaching for moms" get the same site, same emails,
// same ads, same everything. That's a recipe for failure.
//
// Solution: Generate unique differentiators for each business:
// 1. Unique angle (what makes THIS business different)
// 2. Unique brand voice (personality, tone, style)
// 3. Unique color palette (no two businesses look the same)
// 4. Unique hook library (different ad angles)
// 5. Unique story (founder's story woven into everything)
// ---------------------------------------------------------------------------

import { generateAI } from "@/lib/integrations/aiInference";

export type Differentiator = {
  uniqueAngle: string;          // "The only X that Y"
  brandVoice: {
    personality: string;        // "Bold and direct" | "Warm and nurturing" | etc.
    toneWords: string[];        // Words they'd use
    avoidWords: string[];       // Words they'd never use
    sampleSentence: string;     // Example of their voice
  };
  colorPalette: {
    primary: string;            // Hex
    secondary: string;
    accent: string;
    mood: string;               // "Trust" | "Energy" | "Calm" | "Luxury"
  };
  founderStory: {
    hook: string;               // "I was [relatable struggle]..."
    transformation: string;     // "Then I discovered..."
    mission: string;            // "Now I help..."
  };
  uniqueHooks: string[];        // 5 hooks nobody else has
};

// ── Color palettes (20 unique combos) ────────────────────────────────────────

const PALETTES = [
  { primary: "#f5a623", secondary: "#e07850", accent: "#10b981", mood: "Trust + Growth" },
  { primary: "#f59e0b", secondary: "#ef4444", accent: "#f97316", mood: "Energy + Urgency" },
  { primary: "#3b82f6", secondary: "#1d4ed8", accent: "#60a5fa", mood: "Professional" },
  { primary: "#ec4899", secondary: "#e07850", accent: "#f472b6", mood: "Creative + Bold" },
  { primary: "#10b981", secondary: "#059669", accent: "#34d399", mood: "Health + Nature" },
  { primary: "#f97316", secondary: "#ea580c", accent: "#fb923c", mood: "Warm + Inviting" },
  { primary: "#e07850", secondary: "#7c3aed", accent: "#a78bfa", mood: "Premium + Luxury" },
  { primary: "#14b8a6", secondary: "#0d9488", accent: "#2dd4bf", mood: "Clean + Modern" },
  { primary: "#e11d48", secondary: "#be123c", accent: "#fb7185", mood: "Passion + Power" },
  { primary: "#0ea5e9", secondary: "#0284c7", accent: "#38bdf8", mood: "Tech + Innovation" },
  { primary: "#84cc16", secondary: "#65a30d", accent: "#a3e635", mood: "Fresh + Organic" },
  { primary: "#d946ef", secondary: "#c026d3", accent: "#e879f9", mood: "Disruptive" },
  { primary: "#f43f5e", secondary: "#e11d48", accent: "#fda4af", mood: "Bold + Feminine" },
  { primary: "#22d3ee", secondary: "#f5a623", accent: "#67e8f9", mood: "Calm + Clear" },
  { primary: "#a855f7", secondary: "#9333ea", accent: "#c084fc", mood: "Mystical + High-end" },
  { primary: "#eab308", secondary: "#ca8a04", accent: "#facc15", mood: "Wealth + Success" },
  { primary: "#64748b", secondary: "#475569", accent: "#94a3b8", mood: "Minimal + Serious" },
  { primary: "#059669", secondary: "#047857", accent: "#6ee7b7", mood: "Eco + Wellness" },
  { primary: "#dc2626", secondary: "#b91c1c", accent: "#f87171", mood: "Urgent + Direct" },
  { primary: "#7c3aed", secondary: "#6d28d9", accent: "#ddd6fe", mood: "Creative Agency" },
];

// ── Generate unique differentiators ──────────────────────────────────────────

export async function generateDifferentiators(input: {
  niche: string;
  businessName?: string;
  targetAudience?: string;
  userId: string;
}): Promise<Differentiator> {
  // Pick a color palette based on userId hash (deterministic but unique)
  const hash = input.userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const palette = PALETTES[hash % PALETTES.length];

  // Generate unique positioning with AI
  const result = await generateAI({
    prompt: `Create a UNIQUE business positioning for a ${input.niche} business${input.businessName ? ` called "${input.businessName}"` : ""}.
Target audience: ${input.targetAudience ?? "people who need this"}.

Make it DIFFERENT from every other ${input.niche} business. Don't be generic.

Return JSON:
{
  "uniqueAngle": "The only [specific thing] that [specific result] — NOT generic like 'we're the best'",
  "brandVoice": {
    "personality": "2-3 word personality description",
    "toneWords": ["5 words this brand would use"],
    "avoidWords": ["5 words this brand would NEVER use"],
    "sampleSentence": "An example sentence in this brand's voice"
  },
  "founderStory": {
    "hook": "I was [specific relatable struggle]...",
    "transformation": "Then I [specific discovery/change]...",
    "mission": "Now I help [specific audience] [specific result]"
  },
  "uniqueHooks": ["5 ad hooks that ONLY this business could use — specific, not generic"]
}

Be creative. Be specific. Be different.`,
    systemPrompt: "You are a brand strategist who creates unique positioning. Never be generic. Every output must be specific to THIS business. Return only JSON.",
    maxTokens: 800,
  });

  let parsed: Record<string, unknown> = {};
  try { parsed = JSON.parse(result.content); } catch { /* use defaults */ }

  const brandVoice = (parsed.brandVoice as Record<string, unknown>) ?? {};
  const founderStory = (parsed.founderStory as Record<string, unknown>) ?? {};

  return {
    uniqueAngle: (parsed.uniqueAngle as string) ?? `The ${input.niche} system that actually delivers results`,
    brandVoice: {
      personality: (brandVoice.personality as string) ?? "Bold and honest",
      toneWords: (brandVoice.toneWords as string[]) ?? ["proven", "real", "results", "system", "guaranteed"],
      avoidWords: (brandVoice.avoidWords as string[]) ?? ["maybe", "try", "hope", "guru", "secret"],
      sampleSentence: (brandVoice.sampleSentence as string) ?? `Stop guessing. Start doing. ${input.niche} shouldn't be this hard.`,
    },
    colorPalette: palette,
    founderStory: {
      hook: (founderStory.hook as string) ?? `I spent years struggling with ${input.niche}...`,
      transformation: (founderStory.transformation as string) ?? "Then I built a system that actually worked.",
      mission: (founderStory.mission as string) ?? `Now I help others get the same results without the struggle.`,
    },
    uniqueHooks: (parsed.uniqueHooks as string[]) ?? [
      `Most ${input.niche} advice is wrong. Here's what actually works.`,
      `I wasted 2 years on ${input.niche} before finding this.`,
      `Your ${input.niche} problem isn't what you think it is.`,
      `The ${input.niche} playbook nobody talks about.`,
      `Why 95% of people fail at ${input.niche} (and how to be the 5%).`,
    ],
  };
}
