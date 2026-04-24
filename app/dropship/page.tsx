"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import AppNav from "@/components/AppNav";
import { toast } from "sonner";
import {
  Plus, X, Copy, ChevronRight, Loader2, CheckCircle2,
  AlertTriangle, TrendingUp, ShoppingCart, Package,
  BarChart2, Zap, Mail, Megaphone, Globe, FileText,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductStatus = "researching" | "testing" | "winning" | "scaling" | "dead";
type ExecutionTier = "core" | "elite";

interface ScoreBreakdown {
  demand: number;
  competition: number;
  trend: number;
  margin: number;
}

interface DropshipProduct {
  id: string;
  name: string;
  niche: string;
  status: ProductStatus;
  supplierUrl?: string;
  supplierPrice?: number;
  shippingCost?: number;
  suggestedRetail?: number;
  winnerScore?: number;
  scoreBreakdown?: ScoreBreakdown;
  analysis?: {
    verdict: "winner" | "testing" | "pass";
    pricingBreakdown?: object;
    riskFactors?: string[];
    summary?: string;
  };
  storeContent?: object;
  adCreatives?: object;
  emailFlows?: object;
}

interface ResearchProduct {
  name: string;
  estimatedPriceRange: string;
  marginPercent: number;
  winnerScore: number;
  bestSupplierPlatform: string;
  topAngle: string;
}

interface ResearchResult {
  marketAnalysis: string;
  products: ResearchProduct[];
  trendingNow: string[];
  avoidList: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<ProductStatus, string> = {
  researching: "text-white/40 bg-white/[0.03] border-white/10",
  testing:     "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  winning:     "text-green-400 bg-green-500/10 border-green-500/30",
  scaling:     "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  dead:        "text-red-400 bg-red-500/10 border-red-500/30",
};

const STATUS_FILTERS = ["All", "Testing", "Winning", "Scaling"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const VERDICT_BADGE = {
  winner:  "text-green-400 bg-green-500/10 border-green-500/30",
  testing: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  pass:    "text-red-400 bg-red-500/10 border-red-500/30",
};

const TABS = ["Products", "Research", "Profit Calculator", "Generate Assets"] as const;
type Tab = typeof TABS[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Spinner() {
  return <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { void navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/30 hover:text-cyan-400 transition"
    >
      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CopyBlock({ label, content }: { label: string; content: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{label}</span>
        <CopyButton text={content} />
      </div>
      <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">{content}</p>
    </div>
  );
}

function ExecutionTierPicker({
  value,
  onChange,
}: {
  value: ExecutionTier;
  onChange: (tier: ExecutionTier) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[
        {
          id: "core" as const,
          label: "Core",
          description: "Strong launch-ready ecom output with practical testing and asset logic.",
        },
        {
          id: "elite" as const,
          label: "Elite",
          description: "Sharper operator-grade product judgment, stronger creative angles, and better monetization structure.",
        },
      ].map((tier) => {
        const active = value === tier.id;
        return (
          <button
            key={tier.id}
            type="button"
            onClick={() => onChange(tier.id)}
            className={`rounded-2xl border p-4 text-left transition-all ${
              active
                ? "border-cyan-500/40 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.12)]"
                : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className={`text-sm font-black ${active ? "text-cyan-300" : "text-white"}`}>{tier.label}</span>
              <span className={`text-[10px] font-black uppercase tracking-[0.24em] ${active ? "text-cyan-300" : "text-white/20"}`}>
                {tier.id}
              </span>
            </div>
            <p className={`mt-2 text-xs leading-relaxed ${active ? "text-cyan-100/80" : "text-white/45"}`}>
              {tier.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const color = score >= 70 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";

  return (
    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
      <svg width="48" height="48" className="-rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <circle
          cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span className="absolute text-[11px] font-black" style={{ color }}>{score}</span>
    </div>
  );
}

// ─── Score Pills ──────────────────────────────────────────────────────────────

function ScorePills({ breakdown }: { breakdown: ScoreBreakdown }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {(["demand", "competition", "trend", "margin"] as (keyof ScoreBreakdown)[]).map((k) => {
        const v = breakdown[k];
        const color = v >= 70 ? "text-green-400 bg-green-500/10 border-green-500/20"
          : v >= 50 ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
          : "text-red-400 bg-red-500/10 border-red-500/20";
        return (
          <span key={k} className={`text-[10px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider ${color}`}>
            {k} {v}
          </span>
        );
      })}
    </div>
  );
}

// ─── Product Detail Panel ─────────────────────────────────────────────────────

function ProductDetailPanel({
  product,
  onClose,
  onRefresh,
}: {
  product: DropshipProduct;
  onClose: () => void;
  onRefresh: (id: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<{ type: string; data: unknown } | null>(null);
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");

  async function callAction(action: string, endpoint: string) {
    setLoading(action);
    setResult(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, executionTier }),
      });
      const payload = (await res.json()) as {
        analysis?: unknown;
        storeContent?: unknown;
        ads?: unknown;
        emails?: unknown;
      };
      const data =
        action === "analyze" ? payload.analysis :
        action === "content" ? payload.storeContent :
        action === "ads" ? payload.ads :
        action === "emails" ? payload.emails :
        payload;
      setResult({ type: action, data });
      await onRefresh(product.id);
      toast.success(`${action} complete`);
    } catch {
      toast.error(`Failed: ${action}`);
    } finally {
      setLoading(null);
    }
  }

  const profitPerUnit =
    product.supplierPrice != null && product.shippingCost != null && product.suggestedRetail != null
      ? product.suggestedRetail - product.supplierPrice - product.shippingCost
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg h-full bg-[#020509] border-l border-white/[0.07] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#020509]/90 backdrop-blur-xl border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {product.winnerScore != null && <ScoreRing score={product.winnerScore} />}
            <h2 className="text-sm font-black text-white truncate">{product.name}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Pricing */}
          {(product.supplierPrice != null || product.suggestedRetail != null) && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Supplier Cost", value: product.supplierPrice != null ? `$${product.supplierPrice.toFixed(2)}` : "—" },
                { label: "Suggested Retail", value: product.suggestedRetail != null ? `$${product.suggestedRetail.toFixed(2)}` : "—" },
                { label: "Profit / Unit", value: profitPerUnit != null ? `$${profitPerUnit.toFixed(2)}` : "—", highlight: true },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-white/[0.02] border border-white/[0.06] px-3 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">{m.label}</p>
                  <p className={`text-sm font-black ${m.highlight ? "text-cyan-400" : "text-white"}`}>{m.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Score Breakdown */}
          {product.scoreBreakdown && (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Score Breakdown</p>
              <ScorePills breakdown={product.scoreBreakdown} />
            </div>
          )}

          {/* Analysis */}
          {product.analysis && (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Verdict</span>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-black uppercase tracking-wider ${VERDICT_BADGE[product.analysis.verdict]}`}>
                  {product.analysis.verdict}
                </span>
              </div>
              {product.analysis.summary && (
                <p className="text-sm text-white/60 leading-relaxed">{product.analysis.summary}</p>
              )}
              {(product.analysis.riskFactors?.length ?? 0) > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Risk Factors</p>
                  <ul className="space-y-1">
                    {product.analysis.riskFactors!.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-red-400/70">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Actions</p>
            <ExecutionTierPicker value={executionTier} onChange={setExecutionTier} />
            {[
              { key: "analyze",  label: "Full Analysis",   icon: BarChart2,  endpoint: "/api/dropship/products/analyze" },
              { key: "content",  label: "Store Content",   icon: FileText,   endpoint: "/api/dropship/products/store-content" },
              { key: "ads",      label: "Generate Ads",    icon: Megaphone,  endpoint: "/api/dropship/products/ads/generate" },
              { key: "emails",   label: "Email Flows",     icon: Mail,       endpoint: "/api/dropship/products/emails/generate" },
            ].map(({ key, label, icon: Icon, endpoint }) => (
              <button
                key={key}
                disabled={loading !== null}
                onClick={() => void callAction(key, endpoint)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.06] hover:border-cyan-500/20 text-sm font-bold text-white/70 hover:text-white transition disabled:opacity-40"
              >
                {loading === key ? <Spinner /> : <Icon className="w-4 h-4 text-cyan-400/60" />}
                {label}
                <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/20" />
              </button>
            ))}
          </div>

          {/* Inline Result */}
          {result && (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{result.type} result</span>
                <CopyButton text={JSON.stringify(result.data, null, 2)} />
              </div>
              <pre className="text-xs text-white/50 whitespace-pre-wrap overflow-x-auto max-h-64 scrollbar-none">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Products ────────────────────────────────────────────────────────────

function ProductsTab() {
  const [products, setProducts] = useState<DropshipProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("All");
  const [selected, setSelected] = useState<DropshipProduct | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "", niche: "", supplierUrl: "",
    supplierPrice: "", shippingCost: "",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dropship/products");
      const data = (await res.json()) as { ok: boolean; products?: DropshipProduct[] };
      if (data.ok && data.products) setProducts(data.products);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const refreshProduct = useCallback(async (id: string) => {
    const res = await fetch(`/api/dropship/products/${id}`);
    const data = (await res.json()) as { ok: boolean; product?: DropshipProduct };
    if (data.ok && data.product) {
      setProducts((prev) => prev.map((p) => (p.id === id ? data.product! : p)));
      setSelected(data.product ?? null);
    }
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/dropship/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          supplierPrice: form.supplierPrice ? Number(form.supplierPrice) : undefined,
          shippingCost: form.shippingCost ? Number(form.shippingCost) : undefined,
        }),
      });
      const data = (await res.json()) as { ok: boolean; product?: DropshipProduct };
      if (data.ok && data.product) {
        setProducts((prev) => [data.product!, ...prev]);
        setShowAdd(false);
        setForm({ name: "", niche: "", supplierUrl: "", supplierPrice: "", shippingCost: "" });
        toast.success("Product added");
      }
    } catch {
      toast.error("Failed to add product");
    } finally {
      setSaving(false);
    }
  }

  const filtered = products.filter((p) =>
    filter === "All" ? true : p.status === filter.toLowerCase()
  );

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-6 h-6 animate-spin text-cyan-400/50" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        {/* Filter */}
        <div className="flex gap-1">
          {STATUS_FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filter === f
                  ? "bg-white/[0.08] text-white border border-white/[0.1]"
                  : "text-white/30 hover:text-white/60"
              }`}>
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-black px-4 py-2 rounded-xl hover:scale-[1.02] transition-all">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={(e) => void handleAdd(e)}
          className="mb-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-1">Product Name *</label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Posture Corrector X9"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/40" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-1">Niche</label>
            <input value={form.niche} onChange={(e) => setForm((f) => ({ ...f, niche: e.target.value }))}
              placeholder="Health & Wellness"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/40" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-1">Supplier URL</label>
            <input value={form.supplierUrl} onChange={(e) => setForm((f) => ({ ...f, supplierUrl: e.target.value }))}
              placeholder="https://aliexpress.com/..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/40" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-1">Supplier Price ($)</label>
            <input type="number" step="0.01" value={form.supplierPrice} onChange={(e) => setForm((f) => ({ ...f, supplierPrice: e.target.value }))}
              placeholder="8.50"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/40" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-1">Shipping Cost ($)</label>
            <input type="number" step="0.01" value={form.shippingCost} onChange={(e) => setForm((f) => ({ ...f, shippingCost: e.target.value }))}
              placeholder="3.00"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/40" />
          </div>
          <div className="col-span-2 flex gap-2 justify-end">
            <button type="button" onClick={() => setShowAdd(false)}
              className="bg-white/[0.05] border border-white/[0.08] text-white/60 hover:text-white text-sm px-4 py-2 rounded-xl transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-black px-4 py-2 rounded-xl disabled:opacity-50">
              {saving ? <Spinner /> : null} Save Product
            </button>
          </div>
        </form>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-20 text-white/20 text-sm">
          {products.length === 0 ? "No products yet — add your first one above." : `No products with status "${filter}"`}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((p) => (
          <div key={p.id}
            onClick={() => setSelected(p)}
            className="group rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 cursor-pointer hover:bg-white/[0.04] hover:border-white/[0.1] transition-all flex items-center gap-4">
            {p.winnerScore != null && <ScoreRing score={p.winnerScore} />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {p.niche && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-white/40 font-bold">{p.niche}</span>
                )}
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider ${STATUS_STYLE[p.status]}`}>
                  {p.status}
                </span>
                {p.analysis && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider ${VERDICT_BADGE[p.analysis.verdict]}`}>
                    {p.analysis.verdict}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition truncate">{p.name}</h3>
              <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                {p.supplierPrice != null && (
                  <span className="text-xs text-white/30">${p.supplierPrice.toFixed(2)} cost</span>
                )}
                {p.suggestedRetail != null && (
                  <>
                    <span className="text-white/10">→</span>
                    <span className="text-xs text-white/30">${p.suggestedRetail.toFixed(2)} retail</span>
                  </>
                )}
                {p.supplierPrice != null && p.shippingCost != null && p.suggestedRetail != null && (
                  <span className="text-xs font-bold text-cyan-400/70">
                    ${(p.suggestedRetail - p.supplierPrice - p.shippingCost).toFixed(2)} profit
                  </span>
                )}
              </div>
              {p.scoreBreakdown && <div className="mt-2"><ScorePills breakdown={p.scoreBreakdown} /></div>}
            </div>
            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-cyan-400 transition shrink-0" />
          </div>
        ))}
      </div>

      {selected && (
        <ProductDetailPanel
          product={selected}
          onClose={() => setSelected(null)}
          onRefresh={refreshProduct}
        />
      )}
    </div>
  );
}

// ─── Tab: Research ────────────────────────────────────────────────────────────

function ResearchTab() {
  const [form, setForm] = useState({ niche: "", budget: "", targetMarket: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/dropship/products/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, executionTier }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        research?: {
          marketAnalysis?: string;
          productOpportunities?: Array<{
            name: string;
            estimatedRetailPrice?: string;
            estimatedMargin?: string;
            winnerScore: number;
            bestSupplierPlatform: string;
            topAngle: string;
          }>;
          trendingNow?: string[];
          avoidList?: string[];
        };
      };
      if (data.ok && data.research) {
        setResult({
          marketAnalysis: data.research.marketAnalysis ?? "",
          products: (data.research.productOpportunities ?? []).map((p) => ({
            name: p.name,
            estimatedPriceRange: p.estimatedRetailPrice ?? "Unknown",
            marginPercent: Number.parseInt((p.estimatedMargin ?? "0").replace(/[^\d]/g, ""), 10) || 0,
            winnerScore: p.winnerScore,
            bestSupplierPlatform: p.bestSupplierPlatform,
            topAngle: p.topAngle,
          })),
          trendingNow: data.research.trendingNow ?? [],
          avoidList: data.research.avoidList ?? [],
        });
      }
      else toast.error("Research failed");
    } catch {
      toast.error("Research failed");
    } finally {
      setLoading(false);
    }
  }

  async function trackProduct(p: ResearchProduct) {
    setSaving(p.name);
    try {
      const res = await fetch("/api/dropship/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: p.name,
          winnerScore: p.winnerScore,
          status: "researching",
        }),
      });
      const data = (await res.json()) as { ok: boolean };
      if (data.ok) toast.success(`"${p.name}" added to Products`);
      else toast.error("Failed to track product");
    } catch {
      toast.error("Failed to track product");
    } finally {
      setSaving(null);
    }
  }

  const scoreColor = (s: number) => s >= 70 ? "text-green-400" : s >= 50 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="max-w-3xl space-y-6">
      <form onSubmit={(e) => void handleSubmit(e)}
        className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 grid grid-cols-3 gap-3">
        <div className="col-span-3">
          <ExecutionTierPicker value={executionTier} onChange={setExecutionTier} />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-1">Niche *</label>
          <input required value={form.niche} onChange={(e) => setForm((f) => ({ ...f, niche: e.target.value }))}
            placeholder="Home & Garden"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/40" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-1">Budget</label>
          <input value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
            placeholder="$1,000"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/40" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-1">Target Market</label>
          <input value={form.targetMarket} onChange={(e) => setForm((f) => ({ ...f, targetMarket: e.target.value }))}
            placeholder="US / Global"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/40" />
        </div>
        <div className="col-span-3">
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-black px-6 py-2.5 rounded-xl disabled:opacity-50 hover:scale-[1.02] transition-all">
            {loading ? <><Spinner /> Researching...</> : <><TrendingUp className="w-4 h-4" /> Find Products</>}
          </button>
        </div>
      </form>

      {result && (
        <div className="space-y-5">
          {/* Market Analysis */}
          <CopyBlock label="Market Analysis" content={result.marketAnalysis} />

          {/* Product Opportunities */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Product Opportunities</p>
            <div className="space-y-3">
              {result.products.map((p, i) => (
                <div key={i} className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                    <span className={`text-sm font-black ${scoreColor(p.winnerScore)}`}>{p.winnerScore}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-white truncate">{p.name}</h4>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-white/30">{p.estimatedPriceRange}</span>
                      <span className="text-xs text-cyan-400/70">{p.marginPercent}% margin</span>
                      <span className="text-xs text-white/30">{p.bestSupplierPlatform}</span>
                    </div>
                    <p className="text-xs text-white/40 mt-1 truncate">{p.topAngle}</p>
                  </div>
                  <button
                    disabled={saving === p.name}
                    onClick={() => void trackProduct(p)}
                    className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/50 hover:text-white hover:border-cyan-500/30 transition disabled:opacity-40">
                    {saving === p.name ? <Spinner /> : <Plus className="w-3 h-3" />}
                    Track
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Trending + Avoid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Trending Now</p>
              <div className="flex flex-wrap gap-1.5">
                {result.trendingNow.map((t, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-bold">{t}</span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Avoid List</p>
              <ul className="space-y-1.5">
                {result.avoidList.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-400/60">
                    <X className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Profit Calculator ───────────────────────────────────────────────────

function ProfitCalculatorTab() {
  const [inputs, setInputs] = useState({
    supplierPrice: "8.00",
    shippingCost: "3.00",
    adSpendPerDay: "50",
    conversionRate: "2.5",
    targetROAS: "3.0",
  });

  const calc = useMemo(() => {
    const supplier = parseFloat(inputs.supplierPrice) || 0;
    const shipping = parseFloat(inputs.shippingCost) || 0;
    const adSpend = parseFloat(inputs.adSpendPerDay) || 0;
    const cvr = parseFloat(inputs.conversionRate) || 0;
    const roas = parseFloat(inputs.targetROAS) || 1;

    const processingFeeRate = 0.029;
    const processingFeeFlat = 0.30;

    // Three price tiers
    const tiers = [
      { label: "Entry (2x)", multiplier: 2 },
      { label: "Sweet Spot (2.8x)", multiplier: 2.8 },
      { label: "Premium (4x)", multiplier: 4 },
    ].map(({ label, multiplier }) => {
      const retail = (supplier + shipping) * multiplier;
      const processing = retail * processingFeeRate + processingFeeFlat;
      const cogs = supplier + shipping + processing;
      const profit = retail - cogs;
      const margin = retail > 0 ? (profit / retail) * 100 : 0;
      return { label, retail, cogs, profit, margin };
    });

    const sweetSpot = tiers[1];
    const breakEvenROAS = sweetSpot.retail > 0 ? sweetSpot.retail / sweetSpot.cogs : 0;

    // Daily results at target ROAS using sweet-spot retail
    const dailyRevenue = adSpend * roas;
    const dailyOrders = sweetSpot.retail > 0 ? dailyRevenue / sweetSpot.retail : 0;
    const dailyClicks = cvr > 0 ? (dailyOrders / cvr) * 100 : 0;
    const dailyImpressions = dailyClicks * 40; // assume 2.5% CTR
    const dailyProfit = dailyOrders * sweetSpot.profit - adSpend;

    const lowMargin = sweetSpot.margin < 30;

    return { tiers, breakEvenROAS, dailyRevenue, dailyOrders, dailyClicks, dailyImpressions, dailyProfit, sweetSpot, lowMargin };
  }, [inputs]);

  const inp = (key: keyof typeof inputs, label: string, placeholder: string, prefix = "") => (
    <div>
      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-1">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/30 font-bold">{prefix}</span>}
        <input
          type="number" step="any" value={inputs[key]}
          onChange={(e) => setInputs((prev) => ({ ...prev, [key]: e.target.value }))}
          placeholder={placeholder}
          className={`w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/40 ${prefix ? "pl-6" : ""}`}
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      {/* Inputs */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
        {inp("supplierPrice",   "Supplier Price",          "8.00",  "$")}
        {inp("shippingCost",    "Shipping Cost",           "3.00",  "$")}
        {inp("adSpendPerDay",   "Ad Spend / Day",          "50",    "$")}
        {inp("conversionRate",  "Conversion Rate",         "2.5",   "%")}
        {inp("targetROAS",      "Target ROAS",             "3.0"      )}
      </div>

      {/* Break-even spotlight */}
      <div className="rounded-2xl bg-gradient-to-br from-cyan-500/[0.07] to-purple-500/[0.04] border border-cyan-500/20 p-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Break-Even ROAS</p>
          <p className="text-white/40 text-xs">You need this just to cover product costs</p>
        </div>
        <span className="text-5xl font-black text-cyan-400">{calc.breakEvenROAS.toFixed(2)}x</span>
      </div>

      {/* Low margin warning */}
      {calc.lowMargin && (
        <div className="flex items-start gap-3 rounded-2xl bg-yellow-500/[0.06] border border-yellow-500/20 p-4">
          <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
          <p className="text-sm text-yellow-400/80">
            Sweet-spot margin is <strong>{calc.sweetSpot.margin.toFixed(1)}%</strong> — below 30%. Consider negotiating supplier price or increasing retail price.
          </p>
        </div>
      )}

      {/* Price Tiers */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Suggested Retail Tiers</p>
        <div className="grid grid-cols-3 gap-3">
          {calc.tiers.map((t, i) => (
            <div key={i} className={`rounded-2xl border p-4 ${i === 1 ? "border-cyan-500/30 bg-cyan-500/[0.05]" : "border-white/[0.06] bg-white/[0.02]"}`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">{t.label}</p>
              <p className="text-xl font-black text-white">${t.retail.toFixed(2)}</p>
              <p className={`text-sm font-bold mt-1 ${t.margin >= 30 ? "text-green-400" : "text-red-400"}`}>
                ${t.profit.toFixed(2)} profit
              </p>
              <p className="text-xs text-white/30 mt-0.5">{t.margin.toFixed(1)}% margin</p>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Results */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">
          Daily Ad Results at {inputs.targetROAS}x ROAS (Sweet Spot Price)
        </p>
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Impressions", "Clicks", "Orders", "Revenue", "Profit"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/30">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-3 font-bold text-white/60">{Math.round(calc.dailyImpressions).toLocaleString()}</td>
                <td className="px-4 py-3 font-bold text-white/60">{Math.round(calc.dailyClicks).toLocaleString()}</td>
                <td className="px-4 py-3 font-bold text-white/60">{calc.dailyOrders.toFixed(1)}</td>
                <td className="px-4 py-3 font-bold text-white">${calc.dailyRevenue.toFixed(2)}</td>
                <td className={`px-4 py-3 font-black ${calc.dailyProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {calc.dailyProfit >= 0 ? "+" : ""}${calc.dailyProfit.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Generate Assets ─────────────────────────────────────────────────────

function GenerateAssetsTab({ products }: { products: DropshipProduct[] }) {
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<Record<string, any>>({});
  const [subTabs, setSubTabs] = useState<Record<string, number>>({});

  async function generate(key: string, endpoint: string) {
    if (!selectedId) { toast.error("Select a product first"); return; }
    setLoading(key);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedId, executionTier }),
      });
      const payload = (await res.json()) as {
        storeContent?: unknown;
        ads?: unknown;
        emails?: unknown;
        analysis?: unknown;
      };
      const data =
        key === "store" ? payload.storeContent :
        key === "ads" ? payload.ads :
        key === "emails" ? payload.emails :
        key === "analysis" ? payload.analysis :
        payload;
      setResults((r) => ({ ...r, [key]: data }));
      toast.success("Generated successfully");
    } catch {
      toast.error("Generation failed");
    } finally {
      setLoading(null);
    }
  }

  const assetCards = [
    {
      key: "store",
      title: "Store Content",
      desc: "Title, bullets, description, FAQ, specs",
      icon: FileText,
      endpoint: "/api/dropship/products/store-content",
      tabs: ["Title & Bullets", "Description", "FAQ & Specs"],
      getContent: (d: unknown) => {
        const r = d as Record<string, string> | null;
        const titleBullets = r ? `${r.title ?? ""}\n\n${r.bullets ?? ""}` : "";
        return [titleBullets, r?.description ?? "", `${r?.faq ?? ""}\n\n${r?.specs ?? ""}`];
      },
    },
    {
      key: "ads",
      title: "Ad Creatives",
      desc: "Facebook, TikTok, Google, UGC Brief",
      icon: Megaphone,
      endpoint: "/api/dropship/products/ads/generate",
      tabs: ["Facebook", "TikTok", "Google", "UGC Brief"],
      getContent: (d: unknown) => {
        const r = d as Record<string, string> | null;
        return [r?.facebook ?? "", r?.tiktok ?? "", r?.google ?? "", r?.ugcBrief ?? ""];
      },
    },
    {
      key: "emails",
      title: "Email Flows",
      desc: "Abandoned cart, post-purchase, winback",
      icon: Mail,
      endpoint: "/api/dropship/products/emails/generate",
      tabs: ["Abandoned Cart", "Post-Purchase", "Winback"],
      getContent: (d: unknown) => {
        const r = d as Record<string, string> | null;
        return [r?.abandonedCart ?? "", r?.postPurchase ?? "", r?.winback ?? ""];
      },
    },
    {
      key: "analysis",
      title: "Full Analysis",
      desc: "Verdict, scores, pricing, risk factors",
      icon: BarChart2,
      endpoint: "/api/dropship/products/analyze",
      tabs: ["Verdict", "Pricing", "Risk Factors"],
      getContent: (d: unknown) => {
        const r = d as Record<string, unknown> | null;
        return [
          r?.verdict ? JSON.stringify({ verdict: r.verdict, summary: r.summary }, null, 2) : "",
          r?.pricingBreakdown ? JSON.stringify(r.pricingBreakdown, null, 2) : "",
          Array.isArray(r?.riskFactors) ? (r!.riskFactors as string[]).join("\n") : "",
        ];
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-4">
          <ExecutionTierPicker value={executionTier} onChange={setExecutionTier} />
        </div>
        <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-1">Select Product</label>
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/40 min-w-[260px]">
          <option value="">— Choose a product —</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assetCards.map((card) => {
          const Icon = card.icon;
          const result = results[card.key];
          const isLoading = loading === card.key;
          const tabIdx = subTabs[card.key] ?? 0;
          const contents = result ? card.getContent(result) : [];

          return (
            <div key={card.key} className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    <Icon className="w-4 h-4 text-cyan-400/60" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">{card.title}</h4>
                    <p className="text-xs text-white/30">{card.desc}</p>
                  </div>
                </div>
                <button
                  disabled={isLoading || loading !== null}
                  onClick={() => void generate(card.key, card.endpoint)}
                  className="shrink-0 flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.08] text-white/60 hover:text-white text-xs px-3 py-1.5 rounded-xl transition disabled:opacity-40"
                >
                  {isLoading ? <Spinner /> : <Zap className="w-3.5 h-3.5" />}
                  Generate
                </button>
              </div>

              {result && (
                <div>
                  <div className="flex gap-1 mb-3 flex-wrap">
                    {card.tabs.map((t, i) => (
                      <button key={t}
                        onClick={() => setSubTabs((s) => ({ ...s, [card.key]: i }))}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${tabIdx === i ? "bg-white/[0.08] text-white" : "text-white/30 hover:text-white/60"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <div className="absolute top-2 right-2 z-10">
                      <CopyButton text={contents[tabIdx] ?? ""} />
                    </div>
                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 text-xs text-white/60 whitespace-pre-wrap max-h-48 overflow-y-auto pr-8">
                      {contents[tabIdx] ? String(contents[tabIdx]) : <span className="text-white/20">No content for this tab</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DropshipPage() {
  const [tab, setTab] = useState<Tab>("Products");
  const [products, setProducts] = useState<DropshipProduct[]>([]);

  useEffect(() => {
    fetch("/api/dropship/products")
      .then((r) => r.json() as Promise<{ ok: boolean; products?: DropshipProduct[] }>)
      .then((d) => { if (d.ok && d.products) setProducts(d.products); })
      .catch(() => null);
  }, []);

  return (
    <div className="min-h-screen bg-[#020509] text-white flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[300px] opacity-[0.04] blur-[120px] bg-purple-500 rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[280px] opacity-[0.03] blur-[100px] bg-cyan-500 rounded-full" />
        <div className="absolute inset-0 opacity-[0.018]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>

      <AppNav />

      <div className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-6">
        {/* Header */}
        <header className="pt-12 pb-8 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[11px] font-black tracking-[0.25em] text-purple-400/70 uppercase">Dropshipping</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            Dropship{" "}
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Product OS
            </span>
          </h1>
          <p className="text-white/30 mt-2 text-sm">Find winners, calculate profit, generate every asset you need.</p>
        </header>

        {/* Stats */}
        {products.length > 0 && (
          <div className="mt-6 mb-2 grid grid-cols-4 gap-3">
            {[
              { label: "Total Products", value: products.length, color: "text-white" },
              { label: "Testing",  value: products.filter((p) => p.status === "testing").length,  color: "text-yellow-400" },
              { label: "Winning",  value: products.filter((p) => p.status === "winning").length,  color: "text-green-400" },
              { label: "Scaling",  value: products.filter((p) => p.status === "scaling").length,  color: "text-cyan-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-1">{s.label}</p>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mt-6 mb-8 border-b border-white/[0.06]">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-bold rounded-t-xl transition-all ${
                tab === t
                  ? "text-white border-b-2 border-purple-500"
                  : "text-white/30 hover:text-white/60"
              }`}>
              {t}
            </button>
          ))}
        </div>

        <div className="pb-20">
          {tab === "Products"           && <ProductsTab />}
          {tab === "Research"           && <ResearchTab />}
          {tab === "Profit Calculator"  && <ProfitCalculatorTab />}
          {tab === "Generate Assets"    && <GenerateAssetsTab products={products} />}
        </div>
      </div>
    </div>
  );
}
