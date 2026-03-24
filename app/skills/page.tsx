"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AppNav from "@/components/AppNav";
import { SKILLS, SKILL_CATEGORIES } from "@/lib/skills/registry";
import type { SkillMeta, SkillResult } from "@/lib/skills/types";
import { Loader2, Zap, Check, ExternalLink, ChevronRight, X } from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Skill card
// ---------------------------------------------------------------------------

function SkillCard({ skill, onRun }: { skill: SkillMeta; onRun: (skill: SkillMeta) => void }) {
  const cat = SKILL_CATEGORIES[skill.category];
  const colors: Record<string, string> = {
    cyan:   "from-cyan-500/10 border-cyan-500/20 text-cyan-400",
    purple: "from-purple-500/10 border-purple-500/20 text-purple-400",
    blue:   "from-blue-500/10 border-blue-500/20 text-blue-400",
    green:  "from-green-500/10 border-green-500/20 text-green-400",
  };
  const colorClass = colors[cat.color] ?? colors.cyan;

  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5 hover:border-white/[0.15] transition-all group flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{skill.icon}</div>
          <div>
            <h3 className="text-sm font-black text-white">{skill.name}</h3>
            <p className="text-[11px] text-white/40 mt-0.5">{skill.tagline}</p>
          </div>
        </div>
        <div className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r ${colorClass} border text-[10px] font-black`}>
          <Zap className="w-3 h-3" />
          {skill.credits}
        </div>
      </div>

      <p className="text-[11px] text-white/35 leading-relaxed flex-1">{skill.description}</p>

      <div className="space-y-1">
        {skill.outputs.map((o) => (
          <div key={o} className="flex items-center gap-1.5 text-[10px] text-white/30">
            <Check className="w-3 h-3 text-green-400/60 shrink-0" />
            {o}
          </div>
        ))}
      </div>

      <button
        onClick={() => onRun(skill)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/15 to-purple-600/15 hover:from-cyan-500/25 hover:to-purple-600/25 border border-white/[0.08] hover:border-cyan-500/30 text-white/70 hover:text-white text-xs font-bold transition-all"
      >
        Run Skill
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skill runner modal
// ---------------------------------------------------------------------------

function SkillRunner({
  skill,
  onClose,
  prefillData,
}: {
  skill: SkillMeta;
  onClose: () => void;
  prefillData?: Record<string, string>;
}) {
  const [input, setInput] = useState<Record<string, string>>(prefillData ?? {});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SkillResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/skills/${skill.slug}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json() as SkillResult;
      if (data.ok) {
        setResult(data);
      } else {
        setError(data.error ?? "Something went wrong");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#07101f] border border-white/[0.1] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{skill.icon}</span>
            <div>
              <h2 className="text-sm font-black text-white">{skill.name}</h2>
              <p className="text-[11px] text-white/35">{skill.credits} credits</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/[0.05] text-white/30 hover:text-white/60 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!result ? (
            <div className="p-6 space-y-4">
              {skill.inputs.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/30">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  {field.hint && <p className="text-[10px] text-white/20 -mt-1">{field.hint}</p>}

                  {field.type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={input[field.key] ?? ""}
                      onChange={(e) => setInput((p) => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition resize-none"
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={input[field.key] ?? ""}
                      onChange={(e) => setInput((p) => ({ ...p, [field.key]: e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition appearance-none"
                    >
                      <option value="" className="bg-[#07101f]">Select…</option>
                      {field.options?.map((o) => (
                        <option key={o} value={o} className="bg-[#07101f]">{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={input[field.key] ?? ""}
                      onChange={(e) => setInput((p) => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
                    />
                  )}
                </div>
              ))}

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  {error}
                </div>
              )}

              <button
                onClick={() => void run()}
                disabled={running}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-black hover:opacity-90 transition disabled:opacity-40"
              >
                {running ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running {skill.name}…
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Run — {skill.credits} Credits
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Result view */
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                <Check className="w-5 h-5 text-green-400 shrink-0" />
                <div>
                  <p className="text-sm font-black text-green-400">Done!</p>
                  <p className="text-[11px] text-white/40">{result.summary}</p>
                </div>
              </div>

              {/* Output text */}
              {result.data?.rawText && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 max-h-80 overflow-y-auto">
                  <pre className="text-[11px] text-white/70 leading-relaxed whitespace-pre-wrap font-mono">
                    {result.data.rawText as string}
                  </pre>
                </div>
              )}

              {/* Created links — standard skills */}
              {result.created.siteId && (
                <Link
                  href={
                    result.data?.pageId
                      ? `/websites/${result.created.siteId}/editor/${result.data.pageId as string}`
                      : `/websites/${result.created.siteId}`
                  }
                  className="flex items-center gap-2 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold hover:bg-cyan-500/15 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open your new site in the editor →
                </Link>
              )}
              {result.created.emailFlowId && (
                <Link
                  href={`/emails/flows/${result.created.emailFlowId}`}
                  className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-500/15 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open your email flow →
                </Link>
              )}
              {result.created.broadcastId && (
                <Link
                  href="/emails/broadcasts"
                  className="flex items-center gap-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold hover:bg-purple-500/15 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open broadcast drafts →
                </Link>
              )}

              {/* Created links — pipeline skills (website-builder-scout, ad-campaign, email-campaign) */}
              {result.created.campaignId && (
                <Link
                  href={`/campaigns/${result.created.campaignId}`}
                  className="flex items-center gap-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold hover:bg-orange-500/15 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open campaign (hooks, scripts, emails) →
                </Link>
              )}
              {result.created.clientId && (
                <Link
                  href={`/clients/${result.created.clientId}`}
                  className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/15 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open CRM client record →
                </Link>
              )}

              {/* Structured result data for pipeline skills */}
              {result.data?.topGaps && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Top Opportunity Gaps</p>
                  {(result.data.topGaps as string[]).map((g, i) => (
                    <p key={i} className="text-[11px] text-white/50 flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">✗</span>{g}
                    </p>
                  ))}
                </div>
              )}
              {result.data?.hooks && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Ad Hooks</p>
                  {(result.data.hooks as { hook: string; format?: string }[]).slice(0, 3).map((h, i) => (
                    <p key={i} className="text-[11px] text-white/60 leading-relaxed border-l-2 border-cyan-500/20 pl-3">
                      {h.hook ?? String(h)}
                    </p>
                  ))}
                </div>
              )}
              {result.data?.outreachEmail && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Outreach Email</p>
                  <p className="text-[11px] font-bold text-white/70">{(result.data.outreachEmail as { subject: string }).subject}</p>
                  <pre className="text-[10px] text-white/40 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto font-sans">
                    {(result.data.outreachEmail as { body: string }).body}
                  </pre>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setResult(null); setInput({}); }}
                  className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-white/40 hover:text-white/60 text-xs font-bold transition"
                >
                  Run again
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white/60 hover:text-white text-xs font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function SkillsPageInner() {
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [runningSkill, setRunningSkill] = useState<SkillMeta | null>(null);
  const [prefillData, setPrefillData] = useState<Record<string, string>>({});

  useEffect(() => {
    const skillSlug = searchParams.get("skill");
    if (skillSlug) {
      const skill = SKILLS.find((s) => s.slug === skillSlug);
      if (skill) {
        // Build prefill from URL params
        const fill: Record<string, string> = {};
        searchParams.forEach((val, key) => {
          if (key.startsWith("prefill_")) {
            fill[key.replace("prefill_", "")] = val;
          }
        });
        setPrefillData(fill);
        setRunningSkill(skill);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = activeCategory === "all"
    ? SKILLS
    : SKILLS.filter((s) => s.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Himalaya Skills</h1>
          </div>
          <p className="text-sm text-white/35">AI-powered one-click tools. Pick a skill, fill in the inputs, get results in 30 seconds.</p>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              activeCategory === "all"
                ? "bg-white/[0.08] text-white border-white/[0.15]"
                : "text-white/35 border-white/[0.08] hover:text-white/60"
            }`}
          >
            All Skills
          </button>
          {Object.entries(SKILL_CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                activeCategory === key
                  ? "bg-white/[0.08] text-white border-white/[0.15]"
                  : "text-white/35 border-white/[0.08] hover:text-white/60"
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Skills grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((skill) => (
            <SkillCard key={skill.slug} skill={skill} onRun={setRunningSkill} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-white/25">
            <p className="text-lg font-black">No skills in this category yet</p>
            <p className="text-sm mt-1">More skills coming soon</p>
          </div>
        )}
      </main>

      {runningSkill && (
        <SkillRunner skill={runningSkill} onClose={() => { setRunningSkill(null); setPrefillData({}); }} prefillData={prefillData} />
      )}
    </div>
  );
}

export default function SkillsPage() {
  return (
    <Suspense>
      <SkillsPageInner />
    </Suspense>
  );
}
