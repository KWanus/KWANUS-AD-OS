"use client";

import { useState } from "react";
import SimplifiedNav from "@/components/SimplifiedNav";
import { Mountain, Loader2, Copy, Check, Play, Mail, Clock } from "lucide-react";

export default function WebinarToolPage() {
  const [niche, setNiche] = useState("");
  const [offer, setOffer] = useState("");
  const [price, setPrice] = useState("");
  const [audience, setAudience] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function generate() {
    if (!niche) return;
    setLoading(true);
    try {
      const res = await fetch("/api/himalaya/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "webinar", params: { niche, offer: offer || niche, price: price || "$997", audience: audience || "professionals" } }),
      });
      const data = await res.json();
      if (data.ok) setResult(data.result);
    } catch { /* ignore */ }
    setLoading(false);
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const reg = result?.registrationPage as Record<string, unknown> | undefined;
  const outline = (result?.webinarOutline ?? []) as { section: string; duration: string; content: string }[];
  const pitch = result?.pitchScript as string | undefined;
  const emails = (result?.followUpEmails ?? []) as { day: number; subject: string; body: string }[];

  return (
    <main className="min-h-screen bg-t-bg text-t-text">
      <SimplifiedNav />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-20">
        <div className="pt-8 pb-4">
          <h1 className="text-2xl font-black">Webinar Generator</h1>
          <p className="text-sm text-t-text-muted">Create a complete evergreen webinar system — registration page, outline, pitch, and follow-up emails.</p>
        </div>

        {/* Input */}
        <div className="space-y-3 mb-6">
          <input type="text" value={niche} onChange={e => setNiche(e.target.value)} placeholder="Your niche (e.g., business coaching)"
            className="w-full rounded-xl border border-t-border bg-t-bg-raised px-4 py-3 text-sm placeholder-t-text-faint outline-none focus:border-[#f5a623]/30 transition" />
          <div className="grid grid-cols-3 gap-2">
            <input type="text" value={offer} onChange={e => setOffer(e.target.value)} placeholder="Your offer"
              className="rounded-xl border border-t-border bg-t-bg-raised px-3 py-2.5 text-sm placeholder-t-text-faint outline-none focus:border-[#f5a623]/30 transition" />
            <input type="text" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price ($997)"
              className="rounded-xl border border-t-border bg-t-bg-raised px-3 py-2.5 text-sm placeholder-t-text-faint outline-none focus:border-[#f5a623]/30 transition" />
            <input type="text" value={audience} onChange={e => setAudience(e.target.value)} placeholder="Target audience"
              className="rounded-xl border border-t-border bg-t-bg-raised px-3 py-2.5 text-sm placeholder-t-text-faint outline-none focus:border-[#f5a623]/30 transition" />
          </div>
          <button onClick={() => void generate()} disabled={!niche || loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] py-3 text-sm font-bold text-[#0c0a08] disabled:opacity-30 hover:opacity-90 transition">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mountain className="w-4 h-4" />}
            {loading ? "Generating..." : "Generate Webinar System"}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Registration Page */}
            {reg && (
              <div className="rounded-xl border border-t-border bg-t-bg-raised p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Play className="w-4 h-4 text-[#f5a623]" />
                  <p className="text-[10px] font-black text-t-text-faint tracking-wider">REGISTRATION PAGE</p>
                </div>
                <h3 className="text-lg font-black mb-1">{reg.headline as string}</h3>
                <p className="text-sm text-t-text-muted mb-3">{reg.subheadline as string}</p>
                {Array.isArray(reg.bulletPoints) && (
                  <ul className="space-y-1.5 mb-3">
                    {(reg.bulletPoints as string[]).map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-t-text-muted">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> {b}
                      </li>
                    ))}
                  </ul>
                )}
                <button onClick={() => copy(JSON.stringify(reg, null, 2), "reg")}
                  className="text-[10px] font-bold text-[#f5a623]/60 hover:text-[#f5a623] transition flex items-center gap-1">
                  {copiedId === "reg" ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                </button>
              </div>
            )}

            {/* Outline */}
            {outline.length > 0 && (
              <div className="rounded-xl border border-t-border bg-t-bg-raised p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-[#f5a623]" />
                  <p className="text-[10px] font-black text-t-text-faint tracking-wider">WEBINAR OUTLINE</p>
                </div>
                <div className="space-y-3">
                  {outline.map((s, i) => (
                    <div key={i} className="flex gap-3 rounded-lg bg-t-bg-card border border-t-border p-3">
                      <div className="w-14 shrink-0">
                        <p className="text-xs font-bold text-[#f5a623]">{s.duration}</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-t-text">{s.section}</p>
                        <p className="text-xs text-t-text-muted mt-0.5">{s.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pitch Script */}
            {pitch && (
              <div className="rounded-xl border border-t-border bg-t-bg-raised p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black text-t-text-faint tracking-wider">PITCH SCRIPT</p>
                  <button onClick={() => copy(pitch, "pitch")}
                    className="text-[10px] font-bold text-[#f5a623]/60 hover:text-[#f5a623] transition flex items-center gap-1">
                    {copiedId === "pitch" ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
                <p className="text-sm text-t-text-muted leading-relaxed whitespace-pre-wrap">{pitch}</p>
              </div>
            )}

            {/* Follow-up Emails */}
            {emails.length > 0 && (
              <div className="rounded-xl border border-t-border bg-t-bg-raised p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <p className="text-[10px] font-black text-t-text-faint tracking-wider">FOLLOW-UP EMAILS ({emails.length})</p>
                </div>
                <div className="space-y-3">
                  {emails.map((e, i) => (
                    <details key={i} className="group rounded-lg border border-t-border bg-t-bg-card overflow-hidden">
                      <summary className="flex items-center justify-between cursor-pointer px-3 py-2.5 hover:bg-t-bg-raised transition">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-[#f5a623]">Day {e.day}</span>
                          <span className="text-xs font-bold text-t-text">{e.subject}</span>
                        </div>
                      </summary>
                      <div className="px-3 pb-3">
                        <p className="text-xs text-t-text-muted whitespace-pre-wrap leading-relaxed">{e.body}</p>
                        <button onClick={() => copy(`Subject: ${e.subject}\n\n${e.body}`, `email-${i}`)}
                          className="mt-2 text-[10px] font-bold text-[#f5a623]/60 hover:text-[#f5a623] transition flex items-center gap-1">
                          {copiedId === `email-${i}` ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy Email</>}
                        </button>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
