"use client";

import { useState } from "react";
import { Block, BlockType } from "./BlockRenderer";
import { Trash2, Plus, GripVertical, Sparkles } from "lucide-react";

interface Props {
  block: Block;
  onChange: (updated: Block) => void;
  onDelete: () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, multiline }: { value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) {
  const cls = "w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition";
  if (multiline) {
    return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className={`${cls} resize-none`} />;
  }
  return <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />;
}

function AlignSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
      <option value="center">Center</option>
      <option value="left">Left</option>
      <option value="right">Right</option>
    </select>
  );
}

function p(block: Block, key: string, fallback: unknown = "") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (block.props[key] as any) ?? fallback;
}

function setP(block: Block, onChange: (b: Block) => void, key: string, value: unknown) {
  onChange({ ...block, props: { ...block.props, [key]: value } });
}

function sp(block: Block, onChange: (b: Block) => void) {
  return (key: string, value: unknown) => setP(block, onChange, key, value);
}

function HeroProps({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const set = sp(block, onChange);
  return (
    <div className="space-y-4">
      <Field label="Eyebrow Text"><TextInput value={p(block, "eyebrow")} onChange={v => set("eyebrow", v)} placeholder="Optional label above headline" /></Field>
      <Field label="Headline"><TextInput value={p(block, "headline")} onChange={v => set("headline", v)} placeholder="Your main headline" multiline /></Field>
      <Field label="Subheadline"><TextInput value={p(block, "subheadline")} onChange={v => set("subheadline", v)} placeholder="Supporting text..." multiline /></Field>
      <Field label="Button Text"><TextInput value={p(block, "buttonText")} onChange={v => set("buttonText", v)} placeholder="Get Started" /></Field>
      <Field label="Button URL"><TextInput value={p(block, "buttonUrl")} onChange={v => set("buttonUrl", v)} placeholder="https://..." /></Field>
      <Field label="Secondary Button"><TextInput value={p(block, "secondaryButtonText")} onChange={v => set("secondaryButtonText", v)} placeholder="Learn More (optional)" /></Field>
      <Field label="Text Align"><AlignSelect value={p(block, "textAlign", "center")} onChange={v => set("textAlign", v)} /></Field>
      <Field label="Background Color"><TextInput value={p(block, "bgColor")} onChange={v => set("bgColor", v)} placeholder="#050a14" /></Field>
    </div>
  );
}

function FeaturesProps({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const set = sp(block, onChange);
  const items: { icon?: string; title?: string; body?: string }[] = p(block, "items", []);

  function updateItem(i: number, key: string, val: string) {
    const next = [...items];
    next[i] = { ...next[i], [key]: val };
    set("items", next);
  }
  function addItem() {
    set("items", [...items, { icon: "⚡", title: "Feature", body: "Description" }]);
  }
  function removeItem(i: number) {
    set("items", items.filter((_, j) => j !== i));
  }

  return (
    <div className="space-y-4">
      <Field label="Section Title"><TextInput value={p(block, "title")} onChange={v => set("title", v)} placeholder="Why Choose Us" /></Field>
      <Field label="Subtitle"><TextInput value={p(block, "subtitle")} onChange={v => set("subtitle", v)} placeholder="Optional supporting text..." /></Field>
      <Field label="Columns">
        <select value={p(block, "columns", 3)} onChange={e => set("columns", Number(e.target.value))} className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
          <option value={1}>1</option><option value={2}>2</option><option value={3}>3</option>
        </select>
      </Field>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Items</label>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/40 font-bold">Item {i + 1}</span>
                <button onClick={() => removeItem(i)} className="text-white/20 hover:text-red-400 transition"><Trash2 className="w-3 h-3" /></button>
              </div>
              <input type="text" value={item.icon ?? ""} onChange={e => updateItem(i, "icon", e.target.value)} placeholder="Emoji icon" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
              <input type="text" value={item.title ?? ""} onChange={e => updateItem(i, "title", e.target.value)} placeholder="Feature title" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
              <textarea value={item.body ?? ""} onChange={e => updateItem(i, "body", e.target.value)} placeholder="Short description..." rows={2} className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none resize-none" />
            </div>
          ))}
          <button onClick={addItem} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-white/[0.12] hover:border-[#f5a623]/40 text-white/30 hover:text-white/60 text-xs font-semibold transition">
            <Plus className="w-3 h-3" /> Add Item
          </button>
        </div>
      </div>
    </div>
  );
}

