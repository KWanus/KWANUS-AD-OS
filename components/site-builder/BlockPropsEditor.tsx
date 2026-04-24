"use client";

import { useState } from "react";
import { Block, BlockType } from "./BlockRenderer";
import { Trash2, Plus, GripVertical, Sparkles, Loader2 } from "lucide-react";

interface Props {
  block: Block;
  onChange: (updated: Block) => void;
  onDelete: () => void;
  siteId?: string;
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
  const cls = "w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition";
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

function ImageFieldWithAI({ value, onChange, siteId, blockType, label }: { value: string; onChange: (v: string) => void; siteId?: string; blockType?: string; label?: string }) {
  const [generating, setGenerating] = useState(false);

  async function generateImage() {
    if (!siteId || generating) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockType: blockType ?? "hero" }),
      });
      const data = await res.json();
      if (data.ok && data.url) onChange(data.url);
    } catch { /* silent */ }
    setGenerating(false);
  }

  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">{label ?? "Image URL"}</label>
      <div className="flex gap-2">
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder="https://..."
          className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition" />
        {siteId && (
          <button type="button" onClick={generateImage} disabled={generating}
            className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-200 text-xs font-bold hover:bg-purple-500/20 transition disabled:opacity-50"
            title="Generate with AI">
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            AI
          </button>
        )}
      </div>
    </div>
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
          <button onClick={addItem} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-white/[0.12] hover:border-cyan-500/40 text-white/30 hover:text-white/60 text-xs font-semibold transition">
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
          className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition resize-none"
        />
      </Field>
    </div>
  );
}

function ImageProps({ block, onChange, siteId }: { block: Block; onChange: (b: Block) => void; siteId?: string }) {
  const set = sp(block, onChange);
  return (
    <div className="space-y-4">
      <ImageFieldWithAI value={p(block, "src")} onChange={v => set("src", v)} siteId={siteId} blockType="image" label="Image URL" />
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
          <button onClick={addItem} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-white/[0.12] hover:border-cyan-500/40 text-white/30 hover:text-white/60 text-xs font-semibold transition">
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
                <button onClick={() => addFeature(i)} className="text-[11px] text-white/30 hover:text-cyan-400 transition flex items-center gap-1 mt-1"><Plus className="w-3 h-3" /> Add Feature</button>
              </div>
              <input type="text" value={tier.buttonText ?? ""} onChange={e => updateTier(i, "buttonText", e.target.value)} placeholder="Get Started" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
              <div className="flex items-center gap-2">
                <input type="checkbox" id={`highlight-${i}`} checked={tier.highlight ?? false} onChange={e => updateTier(i, "highlight", e.target.checked)} />
                <label htmlFor={`highlight-${i}`} className="text-xs text-white/50">Highlighted (popular)</label>
              </div>
            </div>
          ))}
          <button onClick={() => set("tiers", [...tiers, { label: "Pro", price: "$49", period: "/ month", features: ["Feature 1"], buttonText: "Get Started" }])} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-white/[0.12] hover:border-cyan-500/40 text-white/30 hover:text-white/60 text-xs font-semibold transition">
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
          <button onClick={() => set("items", [...items, { q: "Question?", a: "Answer." }])} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-white/[0.12] hover:border-cyan-500/40 text-white/30 hover:text-white/60 text-xs font-semibold transition">
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
        <div className="pl-4 border-l-2 border-cyan-500/50 space-y-3">
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
          <button onClick={() => set("links", [...links, { label: "Privacy", url: "#" }])} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-white/[0.12] hover:border-cyan-500/40 text-white/30 hover:text-white/60 text-xs font-semibold transition">
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

