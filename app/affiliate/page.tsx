"use client";
import { useState, useEffect, useCallback } from "react";
import AppNav from "@/components/AppNav";
import { toast } from "sonner";
import {
  Plus, X, Copy, ChevronRight, ExternalLink, AlertTriangle,
  Loader2, CheckCircle2, TrendingUp, Link2, DollarSign,
  BarChart2, Target, Layers, Mail, Megaphone, Globe,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = "clickbank" | "jvzoo" | "warriorplus" | "cj" | "amazon" | "digistore24" | "custom";
type OfferStatus = "researching" | "approved" | "building" | "running" | "paused" | "dropped";
type ExecutionTier = "core" | "elite";

interface AffiliateOffer {
  id: string;
  name: string;
  platform: Platform;
  niche: string;
  url?: string;
  affiliateUrl?: string;
  commission?: string;
  gravity?: number;
  status: OfferStatus;
  offerAnalysis?: {
    verdict: "promote" | "test_first" | "pass";
    targetAudience?: string;
    strengths?: string[];
    weaknesses?: string[];
  };
  funnelJson?: object;
  swipeCopy?: object;
  adCreatives?: object;
  bridgePage?: object;
}

type ResearchResult = {
  topNetworks: { name: string; category: string; typicalCommission: string; topOffers: string[] }[];
  nicheAngles: string[];
  competitionLevel: string;
  recommendedTraffic: string[];
  offerCriteria: string[];
  redFlags: string[];
  entryStrategy: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_BADGE: Record<Platform, string> = {
  clickbank:   "bg-green-500/15 text-green-400 border-green-500/30",
  jvzoo:       "bg-blue-500/15 text-blue-400 border-blue-500/30",
  warriorplus: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  cj:          "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  amazon:      "bg-orange-500/15 text-orange-400 border-orange-500/30",
  digistore24: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  custom:      "bg-white/10 text-white/60 border-white/20",
};

const STATUS_BADGE: Record<OfferStatus, string> = {
  researching: "text-white/40 bg-white/[0.03] border-white/10",
  approved:    "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  building:    "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  running:     "text-green-400 bg-green-500/10 border-green-500/30",
  paused:      "text-orange-400 bg-orange-500/10 border-orange-500/30",
  dropped:     "text-red-400 bg-red-500/10 border-red-500/30",
};

const VERDICT_BADGE = {
  promote:    "text-green-400 bg-green-500/10 border-green-500/30",
  test_first: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  pass:       "text-red-400 bg-red-500/10 border-red-500/30",
};

const TABS = ["My Offers", "Research", "Build Assets", "Funnels"] as const;
type Tab = typeof TABS[number];

const TRAFFIC_SOURCES = ["Facebook Ads", "Google Ads", "TikTok", "YouTube", "Email", "SEO", "Native Ads", "Any"];
const PLATFORMS: Platform[] = ["clickbank", "jvzoo", "warriorplus", "cj", "amazon", "digistore24", "custom"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function Spinner() {
  return <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />;
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
          description: "Strong launch-ready affiliate execution with practical angles and assets.",
        },
        {
          id: "elite" as const,
          label: "Elite",
          description: "Sharper super-affiliate positioning, better angle logic, and stronger operator-grade outputs.",
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

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function OfferDetailPanel({
  offer,
  onClose,
  onRefresh,
}: {
  offer: AffiliateOffer;
  onClose: () => void;
  onRefresh: (id: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<{ type: string; data: unknown } | null>(null);
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");

  async function callAction(action: string, endpoint: string, body: object = {}) {
    setLoading(action);
    setResult(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId: offer.id, executionTier, ...body }),
      });
      const data = (await res.json()) as unknown;
      setResult({ type: action, data });
      await onRefresh(offer.id);
      toast.success(`${action} complete`);
    } catch {
      toast.error(`Failed: ${action}`);
    } finally {
      setLoading(null);
    }
  }

  const a = offer.offerAnalysis;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg h-full bg-[#020509] border-l border-white/[0.07] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#020509]/90 backdrop-blur-xl border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
          <h2 className="text-sm font-black text-white truncate">{offer.name}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Platform", value: offer.platform },
              { label: "Niche", value: offer.niche },
              { label: "Commission", value: offer.commission ?? "—" },
              { label: "Gravity", value: offer.gravity?.toString() ?? "—" },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-white/[0.02] border border-white/[0.06] px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">{m.label}</p>
                <p className="text-sm font-bold text-white">{m.value}</p>
              </div>
            ))}
          </div>

          {offer.affiliateUrl && (
            <a href={offer.affiliateUrl} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition">
              <ExternalLink className="w-3.5 h-3.5" /> Affiliate URL
            </a>
          )}

          {/* Analysis */}
          {a && (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Verdict</span>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-black uppercase tracking-wider ${VERDICT_BADGE[a.verdict]}`}>
                  {a.verdict.replace("_", " ")}
                </span>
              </div>
              {a.targetAudience && <p className="text-sm text-white/60 leading-relaxed">{a.targetAudience}</p>}
              {(a.strengths?.length ?? 0) > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Strengths</p>
                  <ul className="space-y-1">
                    {a.strengths!.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-green-400/80">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(a.weaknesses?.length ?? 0) > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Weaknesses</p>
                  <ul className="space-y-1">
                    {a.weaknesses!.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-red-400/80">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {w}
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
              { key: "analyze",     label: "Analyze Offer",       icon: BarChart2,  endpoint: "/api/affiliate/offers/analyze" },
              { key: "funnel",      label: "Generate Funnel",     icon: Layers,     endpoint: "/api/affiliate/funnel/generate" },
              { key: "swipe",       label: "Write Swipe Copy",    icon: Mail,       endpoint: "/api/affiliate/swipe/generate" },
              { key: "ads",         label: "Generate Ads",        icon: Megaphone,  endpoint: "/api/affiliate/ads/generate" },
              { key: "bridge",      label: "Build Bridge Page",   icon: Globe,      endpoint: "/api/affiliate/bridge-page/generate" },
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

          {/* Inline result */}
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

// ─── Tab: My Offers ───────────────────────────────────────────────────────────

function MyOffersTab() {
  const [offers, setOffers] = useState<AffiliateOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AffiliateOffer | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "", platform: "clickbank" as Platform, niche: "",
    url: "", affiliateUrl: "", commission: "", gravity: "",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/affiliate/offers");
      const data = (await res.json()) as { ok: boolean; offers?: AffiliateOffer[] };
      if (data.ok && data.offers) setOffers(data.offers);
    } catch {
      toast.error("Failed to load offers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const refreshOffer = useCallback(async (id: string) => {
    const res = await fetch(`/api/affiliate/offers/${id}`);
    const data = (await res.json()) as { ok: boolean; offer?: AffiliateOffer };
    if (data.ok && data.offer) {
      setOffers((prev) => prev.map((o) => (o.id === id ? data.offer! : o)));
      setSelected(data.offer ?? null);
    }
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Offer name is required"); return; }
    if (!form.url.trim()) { toast.error("Product URL is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/affiliate/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, gravity: form.gravity ? Number(form.gravity) : undefined }),
      });
      const data = (await res.json()) as { ok: boolean; offer?: AffiliateOffer };
      if (data.ok && data.offer) {
        setOffers((prev) => [data.offer!, ...prev]);
        setShowAdd(false);
        setForm({ name: "", platform: "clickbank", niche: "", url: "", affiliateUrl: "", commission: "", gravity: "" });
        toast.success("Offer added");
      }
    } catch {
      toast.error("Failed to add offer");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-6 h-6 animate-spin text-cyan-400/50" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-white/30">{offers.length} offer{offers.length !== 1 ? "s" : ""} tracked</p>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm font-black px-4 py-2 rounded-xl hover:scale-[1.02] transition-all"
        >
          <Plus className="w-4 h-4" /> Add Offer
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={(e) => void handleAdd(e)}
          className="mb-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-1">Offer Name</label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Keto Fat Burner Pro"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/40" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-1">Platform</label>
            <select value={form.platform} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value as Platform }))}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/40">
              {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-1">Niche</label>
            <input value={form.niche} onChange={(e) => setForm((f) => ({ ...f, niche: e.target.value }))}
              placeholder="Health & Fitness"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/40" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-1">Commission</label>
            <input value={form.commission} onChange={(e) => setForm((f) => ({ ...f, commission: e.target.value }))}
              placeholder="75%"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/40" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-1">Gravity</label>
            <input type="number" value={form.gravity} onChange={(e) => setForm((f) => ({ ...f, gravity: e.target.value }))}
              placeholder="120"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/40" />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-1">Offer URL</label>
            <input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/40" />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-1">Affiliate URL</label>
            <input value={form.affiliateUrl} onChange={(e) => setForm((f) => ({ ...f, affiliateUrl: e.target.value }))}
              placeholder="https://hop.clickbank.net/..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/40" />
          </div>
          <div className="col-span-2 flex gap-2 justify-end">
            <button type="button" onClick={() => setShowAdd(false)}
              className="bg-white/[0.05] border border-white/[0.08] text-white/60 hover:text-white text-sm px-4 py-2 rounded-xl transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm font-black px-4 py-2 rounded-xl disabled:opacity-50">
              {saving ? <Spinner /> : null} Save Offer
            </button>
          </div>
        </form>
      )}

      {offers.length === 0 && (
        <div className="text-center py-20 text-white/20 text-sm">No offers yet — add your first one above.</div>
      )}

      <div className="space-y-3">
        {offers.map((o) => (
          <div key={o.id}
            onClick={() => setSelected(o)}
            className="group rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 cursor-pointer hover:bg-white/[0.04] hover:border-white/[0.1] transition-all flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider ${PLATFORM_BADGE[o.platform]}`}>
                  {o.platform}
                </span>
                {o.niche && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-white/40 font-bold">
                    {o.niche}
                  </span>
                )}
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider ${STATUS_BADGE[o.status]}`}>
                  {o.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition truncate">{o.name}</h3>
              <div className="flex items-center gap-4 mt-1">
                {o.commission && (
                  <span className="flex items-center gap-1 text-xs text-white/30">
                    <DollarSign className="w-3 h-3" />{o.commission}
                  </span>
                )}
                {o.gravity != null && (
                  <span className="flex items-center gap-1 text-xs text-white/30">
                    <TrendingUp className="w-3 h-3" />Gravity {o.gravity}
                  </span>
                )}
                {o.offerAnalysis && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider ${VERDICT_BADGE[o.offerAnalysis.verdict]}`}>
                    {o.offerAnalysis.verdict.replace("_", " ")}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-cyan-400 transition shrink-0" />
          </div>
        ))}
      </div>

      {selected && (
        <OfferDetailPanel
          offer={selected}
          onClose={() => setSelected(null)}
          onRefresh={refreshOffer}
        />
      )}
    </div>
  );
}

