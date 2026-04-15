"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mountain, Loader2, ChevronRight } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"pick" | "tell" | "building">("pick");
  const [entry, setEntry] = useState<"fresh" | "have" | "scale" | null>(null);
  const [input, setInput] = useState("");
  const [revenue, setRevenue] = useState("");
  const [building, setBuilding] = useState(false);
  const [stage, setStage] = useState("Setting up your account...");

  async function go() {
    setBuilding(true);
    setPhase("building");

    const msgs = [
      "Setting up your account...",
      "Picking the best business for you...",
      "Building your website...",
      "Creating your ads...",
      "Writing your emails...",
      "Setting up your funnel...",
      "Adding tracking...",
      "Going live...",
    ];
    let i = 0;
    setStage(msgs[0]);
    const iv = setInterval(() => { i++; if (i < msgs.length) setStage(msgs[i]); }, 3000);

    try {
      // Save profile
      const bizType = detectBizType(input, entry!);
      await fetch("/api/business-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: bizType,
          niche: input.trim() || undefined,
          stage: entry === "scale" ? "scaling" : entry === "have" ? "early" : "starting",
          monthlyRevenue: revenue || "$0-1k",
          mainGoal: entry === "scale" ? "scale" : "more_leads",
          setupCompleted: true,
          setupStep: 5,
        }),
      });

      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingCompleted: true, businessType: bizType }),
      });

      // Build the business
      let niche = input.trim();
      if (!niche && entry === "fresh") niche = "Start a profitable online business";
      if (!niche && entry === "have") niche = "Grow my existing business";
      if (!niche && entry === "scale") niche = `Scale my business from ${revenue || "$5k"}/month`;
      if (entry === "scale" && revenue) niche = `${niche}. Currently at ${revenue}/month`;

      const isUrl = /^https?:\/\/.+\..+/.test(niche);
      const res = await fetch("/api/himalaya/express", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          ...(isUrl ? { url: niche } : {}),
          entryType: entry === "fresh" ? "no_business" : entry === "have" ? "has_business" : "want_to_scale",
          revenue: revenue || undefined,
        }),
      });

      const data = await res.json() as { ok: boolean; runId?: string };
      clearInterval(iv);

      if (data.ok && data.runId) {
        setStage("Your business is ready!");
        setTimeout(() => router.push(`/himalaya/run/${data.runId}`), 800);
      } else {
        setStage("Done!");
        setTimeout(() => router.push("/"), 800);
      }
    } catch {
      clearInterval(iv);
      setStage("Done!");
      setTimeout(() => router.push("/"), 800);
    }
  }

  // ── Building screen ──
  if (phase === "building") {
    return (
      <main className="min-h-screen bg-t-bg text-t-text flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#f5a623] to-[#e07850] flex items-center justify-center shadow-[0_0_60px_rgba(245,166,35,0.25)] mb-6">
          <Mountain className="w-10 h-10 text-t-text animate-pulse" />
        </div>
        <p className="text-xl font-black text-t-text mb-2">{stage}</p>
        <p className="text-sm text-t-text/25 mb-6">This takes about 60 seconds.</p>
        <div className="flex gap-1.5">
          {Array.from({ length: 8 }).map((_, idx) => {
            const msgs = ["Setting up your account...", "Picking the best business for you...", "Building your website...", "Creating your ads...", "Writing your emails...", "Setting up your funnel...", "Adding tracking...", "Going live..."];
            const ci = msgs.indexOf(stage);
            return <div key={idx} className={`w-2.5 h-2.5 rounded-full transition-all ${idx <= ci ? "bg-[#f5a623]" : "bg-white/[0.06]"}`} />;
          })}
        </div>
        <Loader2 className="w-4 h-4 text-t-text/15 animate-spin mt-6" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-t-bg text-t-text flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f5a623] to-[#e07850] flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(245,166,35,0.2)]">
            <Mountain className="w-8 h-8 text-t-text" />
          </div>
          <h1 className="text-3xl font-black text-t-text">
            {phase === "pick" ? "Let's make you money." : entry === "fresh" ? "What sounds cool to you?" : entry === "scale" ? "How much are you making?" : "What do you do?"}
          </h1>
          <p className="text-sm text-t-text/30 mt-2">
            {phase === "pick" ? "Pick one. We handle the rest." : "Type anything. Or skip and we'll pick for you."}
          </p>
        </div>

        {/* ── Step 1: Pick ── */}
        {phase === "pick" && (
          <div className="space-y-3">
            {[
              { id: "fresh" as const, label: "I'm starting from zero", sub: "We pick your business, build everything, tell you what to do" },
              { id: "have" as const, label: "I already have a business", sub: "Tell us what you do — we fix what's broken and grow it" },
              { id: "scale" as const, label: "I'm making money, I want more", sub: "We find what's leaking and multiply what's working" },
            ].map(opt => (
              <button key={opt.id} onClick={() => { setEntry(opt.id); setPhase("tell"); }}
                className="w-full text-left rounded-2xl border border-t-border bg-t-bg-raised px-6 py-5 hover:border-[#f5a623]/20 hover:bg-[#f5a623]/[0.03] transition group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-black text-t-text group-hover:text-[#f5f0e8] transition">{opt.label}</p>
                    <p className="text-sm text-t-text/25 mt-1">{opt.sub}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-t-text/10 group-hover:text-t-text/30 transition" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Step 2: Context ── */}
        {phase === "tell" && entry && (
          <div className="space-y-4">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") void go(); }}
              autoFocus
              placeholder={
                entry === "fresh" ? "e.g. affiliate marketing, coaching, dropshipping..." :
                entry === "have" ? "Paste your website or describe your business" :
                "What's your business?"
              }
              className="w-full rounded-2xl border border-t-border bg-t-bg-raised px-5 py-4 text-base text-t-text placeholder-t-text-faint outline-none focus:border-[#f5a623]/25 transition"
            />

            {entry === "scale" && (
              <div>
                <p className="text-xs font-bold text-t-text/20 mb-2">How much per month?</p>
                <div className="flex gap-2">
                  {["$1-5k", "$5-10k", "$10-25k", "$25-50k", "$50k+"].map(r => (
                    <button key={r} onClick={() => setRevenue(r)}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition ${
                        revenue === r ? "border-[#f5a623]/30 bg-[#f5a623]/10 text-[#f5a623]" : "border-t-border text-t-text/25 hover:text-t-text/50"
                      }`}>{r}</button>
                  ))}
                </div>
              </div>
            )}

            {entry === "fresh" && !input && (
              <div className="flex flex-wrap gap-2">
                {["Affiliate marketing", "Coaching", "Dropshipping", "Digital products", "Agency", "Freelancing"].map(s => (
                  <button key={s} onClick={() => setInput(s)}
                    className="px-3 py-1.5 rounded-xl border border-t-border text-xs text-t-text/20 hover:text-t-text/40 hover:border-t-border transition">{s}</button>
                ))}
              </div>
            )}

            <button onClick={() => void go()}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f5a623] to-[#e07850] py-4 text-base font-black text-t-text hover:opacity-90 transition">
              <Mountain className="w-5 h-5" /> Build My Business
            </button>

            {entry === "fresh" && (
              <button onClick={() => void go()}
                className="w-full text-center text-xs text-t-text/15 hover:text-t-text/30 transition py-1">
                Skip — pick everything for me
              </button>
            )}

            <button onClick={() => { setPhase("pick"); setEntry(null); setInput(""); setRevenue(""); }}
              className="w-full text-center text-xs text-t-text/15 hover:text-t-text/30 transition">← Back</button>
          </div>
        )}
      </div>
    </main>
  );
}

function detectBizType(input: string, entry: "fresh" | "have" | "scale"): string {
  const l = input.toLowerCase();
  if (entry === "scale") return "consultant_coach";
  if (/affiliate|commission|clickbank/.test(l)) return "affiliate";
  if (/coach|consult|mentor/.test(l)) return "consultant_coach";
  if (/dropship|ecommerce|store|shopify/.test(l)) return "dropship";
  if (/agency|client|marketing/.test(l)) return "agency";
  if (/local|plumb|hvac|clean|roof/.test(l)) return "local_service";
  if (/course|ebook|digital/.test(l)) return "content_creator";
  if (/freelanc|design|develop/.test(l)) return "agency";
  return entry === "fresh" ? "affiliate" : "consultant_coach";
}