function TextProps({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const set = sp(block, onChange);
  return (
    <div className="space-y-4">
      <Field label="Content">
        <textarea
          value={p(block, "content")}
          onChange={e => set("content", e.target.value)}
          placeholder="Write your text content here..."
          rows={10}
          className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition resize-none"
        />
      </Field>
    </div>
  );
}

function ImageProps({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const set = sp(block, onChange);
  const [aiLoading, setAiLoading] = useState(false);

  async function handleAiGenerate() {
    setAiLoading(true);
    try {
      const description = (p(block, "alt") as string) || (p(block, "caption") as string) || "professional business image";
      const res = await fetch("/api/himalaya/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "image_prompt", params: { niche: "business", description } }),
      });
      const data = await res.json();
      if (data.ok && data.result?.url) {
        set("src", data.result.url);
      }
    } catch (err) {
      console.error("AI image generation failed:", err);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Image URL">
        <div className="space-y-2">
          <TextInput value={p(block, "src")} onChange={v => set("src", v)} placeholder="https://..." />
          <button
            onClick={handleAiGenerate}
            disabled={aiLoading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-[#f5a623]/20 to-purple-500/20 border border-[#f5a623]/30 hover:border-[#f5a623]/60 text-[#f5a623] text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {aiLoading ? "Generating..." : "AI Generate"}
          </button>
        </div>
      </Field>
      <Field label="Alt Text"><TextInput value={p(block, "alt")} onChange={v => set("alt", v)} placeholder="Image description" /></Field>
      <Field label="Caption"><TextInput value={p(block, "caption")} onChange={v => set("caption", v)} placeholder="Optional caption..." /></Field>
      <div className="flex items-center gap-3">
        <input type="checkbox" id="rounded" checked={p(block, "rounded", true)} onChange={e => set("rounded", e.target.checked)} className="rounded" />
        <label htmlFor="rounded" className="text-sm text-white/60">Rounded corners</label>
      </div>
      <div className="flex items-center gap-3">
        <input type="checkbox" id="full" checked={p(block, "fullWidth", false)} onChange={e => set("fullWidth", e.target.checked)} className="rounded" />
        <label htmlFor="full" className="text-sm text-white/60">Full width</label>
      </div>
    </div>
  );
}

function CTAProps({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const set = sp(block, onChange);
  return (
    <div className="space-y-4">
      <Field label="Headline"><TextInput value={p(block, "headline")} onChange={v => set("headline", v)} placeholder="Ready to get started?" multiline /></Field>
      <Field label="Subheadline"><TextInput value={p(block, "subheadline")} onChange={v => set("subheadline", v)} placeholder="Supporting text..." multiline /></Field>
      <Field label="Button Text"><TextInput value={p(block, "buttonText")} onChange={v => set("buttonText", v)} placeholder="Get Started" /></Field>
      <Field label="Button URL"><TextInput value={p(block, "buttonUrl")} onChange={v => set("buttonUrl", v)} placeholder="https://..." /></Field>
    </div>
  );
}

function TestimonialsProps({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const set = sp(block, onChange);
  const items: { name?: string; role?: string; quote?: string; stars?: number }[] = p(block, "items", []);

  function updateItem(i: number, key: string, val: unknown) {
    const next = [...items];
    next[i] = { ...next[i], [key]: val };
    set("items", next);
  }
  function addItem() {
    set("items", [...items, { name: "Customer Name", role: "CEO, Company", quote: "This product changed everything.", stars: 5 }]);
  }

  return (
    <div className="space-y-4">
      <Field label="Section Title"><TextInput value={p(block, "title")} onChange={v => set("title", v)} placeholder="What customers say" /></Field>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Testimonials</label>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3 space-y-2">
              <div className="flex justify-between"><span className="text-xs text-white/40 font-bold">#{i + 1}</span><button onClick={() => set("items", items.filter((_, j) => j !== i))} className="text-white/20 hover:text-red-400 transition"><Trash2 className="w-3 h-3" /></button></div>
              <textarea value={item.quote ?? ""} onChange={e => updateItem(i, "quote", e.target.value)} placeholder="Quote..." rows={2} className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none resize-none" />
              <input type="text" value={item.name ?? ""} onChange={e => updateItem(i, "name", e.target.value)} placeholder="Name" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
              <input type="text" value={item.role ?? ""} onChange={e => updateItem(i, "role", e.target.value)} placeholder="Role, Company" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
              <select value={item.stars ?? 5} onChange={e => updateItem(i, "stars", Number(e.target.value))} className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white focus:outline-none">
                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} stars</option>)}
              </select>
            </div>
          ))}
          <button onClick={addItem} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-white/[0.12] hover:border-[#f5a623]/40 text-white/30 hover:text-white/60 text-xs font-semibold transition">
            <Plus className="w-3 h-3" /> Add Testimonial
          </button>
        </div>
      </div>
    </div>
  );
}

function PricingProps({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const set = sp(block, onChange);
  const tiers: { label?: string; price?: string; period?: string; features?: string[]; buttonText?: string; buttonUrl?: string; highlight?: boolean }[] = p(block, "tiers", []);

  function updateTier(i: number, key: string, val: unknown) {
    const next = [...tiers];
    next[i] = { ...next[i], [key]: val };
    set("tiers", next);
  }
  function addFeature(i: number) {
    const next = [...tiers];
    next[i] = { ...next[i], features: [...(next[i].features ?? []), "New feature"] };
    set("tiers", next);
  }

  return (
    <div className="space-y-4">
      <Field label="Section Title"><TextInput value={p(block, "title")} onChange={v => set("title", v)} placeholder="Simple Pricing" /></Field>
      <Field label="Subtitle"><TextInput value={p(block, "subtitle")} onChange={v => set("subtitle", v)} placeholder="No hidden fees." /></Field>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Tiers</label>
        <div className="space-y-3">
          {tiers.map((tier, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3 space-y-2">
              <div className="flex justify-between"><span className="text-xs text-white/40 font-bold">Tier {i + 1}</span><button onClick={() => set("tiers", tiers.filter((_, j) => j !== i))} className="text-white/20 hover:text-red-400 transition"><Trash2 className="w-3 h-3" /></button></div>
              <input type="text" value={tier.label ?? ""} onChange={e => updateTier(i, "label", e.target.value)} placeholder="Plan name" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={tier.price ?? ""} onChange={e => updateTier(i, "price", e.target.value)} placeholder="$49" className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
                <input type="text" value={tier.period ?? ""} onChange={e => updateTier(i, "period", e.target.value)} placeholder="/ month" className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
              </div>
              <div>
                {(tier.features ?? []).map((f, j) => (
                  <div key={j} className="flex gap-2 mb-1">
                    <input type="text" value={f} onChange={e => { const fs = [...(tier.features ?? [])]; fs[j] = e.target.value; updateTier(i, "features", fs); }} className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-sm text-white placeholder-white/20 focus:outline-none" />
                    <button onClick={() => updateTier(i, "features", (tier.features ?? []).filter((_, k) => k !== j))} className="text-white/20 hover:text-red-400 transition"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
                <button onClick={() => addFeature(i)} className="text-[11px] text-white/30 hover:text-[#f5a623] transition flex items-center gap-1 mt-1"><Plus className="w-3 h-3" /> Add Feature</button>
              </div>
              <input type="text" value={tier.buttonText ?? ""} onChange={e => updateTier(i, "buttonText", e.target.value)} placeholder="Get Started" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
              <div className="flex items-center gap-2">
                <input type="checkbox" id={`highlight-${i}`} checked={tier.highlight ?? false} onChange={e => updateTier(i, "highlight", e.target.checked)} />
                <label htmlFor={`highlight-${i}`} className="text-xs text-white/50">Highlighted (popular)</label>
              </div>
            </div>
          ))}
          <button onClick={() => set("tiers", [...tiers, { label: "Pro", price: "$49", period: "/ month", features: ["Feature 1"], buttonText: "Get Started" }])} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-white/[0.12] hover:border-[#f5a623]/40 text-white/30 hover:text-white/60 text-xs font-semibold transition">
            <Plus className="w-3 h-3" /> Add Tier
          </button>
        </div>
      </div>
    </div>
  );
}

function FAQProps({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const set = sp(block, onChange);
  const items: { q?: string; a?: string }[] = p(block, "items", []);

  return (
    <div className="space-y-4">
      <Field label="Section Title"><TextInput value={p(block, "title")} onChange={v => set("title", v)} placeholder="Frequently Asked Questions" /></Field>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Questions</label>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3 space-y-2">
              <div className="flex justify-between"><span className="text-xs text-white/40">Q{i + 1}</span><button onClick={() => set("items", items.filter((_, j) => j !== i))} className="text-white/20 hover:text-red-400 transition"><Trash2 className="w-3 h-3" /></button></div>
              <input type="text" value={item.q ?? ""} onChange={e => { const n = [...items]; n[i] = { ...n[i], q: e.target.value }; set("items", n); }} placeholder="Question..." className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
              <textarea value={item.a ?? ""} onChange={e => { const n = [...items]; n[i] = { ...n[i], a: e.target.value }; set("items", n); }} placeholder="Answer..." rows={2} className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none resize-none" />
            </div>
          ))}
          <button onClick={() => set("items", [...items, { q: "Question?", a: "Answer." }])} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-white/[0.12] hover:border-[#f5a623]/40 text-white/30 hover:text-white/60 text-xs font-semibold transition">
            <Plus className="w-3 h-3" /> Add Question
          </button>
        </div>
      </div>
    </div>
  );
}

function VideoProps({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const set = sp(block, onChange);
  return (
    <div className="space-y-4">
      <Field label="Title"><TextInput value={p(block, "title")} onChange={v => set("title", v)} placeholder="Optional section title" /></Field>
      <Field label="YouTube / Vimeo URL"><TextInput value={p(block, "url")} onChange={v => set("url", v)} placeholder="https://youtube.com/watch?v=..." /></Field>
    </div>
  );
}

function DividerProps({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const set = sp(block, onChange);
  return (
    <div className="space-y-4">
      <Field label="Height (px)">
        <input type="number" value={p(block, "height", 60)} onChange={e => set("height", Number(e.target.value))} className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none" />
      </Field>
      <div className="flex items-center gap-3">
        <input type="checkbox" id="showLine" checked={p(block, "showLine", false)} onChange={e => set("showLine", e.target.checked)} />
        <label htmlFor="showLine" className="text-sm text-white/60">Show divider line</label>
      </div>
    </div>
  );
}

function CheckoutProps({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const set = sp(block, onChange);
  return (
    <div className="space-y-4">
      <Field label="Title"><TextInput value={p(block, "title")} onChange={v => set("title", v)} placeholder="Secure Checkout" /></Field>
      <Field label="Subtitle"><TextInput value={p(block, "subtitle")} onChange={v => set("subtitle", v)} placeholder="Complete your secure order below" /></Field>
      <Field label="Button Text"><TextInput value={p(block, "buttonText")} onChange={v => set("buttonText", v)} placeholder="Complete Purchase" /></Field>
      <div className="flex items-center gap-3 pt-2">
        <input type="checkbox" id="orderBump" checked={p(block, "showOrderBump", false)} onChange={e => set("showOrderBump", e.target.checked)} />
        <label htmlFor="orderBump" className="text-sm text-white font-bold">Show Order Bump (1-Click Upsell)</label>
      </div>
      {p(block, "showOrderBump", false) && (
        <div className="pl-4 border-l-2 border-[#f5a623]/50 space-y-3">
          <Field label="Bump Headline"><TextInput value={p(block, "bumpHeadline")} onChange={v => set("bumpHeadline", v)} placeholder="Yes, add the VIP Bonus!" /></Field>
          <Field label="Bump Description"><TextInput value={p(block, "bumpText")} onChange={v => set("bumpText", v)} placeholder="Get it for $19 more..." multiline /></Field>
        </div>
      )}
    </div>
  );
}

function FooterProps({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const set = sp(block, onChange);
  const links: { label?: string; url?: string }[] = p(block, "links", []);

  return (
    <div className="space-y-4">
      <Field label="Copyright Text"><TextInput value={p(block, "copyright")} onChange={v => set("copyright", v)} placeholder={`© ${new Date().getFullYear()} All rights reserved.`} /></Field>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Links</label>
        <div className="space-y-2">
          {links.map((link, i) => (
            <div key={i} className="flex gap-2">
              <input type="text" value={link.label ?? ""} onChange={e => { const n = [...links]; n[i] = { ...n[i], label: e.target.value }; set("links", n); }} placeholder="Label" className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
              <input type="text" value={link.url ?? ""} onChange={e => { const n = [...links]; n[i] = { ...n[i], url: e.target.value }; set("links", n); }} placeholder="URL" className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
              <button onClick={() => set("links", links.filter((_, j) => j !== i))} className="text-white/20 hover:text-red-400 transition"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
          <button onClick={() => set("links", [...links, { label: "Privacy", url: "#" }])} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-white/[0.12] hover:border-[#f5a623]/40 text-white/30 hover:text-white/60 text-xs font-semibold transition">
            <Plus className="w-3 h-3" /> Add Link
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <input type="checkbox" id="poweredBy" checked={p(block, "showPoweredBy", true)} onChange={e => set("showPoweredBy", e.target.checked)} />
        <label htmlFor="poweredBy" className="text-sm text-white/60">Show &ldquo;Built with Himalaya&rdquo;</label>
      </div>
    </div>
  );
}

function GenericProps() {
  return <p className="text-sm text-white/30">Select a block to edit its properties.</p>;
}

const BLOCK_LABELS: Record<BlockType, string> = {
  hero: "Hero Section",
  features: "Features Grid",
  text: "Text Block",
  image: "Image",
  cta: "Call to Action",
  testimonials: "Testimonials",
  pricing: "Pricing Table",
  faq: "FAQ",
  form: "Opt-in Form",
  video: "Video Embed",
  products: "Product Grid",
  checkout: "Checkout Form",
  payment: "Payment Link",
  booking: "Booking Calendar",
  divider: "Divider / Spacer",
  footer: "Footer",
  stats: "Stats Bar",
  guarantee: "Guarantee Block",
  trust_badges: "Trust Badges",
  process: "Process Steps",
  before_after: "Before / After",
  urgency: "Urgency Bar",
};

export default function BlockPropsEditor({ block, onChange, onDelete }: Props) {
  const label = BLOCK_LABELS[block.type] ?? block.type;

  function renderEditor() {
    switch (block.type) {
      case "hero": return <HeroProps block={block} onChange={onChange} />;
      case "features": return <FeaturesProps block={block} onChange={onChange} />;
      case "text": return <TextProps block={block} onChange={onChange} />;
      case "image": return <ImageProps block={block} onChange={onChange} />;
      case "cta": return <CTAProps block={block} onChange={onChange} />;
      case "testimonials": return <TestimonialsProps block={block} onChange={onChange} />;
      case "pricing": return <PricingProps block={block} onChange={onChange} />;
      case "faq": return <FAQProps block={block} onChange={onChange} />;
      case "video": return <VideoProps block={block} onChange={onChange} />;
      case "divider": return <DividerProps block={block} onChange={onChange} />;
      case "checkout": return <CheckoutProps block={block} onChange={onChange} />;
      case "footer": return <FooterProps block={block} onChange={onChange} />;
      default: return <GenericProps />;
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between shrink-0">
        <div>
          <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Edit Block</p>
          <h3 className="text-sm font-black text-white mt-0.5">{label}</h3>
        </div>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition" title="Delete block">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {renderEditor()}
      </div>
    </div>
  );
}

export { GripVertical };
