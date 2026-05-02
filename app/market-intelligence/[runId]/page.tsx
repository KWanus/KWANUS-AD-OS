"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  ArrowLeft, Loader2, Target, Trophy, Users, Zap,
  BarChart2, Copy, Check, ChevronDown, ChevronRight,
  Mail, Globe, TrendingUp, Sparkles, ShoppingCart, Clock,
} from "lucide-react";

interface DiscoveredProduct {
  name: string;
  url: string;
  platform: string;
  niche: string;
  subNiche?: string;
  commission?: string;
  price?: string;
  gravity?: number;
  avgEarningsPerSale?: string;
  recurring?: boolean;
  competitionLevel?: string;
  demandSignals?: string[];
}

interface WinnerProfile {
  product: DiscoveredProduct;
  strengths: string[];
  weaknesses: string[];
  audienceMatch: string;
  marketingAngle: string;
  estimatedPotential: string;
  competitorGaps: string[];
}

interface MarketSynthesis {
  overallScore: number;
  bestProduct: Record<string, unknown>;
  targetAudience: Record<string, unknown>;
  winningStrategy: Record<string, unknown>;
  funnelBlueprint: Record<string, unknown>;
  dayOnePlan: Record<string, unknown>;
}

interface GeneratedAssets {
  hooks: string[];
  adScripts: Array<Record<string, unknown>>;
  emailSequence: Array<Record<string, unknown>>;
  landingPageOutline: Record<string, unknown>;
}

interface MIRun {
  id: string;
  niche: string;
  subNiche?: string;
  vertical: string;
  executionTier: string;
  status: string;
  score?: number | null;
  topProductName?: string | null;
  topProductUrl?: string | null;
  discoveredProducts?: DiscoveredProduct[];
  winnerProfiles?: WinnerProfile[];
  winnerAnalysis?: WinnerProfile[];
  synthesis?: MarketSynthesis;
  marketSynthesis?: MarketSynthesis;
  generatedAssets?: GeneratedAssets;
  createdAt: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1 rounded-lg hover:bg-white/[0.06] text-white/20 hover:text-white/50 transition shrink-0"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function SectionLabel({ children, icon: Icon }: { children: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon className="w-4 h-4 text-cyan-400/60" />}
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">{children}</p>
    </div>
  );
}

function ExpandableCard({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition">
        <span className="text-xs font-bold text-white/60">{title}</span>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-white/20" /> : <ChevronRight className="w-3.5 h-3.5 text-white/20" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-white/[0.05]">{children}</div>}
    </div>
  );
}

function verticalToBusinessType(v: string): string {
  const map: Record<string, string> = {
    affiliate: "affiliate",
    dropship: "ecommerce",
    ecommerce: "ecommerce",
    digital: "content_creator",
    local_service: "local_service",
  };
  return map[v] ?? "affiliate";
}

