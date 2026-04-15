"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mountain, ArrowRight, ChevronRight, Settings2 } from "lucide-react";
import AppNav from "@/components/AppNav";
import { track } from "@/lib/himalaya/tracking";

// ── The 3 entry states ──────────────────────────────────────────────────────

const ENTRY_OPTIONS = [
  {
    id: "no_business",
    label: "I don't have a business yet",
    sub: "We'll pick your path, build everything, and tell you exactly what to do",
  },
  {
    id: "has_business",
    label: "I have a business",
    sub: "Paste your URL or tell us your niche — we'll find the gaps and fix them",
  },
  {
    id: "want_to_scale",
    label: "I want to scale",
    sub: "Already making money — we'll find what's leaking and multiply what's working",
  },
] as const;

type EntryState = typeof ENTRY_OPTIONS[number]["id"];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HimalayaPage() {
  const router = useRouter();

  const [phase, setPhase] = useState<"entry" | "context" | "building">("entry");
  const [entry, setEntry] = useState<EntryState | null>(null);
  const [context, setContext] = useState("");   // niche or URL
  const [revenue, setRevenue] = useState("");   // for scale mode
  const [building, setBuilding] = useState(false);
  const [buildStage, setBuildStage] = useState("");
  const [hasHistory, setHasHistory] = useState(false);

  // Pick up goal from homepage
  useEffect(() => {
    track.pageView("/himalaya");

    try {
      const goal = sessionStorage.getItem("himalaya_goal");
      if (goal) {
        sessionStorage.removeItem("himalaya_goal");
        setContext(goal);
        // Auto-detect entry type from goal
        if (/scale|grow|increase|expand|\$\d+k.*to/i.test(goal)) {
          setEntry("want_to_scale");
        } else if (/clone|competitor|https?:\/\//i.test(goal)) {
          setEntry("has_business");
        } else {
          setEntry("no_business");
        }
        setPhase("context");
      }
    } catch { /* ignore */ }

    // URL params
    const params = new URLSearchParams(window.location.search);
    const target = params.get("target");
    if (target) {
      setContext(`I want to make $${Number(target).toLocaleString()}/month`);
      setEntry("no_business");
      setPhase("context");
    }

    // Check history
    fetch("/api/analyses?limit=1")
      .then(r => r.json() as Promise<{ ok: boolean; analyses?: unknown[] }>)
      .then(d => { if (d.ok && d.analyses?.length) setHasHistory(true); })
      .catch(() => {});
  }, []);

  // ── Launch the system ─────────────────────────────────────────────────────
  async function launch() {
    if (!entry) return;
    setBuilding(true);
    setPhase("building");

    const stages = [
      "Analyzing your situation...",
      "Choosing the best path for you...",
      "Generating your website...",
      "Writing your ad copy...",
      "Building your email sequences...",
      "Creating your funnel...",
      "Setting up tracking...",
      "Deploying everything...",
    ];

    let i = 0;
    setBuildStage(stages[0]);
    const iv = setInterval(() => {
      i++;
      if (i < stages.length) setBuildStage(stages[i]);
    }, 3000);

    try {
      let niche = context.trim();

      // Build context string based on entry type
      if (entry === "no_business" && !niche) {
        niche = "Start a profitable online business from scratch";
      } else if (entry === "want_to_scale" && revenue) {
        niche = `${niche || "my business"}. Currently at ${revenue}/month, want to scale`;
      }

      const isUrl = /^https?:\/\/.+\..+/.test(niche);

      const res = await fetch("/api/himalaya/express", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          ...(isUrl ? { url: niche } : {}),
          entryType: entry,
          revenue: revenue || undefined,
        }),
      });

      const data = await res.json() as {
        ok: boolean; runId?: string; error?: string;
        deployed?: { site?: { url: string } | null };
        postDeploy?: { siteUrl?: string; adCreatives?: number };
        buildScore?: number;
        readyToLaunch?: boolean;
        path?: string;
        niche?: string;
        steps?: { step: string; ok: boolean }[];
      };
      clearInterval(iv);

      if (data.ok && data.runId) {
        setBuildStage(
          data.readyToLaunch
            ? `Your business is live! Score: ${data.buildScore}/100`
            : "Done. Loading your results..."
        );
        setTimeout(() => router.push(`/himalaya/run/${data.runId}`), 800);
      } else {
        alert(data.error ?? "Something went wrong. Try again.");
        setBuilding(false);
        setPhase("context");
      }
    } catch {
      clearInterval(iv);
      alert("Connection error. Try again.");
      setBuilding(false);
      setPhase("context");
    }
  }

  // ── Building state ─────────────────────────────────────────────────────────
  if (phase === "building") {
    return (
      <main className="min-h-screen bg-[#0c0a08] text-white">
        <AppNav />
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 px-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#f5a623] to-[#e07850] flex items-center justify-center shadow-[0_0_60px_rgba(245,166,35,0.25)]">
            <Mountain className="w-10 h-10 text-white animate-pulse" />
          </div>
          <div className="text-center max-w-sm">
            <p className="text-lg font-bold text-white mb-1">{buildStage}</p>
            <p className="text-xs text-white/25">Himalaya is building your entire business. This takes about 60 seconds.</p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5">
            {Array.from({ length: 8 }).map((_, idx) => {
              const stages = ["Analyzing your situation...", "Choosing the best path for you...", "Generating your website...", "Writing your ad copy...", "Building your email sequences...", "Creating your funnel...", "Setting up tracking...", "Deploying everything..."];
              const currentIdx = stages.indexOf(buildStage);
              return (
                <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx <= currentIdx ? "bg-[#f5a623]" : "bg-white/[0.06]"}`} />
              );
            })}
          </div>

          <Loader2 className="w-4 h-4 text-white/15 animate-spin mt-4" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0c0a08] text-white">
      <AppNav />

      <div className="max-w-lg mx-auto px-4 sm:px-6 pb-20">

        {/* ── Header ── */}
        <div className="pt-14 pb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f5a623] to-[#e07850] flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(245,166,35,0.2)]">
            <Mountain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">
            {phase === "entry" ? "Where are you right now?" : entry === "no_business" ? "Tell us what you want" : entry === "want_to_scale" ? "What are you scaling?" : "Tell us about your business"}
          </h1>
          <p className="mt-2 text-sm text-white/30">
            {phase === "entry" ? "Pick one. Himalaya handles the rest." : "Be specific or vague — we'll figure it out."}
          </p>
        </div>

        {/* ── Phase 1: Entry — 3 options ── */}
        {phase === "entry" && (
          <div className="space-y-2">
            {ENTRY_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => { setEntry(opt.id); setPhase("context"); }}
                className="w-full text-left rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 hover:border-[#f5a623]/20 hover:bg-[#f5a623]/[0.03] transition group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-[#f5f0e8] transition">{opt.label}</p>
                    <p className="text-xs text-white/25 mt-0.5">{opt.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-white/30 transition" />
                </div>
              </button>
            ))}

            {/* Past results */}
            {hasHistory && (
              <div className="pt-4 text-center">
                <Link href="/himalaya/runs" className="text-[11px] text-white/20 hover:text-white/40 transition">
                  View past results →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Phase 2: Context — one input, then go ── */}
        {phase === "context" && entry && (
          <div className="space-y-4">

            {/* Main input */}
            <div>
              <input
                type="text"
                value={context}
                onChange={e => setContext(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") void launch(); }}
                autoFocus
                placeholder={
                  entry === "no_business" ? "e.g. I want to make $10k/month, or: affiliate marketing" :
                  entry === "has_business" ? "Paste your website URL or describe your business" :
                  "What's your business? e.g. coaching, agency, ecommerce"
                }
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-sm text-white placeholder-white/15 outline-none focus:border-[#f5a623]/25 transition"
              />
            </div>

            {/* Revenue input for scale mode */}
            {entry === "want_to_scale" && (
              <div>
                <p className="text-[10px] font-bold text-white/20 mb-1.5">Current monthly revenue</p>
                <div className="flex gap-2">
                  {["$1-5k", "$5-10k", "$10-25k", "$25-50k", "$50k+"].map(r => (
                    <button key={r} onClick={() => setRevenue(r)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-bold transition ${
                        revenue === r ? "border-[#f5a623]/30 bg-[#f5a623]/10 text-[#f5a623]" : "border-white/[0.06] text-white/25 hover:text-white/50"
                      }`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick suggestions for no_business */}
            {entry === "no_business" && !context && (
              <div className="flex flex-wrap gap-1.5">
                {["Affiliate marketing", "Start a coaching business", "Dropshipping", "Digital products", "Marketing agency", "Freelance services"].map(s => (
                  <button key={s} onClick={() => setContext(s)}
                    className="px-2.5 py-1 rounded-lg border border-white/[0.04] text-[10px] text-white/20 hover:text-white/40 hover:border-white/[0.08] transition">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* The button */}
            <button
              onClick={() => void launch()}
              disabled={building}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] py-3.5 text-sm font-bold text-white hover:opacity-90 transition disabled:opacity-40"
            >
              <Mountain className="w-4 h-4" />
              {entry === "no_business" ? "Build My Business" : entry === "want_to_scale" ? "Find My Growth Levers" : "Analyze & Improve"}
            </button>

            {/* Skip context — let system decide everything */}
            {entry === "no_business" && (
              <button
                onClick={() => { setContext(""); void launch(); }}
                className="w-full text-center text-[11px] text-white/15 hover:text-white/30 transition py-2"
              >
                Skip — let Himalaya pick everything for me
              </button>
            )}

            {/* Back */}
            <button onClick={() => { setPhase("entry"); setEntry(null); setContext(""); setRevenue(""); }}
              className="w-full text-center text-[11px] text-white/15 hover:text-white/30 transition">
              ← Back
            </button>

            {/* Advanced toggle */}
            <div className="pt-2 text-center">
              <Link href="/himalaya/scratch" className="inline-flex items-center gap-1 text-[10px] text-white/10 hover:text-white/25 transition">
                <Settings2 className="w-3 h-3" /> I want full control over every setting
              </Link>
            </div>
          </div>
        )}

        {/* ── What happens next ── */}
        {phase === "context" && (
          <div className="mt-8 rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-3">
            <p className="text-[10px] font-bold text-white/15 mb-2">WHAT HIMALAYA WILL DO</p>
            <div className="space-y-1.5">
              {[
                "Pick the best business model for your situation",
                "Generate a high-converting website",
                "Write ads, emails, and a content plan",
                "Build your funnel and follow-up system",
                "Deploy everything — ready to launch",
                "Give you daily commands: post this, run this, send this",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full border border-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[8px] font-bold text-white/20">{i + 1}</span>
                  </div>
                  <p className="text-[11px] text-white/25">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
