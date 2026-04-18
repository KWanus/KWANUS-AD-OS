"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import { Mountain, Loader2, Copy, Check, DollarSign, Gift, Shield, Zap } from "lucide-react";

export default function OfferStackPage() {
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
        body: JSON.stringify({ tool: "offer_stack", params: { niche, offer: offer || niche, price: price || "$997", audience: audience || "customers" } }),
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

  const stack = (result?.stack ?? []) as { item: string; value: string; type: string }[];
  const totalValue = result?.totalValue as string | undefined;
  const yourPrice = result?.yourPrice as string | undefined;
  const savings = result?.savings as string | undefined;
  const headline = result?.headline as string | undefined;

  const TYPE_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    core: { icon: DollarSign, color: "text-[#f5a623]", bg: "bg-[#f5a623]/10 border-[#f5a623]/20" },
    bonus: { icon: Gift, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    guarantee: { icon: Shield, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    urgency: { icon: Zap, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  };

  return (
    <main className="min-h-screen bg-t-bg text-t-text">
      <AppNav />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-20">
        <div className="pt-8 pb-4">
          <h1 className="text-2xl font-black">Offer Stack Builder</h1>
          <p className="text-sm text-t-text-muted">Create a &quot;no-brainer&quot; offer that makes people feel stupid saying no.</p>
        </div>

        <div className="space-y-3 mb-6">
          <input type="text" value={niche} onChange={e => setNiche(e.target.value)} placeholder="Your niche"
            className="w-full rounded-xl border border-t-border bg-t-bg-raised px-4 py-3 text-sm placeholder-t-text-faint outline-none focus:border-[#f5a623]/30 transition" />
          <div className="grid grid-cols-3 gap-2">
            <input type="text" value={offer} onChange={e => setOffer(e.target.value)} placeholder="Core offer"
              className="rounded-xl border border-t-border bg-t-bg-raised px-3 py-2.5 text-sm placeholder-t-text-faint outline-none" />
            <input type="text" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price ($997)"
              className="rounded-xl border border-t-border bg-t-bg-raised px-3 py-2.5 text-sm placeholder-t-text-faint outline-none" />
            <input type="text" value={audience} onChange={e => setAudience(e.target.value)} placeholder="Audience"
              className="rounded-xl border border-t-border bg-t-bg-raised px-3 py-2.5 text-sm placeholder-t-text-faint outline-none" />
          </div>
          <button onClick={() => void generate()} disabled={!niche || loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] py-3 text-sm font-bold text-[#0c0a08] disabled:opacity-30 hover:opacity-90 transition">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mountain className="w-4 h-4" />}
            {loading ? "Building..." : "Build Offer Stack"}
          </button>
        </div>

        {result && (
          <div className="space-y-4">
            {headline && (
              <div className="rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/[0.03] p-5 text-center">
                <p className="text-lg font-black">{headline}</p>
              </div>
            )}

            <div className="space-y-2">
              {stack.map((item, i) => {
                const typeInfo = TYPE_ICONS[item.type] ?? TYPE_ICONS.core;
                const Icon = typeInfo.icon;
                return (
                  <div key={i} className={`flex items-center justify-between rounded-xl border ${typeInfo.bg} px-4 py-3`}>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${typeInfo.color}`} />
                      <span className="text-sm font-bold">{item.item}</span>
                    </div>
                    <span className="text-sm font-black text-t-text-muted">{item.value}</span>
                  </div>
                );
              })}
            </div>

            {totalValue && yourPrice && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5 text-center">
                <p className="text-sm text-t-text-muted">Total Value: <span className="line-through">{totalValue}</span></p>
                <p className="text-3xl font-black text-emerald-400 mt-1">Your Price: {yourPrice}</p>
                {savings && <p className="text-xs text-emerald-400/60 mt-1">You save {savings}</p>}
              </div>
            )}

            <button onClick={() => copy(JSON.stringify(result, null, 2), "stack")}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-t-border py-2.5 text-xs font-bold text-t-text-muted hover:text-t-text transition">
              {copiedId === "stack" ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy Full Stack</>}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