export default function MIResultPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = use(params);
  const router = useRouter();
  const [run, setRun] = useState<MIRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/market-intelligence/${runId}`);
        const data = await res.json() as { ok: boolean; run?: MIRun };
        if (data.ok && data.run) setRun(data.run);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    void load();
  }, [runId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020509] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="min-h-screen bg-[#020509] flex items-center justify-center">
        <p className="text-white/30">Run not found</p>
      </div>
    );
  }

  const synthesis = run.synthesis ?? run.marketSynthesis;
  const products = run.discoveredProducts ?? [];
  const winners = run.winnerProfiles ?? run.winnerAnalysis ?? [];
  const assets = run.generatedAssets ?? {} as GeneratedAssets;

  function scoreColor(s: number) {
    if (s >= 75) return "from-emerald-400 to-green-300";
    if (s >= 50) return "from-cyan-400 to-blue-300";
    if (s >= 30) return "from-amber-400 to-yellow-300";
    return "from-red-400 to-orange-300";
  }

  async function createCampaign() {
    setCreatingCampaign(true);
    try {
      const res = await fetch("/api/market-intelligence/to-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: run!.id }),
      });
      const data = await res.json() as { ok: boolean; campaignId?: string };
      if (data.ok && data.campaignId) {
        router.push(`/campaigns/${data.campaignId}`);
      }
    } catch { /* ignore */ }
    finally { setCreatingCampaign(false); }
  }

  const himalayaParams = new URLSearchParams({
    businessType: verticalToBusinessType(run.vertical),
    niche: run.subNiche ?? run.niche,
    goal: "more_leads",
    ...(synthesis?.winningStrategy ? { description: String((synthesis.winningStrategy as Record<string, unknown>).primaryAngle ?? "") } : {}),
  }).toString();

  const bestProduct = (synthesis?.bestProduct ?? {}) as Record<string, unknown>;
  const audience = (synthesis?.targetAudience ?? {}) as Record<string, unknown>;
  const strategy = (synthesis?.winningStrategy ?? {}) as Record<string, unknown>;
  const funnel = (synthesis?.funnelBlueprint ?? {}) as Record<string, unknown>;
  const dayOne = (synthesis?.dayOnePlan ?? {}) as Record<string, unknown>;

  return (
    <div className="min-h-screen bg-[#020509] text-white">
      <AppNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <Link href="/market-intelligence" className="flex items-center gap-1.5 text-white/30 hover:text-white/60 transition text-xs mb-3">
              <ArrowLeft className="w-3 h-3" />
              Back to Market Intelligence
            </Link>
            <h1 className="text-2xl font-black text-white">{run.niche}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {run.subNiche && <span className="text-xs text-white/30">/ {run.subNiche}</span>}
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.03] text-white/30">
                {run.vertical ?? "affiliate"}
              </span>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                {run.executionTier ?? "elite"}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-white/20">
                <Clock className="w-3 h-3" />
                {new Date(run.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {run.score != null && (
            <div className="text-right shrink-0">
              <div className={`text-4xl font-black bg-gradient-to-r ${scoreColor(run.score)} bg-clip-text text-transparent`}>
                {run.score}
              </div>
              <div className="text-[9px] font-black uppercase text-white/30 tracking-widest">Score</div>
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link
            href={`/himalaya/scratch?${himalayaParams}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-sm font-bold text-white hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition"
          >
            <Sparkles className="w-4 h-4" />
            Build This Business
          </Link>
          <button
            onClick={createCampaign}
            disabled={creatingCampaign}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm font-medium text-white/70 hover:border-white/20 hover:text-white transition disabled:opacity-50"
          >
            {creatingCampaign ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
            Create Campaign
          </button>
        </div>

        {/* Best Product */}
        {typeof bestProduct.name === "string" && (
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5 mb-8">
            <SectionLabel icon={Trophy}>Top Product</SectionLabel>
            <h3 className="text-lg font-bold text-white mb-1">{String(bestProduct.name)}</h3>
            {typeof bestProduct.whyBest === "string" && (
              <p className="text-sm text-white/50">{bestProduct.whyBest}</p>
            )}
            {typeof bestProduct.url === "string" && (
              <a href={bestProduct.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 mt-2">
                <Globe className="w-3 h-3" /> {bestProduct.url}
              </a>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Target Audience */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
            <SectionLabel icon={Users}>Target Audience</SectionLabel>
            {typeof audience.demographics === "string" && (
              <p className="text-sm text-white/60 mb-3">{audience.demographics}</p>
            )}
            {Array.isArray(audience.painPoints) && (
              <div className="mb-2">
                <p className="text-[10px] font-bold text-white/30 uppercase mb-1">Pain Points</p>
                <ul className="space-y-1">
                  {(audience.painPoints as string[]).map((p, i) => (
                    <li key={i} className="text-xs text-white/50 flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray(audience.desires) && (
              <div>
                <p className="text-[10px] font-bold text-white/30 uppercase mb-1">Desires</p>
                <ul className="space-y-1">
                  {(audience.desires as string[]).map((d, i) => (
                    <li key={i} className="text-xs text-white/50 flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">•</span> {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Winning Strategy */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
            <SectionLabel icon={Target}>Winning Strategy</SectionLabel>
            {typeof strategy.primaryAngle === "string" && (
              <div className="mb-3">
                <p className="text-[10px] font-bold text-white/30 uppercase mb-1">Primary Angle</p>
                <p className="text-sm text-white/70">{strategy.primaryAngle}</p>
              </div>
            )}
            {typeof strategy.differentiator === "string" && (
              <div className="mb-3">
                <p className="text-[10px] font-bold text-white/30 uppercase mb-1">Differentiator</p>
                <p className="text-sm text-white/60">{strategy.differentiator}</p>
              </div>
            )}
            {Array.isArray(strategy.trafficSources) && (
              <div>
                <p className="text-[10px] font-bold text-white/30 uppercase mb-1">Traffic Sources</p>
                <div className="flex flex-wrap gap-1.5">
                  {(strategy.trafficSources as string[]).map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[10px] text-white/50">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Discovered Products */}
        {products.length > 0 && (
          <div className="mb-8">
            <SectionLabel icon={ShoppingCart}>Discovered Products ({products.length})</SectionLabel>
            <div className="space-y-2">
              {products.map((p, i) => (
                <ExpandableCard key={i} title={`${p.name} — ${p.platform}`} defaultOpen={i === 0}>
                  <div className="pt-3 grid grid-cols-2 gap-3 text-xs">
                    {p.price && <div><span className="text-white/30">Price:</span> <span className="text-white/60">{p.price}</span></div>}
                    {p.commission && <div><span className="text-white/30">Commission:</span> <span className="text-white/60">{p.commission}</span></div>}
                    {p.gravity != null && <div><span className="text-white/30">Gravity:</span> <span className="text-white/60">{p.gravity}</span></div>}
                    {p.competitionLevel && <div><span className="text-white/30">Competition:</span> <span className="text-white/60">{p.competitionLevel}</span></div>}
                    {p.avgEarningsPerSale && <div><span className="text-white/30">Avg Earnings:</span> <span className="text-white/60">{p.avgEarningsPerSale}</span></div>}
                    {p.recurring && <div><span className="text-emerald-400">Recurring ✓</span></div>}
                  </div>
                  {p.demandSignals && p.demandSignals.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[10px] text-white/30 font-bold uppercase mb-1">Demand Signals</p>
                      <div className="flex flex-wrap gap-1">
                        {p.demandSignals.map((s, j) => (
                          <span key={j} className="px-2 py-0.5 rounded-full bg-cyan-500/5 border border-cyan-500/10 text-[10px] text-cyan-300/60">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </ExpandableCard>
              ))}
            </div>
          </div>
        )}

        {/* Ad Hooks */}
        {Array.isArray(assets.hooks) && assets.hooks.length > 0 && (
          <div className="mb-8">
            <SectionLabel icon={Zap}>Ad Hooks ({assets.hooks.length})</SectionLabel>
            <div className="grid sm:grid-cols-2 gap-2">
              {assets.hooks.map((hook, i) => (
                <div key={i} className="flex items-start justify-between gap-2 px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02]">
                  <p className="text-sm text-white/70">{hook}</p>
                  <CopyButton text={hook} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ad Scripts */}
        {Array.isArray(assets.adScripts) && assets.adScripts.length > 0 && (
          <div className="mb-8">
            <SectionLabel icon={BarChart2}>Ad Scripts ({assets.adScripts.length})</SectionLabel>
            <div className="space-y-2">
              {assets.adScripts.map((script, i) => (
                <ExpandableCard key={i} title={`${String(script.title ?? `Script ${i + 1}`)} — ${String(script.platform ?? "Multi")}`}>
                  <div className="pt-3">
                    <p className="text-[10px] text-white/30 mb-2">Duration: {String(script.duration ?? "30s")}</p>
                    <pre className="text-xs text-white/60 whitespace-pre-wrap font-sans">{String(script.script ?? "")}</pre>
                    <CopyButton text={String(script.script ?? "")} />
                  </div>
                </ExpandableCard>
              ))}
            </div>
          </div>
        )}

        {/* Email Sequence */}
        {Array.isArray(assets.emailSequence) && assets.emailSequence.length > 0 && (
          <div className="mb-8">
            <SectionLabel icon={Mail}>Email Sequence ({assets.emailSequence.length})</SectionLabel>
            <div className="space-y-2">
              {assets.emailSequence.map((email, i) => (
                <ExpandableCard key={i} title={`${String(email.timing ?? `Day ${i + 1}`)}: ${String(email.subject ?? "")}`}>
                  <div className="pt-3">
                    <pre className="text-xs text-white/60 whitespace-pre-wrap font-sans">{String(email.body ?? "")}</pre>
                    <CopyButton text={String(email.body ?? "")} />
                  </div>
                </ExpandableCard>
              ))}
            </div>
          </div>
        )}

        {/* Day One Plan */}
        {Array.isArray((dayOne as Record<string, unknown>).steps) && (
          <div className="mb-8">
            <SectionLabel icon={Sparkles}>Day One Plan</SectionLabel>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
              {typeof dayOne.budget === "string" && <p className="text-xs text-white/40 mb-3">Budget: {dayOne.budget} · Timeline: {String(dayOne.timeline ?? "")}</p>}
              <ol className="space-y-2">
                {((dayOne as Record<string, unknown>).steps as string[]).map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white/60">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[10px] font-bold text-cyan-400">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
