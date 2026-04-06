"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import { Plus, X, Copy, Check, DollarSign, Gift, Shield, Sparkles, Loader2 } from "lucide-react";

type OfferItem = {
  id: string;
  name: string;
  value: string;
  type: "core" | "bonus" | "guarantee";
};

export default function OfferBuilderPage() {
  const [offerName, setOfferName] = useState("");
  const [price, setPrice] = useState("");
  const [items, setItems] = useState<OfferItem[]>([
    { id: "1", name: "", value: "", type: "core" },
  ]);
  const [guarantee, setGuarantee] = useState("30-day money-back guarantee");
  const [urgency, setUrgency] = useState("");
  const [copied, setCopied] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  function addItem(type: OfferItem["type"]) {
    setItems([...items, { id: Date.now().toString(), name: "", value: "", type }]);
  }

  function removeItem(id: string) {
    setItems(items.filter((i) => i.id !== id));
  }

  function updateItem(id: string, field: "name" | "value", val: string) {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: val } : i)));
  }

  const coreItems = items.filter((i) => i.type === "core" && i.name.trim());
  const bonusItems = items.filter((i) => i.type === "bonus" && i.name.trim());
  const totalValue = items.reduce((s, i) => {
    const v = parseFloat(i.value.replace(/[^0-9.]/g, ""));
    return s + (isNaN(v) ? 0 : v);
  }, 0);

  function copyOffer() {
    const lines = [
      `# ${offerName || "Your Offer"}`,
      "",
      `**Price: ${price || "TBD"}**`,
      "",
      "## What You Get:",
      ...coreItems.map((i) => `- ${i.name}${i.value ? ` (Value: $${i.value})` : ""}`),
    ];
    if (bonusItems.length > 0) {
      lines.push("", "## Bonuses:", ...bonusItems.map((i) => `- BONUS: ${i.name}${i.value ? ` (Value: $${i.value})` : ""}`));
    }
    if (guarantee) lines.push("", `## Guarantee: ${guarantee}`);
    if (urgency) lines.push("", `*${urgency}*`);
    if (totalValue > 0) lines.push("", `**Total Value: $${totalValue.toLocaleString()}**`);

    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function aiSuggestBonuses() {
    if (!offerName.trim()) return;
    setAiGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Suggest 3 high-value bonuses for this offer: "${offerName}". Price: ${price || "not set"}. Core items: ${coreItems.map(i => i.name).join(", ") || "not set yet"}. For each bonus provide: name (short) and perceived value in dollars. Format as: Name | $Value (one per line, no numbering).`,
        }),
      });
      const data = await res.json() as { ok: boolean; content?: string };
      if (data.ok && data.content) {
        const lines = data.content.split("\n").filter((l) => l.trim() && l.includes("|"));
        const newBonuses = lines.map((l) => {
          const [name, val] = l.split("|").map((s) => s.trim());
          return { id: Date.now().toString() + Math.random(), name: name ?? "", value: (val ?? "").replace(/[^0-9.]/g, ""), type: "bonus" as const };
        });
        setItems([...items, ...newBonuses.slice(0, 3)]);
      }
    } catch { /* silent */ }
    finally { setAiGenerating(false); }
  }

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Offer Stack Builder</h1>
            <p className="text-xs text-white/35">Build irresistible offers with bonuses, guarantees, and value stacking</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Builder */}
          <div className="space-y-4">
            <input type="text" value={offerName} onChange={(e) => setOfferName(e.target.value)} placeholder="Offer name (e.g. Growth Accelerator Package)"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition font-bold" />

            <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price (e.g. $497)"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/50 transition" />

            {/* Core items */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Core Deliverables</p>
              {items.filter((i) => i.type === "core").map((item) => (
                <div key={item.id} className="flex gap-2 mb-2">
                  <input type="text" value={item.name} onChange={(e) => updateItem(item.id, "name", e.target.value)} placeholder="What they get"
                    className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition" />
                  <input type="text" value={item.value} onChange={(e) => updateItem(item.id, "value", e.target.value)} placeholder="$value"
                    className="w-20 bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none transition" />
                  <button onClick={() => removeItem(item.id)} className="text-white/15 hover:text-red-400"><X className="w-4 h-4" /></button>
                </div>
              ))}
              <button onClick={() => addItem("core")} className="text-[10px] text-cyan-400/60 hover:text-cyan-400 transition">+ Add deliverable</button>
            </div>

            {/* Bonuses */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Bonuses</p>
                <button onClick={aiSuggestBonuses} disabled={aiGenerating} className="text-[10px] text-purple-400/60 hover:text-purple-400 transition flex items-center gap-1 disabled:opacity-40">
                  {aiGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} AI Suggest
                </button>
              </div>
              {items.filter((i) => i.type === "bonus").map((item) => (
                <div key={item.id} className="flex gap-2 mb-2">
                  <Gift className="w-4 h-4 text-amber-400/40 shrink-0 mt-2" />
                  <input type="text" value={item.name} onChange={(e) => updateItem(item.id, "name", e.target.value)} placeholder="Bonus name"
                    className="flex-1 bg-white/[0.04] border border-amber-500/20 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none transition" />
                  <input type="text" value={item.value} onChange={(e) => updateItem(item.id, "value", e.target.value)} placeholder="$value"
                    className="w-20 bg-white/[0.04] border border-amber-500/20 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none transition" />
                  <button onClick={() => removeItem(item.id)} className="text-white/15 hover:text-red-400"><X className="w-4 h-4" /></button>
                </div>
              ))}
              <button onClick={() => addItem("bonus")} className="text-[10px] text-amber-400/60 hover:text-amber-400 transition">+ Add bonus</button>
            </div>

            {/* Guarantee */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Guarantee</p>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400/40 shrink-0" />
                <input type="text" value={guarantee} onChange={(e) => setGuarantee(e.target.value)} placeholder="e.g. 30-day money-back guarantee"
                  className="flex-1 bg-white/[0.04] border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none transition" />
              </div>
            </div>

            {/* Urgency */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Urgency (optional)</p>
              <input type="text" value={urgency} onChange={(e) => setUrgency(e.target.value)} placeholder="e.g. Only 10 spots available this month"
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none transition" />
            </div>
          </div>

          {/* Preview */}
          <div>
            <div className="sticky top-20">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4">Offer Preview</p>

                <h2 className="text-lg font-black text-white mb-1">{offerName || "Your Offer"}</h2>
                {price && <p className="text-2xl font-black text-emerald-400 mb-4">{price}</p>}

                {coreItems.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] text-white/30 uppercase mb-2">What you get:</p>
                    {coreItems.map((i) => (
                      <p key={i.id} className="text-xs text-white/60 mb-1 flex items-center gap-2">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" /> {i.name}
                        {i.value && <span className="text-white/20">(${i.value})</span>}
                      </p>
                    ))}
                  </div>
                )}

                {bonusItems.length > 0 && (
                  <div className="mb-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                    <p className="text-[10px] text-amber-400/60 uppercase mb-2">Bonuses:</p>
                    {bonusItems.map((i) => (
                      <p key={i.id} className="text-xs text-amber-300/70 mb-1 flex items-center gap-2">
                        <Gift className="w-3 h-3 text-amber-400 shrink-0" /> {i.name}
                        {i.value && <span className="text-amber-400/40">(${i.value} value)</span>}
                      </p>
                    ))}
                  </div>
                )}

                {guarantee && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                    <p className="text-xs text-emerald-300/70">{guarantee}</p>
                  </div>
                )}

                {totalValue > 0 && (
                  <p className="text-sm text-white/40 mb-2">
                    Total value: <span className="line-through text-white/25">${totalValue.toLocaleString()}</span>
                    {price && <span className="text-emerald-400 font-bold ml-2">Yours for {price}</span>}
                  </p>
                )}

                {urgency && <p className="text-xs text-red-400/70 italic">{urgency}</p>}
              </div>

              <button onClick={copyOffer} className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500 text-[#0a0f1e] text-xs font-bold hover:bg-cyan-400 transition">
                {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Offer Stack</>}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
