"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import { Search, Plus, Trash2, ArrowRight, BarChart2, Mail, CheckSquare, Clock, Zap } from "lucide-react";

type Campaign = {
  id: string;
  name: string;
  mode: string;
  status: string;
  productName: string | null;
  productUrl: string | null;
  createdAt: string;
  _count: { adVariations: number; emailDrafts: number; checklistItems: number };
};

const STATUS_STYLES: Record<string, { border: string; text: string; bg: string; dot: string; glow: string }> = {
  draft: { border: "border-white/10", text: "text-white/40", bg: "bg-white/5", dot: "bg-white/30", glow: "" },
  active: { border: "border-cyan-500/40", text: "text-cyan-400", bg: "bg-cyan-500/10", dot: "bg-cyan-400", glow: "shadow-[0_0_6px_rgba(6,182,212,0.4)]" },
  testing: { border: "border-yellow-500/40", text: "text-yellow-400", bg: "bg-yellow-500/10", dot: "bg-yellow-400", glow: "shadow-[0_0_6px_rgba(234,179,8,0.4)]" },
  scaling: { border: "border-green-500/40", text: "text-green-400", bg: "bg-green-500/10", dot: "bg-green-400", glow: "shadow-[0_0_6px_rgba(34,197,94,0.4)]" },
  dead: { border: "border-red-500/30", text: "text-red-400/60", bg: "bg-red-500/5", dot: "bg-red-500/60", glow: "" },
};

const MODE_ICONS: Record<string, string> = {
  operator: "🛒",
  consultant: "💼",
  saas: "💻",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Not launched yet — assets saved, nothing live",
  active: "Running — ads or emails are live right now",
  testing: "A/B testing — comparing hooks or audiences",
  scaling: "Profitable — increasing budget to scale",
  dead: "Paused or shut down — no longer running",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json() as Promise<{ ok: boolean; campaigns?: Campaign[] }>)
      .then((data) => {
        if (data.ok && data.campaigns) setCampaigns(data.campaigns);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirm(null);
  }

  const filtered = campaigns.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.productName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const totalAds = campaigns.reduce((acc, c) => acc + c._count.adVariations, 0);
  const totalEmails = campaigns.reduce((acc, c) => acc + c._count.emailDrafts, 0);

  return (
    <div className="min-h-screen bg-[#020509] text-white flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[700px] h-[350px] opacity-[0.04] blur-[130px] bg-cyan-500 rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[300px] opacity-[0.03] blur-[100px] bg-purple-500 rounded-full" />
        <div className="absolute inset-0 opacity-[0.018]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>

      <AppNav />

      <div className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-6">
        {/* Header */}
        <header className="pt-12 pb-10 flex items-end justify-between gap-6 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-[11px] font-black tracking-[0.25em] text-cyan-400/70 uppercase">Campaigns</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight">
              Your{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Campaign Workspaces
              </span>
            </h1>
            <p className="text-white/30 mt-2 text-sm">
              {campaigns.length > 0
                ? `${campaigns.length} workspace${campaigns.length !== 1 ? "s" : ""} — every one a living launch plan`
                : "Analyze a product URL to generate your first complete campaign package"}
            </p>
          </div>
          <Link href="/analyze"
            className="shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-black shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.45)] hover:scale-[1.02] transition-all duration-200">
            <Zap className="w-4 h-4" /> New Scan
          </Link>
        </header>

        {/* Stats bar */}
        {campaigns.length > 0 && (
          <div className="mt-8 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Campaigns", value: campaigns.length.toString() },
              { label: "Ad Variations", value: totalAds.toString(), color: "text-purple-400" },
              { label: "Email Drafts", value: totalEmails.toString(), color: "text-cyan-400" },
              { label: "Active", value: (campaigns.filter(c => c.status === "active" || c.status === "scaling").length).toString(), color: "text-green-400" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
                <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className={`text-2xl font-black ${stat.color || "text-white"}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter bar */}
        {campaigns.length > 0 && (
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search campaigns..."
                className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-cyan-500/40 transition placeholder-white/20 font-medium"
              />
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-8 h-8 border-2 border-white/10 border-t-cyan-500 rounded-full animate-spin" />
            <span className="text-sm text-white/25 font-semibold">Loading campaigns...</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && campaigns.length === 0 && (
          <div className="mt-8 relative rounded-3xl border border-white/[0.06] bg-gradient-to-br from-cyan-500/[0.04] to-purple-500/[0.02] p-20 flex flex-col items-center text-center overflow-hidden">
            <div className="absolute inset-0 opacity-[0.013]"
              style={{ backgroundImage: "radial-gradient(circle, #06b6d4 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/[0.07] flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
              <BarChart2 className="w-10 h-10 text-cyan-400/50" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">No campaigns yet</h2>
            <p className="text-sm text-white/35 max-w-sm mb-10 leading-relaxed">
              Paste a product or competitor URL into the Copilot. In seconds, you'll get a full ad package — hooks, briefs, scripts, landing page copy, and email sequences.
            </p>
            <Link href="/analyze"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-black shadow-[0_0_30px_rgba(6,182,212,0.25)] hover:scale-[1.02] transition-all">
              <Zap className="w-4 h-4" />
              Analyze Your First Market →
            </Link>
          </div>
        )}

        {/* No results */}
        {!loading && campaigns.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16 text-white/20 text-sm font-semibold">No campaigns match &ldquo;{search}&rdquo;</div>
        )}

        {/* Campaign cards */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-3 pb-16">
            {filtered.map((c) => {
              const s = STATUS_STYLES[c.status] ?? STATUS_STYLES.draft;
              return (
                <div key={c.id}
                  onClick={() => router.push(`/campaigns/${c.id}`)}
                  className={`group relative rounded-2xl border ${s.border} bg-white/[0.02] hover:bg-white/[0.04] p-5 cursor-pointer transition-all duration-200 flex items-center gap-4 overflow-hidden`}
                >
                  {/* Subtle left accent */}
                  <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${s.dot} opacity-60`} />

                  {/* Mode icon */}
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-xl">
                    {MODE_ICONS[c.mode] ?? "📊"}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div
                        title={STATUS_LABELS[c.status]}
                        className={`flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider cursor-help ${s.border} ${s.text} ${s.bg}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${s.dot} ${s.glow}`} />
                        {c.status}
                      </div>
                      <span className="text-[10px] text-white/20 font-medium">
                        {c.mode === "operator" ? "E-Commerce" : c.mode === "consultant" ? "Consultant" : "SaaS"}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition truncate leading-snug">{c.name}</h3>
                    {c.productName && <p className="text-xs text-white/25 mt-0.5 truncate">{c.productName}</p>}
                  </div>

                  {/* Asset counts */}
                  <div className="shrink-0 flex items-center gap-5 text-white/25">
                    <div className="flex flex-col items-center gap-0.5">
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">{c._count.adVariations}</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">{c._count.emailDrafts}</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">{c._count.checklistItems}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white/15">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] font-semibold">
                        {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {deleteConfirm === c.id ? (
                      <>
                        <button
                          onClick={(e) => void handleDelete(e, c.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-black hover:bg-red-500/30 transition"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.07] text-white/40 text-xs font-semibold hover:text-white transition"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setDeleteConfirm(c.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center">
                          <ArrowRight className="w-4 h-4 text-cyan-400/60" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