function StatsProps({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const set = sp(block, onChange);
  const items: { value?: string; label?: string; suffix?: string }[] = p(block, "items", []);

  function updateItem(i: number, key: string, val: string) {
    const next = [...items]; next[i] = { ...next[i], [key]: val }; set("items", next);
  }

  return (
    <div className="space-y-4">
      <Field label="Section Title"><TextInput value={p(block, "title")} onChange={v => set("title", v)} placeholder="Our Results" /></Field>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Stats</label>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3 space-y-2">
              <div className="flex justify-between"><span className="text-xs text-white/40">Stat {i + 1}</span><button onClick={() => set("items", items.filter((_, j) => j !== i))} className="text-white/20 hover:text-red-400 transition"><Trash2 className="w-3 h-3" /></button></div>
              <input type="text" value={item.value ?? ""} onChange={e => updateItem(i, "value", e.target.value)} placeholder="500+" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
              <input type="text" value={item.label ?? ""} onChange={e => updateItem(i, "label", e.target.value)} placeholder="Clients Served" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
              <input type="text" value={item.suffix ?? ""} onChange={e => updateItem(i, "suffix", e.target.value)} placeholder="Suffix (optional, e.g. %)" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
            </div>
          ))}
          <button onClick={() => set("items", [...items, { value: "100+", label: "Happy Clients" }])} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-white/[0.12] hover:border-cyan-500/40 text-white/30 hover:text-white/60 text-xs font-semibold transition"><Plus className="w-3 h-3" /> Add Stat</button>
        </div>
      </div>
    </div>
  );
}

function GuaranteeProps({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const set = sp(block, onChange);
  return (
    <div className="space-y-4">
      <Field label="Title"><TextInput value={p(block, "title")} onChange={v => set("title", v)} placeholder="100% Money-Back Guarantee" /></Field>
      <Field label="Body"><TextInput value={p(block, "body")} onChange={v => set("body", v)} placeholder="If you're not satisfied..." multiline /></Field>
      <Field label="Badge Text"><TextInput value={p(block, "badgeText")} onChange={v => set("badgeText", v)} placeholder="30-Day Guarantee" /></Field>
      <Field label="Icon Emoji"><TextInput value={p(block, "icon")} onChange={v => set("icon", v)} placeholder="🛡️" /></Field>
    </div>
  );
}

function TrustBadgesProps({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const set = sp(block, onChange);
  const items: { icon?: string; label?: string }[] = p(block, "items", []);

  function updateItem(i: number, key: string, val: string) {
    const next = [...items]; next[i] = { ...next[i], [key]: val }; set("items", next);
  }

  return (
    <div className="space-y-4">
      <Field label="Title"><TextInput value={p(block, "title")} onChange={v => set("title", v)} placeholder="Trusted By Thousands" /></Field>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Badges</label>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="text" value={item.icon ?? ""} onChange={e => updateItem(i, "icon", e.target.value)} placeholder="🔒" className="w-12 bg-white/[0.05] border border-white/[0.1] rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none" />
              <input type="text" value={item.label ?? ""} onChange={e => updateItem(i, "label", e.target.value)} placeholder="SSL Secure" className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
              <button onClick={() => set("items", items.filter((_, j) => j !== i))} className="text-white/20 hover:text-red-400 transition"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
          <button onClick={() => set("items", [...items, { icon: "✓", label: "Verified" }])} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-white/[0.12] hover:border-cyan-500/40 text-white/30 hover:text-white/60 text-xs font-semibold transition"><Plus className="w-3 h-3" /> Add Badge</button>
        </div>
      </div>
    </div>
  );
}

function ProcessProps({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const set = sp(block, onChange);
  const steps: { icon?: string; title?: string; body?: string }[] = p(block, "steps", []);

  function updateStep(i: number, key: string, val: string) {
    const next = [...steps]; next[i] = { ...next[i], [key]: val }; set("steps", next);
  }

  return (
    <div className="space-y-4">
      <Field label="Section Title"><TextInput value={p(block, "title")} onChange={v => set("title", v)} placeholder="How It Works" /></Field>
      <Field label="Subtitle"><TextInput value={p(block, "subtitle")} onChange={v => set("subtitle", v)} placeholder="3 simple steps..." /></Field>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Steps</label>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3 space-y-2">
              <div className="flex justify-between"><span className="text-xs text-white/40 font-bold">Step {i + 1}</span><button onClick={() => set("steps", steps.filter((_, j) => j !== i))} className="text-white/20 hover:text-red-400 transition"><Trash2 className="w-3 h-3" /></button></div>
              <input type="text" value={step.icon ?? ""} onChange={e => updateStep(i, "icon", e.target.value)} placeholder="Emoji" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
              <input type="text" value={step.title ?? ""} onChange={e => updateStep(i, "title", e.target.value)} placeholder="Step title" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
              <textarea value={step.body ?? ""} onChange={e => updateStep(i, "body", e.target.value)} placeholder="Description..." rows={2} className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none resize-none" />
            </div>
          ))}
          <button onClick={() => set("steps", [...steps, { icon: "📋", title: "New Step", body: "Description" }])} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-white/[0.12] hover:border-cyan-500/40 text-white/30 hover:text-white/60 text-xs font-semibold transition"><Plus className="w-3 h-3" /> Add Step</button>
        </div>
      </div>
    </div>
  );
}