// ─── Tab: Research ────────────────────────────────────────────────────────────

function ResearchTab() {
  const [form, setForm] = useState({ niche: "", budget: "", trafficSource: "Any" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/affiliate/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, executionTier }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        research?: {
          topNetworks?: Array<{ network: string; category: string; avgComm: string; topOffers: string[] }>;
          topNicheAngles?: string[];
          competitionLevel?: string;
          recommendedTraffic?: string[];
          offerCriteria?: string[];
          redFlags?: string[];
          entryStrategy?: string;
        };
      };
      if (data.ok && data.research) {
        setResult({
          topNetworks: (data.research.topNetworks ?? []).map((n) => ({
            name: n.network,
            category: n.category,
            typicalCommission: n.avgComm,
            topOffers: n.topOffers,
          })),
          nicheAngles: data.research.topNicheAngles ?? [],
          competitionLevel: data.research.competitionLevel ?? "medium",
          recommendedTraffic: data.research.recommendedTraffic ?? [],
          offerCriteria: data.research.offerCriteria ?? [],
          redFlags: data.research.redFlags ?? [],
          entryStrategy: data.research.entryStrategy ?? "",
        });
      }
      else toast.error("Research failed");
    } catch {
      toast.error("Research failed");
    } finally {
      setLoading(false);
    }
  }

  const COMPETITION_COLOR: Record<string, string> = {
    low: "text-green-400 bg-green-500/10 border-green-500/30",
    medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    high: "text-red-400 bg-red-500/10 border-red-500/30",
  };

  return (
    <div className="max-w-3xl space-y-6">
      <form onSubmit={(e) => void handleSubmit(e)}
        className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 grid grid-cols-3 gap-3">
        <div className="col-span-3">
          <ExecutionTierPicker value={executionTier} onChange={setExecutionTier} />
        </div>
        <div className="col-span-3 md:col-span-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-1">Niche *</label>
          <input required value={form.niche} onChange={(e) => setForm((f) => ({ ...f, niche: e.target.value }))}
            placeholder="Weight Loss"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/40" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-1">Budget (optional)</label>
          <input value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
            placeholder="$500/mo"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/40" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-1">Traffic Source</label>
          <select value={form.trafficSource} onChange={(e) => setForm((f) => ({ ...f, trafficSource: e.target.value }))}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/40">
            {TRAFFIC_SOURCES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="col-span-3">
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm font-black px-6 py-2.5 rounded-xl disabled:opacity-50 hover:scale-[1.02] transition-all">
            {loading ? <><Spinner /> Researching...</> : <><Target className="w-4 h-4" /> Run Research</>}
          </button>
        </div>
      </form>

      {result && (
        <div className="space-y-5">
          {/* Top Networks */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Top Networks</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.topNetworks.map((n, i) => (
                <div key={i} className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-black text-white">{n.name}</h4>
                    <span className="text-[10px] text-cyan-400 font-bold">{n.typicalCommission}</span>
                  </div>
                  <p className="text-xs text-white/30 mb-2">{n.category}</p>
                  <ul className="space-y-1">
                    {n.topOffers.map((o, j) => (
                      <li key={j} className="text-xs text-white/50 flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-white/20" />{o}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Niche Angles */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Niche Angles</p>
              <CopyButton text={result.nicheAngles.join("\n")} />
            </div>
            <ol className="space-y-2">
              {result.nicheAngles.map((a, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/60">
                  <span className="text-cyan-400 font-black shrink-0">{i + 1}.</span> {a}
                </li>
              ))}
            </ol>
          </div>

          {/* Competition + Traffic */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Competition</p>
              <span className={`text-xs px-3 py-1 rounded-full border font-black uppercase tracking-wider ${COMPETITION_COLOR[result.competitionLevel.toLowerCase()] ?? "text-white/40 border-white/10"}`}>
                {result.competitionLevel}
              </span>
            </div>
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Recommended Traffic</p>
              <div className="flex flex-wrap gap-1.5">
                {result.recommendedTraffic.map((t, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold">{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Criteria + Red Flags */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Offer Criteria</p>
              <ul className="space-y-1.5">
                {result.offerCriteria.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-400/60" /> {c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Red Flags</p>
              <ul className="space-y-1.5">
                {result.redFlags.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-400/70">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Entry Strategy */}
          <CopyBlock label="Entry Strategy" content={result.entryStrategy} />
        </div>
      )}
    </div>
  );
}

// ─── Tab: Build Assets ────────────────────────────────────────────────────────

function BuildAssetsTab({ offers }: { offers: AffiliateOffer[] }) {
  const [selectedOfferId, setSelectedOfferId] = useState("");
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<Record<string, any>>({});
  const [subTab, setSubTab] = useState<Record<string, number>>({});

  async function generate(cardKey: string, endpoint: string) {
    if (!selectedOfferId) { toast.error("Select an offer first"); return; }
    setActiveCard(cardKey);
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId: selectedOfferId, executionTier }),
      });
      const payload = (await res.json()) as {
        swipe?: unknown;
        ads?: unknown;
        landing?: unknown;
        funnel?: unknown;
        analysis?: unknown;
      };
      const data =
        cardKey === "swipe" ? payload.swipe :
        cardKey === "ads" ? payload.ads :
        cardKey === "bridge" ? payload.landing :
        cardKey === "funnel" ? payload.funnel :
        payload;
      setResults((r) => ({ ...r, [cardKey]: data }));
      toast.success("Generated successfully");
    } catch {
      toast.error("Generation failed");
    } finally {
      setLoading(false);
    }
  }

  const cards = [
    {
      key: "swipe",
      title: "Swipe Copy",
      desc: "Email broadcasts, 7-day sequence, and SMS messages",
      icon: Mail,
      endpoint: "/api/affiliate/swipe/generate",
      tabs: ["Broadcasts", "7-Day Sequence", "SMS"],
      getContent: (d: unknown) => {
        const r = d as Record<string, string> | null;
        return [r?.broadcasts ?? "", r?.sequence ?? "", r?.sms ?? ""];
      },
    },
    {
      key: "ads",
      title: "Ad Creative",
      desc: "Copy for Facebook, TikTok, and Google ads",
      icon: Megaphone,
      endpoint: "/api/affiliate/ads/generate",
      tabs: ["Facebook", "TikTok", "Google"],
      getContent: (d: unknown) => {
        const r = d as Record<string, string> | null;
        return [r?.facebook ?? "", r?.tiktok ?? "", r?.google ?? ""];
      },
    },
    {
      key: "bridge",
      title: "Bridge Page",
      desc: "Pre-sell page content blocks",
      icon: Globe,
      endpoint: "/api/affiliate/bridge-page/generate",
      tabs: ["Headline", "Body", "CTA"],
      getContent: (d: unknown) => {
        const r = d as Record<string, string> | null;
        return [r?.headline ?? "", r?.body ?? "", r?.cta ?? ""];
      },
    },
    {
      key: "funnel",
      title: "Funnel Map",
      desc: "Full funnel flow as connected steps",
      icon: Layers,
      endpoint: "/api/affiliate/funnel/generate",
      tabs: ["Overview", "Steps", "Emails"],
      getContent: (d: unknown) => {
        const r = d as Record<string, unknown> | null;
        return [
          r?.overview ? JSON.stringify(r.overview, null, 2) : "",
          r?.steps ? JSON.stringify(r.steps, null, 2) : "",
          r?.emails ? JSON.stringify(r.emails, null, 2) : "",
        ];
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-[280px]">
          <ExecutionTierPicker value={executionTier} onChange={setExecutionTier} />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-1">Select Offer</label>
          <select value={selectedOfferId} onChange={(e) => setSelectedOfferId(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/40 min-w-[240px]">
            <option value="">— Choose an offer —</option>
            {offers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const result = results[card.key];
          const isLoading = loading && activeCard === card.key;
          const tabIdx = subTab[card.key] ?? 0;
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
                  disabled={isLoading || loading}
                  onClick={() => void generate(card.key, card.endpoint)}
                  className="shrink-0 flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.08] text-white/60 hover:text-white text-xs px-3 py-1.5 rounded-xl transition disabled:opacity-40"
                >
                  {isLoading ? <Spinner /> : <Plus className="w-3.5 h-3.5" />}
                  Generate
                </button>
              </div>

              {result && (
                <div>
                  <div className="flex gap-1 mb-3">
                    {card.tabs.map((t, i) => (
                      <button key={t}
                        onClick={() => setSubTab((s) => ({ ...s, [card.key]: i }))}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${tabIdx === i ? "bg-white/[0.08] text-white" : "text-white/30 hover:text-white/60"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <div className="absolute top-2 right-2 z-10">
                      <CopyButton text={String(contents[tabIdx] ?? "")} />
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

// ─── Tab: Funnels ─────────────────────────────────────────────────────────────

function FunnelsTab({ offers }: { offers: AffiliateOffer[] }) {
  const [selected, setSelected] = useState<AffiliateOffer | null>(null);
  const funnelOffers = offers.filter((o) => o.funnelJson != null);

  if (funnelOffers.length === 0) {
    return (
      <div className="text-center py-20">
        <Layers className="w-8 h-8 text-white/10 mx-auto mb-3" />
        <p className="text-sm text-white/20">No funnels yet — generate one from the Build Assets tab or an offer&apos;s detail panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {funnelOffers.map((o) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const funnel = o.funnelJson as Record<string, any> | null;
        return (
          <div key={o.id}
            onClick={() => setSelected(o)}
            className="group rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 cursor-pointer hover:bg-white/[0.04] hover:border-white/[0.1] transition-all flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/[0.06] flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 text-cyan-400/70" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-black text-white group-hover:text-cyan-300 transition truncate">{o.name}</h3>
              <div className="flex items-center gap-3 mt-1">
                {funnel?.type && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold uppercase tracking-wider">
                    {String(funnel.type)}
                  </span>
                )}
                {funnel?.emailCount && (
                  <span className="flex items-center gap-1 text-xs text-white/30">
                    <Mail className="w-3 h-3" />{String(funnel.emailCount)} emails
                  </span>
                )}
                {funnel?.bridgePage && (
                  <span className="flex items-center gap-1 text-xs text-green-400/60">
                    <Globe className="w-3 h-3" /> Bridge page
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-cyan-400 transition shrink-0" />
          </div>
        );
      })}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl bg-[#020509] border border-white/[0.08] p-6"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-black text-white">{selected.name} — Funnel</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre className="text-xs text-white/50 whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(selected.funnelJson, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AffiliatePage() {
  const [tab, setTab] = useState<Tab>("My Offers");
  const [offers, setOffers] = useState<AffiliateOffer[]>([]);

  // Load offers once for shared use across tabs
  useEffect(() => {
    fetch("/api/affiliate/offers")
      .then((r) => r.json() as Promise<{ ok: boolean; offers?: AffiliateOffer[] }>)
      .then((d) => { if (d.ok && d.offers) setOffers(d.offers); })
      .catch(() => null);
  }, []);

  return (
    <div className="min-h-screen bg-[#020509] text-white flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/3 w-[600px] h-[300px] opacity-[0.04] blur-[120px] bg-cyan-500 rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[280px] opacity-[0.03] blur-[100px] bg-purple-500 rounded-full" />
        <div className="absolute inset-0 opacity-[0.018]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>

      <AppNav />

      <div className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-6">
        {/* Header */}
        <header className="pt-12 pb-8 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-[11px] font-black tracking-[0.25em] text-cyan-400/70 uppercase">Affiliate</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            Affiliate{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Marketing OS
            </span>
          </h1>
          <p className="text-white/30 mt-2 text-sm">Research, build assets, and track every offer in one place.</p>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 mt-6 mb-8 border-b border-white/[0.06]">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-bold rounded-t-xl transition-all ${
                tab === t
                  ? "text-white border-b-2 border-cyan-500"
                  : "text-white/30 hover:text-white/60"
              }`}>
              {t}
            </button>
          ))}
        </div>

        <div className="pb-20">
          {tab === "My Offers"    && <MyOffersTab />}
          {tab === "Research"     && <ResearchTab />}
          {tab === "Build Assets" && <BuildAssetsTab offers={offers} />}
          {tab === "Funnels"      && <FunnelsTab offers={offers} />}
        </div>
      </div>
    </div>
  );
}
