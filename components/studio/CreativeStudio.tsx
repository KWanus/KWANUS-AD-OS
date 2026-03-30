"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  X, Film, Sparkles, Download, Zap, Copy, Check, Play,
  ImageIcon, Plus, Trash2, AlignCenter, AlignLeft, AlignRight,
  Type, Square, RefreshCw, Loader2, Video, ExternalLink,
  ChevronUp, ChevronDown, Layers, Save,
} from "lucide-react";
import type { CanvasState, CanvasLayer } from "./KonvaCanvas";
import type { StageRefType } from "./KonvaCanvas";

// Dynamic import — Konva needs window, can't SSR
const KonvaCanvas = dynamic(() => import("./KonvaCanvas"), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────

type StudioMode = "storyboard" | "image" | "video" | "prompts";
type ExecutionTier = "core" | "elite";

export interface StudioBrief {
  id: string;
  title: string;
  format: string;
  duration: string;
  platform: string;
  concept: string;
  scenes: { timestamp: string; shotType: string; visual: string; audio: string; textOverlay: string }[];
  productionKit: { location: string; props: string[]; casting: string; lighting: string; audioStyle: string; colorGrade: string };
  imageAd?: { headline: string; visualDirection: string; bodyCopy: string; cta: string };
}

interface CreativeStudioProps {
  isOpen: boolean;
  onClose: () => void;
  brief: StudioBrief;
  executionTier?: ExecutionTier;
}

type AdFormat = { id: string; label: string; w: number; h: number; ratio: string };

type VideoJobStatus = "idle" | "pending" | "running" | "succeeded" | "failed";

type SceneVideoState = {
  jobId: string | null;
  status: VideoJobStatus;
  videoUrl: string | null;
  progress: number;
  prompt: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const THEMES: Record<string, { from: string; to: string }> = {
  TikTok: { from: "#ff0050", to: "#00f2ea" },
  Facebook: { from: "#1877f2", to: "#42b72a" },
  Instagram: { from: "#f09433", to: "#833ab4" },
  Cinematic: { from: "#d4af37", to: "#c0c0c0" },
  Static: { from: "#06b6d4", to: "#8b5cf6" },
};

const AD_FORMATS: AdFormat[] = [
  { id: "tiktok", label: "TikTok / Reels", w: 1080, h: 1920, ratio: "9:16" },
  { id: "ig_sq", label: "Instagram Square", w: 1080, h: 1080, ratio: "1:1" },
  { id: "fb_feed", label: "Facebook Feed", w: 1080, h: 1080, ratio: "1:1" },
  { id: "fb_story", label: "Facebook Story", w: 1080, h: 1920, ratio: "9:16" },
  { id: "yt", label: "YouTube Pre-roll", w: 1920, h: 1080, ratio: "16:9" },
];

const BG_PRESETS = [
  { label: "Midnight", value: "linear-gradient(135deg,#0a0f1e,#1a2040)", colors: ["#0a0f1e", "#1a2040"] },
  { label: "Cyber", value: "linear-gradient(135deg,#000428,#004e92)", colors: ["#000428", "#004e92"] },
  { label: "Fire", value: "linear-gradient(135deg,#f12711,#f5af19)", colors: ["#f12711", "#f5af19"] },
  { label: "Forest", value: "linear-gradient(135deg,#134e5e,#71b280)", colors: ["#134e5e", "#71b280"] },
  { label: "Violet", value: "linear-gradient(135deg,#360033,#0b8793)", colors: ["#360033", "#0b8793"] },
  { label: "Noir", value: "linear-gradient(135deg,#000,#434343)", colors: ["#000000", "#434343"] },
  { label: "Gold", value: "linear-gradient(135deg,#b8860b,#ffd700)", colors: ["#b8860b", "#ffd700"] },
  { label: "Ocean", value: "linear-gradient(135deg,#1a1a2e,#16213e)", colors: ["#1a1a2e", "#16213e"] },
];

const FONT_PRESETS = ["Inter", "Outfit", "Space Grotesk", "Montserrat", "Anton", "Bebas Neue", "Syne", "Luckiest Guy"];

const TIKTOK_CAPTION_STYLE = {
  fontFamily: "Anton",
  fontSize: 64,
  fontStyle: "bold",
  fill: "#ffff00", // Yellow
  stroke: "#000000", // Black
  strokeWidth: 4,
  align: "center",
};

const PROMPT_TOOLS = [
  { id: "runway", label: "Runway Gen-4", color: "#7c3aed", link: "https://runwayml.com" },
  { id: "pika", label: "Pika 2.0", color: "#ec4899", link: "https://pika.art" },
  { id: "midjourney", label: "Midjourney v6", color: "#2563eb", link: "https://midjourney.com" },
  { id: "dalle", label: "DALL·E 3", color: "#10b981", link: "https://platform.openai.com" },
] as const;
type PromptTool = typeof PROMPT_TOOLS[number]["id"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2); }

function genPrompt(
  scene: StudioBrief["scenes"][0],
  kit: StudioBrief["productionKit"],
  tool: PromptTool,
  platform: string,
  executionTier: ExecutionTier
): string {
  const ar = (platform === "TikTok" || platform.includes("Story")) ? "9:16" : platform === "Cinematic" ? "16:9" : "1:1";
  const qualityTail = executionTier === "elite"
    ? "premium direct-response campaign quality, sharper product focus, stronger buyer emotion, conversion-first composition"
    : "strong performance-marketing creative, clear focal point, practical ad-ready composition";
  switch (tool) {
    case "runway":
      return `${scene.shotType.toLowerCase().includes("wide") ? "wide establishing shot" : scene.shotType.toLowerCase().includes("close") ? "extreme close-up" : "smooth dolly push"}, ${scene.visual.toLowerCase()}, ${kit.lighting.toLowerCase()} lighting, ${kit.colorGrade.toLowerCase()} color grade, ${qualityTail}, 4K cinematic, 24fps`;
    case "pika":
      return `${scene.visual}. Camera: ${scene.shotType}. Lighting: ${kit.lighting}. Style: ${kit.colorGrade}. Motion: subtle natural. Quality: ultra HD. Direction: ${qualityTail}.`;
    case "midjourney":
      return `${scene.visual}, ${kit.casting}, ${kit.lighting} lighting, ${kit.colorGrade} color grade, ${kit.location}, ${qualityTail}, ultra-realistic commercial photography, 8K --ar ${ar} --style raw --q 2 --v 6.1`;
    case "dalle":
      return `A high-end advertising photograph: ${scene.visual}. Setting: ${kit.location}. ${kit.lighting} professional lighting. ${kit.colorGrade} color treatment. ${qualityTail}. Cinematic commercial photography, 8K, award-winning campaign quality.`;
  }
}

function genCaptionLayer(text: string, w: number, h: number): CanvasLayer {
  return {
    id: uid(),
    type: "text",
    text: text.toUpperCase(),
    x: w * 0.05,
    y: h * 0.4,
    width: w * 0.9,
    height: 100,
    ...TIKTOK_CAPTION_STYLE,
  };
}

function buildImagePrompt(brief: StudioBrief, executionTier: ExecutionTier): string {
  const ia = brief.imageAd;
  const kit = brief.productionKit;
  const qualityTail = executionTier === "elite"
    ? "Make it feel premium, category-leading, trust-rich, and built to win cold traffic."
    : "Make it feel strong, clean, and immediately usable in a paid ad.";
  if (ia) {
    return `${ia.visualDirection}. Professional advertising image for ${brief.platform}. ${kit.lighting} lighting. ${kit.colorGrade} color treatment. Commercial photography quality, 8K resolution. ${qualityTail} Include compelling headline: "${ia.headline}"`;
  }
  return `${brief.concept}. ${kit.lighting} lighting, ${kit.colorGrade} color grade, ${kit.location}, commercial advertising photography, 8K, ultra-detailed. ${qualityTail}`;
}

// ── CopyBtn ───────────────────────────────────────────────────────────────────

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  function go() {
    void navigator.clipboard.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 2000); });
  }
  return (
    <button onClick={go} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition border ${ok ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 border-white/[0.07]"}`}>
      {ok ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {ok ? "Copied!" : label}
    </button>
  );
}

// ── Main Studio ───────────────────────────────────────────────────────────────

export default function CreativeStudio({ isOpen, onClose, brief, executionTier: executionTierProp }: CreativeStudioProps) {
  const [mode, setMode] = useState<StudioMode>("storyboard");
  const [executionTier, setExecutionTier] = useState<ExecutionTier>(executionTierProp === "core" ? "core" : "elite");
  const theme = THEMES[brief.platform] ?? THEMES.Static;

  useEffect(() => {
    if (executionTierProp) {
      setExecutionTier(executionTierProp === "core" ? "core" : "elite");
    }
  }, [executionTierProp]);

  if (!isOpen) return null;

  const modes: { id: StudioMode; icon: React.ElementType; label: string }[] = [
    { id: "storyboard", icon: Film, label: "Storyboard" },
    { id: "image", icon: ImageIcon, label: "Image Studio" },
    { id: "video", icon: Video, label: "Video Lab" },
    { id: "prompts", icon: Zap, label: "AI Prompts" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#050a14" }}>
      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#fff 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[280px] opacity-[0.06] blur-[100px] pointer-events-none" style={{ background: `linear-gradient(to bottom, ${theme.from}, ${theme.to})` }} />

      {/* ── Header ── */}
      <header className="relative z-10 px-5 py-3 border-b border-white/[0.06] flex items-center gap-4 bg-black/40 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3 w-64 shrink-0 min-w-0">
          <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg,${theme.from},${theme.to})` }}>
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 truncate">{brief.platform} · {brief.format}</p>
            <p className="text-sm font-bold text-white truncate">{brief.title}</p>
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="flex items-center rounded-2xl p-1 gap-0.5 border border-white/[0.07]" style={{ background: "rgba(255,255,255,0.04)" }}>
            {modes.map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setMode(id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                style={mode === id
                  ? { background: `linear-gradient(135deg,${theme.from},${theme.to})`, color: "#050a14" }
                  : { color: "rgba(255,255,255,0.35)" }}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 w-64 shrink-0 justify-end">
          <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.04] p-1">
            {(["core", "elite"] as const).map((tier) => {
              const active = executionTier === tier;
              return (
                <button
                  key={tier}
                  onClick={() => setExecutionTier(tier)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.18em] transition"
                  style={active
                    ? { background: `linear-gradient(135deg,${theme.from},${theme.to})`, color: "#050a14" }
                    : { color: "rgba(255,255,255,0.4)" }}
                >
                  {tier}
                </button>
              );
            })}
          </div>
          <span className="text-[10px] text-white/15 font-mono">{brief.duration}</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-white/25 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="relative z-10 flex-1 overflow-hidden">
        {mode === "storyboard" && <StoryboardMode brief={brief} theme={theme} executionTier={executionTier} />}
        {mode === "image" && <ImageStudio brief={brief} theme={theme} executionTier={executionTier} />}
        {mode === "video" && <VideoLab brief={brief} theme={theme} executionTier={executionTier} />}
        {mode === "prompts" && <PromptLab brief={brief} theme={theme} executionTier={executionTier} />}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STORYBOARD MODE
// ─────────────────────────────────────────────────────────────────────────────

function StoryboardMode({ brief, theme, executionTier }: { brief: StudioBrief; theme: { from: string; to: string }; executionTier: ExecutionTier }) {
  const [active, setActive] = useState(0);
  const scene = brief.scenes[active];

  return (
    <div className="flex h-full">
      {/* Scene list */}
      <aside className="w-60 shrink-0 border-r border-white/[0.06] flex flex-col bg-black/20">
        <div className="p-4 border-b border-white/[0.06]">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">{brief.scenes.length} Scenes · {brief.duration}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {brief.scenes.map((s, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`w-full text-left p-3 rounded-xl transition border text-xs ${active === i ? "border-white/15 bg-white/8" : "border-transparent hover:bg-white/[0.03]"}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30">{s.timestamp}</span>
                {active === i && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: theme.from }} />}
              </div>
              <p className="text-white/55 line-clamp-2 leading-snug">{s.visual}</p>
              <p className="text-[9px] text-white/20 uppercase font-bold mt-1 tracking-wider">{s.shotType}</p>
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-white/[0.06]">
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/15 mb-2">Concept</p>
          <p className="text-[11px] text-white/40 leading-relaxed italic">{brief.concept}</p>
        </div>
      </aside>

      {/* Scene detail */}
      <div className="flex-1 overflow-y-auto p-8">
        {scene ? (
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white" style={{ background: `${theme.from}22`, border: `1px solid ${theme.from}30` }}>{active + 1}</div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/40">{scene.timestamp}</span>
                  <span className="text-[10px] uppercase font-bold text-white/20 tracking-widest">{scene.shotType}</span>
                </div>
                <p className="text-base font-bold text-white mt-0.5">Scene {active + 1} of {brief.scenes.length}</p>
              </div>
              <CopyBtn text={`[${scene.timestamp}] ${scene.shotType}\nVisual: ${scene.visual}\nVO: ${scene.audio}${scene.textOverlay ? `\nText: ${scene.textOverlay}` : ""}`} label="Copy Scene" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-3 flex items-center gap-2"><ImageIcon className="w-3 h-3" /> Visual</p>
                <p className="text-sm text-white/75 leading-relaxed">{scene.visual}</p>
              </div>
              <div className="rounded-2xl p-5" style={{ border: `1px solid ${theme.from}20`, background: `${theme.from}07` }}>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2" style={{ color: `${theme.from}99` }}><Film className="w-3 h-3" /> Voiceover</p>
                <p className="text-sm text-white/75 leading-relaxed">{scene.audio}</p>
                {scene.textOverlay && (
                  <div className="mt-3 pt-3 border-t border-white/[0.07]">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/15 mb-1">Text Overlay</p>
                    <p className="text-sm font-black text-white uppercase">{scene.textOverlay}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-5">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-4">Production Notes</p>
              <div className="grid grid-cols-3 gap-3">
                {([["Location", brief.productionKit.location], ["Casting", brief.productionKit.casting], ["Lighting", brief.productionKit.lighting], ["Audio", brief.productionKit.audioStyle], ["Color Grade", brief.productionKit.colorGrade], ["Props", brief.productionKit.props.join(", ")]] as [string, string][]).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[9px] text-white/15 uppercase font-bold mb-0.5">{k}</p>
                    <p className="text-xs text-white/60">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick prompts */}
            <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-5 space-y-3">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">AI Prompts for This Scene</p>
              {(["runway", "midjourney"] as PromptTool[]).map(tool => (
                <div key={tool} className="flex items-start gap-3">
                  <span className="text-[9px] font-black uppercase text-white/15 w-16 pt-0.5 shrink-0">{tool}</span>
                  <p className="text-[11px] text-white/45 flex-1 leading-relaxed font-mono">{genPrompt(scene, brief.productionKit, tool, brief.platform, executionTier)}</p>
                  <CopyBtn text={genPrompt(scene, brief.productionKit, tool, brief.platform, executionTier)} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/20 text-sm">No scenes — this is a static image ad.</p>
          </div>
        )}
      </div>

      {/* Image ad sidebar */}
      {brief.imageAd && (
        <aside className="w-64 shrink-0 border-l border-white/[0.06] p-5 overflow-y-auto bg-black/20">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-4">Static Image Ad</p>
          <div className="space-y-3">
            {[["Headline", brief.imageAd.headline], ["Body", brief.imageAd.bodyCopy], ["Visual Direction", brief.imageAd.visualDirection]].map(([label, val]) => (
              <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[9px] text-white/15 uppercase font-bold mb-1">{label}</p>
                <p className={`text-xs text-white/65 leading-relaxed ${label === "Headline" ? "font-bold text-white" : ""}`}>{val}</p>
              </div>
            ))}
            <div className="inline-flex rounded-lg px-3 py-1.5 font-bold text-xs text-white/90" style={{ background: `linear-gradient(135deg,${theme.from}40,${theme.to}40)`, border: `1px solid ${theme.from}40` }}>
              {brief.imageAd.cta}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE STUDIO — Real Konva canvas editor + AI generation
// ─────────────────────────────────────────────────────────────────────────────

function ImageStudio({ brief, theme, executionTier }: { brief: StudioBrief; theme: { from: string; to: string }; executionTier: ExecutionTier }) {
  const [fmt, setFmt] = useState(AD_FORMATS[0]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bg, setBg] = useState(BG_PRESETS[0]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [customPrompt, setCustomPrompt] = useState(() => buildImagePrompt(brief, executionTier));
  const [showPromptEdit, setShowPromptEdit] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState<boolean | null>(null);

  useEffect(() => {
    setCustomPrompt(buildImagePrompt(brief, executionTier));
  }, [brief, executionTier]);

  // Canvas state
  const [canvas, setCanvas] = useState<CanvasState>(() => {
    const ia = brief.imageAd;
    const w = 540;
    const h = Math.round(540 * fmt.h / fmt.w);
    return {
      width: w,
      height: h,
      background: bg.value,
      layers: [
        ia?.headline ? {
          id: uid(), type: "text" as const, text: ia.headline,
          x: w * 0.05, y: h * 0.55, width: w * 0.9,
          fontSize: Math.round(w * 0.07), fontFamily: "Inter", fontStyle: "900",
          fill: "#ffffff", align: "center",
        } : null,
        ia?.bodyCopy ? {
          id: uid(), type: "text" as const, text: ia.bodyCopy.slice(0, 120),
          x: w * 0.08, y: h * 0.73, width: w * 0.84,
          fontSize: Math.round(w * 0.028), fontFamily: "Inter", fontStyle: "normal",
          fill: "rgba(255,255,255,0.75)", align: "center",
        } : null,
        ia?.cta ? {
          id: uid(), type: "rect" as const,
          x: w * 0.25, y: h * 0.84, width: w * 0.5, height: Math.round(w * 0.09),
          fill: theme.from, cornerRadius: 100, opacity: 1,
        } : null,
        ia?.cta ? {
          id: uid(), type: "text" as const, text: ia.cta,
          x: w * 0.25, y: h * 0.855, width: w * 0.5,
          fontSize: Math.round(w * 0.032), fontFamily: "Inter", fontStyle: "bold",
          fill: "#ffffff", align: "center",
        } : null,
      ].filter(Boolean) as CanvasLayer[],
    };
  });

  const stageRef = useRef<any>(null);
  const selectedLayer = canvas.layers.find(l => l.id === selectedId);

  // Sync bg into canvas state
  useEffect(() => {
    setCanvas(prev => ({ ...prev, background: bg.value }));
  }, [bg]);

  // Sync format dimensions
  useEffect(() => {
    const w = 540;
    const h = Math.round(540 * fmt.h / fmt.w);
    setCanvas(prev => ({ ...prev, width: w, height: h }));
  }, [fmt]);

  function addTextLayer() {
    const l: CanvasLayer = {
      id: uid(), type: "text", text: "Your text here",
      x: canvas.width * 0.1, y: canvas.height * 0.4, width: canvas.width * 0.8, height: 60,
      fontSize: Math.round(canvas.width * 0.06), fontFamily: "Inter", fontStyle: "bold",
      fill: "#ffffff", align: "center",
    };
    setCanvas(prev => ({ ...prev, layers: [...prev.layers, l] }));
    setSelectedId(l.id);
  }

  function addRectLayer() {
    const l: CanvasLayer = {
      id: uid(), type: "rect",
      x: canvas.width * 0.2, y: canvas.height * 0.4, width: canvas.width * 0.6, height: canvas.height * 0.08,
      fill: theme.from, cornerRadius: 12, opacity: 0.9,
    };
    setCanvas(prev => ({ ...prev, layers: [...prev.layers, l] }));
    setSelectedId(l.id);
  }

  function applyAutoCaption() {
    const text = brief.scenes[0]?.textOverlay || brief.imageAd?.headline || "New Caption";
    const l = genCaptionLayer(text, canvas.width, canvas.height);
    setCanvas(prev => ({ ...prev, layers: [...prev.layers, l] }));
    setSelectedId(l.id);
  }

  function deleteLayer(id: string) {
    setCanvas(prev => ({ ...prev, layers: prev.layers.filter(l => l.id !== id) }));
    if (selectedId === id) setSelectedId(null);
  }

  function updateSelected(patch: Partial<CanvasLayer>) {
    if (!selectedId) return;
    setCanvas(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === selectedId ? { ...l, ...patch } : l),
    }));
  }

  function moveLayer(id: string, dir: "up" | "down") {
    setCanvas(prev => {
      const layers = [...prev.layers];
      const idx = layers.findIndex(l => l.id === id);
      if (dir === "up" && idx < layers.length - 1) {
        [layers[idx], layers[idx + 1]] = [layers[idx + 1], layers[idx]];
      } else if (dir === "down" && idx > 0) {
        [layers[idx], layers[idx - 1]] = [layers[idx - 1], layers[idx]];
      }
      return { ...prev, layers };
    });
  }

  async function generateImage() {
    setGenerating(true);
    setGenError("");
    try {
      const ar = fmt.ratio as "1:1" | "9:16" | "16:9";
      const res = await fetch("/api/creative/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: customPrompt, aspectRatio: ar, executionTier }),
      });
      const data = await res.json() as { ok: boolean; url?: string; error?: string; message?: string };
      if (!data.ok) {
        setGenError(data.message ?? data.error ?? "Generation failed");
        return;
      }
      if (data.url) {
        // Add as image layer
        const l: CanvasLayer = {
          id: uid(), type: "image", src: data.url,
          x: 0, y: 0, width: canvas.width, height: canvas.height,
        };
        setCanvas(prev => ({ ...prev, layers: [l, ...prev.layers] }));
      }
    } catch {
      setGenError("Network error. Try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function saveToLibrary() {
    setSaving(true);
    setSaveOk(null);
    try {
      const outputUrl = canvas.layers.find((layer) => layer.type === "image")?.src ?? undefined;
      const res = await fetch("/api/creative/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Image Ad — ${brief.title}`,
          type: "image",
          state: { ...canvas, executionTier },
          campaignId: null,
          outputUrl,
        }),
      });
      const data = (await res.json()) as { ok: boolean };
      setSaveOk(data.ok ? true : false);
    } catch {
      setSaveOk(false);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveOk(null), 2000);
    }
  }

  async function downloadCanvas() {
    setDownloading(true);
    try {
      if (stageRef.current) {
        const stage = stageRef.current as any;
        const pixelRatio = Math.round(fmt.w / canvas.width);
        const dataURL: string = stage.toDataURL({ pixelRatio });
        const link = document.createElement("a");
        link.download = `${brief.id}-${fmt.id}.png`;
        link.href = dataURL;
        link.click();
      }
    } finally {
      setDownloading(false);
    }
  }

  const scaleForPreview = canvas.width > 0 ? canvas.width / canvas.width : 1;

  return (
    <div className="flex h-full">
      {/* Left: Layer controls + format */}
      <aside className="w-64 shrink-0 border-r border-white/[0.06] flex flex-col bg-black/20 overflow-y-auto">
        {/* Format */}
        <div className="p-4 border-b border-white/[0.06]">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-2">Format</p>
          <div className="space-y-1">
            {AD_FORMATS.map(f => (
              <button key={f.id} onClick={() => setFmt(f)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] transition border ${fmt.id === f.id ? "border-white/20 bg-white/8 text-white font-bold" : "border-transparent text-white/35 hover:text-white/55"}`}>
                <span>{f.label}</span>
                <span className="font-mono text-white/20">{f.ratio}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Background */}
        <div className="p-4 border-b border-white/[0.06]">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-2">Background</p>
          <div className="grid grid-cols-4 gap-1.5">
            {BG_PRESETS.map(g => (
              <button key={g.label} onClick={() => setBg(g)} title={g.label}
                className={`h-7 rounded-lg transition ${bg.label === g.label ? "ring-2 ring-white/40 scale-95" : "hover:scale-105"}`}
                style={{ background: g.value }} />
            ))}
          </div>
        </div>

        {/* AI Generate */}
        <div className="p-4 border-b border-white/[0.06]">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-2">AI Generate Image</p>
          {showPromptEdit && (
            <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} rows={4}
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-[11px] text-white/70 outline-none focus:border-white/20 resize-none mb-2 leading-relaxed" />
          )}
          <div className="flex gap-2 mb-2">
            <button onClick={() => setShowPromptEdit(!showPromptEdit)}
              className="flex-1 py-1.5 rounded-lg border border-white/[0.07] text-[10px] text-white/35 hover:text-white/55 transition">
              {showPromptEdit ? "Hide prompt" : "Edit prompt"}
            </button>
            <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-[0.18em] ${executionTier === "elite"
              ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-300"
              : "border-white/[0.07] bg-white/[0.04] text-white/45"
              }`}>
              {executionTier}
            </div>
          </div>
          {genError && (genError.includes("OPENAI_API_KEY") || genError.includes("FAL_KEY")) ? (
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-[10px] text-yellow-300/70 leading-relaxed">
              Add <code className="font-mono text-yellow-300">{genError.includes("FAL_KEY") ? "FAL_KEY" : "OPENAI_API_KEY"}</code> to your .env file to enable {executionTier === "elite" && genError.includes("FAL_KEY") ? "Elite (Flux)" : "AI"} generation.
            </div>
          ) : genError ? (
            <p className="text-[10px] text-red-400 mb-2">{genError}</p>
          ) : null}
          <button onClick={generateImage} disabled={generating}
            className="w-full py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest text-[#050a14] flex items-center justify-center gap-2 disabled:opacity-60 transition"
            style={{ background: `linear-gradient(135deg,${theme.from},${theme.to})` }}>
            {generating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</> : <><Sparkles className="w-3.5 h-3.5" /> Generate {executionTier === "elite" ? "Elite" : "Core"} Image</>}
          </button>
        </div>

        <div className="p-4 border-b border-white/[0.06]">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-2">Add Layer</p>
          <div className="space-y-2">
            <div className="flex gap-2">
              <button onClick={addTextLayer} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-white/[0.07] text-[10px] text-white/40 hover:text-white/70 hover:bg-white/5 transition">
                <Type className="w-3 h-3" /> Text
              </button>
              <button onClick={addRectLayer} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-white/[0.07] text-[10px] text-white/40 hover:text-white/70 hover:bg-white/5 transition">
                <Square className="w-3 h-3" /> Shape
              </button>
            </div>
            <button onClick={applyAutoCaption}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black text-cyan-400 uppercase tracking-widest transition">
              <Sparkles className="w-3 h-3" /> Auto-Caption TikTok
            </button>
          </div>
        </div>

        {/* Layers list */}
        <div className="p-4 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-2 flex items-center gap-1"><Layers className="w-3 h-3" /> Layers</p>
          <div className="space-y-1">
            {[...canvas.layers].reverse().map((l) => (
              <div key={l.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition ${selectedId === l.id ? "bg-white/8 border border-white/15" : "hover:bg-white/[0.03]"}`}
                onClick={() => setSelectedId(l.id)}>
                <span className="text-[9px] text-white/20 uppercase font-bold w-8 shrink-0">{l.type}</span>
                <span className="text-[10px] text-white/55 flex-1 truncate">
                  {l.type === "text" ? (l.text?.slice(0, 20) ?? "") : l.type === "image" ? "Image" : "Shape"}
                </span>
                <button onClick={e => { e.stopPropagation(); moveLayer(l.id, "up"); }} className="text-white/15 hover:text-white/40">
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button onClick={e => { e.stopPropagation(); deleteLayer(l.id); }} className="text-white/15 hover:text-red-400">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Center: Canvas */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 overflow-hidden" style={{ background: "#030508" }}>
        <div className="flex items-center gap-3 text-[10px] text-white/20">
          <span>{fmt.label}</span>
          <span className="font-mono">{fmt.w}×{fmt.h}px</span>
          <span>{fmt.ratio}</span>
        </div>
        <div className="shadow-2xl shadow-black/60 overflow-hidden rounded-sm" style={{ background: bg.colors[0] }}>
          <KonvaCanvas
            state={canvas}
            onChange={setCanvas}
            selectedId={selectedId}
            onSelect={setSelectedId}
            scale={1}
            stageRef={stageRef}
          />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={downloadCanvas} disabled={downloading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-[#050a14] transition disabled:opacity-50"
            style={{ background: `linear-gradient(135deg,${theme.from},${theme.to})` }}>
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export {fmt.w}×{fmt.h} PNG
          </button>
          <button onClick={saveToLibrary} disabled={saving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition disabled:opacity-50 ${saveOk === false ? "bg-red-500/20 border border-red-500/40 text-red-400" : "text-white"}`}
            style={saveOk === false ? {} : { background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              : saveOk === true
                ? <><Check className="w-4 h-4" /> Saved!</>
                : saveOk === false
                  ? "Failed"
                  : <><Save className="w-4 h-4" /> Save to Library</>}
          </button>
        </div>
      </div>

      {/* Right: Properties of selected layer */}
      <aside className="w-64 shrink-0 border-l border-white/[0.06] overflow-y-auto p-5 bg-black/20">
        {selectedLayer ? (
          <div className="space-y-4">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Layer Properties</p>

            {selectedLayer.type === "text" && (
              <>
                <div>
                  <p className="text-[9px] text-white/20 uppercase font-bold mb-1.5">Text</p>
                  <textarea value={selectedLayer.text ?? ""} onChange={e => updateSelected({ text: e.target.value })} rows={3}
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-white/20 resize-none" />
                </div>
                <div>
                  <p className="text-[9px] text-white/20 uppercase font-bold mb-1.5">Font</p>
                  <select value={selectedLayer.fontFamily ?? "Inter"} onChange={e => updateSelected({ fontFamily: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-2 py-1.5 text-xs text-white outline-none mb-2">
                    {FONT_PRESETS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <div className="flex items-center gap-2">
                    <input type="range" min={10} max={200} value={selectedLayer.fontSize ?? 48} onChange={e => updateSelected({ fontSize: +e.target.value })} className="flex-1 accent-cyan-400" />
                    <span className="text-[10px] text-white/25 w-8">{selectedLayer.fontSize ?? 48}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] text-white/20 uppercase font-bold mb-1.5">Alignment</p>
                  <div className="flex gap-1">
                    {(["left", "center", "right"] as const).map(a => (
                      <button key={a} onClick={() => updateSelected({ align: a })}
                        className={`flex-1 py-1.5 rounded-lg border text-xs transition ${selectedLayer.align === a ? "border-white/25 bg-white/10 text-white" : "border-white/[0.07] text-white/25"}`}>
                        {a === "left" ? <AlignLeft className="w-3 h-3 mx-auto" /> : a === "center" ? <AlignCenter className="w-3 h-3 mx-auto" /> : <AlignRight className="w-3 h-3 mx-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] text-white/20 uppercase font-bold mb-1.5">Color</p>
                  <input type="color" value={selectedLayer.fill ?? "#ffffff"} onChange={e => updateSelected({ fill: e.target.value })}
                    className="w-full h-8 rounded-lg cursor-pointer border border-white/[0.07] bg-transparent" />
                </div>
                <div>
                  <p className="text-[9px] text-white/20 uppercase font-bold mb-1.5">Style</p>
                  <select value={selectedLayer.fontStyle ?? "bold"} onChange={e => updateSelected({ fontStyle: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-2 py-1.5 text-xs text-white outline-none">
                    {["normal", "bold", "italic", "bold italic"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[9px] text-white/20 uppercase font-bold mb-1.5">Outline</p>
                    <input type="color" value={selectedLayer.stroke ?? "#000000"} onChange={e => updateSelected({ stroke: e.target.value })}
                      className="w-full h-8 rounded-lg cursor-pointer border border-white/[0.07] bg-transparent" />
                  </div>
                  <div>
                    <p className="text-[9px] text-white/20 uppercase font-bold mb-1.5">Width</p>
                    <input type="number" min={0} max={20} value={selectedLayer.strokeWidth ?? 0} onChange={e => updateSelected({ strokeWidth: +e.target.value })}
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-2 py-1.5 text-xs text-white outline-none" />
                  </div>
                </div>
                <button
                  onClick={() => updateSelected(TIKTOK_CAPTION_STYLE)}
                  className="w-full py-2 rounded-lg bg-[#ffff00]/10 border border-[#ffff00]/30 text-[#ffff00] text-[10px] font-black uppercase tracking-widest hover:bg-[#ffff00]/20 transition">
                  Apply TikTok Style
                </button>
              </>
            )}

            {selectedLayer.type === "rect" && (
              <>
                <div>
                  <p className="text-[9px] text-white/20 uppercase font-bold mb-1.5">Fill Color</p>
                  <input type="color" value={selectedLayer.fill ?? "#06b6d4"} onChange={e => updateSelected({ fill: e.target.value })}
                    className="w-full h-8 rounded-lg cursor-pointer border border-white/[0.07] bg-transparent" />
                </div>
                <div>
                  <p className="text-[9px] text-white/20 uppercase font-bold mb-1.5">Corner Radius</p>
                  <input type="range" min={0} max={100} value={selectedLayer.cornerRadius ?? 12} onChange={e => updateSelected({ cornerRadius: +e.target.value })} className="w-full accent-cyan-400" />
                </div>
              </>
            )}

            <div>
              <p className="text-[9px] text-white/20 uppercase font-bold mb-1.5">Opacity</p>
              <div className="flex items-center gap-2">
                <input type="range" min={0} max={1} step={0.05} value={selectedLayer.opacity ?? 1} onChange={e => updateSelected({ opacity: +e.target.value })} className="flex-1 accent-cyan-400" />
                <span className="text-[10px] text-white/25 w-8">{Math.round((selectedLayer.opacity ?? 1) * 100)}%</span>
              </div>
            </div>

            <button onClick={() => deleteLayer(selectedLayer.id)}
              className="w-full py-2 rounded-lg border border-red-500/20 text-red-400/60 hover:border-red-500/40 hover:text-red-400 text-xs font-semibold transition flex items-center justify-center gap-2">
              <Trash2 className="w-3.5 h-3.5" /> Delete Layer
            </button>
          </div>
        ) : (
          <div className="text-center pt-8">
            <p className="text-[10px] text-white/20">Click a layer on the canvas to edit its properties.</p>
          </div>
        )}
      </aside>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO LAB — Per-scene AI video generation with Runway
// ─────────────────────────────────────────────────────────────────────────────

function VideoLab({ brief, theme, executionTier }: { brief: StudioBrief; theme: { from: string; to: string }; executionTier: ExecutionTier }) {
  const [scenes, setScenes] = useState(brief.scenes);
  const [videoJobs, setVideoJobs] = useState<SceneVideoState[]>(() =>
    brief.scenes.map(s => ({
      jobId: null, status: "idle" as VideoJobStatus, videoUrl: null, progress: 0,
      prompt: genPrompt(s, brief.productionKit, "runway", brief.platform, executionTier),
    }))
  );

  useEffect(() => {
    setVideoJobs(brief.scenes.map((s, index) => {
      const existing = videoJobs[index];
      return {
        jobId: existing?.jobId ?? null,
        status: existing?.status ?? "idle",
        videoUrl: existing?.videoUrl ?? null,
        progress: existing?.progress ?? 0,
        prompt: existing?.jobId ? existing.prompt : genPrompt(s, brief.productionKit, "runway", brief.platform, executionTier),
      };
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brief, executionTier]);

  async function generateScene(i: number) {
    setVideoJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: "pending" } : j));
    try {
      const res = await fetch("/api/creative/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: videoJobs[i].prompt, duration: 5, ratio: "768:1344", executionTier }),
      });
      const data = await res.json() as { ok: boolean; jobId?: string; error?: string; message?: string };
      if (!data.ok || !data.jobId) {
        const errMsg = data.message ?? data.error ?? "Generation failed";
        setVideoJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: "failed", prompt: `${j.prompt}\n[Error: ${errMsg}]` } : j));
        return;
      }
      setVideoJobs(prev => prev.map((j, idx) => idx === i ? { ...j, jobId: data.jobId!, status: "running" } : j));
      // Poll
      pollJob(i, data.jobId!);
    } catch {
      setVideoJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: "failed" } : j));
    }
  }

  function pollJob(sceneIdx: number, jobId: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/creative/video-status/${jobId}`);
        const data = await res.json() as { ok: boolean; status: string; videoUrl?: string; progress?: number };
        if (data.status === "SUCCEEDED" && data.videoUrl) {
          setVideoJobs(prev => prev.map((j, idx) => idx === sceneIdx ? { ...j, status: "succeeded", videoUrl: data.videoUrl!, progress: 100 } : j));
          clearInterval(interval);
        } else if (data.status === "FAILED") {
          setVideoJobs(prev => prev.map((j, idx) => idx === sceneIdx ? { ...j, status: "failed" } : j));
          clearInterval(interval);
        } else {
          setVideoJobs(prev => prev.map((j, idx) => idx === sceneIdx ? { ...j, progress: data.progress ?? 50 } : j));
        }
      } catch { clearInterval(interval); }
    }, 4000);
  }

  const hasRunwayKey = true; // We show the "no key" message from API response

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-white">Video Lab</h2>
              <p className="text-xs text-white/30 mt-0.5">Generate AI video clips for each scene. Powered by Runway Gen-4.</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-cyan-400" /> Auto-Captions
              </button>
              <button className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase bg-white/5 text-white/40 border border-white/[0.07]">
                {executionTier === "elite" ? "Elite Framing" : "Hook First"}
              </button>
              <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-[#050a14]" style={{ background: `linear-gradient(135deg,${theme.from},${theme.to})` }}>1080×1920</span>
            </div>
          </div>

          <div className="space-y-4">
            {scenes.map((scene, i) => {
              const job = videoJobs[i];
              return (
                <div key={i} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/[0.07] flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white" style={{ background: `${theme.from}22` }}>{i + 1}</span>
                    <span className="text-[10px] font-mono text-white/30">{scene.timestamp}</span>
                    <span className="text-[10px] text-white/20 uppercase font-bold tracking-widest flex-1">{scene.shotType}</span>
                    {job.status === "succeeded" && job.videoUrl && (
                      <a href={job.videoUrl} download target="_blank" rel="noopener"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25 transition">
                        <Download className="w-3 h-3" /> Download
                      </a>
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    <p className="text-xs text-white/55 leading-relaxed">{scene.visual}</p>
                    <div>
                      <p className="text-[9px] text-white/20 uppercase font-bold mb-1.5">Runway Prompt</p>
                      <textarea
                        value={job.prompt}
                        onChange={e => setVideoJobs(prev => prev.map((j, idx) => idx === i ? { ...j, prompt: e.target.value } : j))}
                        rows={2}
                        className="w-full bg-black/30 border border-white/[0.06] rounded-lg px-3 py-2 text-[11px] text-white/55 font-mono outline-none focus:border-white/20 resize-none leading-relaxed"
                      />
                    </div>

                    {job.status === "succeeded" && job.videoUrl ? (
                      <video src={job.videoUrl} controls className="w-full rounded-xl max-h-48 bg-black" />
                    ) : job.status === "running" || job.status === "pending" ? (
                      <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4 flex items-center gap-3">
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-white/50">{job.status === "pending" ? "Starting generation..." : "Generating video..."}</p>
                          <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-400 rounded-full transition-all" style={{ width: `${job.progress}%` }} />
                          </div>
                        </div>
                      </div>
                    ) : job.status === "failed" ? (
                      <div className="space-y-1">
                        <p className="text-xs text-red-500 font-bold">Generation failed</p>
                        <p className="text-[10px] text-red-400/70 leading-relaxed font-mono">
                          {job.prompt.includes("[Error:")
                            ? job.prompt.split("[Error:")[1].split("]")[0]
                            : "Check your Runway API key and account credits in the developer portal."}
                        </p>
                      </div>
                    ) : null}

                    <button onClick={() => void generateScene(i)}
                      disabled={job.status === "running" || job.status === "pending"}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase text-[#050a14] transition disabled:opacity-50"
                      style={{ background: `linear-gradient(135deg,${theme.from},${theme.to})` }}>
                      {job.status === "running" || job.status === "pending"
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</>
                        : job.status === "succeeded"
                          ? <><RefreshCw className="w-3.5 h-3.5" /> Regenerate</>
                          : <><Video className="w-3.5 h-3.5" /> Generate {executionTier === "elite" ? "Elite" : "Core"} Clip</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Setup guide */}
      <aside className="w-64 shrink-0 border-l border-white/[0.06] p-5 bg-black/20 overflow-y-auto">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-4">Setup Guide</p>
        <div className="space-y-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[10px] font-bold text-white mb-1">1. Get Runway Key</p>
            <p className="text-[10px] text-white/40 leading-relaxed mb-2">Sign up at runwayml.com. Go to Account → API Keys.</p>
            <a href="https://runwayml.com" target="_blank" rel="noopener" className="text-[10px] text-cyan-400 flex items-center gap-1 hover:underline">runwayml.com <ExternalLink className="w-3 h-3" /></a>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[10px] font-bold text-white mb-1">2. Add to .env</p>
            <code className="text-[10px] font-mono text-cyan-300/70 block bg-black/30 rounded p-2">RUNWAY_API_KEY=your_key_here</code>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[10px] font-bold text-white mb-1">3. Restart dev server</p>
            <code className="text-[10px] font-mono text-white/40">npm run dev</code>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-white/[0.06]">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-3">Also works with</p>
          {[
            { name: "Pika 2.0", url: "pika.art", color: "#ec4899" },
            { name: "Kling AI", url: "kling.ai", color: "#f59e0b" },
            { name: "Luma Dream", url: "lumalabs.ai", color: "#8b5cf6" },
          ].map(t => (
            <div key={t.name} className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <span className="text-[10px] font-bold" style={{ color: t.color }}>{t.name}</span>
              <a href={`https://${t.url}`} target="_blank" rel="noopener" className="text-[10px] text-white/20 hover:text-white/50 transition">{t.url} ↗</a>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT LAB
// ─────────────────────────────────────────────────────────────────────────────

function PromptLab({ brief, theme, executionTier }: { brief: StudioBrief; theme: { from: string; to: string }; executionTier: ExecutionTier }) {
  const [tool, setTool] = useState<PromptTool>("runway");
  const activeTool = PROMPT_TOOLS.find(t => t.id === tool)!;
  const allPrompts = brief.scenes.map((s, i) => `// Scene ${i + 1} [${s.timestamp}]\n${genPrompt(s, brief.productionKit, tool, brief.platform, executionTier)}`).join("\n\n");

  return (
    <div className="flex h-full">
      {/* Tool selector */}
      <aside className="w-52 shrink-0 border-r border-white/[0.06] p-4 bg-black/20">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-3">Select Tool</p>
        <div className="space-y-1.5">
          {PROMPT_TOOLS.map(t => (
            <button key={t.id} onClick={() => setTool(t.id)}
              className={`w-full text-left p-3 rounded-xl transition border ${tool === t.id ? "border-white/15 bg-white/8" : "border-transparent hover:bg-white/[0.03]"}`}>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: t.color }} />
                <span className="text-xs font-bold text-white">{t.label}</span>
              </div>
              <a href={t.link} target="_blank" rel="noopener" onClick={e => e.stopPropagation()} className="text-[9px] text-white/20 hover:text-white/50 pl-3.5 flex items-center gap-1 transition">
                {t.link.replace("https://", "")} <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </button>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-white/[0.06]">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-2">Tips</p>
          <div className="space-y-2 text-[10px] text-white/35 leading-relaxed">
            {tool === "runway" && <>
              <p>→ Generate each scene at 5s</p>
              <p>→ Use Extend for longer clips</p>
              <p>→ Assemble in CapCut/Premiere</p>
            </>}
            {tool === "pika" && <>
              <p>→ Use Ingredients to add product</p>
              <p>→ Motion scale: 2-3 for natural</p>
              <p>→ Batch generate 4 variations</p>
            </>}
            {tool === "midjourney" && <>
              <p>→ Use --seed for consistency</p>
              <p>→ Add --no text to avoid text</p>
              <p>→ Use --sref for style matching</p>
            </>}
            {tool === "dalle" && <>
              <p>→ Use "vivid" for bold looks</p>
              <p>→ 1024×1792 for portrait</p>
              <p>→ Iterate with ChatGPT-4o</p>
            </>}
          </div>
        </div>
      </aside>

      {/* Prompts */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-black text-white">{activeTool.label} Prompts</h2>
              <p className="text-xs text-white/25 mt-0.5">{brief.scenes.length} scenes auto-generated from your brief</p>
            </div>
            <CopyBtn text={allPrompts} label="Copy All" />
          </div>

          {brief.imageAd && (
            <div className="rounded-2xl p-5 space-y-2" style={{ border: `1px solid ${theme.from}20`, background: `${theme.from}06` }}>
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: `${theme.from}80` }}>Static Image Prompt</p>
                <CopyBtn text={tool === "midjourney"
                  ? `${brief.imageAd.visualDirection}, professional ad photo, ${brief.productionKit.lighting} lighting, ${brief.productionKit.colorGrade} grade, 8K --ar 1:1 --style raw --q 2 --v 6.1`
                  : `${brief.imageAd.visualDirection}. ${brief.productionKit.lighting} lighting. ${brief.productionKit.colorGrade} treatment. Commercial ad photography, 8K.`} />
              </div>
              <p className="text-[11px] text-white/45 font-mono leading-relaxed bg-black/20 rounded-lg p-3">
                {tool === "midjourney"
                  ? `${brief.imageAd.visualDirection}, professional ad photo, ${brief.productionKit.lighting} lighting, ${brief.productionKit.colorGrade} grade, 8K --ar 1:1 --style raw --q 2 --v 6.1`
                  : `${brief.imageAd.visualDirection}. ${brief.productionKit.lighting} lighting. ${brief.productionKit.colorGrade} treatment. Commercial ad photography, 8K.`}
              </p>
            </div>
          )}

          {brief.scenes.map((scene, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] text-white" style={{ background: `${theme.from}22` }}>{i + 1}</span>
                <span className="text-[10px] font-mono text-white/25">{scene.timestamp}</span>
                <span className="text-[10px] uppercase font-bold text-white/15 tracking-widest flex-1">{scene.shotType}</span>
                <CopyBtn text={genPrompt(scene, brief.productionKit, tool, brief.platform, executionTier)} />
              </div>
              <div className="p-4">
                <p className="text-[11px] text-white/50 font-mono leading-relaxed bg-black/20 rounded-lg p-3">{genPrompt(scene, brief.productionKit, tool, brief.platform, executionTier)}</p>
                <p className="text-[9px] text-white/20 mt-2 italic">From: {scene.visual.slice(0, 70)}…</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