function BeforeAfterProps({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const set = sp(block, onChange);
  const beforeItems: string[] = p(block, "beforeItems", []);
  const afterItems: string[] = p(block, "afterItems", []);

  return (
    <div className="space-y-4">
      <Field label="Section Title"><TextInput value={p(block, "title")} onChange={v => set("title", v)} placeholder="The Transformation" /></Field>
      <Field label="Before Label"><TextInput value={p(block, "beforeLabel")} onChange={v => set("beforeLabel", v)} placeholder="Before" /></Field>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Before Items</label>
        <div className="space-y-2">
          {beforeItems.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input type="text" value={item} onChange={e => { const n = [...beforeItems]; n[i] = e.target.value; set("beforeItems", n); }} placeholder="Pain point..." className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
              <button onClick={() => set("beforeItems", beforeItems.filter((_, j) => j !== i))} className="text-white/20 hover:text-red-400 transition"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
          <button onClick={() => set("beforeItems", [...beforeItems, ""])} className="text-[11px] text-white/30 hover:text-cyan-400 transition flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
        </div>
      </div>
      <Field label="After Label"><TextInput value={p(block, "afterLabel")} onChange={v => set("afterLabel", v)} placeholder="After" /></Field>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">After Items</label>
        <div className="space-y-2">
          {afterItems.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input type="text" value={item} onChange={e => { const n = [...afterItems]; n[i] = e.target.value; set("afterItems", n); }} placeholder="Result..." className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
              <button onClick={() => set("afterItems", afterItems.filter((_, j) => j !== i))} className="text-white/20 hover:text-red-400 transition"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
          <button onClick={() => set("afterItems", [...afterItems, ""])} className="text-[11px] text-white/30 hover:text-cyan-400 transition flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
        </div>
      </div>
    </div>
  );
}

function UrgencyProps({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const set = sp(block, onChange);
  return (
    <div className="space-y-4">
      <Field label="Main Text"><TextInput value={p(block, "text")} onChange={v => set("text", v)} placeholder="⚡ Limited spots available" /></Field>
      <Field label="Subtext"><TextInput value={p(block, "subtext")} onChange={v => set("subtext", v)} placeholder="Offer expires in 24 hours" /></Field>
      <Field label="Button Text"><TextInput value={p(block, "buttonText")} onChange={v => set("buttonText", v)} placeholder="Claim Your Spot" /></Field>
      <Field label="Button URL"><TextInput value={p(block, "buttonUrl")} onChange={v => set("buttonUrl", v)} placeholder="https://..." /></Field>
      <Field label="Background Color"><TextInput value={p(block, "bgColor")} onChange={v => set("bgColor", v)} placeholder="#dc2626" /></Field>
    </div>
  );
}

function FormProps({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const set = sp(block, onChange);
  const fields: { name?: string; type?: string; placeholder?: string; required?: boolean }[] = p(block, "fields", []);

  function updateField(i: number, key: string, val: unknown) {
    const next = [...fields]; next[i] = { ...next[i], [key]: val }; set("fields", next);
  }

  return (
    <div className="space-y-4">
      <Field label="Title"><TextInput value={p(block, "title")} onChange={v => set("title", v)} placeholder="Get Started Free" /></Field>
      <Field label="Subtitle"><TextInput value={p(block, "subtitle")} onChange={v => set("subtitle", v)} placeholder="Enter your details below" /></Field>
      <Field label="Button Text"><TextInput value={p(block, "buttonText")} onChange={v => set("buttonText", v)} placeholder="Submit" /></Field>
      <Field label="Privacy Text"><TextInput value={p(block, "privacyText")} onChange={v => set("privacyText", v)} placeholder="We'll never spam you." /></Field>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Form Fields</label>
        <div className="space-y-3">
          {fields.map((field, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3 space-y-2">
              <div className="flex justify-between"><span className="text-xs text-white/40">Field {i + 1}</span><button onClick={() => set("fields", fields.filter((_, j) => j !== i))} className="text-white/20 hover:text-red-400 transition"><Trash2 className="w-3 h-3" /></button></div>
              <input type="text" value={field.name ?? ""} onChange={e => updateField(i, "name", e.target.value)} placeholder="Field name (e.g. email)" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
              <select value={field.type ?? "text"} onChange={e => updateField(i, "type", e.target.value)} className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white focus:outline-none">
                <option value="text">Text</option><option value="email">Email</option><option value="tel">Phone</option><option value="textarea">Textarea</option>
              </select>
              <input type="text" value={field.placeholder ?? ""} onChange={e => updateField(i, "placeholder", e.target.value)} placeholder="Placeholder text" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={field.required ?? false} onChange={e => updateField(i, "required", e.target.checked)} />
                <label className="text-xs text-white/50">Required</label>
              </div>
            </div>
          ))}
          <button onClick={() => set("fields", [...fields, { name: "email", type: "email", placeholder: "Your email", required: true }])} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-white/[0.12] hover:border-cyan-500/40 text-white/30 hover:text-white/60 text-xs font-semibold transition"><Plus className="w-3 h-3" /> Add Field</button>
        </div>
      </div>
    </div>
  );
}

function ProductsProps({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const set = sp(block, onChange);
  return (
    <div className="space-y-4">
      <Field label="Section Title"><TextInput value={p(block, "title")} onChange={v => set("title", v)} placeholder="Our Products" /></Field>
      <Field label="Subtitle"><TextInput value={p(block, "subtitle")} onChange={v => set("subtitle", v)} placeholder="Browse our collection" /></Field>
      <Field label="Columns">
        <select value={p(block, "columns", 3)} onChange={e => set("columns", Number(e.target.value))} className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
          <option value={2}>2</option><option value={3}>3</option><option value={4}>4</option>
        </select>
      </Field>
      <Field label="Button Text"><TextInput value={p(block, "buttonText")} onChange={v => set("buttonText", v)} placeholder="Shop Now" /></Field>
      <Field label="Button URL"><TextInput value={p(block, "buttonUrl")} onChange={v => set("buttonUrl", v)} placeholder="https://..." /></Field>
      <p className="text-xs text-white/30">Products are pulled from your store automatically.</p>
    </div>
  );
}

function VideoHeroProps({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const set = sp(block, onChange);
  return (
    <div className="space-y-4">
      <Field label="Social Proof"><TextInput value={p(block, "socialProofText")} onChange={v => set("socialProofText", v)} placeholder="Over 10,000 students enrolled" /></Field>
      <Field label="Eyebrow"><TextInput value={p(block, "eyebrow")} onChange={v => set("eyebrow", v)} placeholder="Optional label" /></Field>
      <Field label="Headline"><TextInput value={p(block, "headline")} onChange={v => set("headline", v)} placeholder="See How It Works" multiline /></Field>
      <Field label="Subheadline"><TextInput value={p(block, "subheadline")} onChange={v => set("subheadline", v)} placeholder="Supporting text..." multiline /></Field>
      <Field label="Video URL"><TextInput value={p(block, "videoUrl")} onChange={v => set("videoUrl", v)} placeholder="https://youtube.com/watch?v=..." /></Field>
      <Field label="Layout">
        <select value={p(block, "layout", "side")} onChange={e => set("layout", e.target.value)}
          className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
          <option value="side">Side by Side</option>
          <option value="stacked">Stacked</option>
        </select>
      </Field>
      <Field label="Button Text"><TextInput value={p(block, "buttonText")} onChange={v => set("buttonText", v)} placeholder="Join Free" /></Field>
      <Field label="Button URL"><TextInput value={p(block, "buttonUrl")} onChange={v => set("buttonUrl", v)} placeholder="https://..." /></Field>
      <Field label="Background Color"><TextInput value={p(block, "bgColor")} onChange={v => set("bgColor", v)} placeholder="Auto (gradient)" /></Field>
    </div>
  );
}

function CountdownProps({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const set = sp(block, onChange);
  const targetDate = p(block, "targetDate", "");
  const localDate = targetDate ? new Date(targetDate as string).toISOString().slice(0, 16) : "";

  return (
    <div className="space-y-4">
      <Field label="Eyebrow"><TextInput value={p(block, "eyebrow")} onChange={v => set("eyebrow", v)} placeholder="Doors closing soon" /></Field>
      <Field label="Headline"><TextInput value={p(block, "headline")} onChange={v => set("headline", v)} placeholder="Don't Miss Your Chance" multiline /></Field>
      <Field label="Subheadline"><TextInput value={p(block, "subheadline")} onChange={v => set("subheadline", v)} placeholder="This offer expires..." multiline /></Field>
      <Field label="Target Date & Time">
        <input type="datetime-local" value={localDate} onChange={e => set("targetDate", new Date(e.target.value).toISOString())}
          className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition" />
      </Field>
      <Field label="Button Text"><TextInput value={p(block, "buttonText")} onChange={v => set("buttonText", v)} placeholder="Claim Your Spot →" /></Field>
      <Field label="Button URL"><TextInput value={p(block, "buttonUrl")} onChange={v => set("buttonUrl", v)} placeholder="https://..." /></Field>
      <Field label="Compact Mode">
        <label className="flex items-center gap-2 text-sm text-white/50 cursor-pointer">
          <input type="checkbox" checked={p(block, "compact", false)} onChange={e => set("compact", e.target.checked)} className="rounded" />
          Compact (smaller, fits as a bar)
        </label>
      </Field>
      <Field label="Background Color"><TextInput value={p(block, "bgColor")} onChange={v => set("bgColor", v)} placeholder="Auto (gradient)" /></Field>
    </div>
  );
}

function GenericProps() {
  return <p className="text-sm text-white/30">Select a block to edit its properties.</p>;
}

const BLOCK_LABELS: Record<BlockType, string> = {
  hero: "Hero Section",
  video_hero: "Video Hero",
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
  divider: "Divider / Spacer",
  footer: "Footer",
  stats: "Stats Bar",
  guarantee: "Guarantee Block",
  trust_badges: "Trust Badges",
  process: "Process Steps",
  before_after: "Before / After",
  urgency: "Urgency Bar",
  countdown: "Countdown Timer",
};

export default function BlockPropsEditor({ block, onChange, onDelete, siteId }: Props) {
  const label = BLOCK_LABELS[block.type] ?? block.type;

  function renderEditor() {
    switch (block.type) {
      case "hero": return <HeroProps block={block} onChange={onChange} />;
      case "video_hero": return <VideoHeroProps block={block} onChange={onChange} />;
      case "countdown": return <CountdownProps block={block} onChange={onChange} />;
      case "features": return <FeaturesProps block={block} onChange={onChange} />;
      case "text": return <TextProps block={block} onChange={onChange} />;
      case "image": return <ImageProps block={block} onChange={onChange} siteId={siteId} />;
      case "cta": return <CTAProps block={block} onChange={onChange} />;
      case "testimonials": return <TestimonialsProps block={block} onChange={onChange} />;
      case "pricing": return <PricingProps block={block} onChange={onChange} />;
      case "faq": return <FAQProps block={block} onChange={onChange} />;
      case "video": return <VideoProps block={block} onChange={onChange} />;
      case "divider": return <DividerProps block={block} onChange={onChange} />;
      case "checkout": return <CheckoutProps block={block} onChange={onChange} />;
      case "footer": return <FooterProps block={block} onChange={onChange} />;
      case "stats": return <StatsProps block={block} onChange={onChange} />;
      case "guarantee": return <GuaranteeProps block={block} onChange={onChange} />;
      case "trust_badges": return <TrustBadgesProps block={block} onChange={onChange} />;
      case "process": return <ProcessProps block={block} onChange={onChange} />;
      case "before_after": return <BeforeAfterProps block={block} onChange={onChange} />;
      case "urgency": return <UrgencyProps block={block} onChange={onChange} />;
      case "form": return <FormProps block={block} onChange={onChange} />;
      case "products": return <ProductsProps block={block} onChange={onChange} />;
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
