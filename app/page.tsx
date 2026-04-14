"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  ArrowRight, Sparkles, Mountain, Send, Loader2,
  Zap, Globe, Mail, Users, ChevronRight,
  HelpCircle, BarChart2, Target, Copy,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface LiveStats {
  campaigns: number;
  activeCampaigns: number;
  sites: number;
  publishedSites: number;
  leads: number;
  emailFlows: number;
  activeFlows: number;
  clients: number;
}

interface QuickAction {
  id: string;
  priority: string;
  title: string;
  description: string;
  href: string;
  cta: string;
}

// ── Quick suggestions ────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "Make $10k/month",
  "Get more clients for my agency",
  "Start affiliate marketing",
  "Clone this competitor: ",
  "Scale from $20k to $50k/month",
];

const QUIZ = [
  { q: "Do you have an existing business?", opts: [
    { label: "Yes, I want to grow it", val: "scale" },
    { label: "No, starting fresh", val: "fresh" },
  ]},
  { q: "What sounds best?", opts: [
    { label: "Sell other people's products", val: "affiliate" },
    { label: "Offer my own services", val: "consulting" },
    { label: "Sell products online", val: "dropship" },
    { label: "Build an agency", val: "agency" },
    { label: "Create digital products", val: "digital" },
  ]},
  { q: "How much time can you commit?", opts: [
    { label: "Few hours a week", val: "minimal" },
    { label: "Part-time", val: "parttime" },
    { label: "Full-time — all in", val: "fulltime" },
  ]},
];

const QUIZ_PATHS: Record<string, string> = {
  affiliate: "affiliate marketing",
  consulting: "coaching and consulting",
  dropship: "dropshipping",
  agency: "marketing agency",
  digital: "digital products",
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState<LiveStats | null>(null);
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [commands, setCommands] = useState<{ id: string; priority: number; action: string; details: string; estimatedTime: string; category: string; href?: string; content?: string; completed: boolean }[]>([]);
  const [commandGreeting, setCommandGreeting] = useState("");
  const [commandStats, setCommandStats] = useState<{ streak: number; stage: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState("");
  const [running, setRunning] = useState(false);
  const [runStage, setRunStage] = useState("");
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace("/sign-in");
  }, [isLoaded, isSignedIn, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, aRes, cRes] = await Promise.allSettled([
        fetch("/api/stats").then(r => r.json() as Promise<{ ok: boolean; stats?: Record<string, unknown> | null }>),
        fetch("/api/quick-actions").then(r => r.json() as Promise<{ ok: boolean; actions?: QuickAction[] }>),
        fetch("/api/himalaya/commands").then(r => r.json() as Promise<{ ok: boolean; greeting?: string; commands?: typeof commands; stats?: { streak: number; stage: string } }>),
      ]);
      if (sRes.status === "fulfilled" && sRes.value.ok && sRes.value.stats) {
        const s = sRes.value.stats;
        setStats({
          campaigns: (s.campaigns as number) ?? 0, activeCampaigns: (s.activeCampaigns as number) ?? 0,
          sites: (s.sites as number) ?? 0, publishedSites: (s.publishedSites as number) ?? 0,
          leads: (s.leads as number) ?? 0, emailFlows: (s.emailFlows as number) ?? 0,
          activeFlows: (s.activeFlows as number) ?? 0, clients: (s.clients as number) ?? 0,
        });
      }
      if (aRes.status === "fulfilled" && aRes.value.ok) setActions(aRes.value.actions ?? []);
      if (cRes.status === "fulfilled" && cRes.value.ok) {
        setCommands(cRes.value.commands ?? []);
        setCommandGreeting(cRes.value.greeting ?? "");
        setCommandStats(cRes.value.stats ?? null);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isSignedIn) void fetchData(); }, [fetchData, isSignedIn]);

  // ── Run express ────────────────────────────────────────────────────────────
  async function run(input: string) {
    if (!input.trim()) return;
    setRunning(true);
    setRunStage("Understanding your goal...");
    const stages = ["Understanding your goal...", "Picking your strategy...", "Building your assets...", "Deploying..."];
    let i = 0;
    const iv = setInterval(() => { i++; if (i < stages.length) setRunStage(stages[i]); }, 2500);

    try {
      const isUrl = /^https?:\/\/.+\..+/.test(input.trim());
      const res = await fetch("/api/himalaya/express", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isUrl ? { niche: input, url: input } : { niche: input }),
      });
      const data = await res.json() as { ok: boolean; runId?: string };
      clearInterval(iv);
      if (data.ok && data.runId) {
        router.push(`/himalaya/run/${data.runId}`);
      } else {
        try { sessionStorage.setItem("himalaya_goal", input); } catch { /* */ }
        router.push("/himalaya");
      }
    } catch {
      clearInterval(iv);
      try { sessionStorage.setItem("himalaya_goal", input); } catch { /* */ }
      router.push("/himalaya");
    }
  }

  function quizAnswer(val: string) {
    const ans = [...quizAnswers, val];
    setQuizAnswers(ans);
    if (ans[0] === "scale") {
      void run("Scale my existing business to the next level");
      return;
    }
    if (quizStep + 1 < QUIZ.length) { setQuizStep(quizStep + 1); return; }
    const path = QUIZ_PATHS[ans[1]] ?? "online business";
    const time = ans[2] === "fulltime" ? "full-time" : ans[2] === "parttime" ? "part-time" : "a few hours/week";
    void run(`Start a ${path} business, I can work ${time}`);
  }

  if (!isLoaded || !isSignedIn) return null;
  const name = user?.firstName ?? user?.username ?? "there";
  const hasWork = stats && (stats.campaigns > 0 || stats.sites > 0 || stats.leads > 0);

  // ── Running state ──────────────────────────────────────────────────────────
  if (running) {
    return (
      <main className="min-h-screen bg-[#020509] text-white">
        <AppNav />
        <div className="flex flex-col items-center justify-center min-h-[75vh] gap-5 px-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center animate-pulse">
            <Mountain className="w-8 h-8 text-white" />
          </div>
          <p className="text-base font-bold text-white">{runStage}</p>
          <p className="text-xs text-white/25">Building your entire business. ~60 seconds.</p>
          <Loader2 className="w-4 h-4 text-white/20 animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020509] text-white">
      <AppNav />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-20">

        {/* ── Greeting ── */}
        <div className="pt-16 pb-2 text-center">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            {commandGreeting || <>Hey {name}. <span className="text-white/30">What are we building?</span></>}
          </h1>
        </div>

        {/* ── The one input ── */}
        {!showQuiz && (
          <div className="mt-6 mb-8">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={goal}
                onChange={e => setGoal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") void run(goal); }}
                placeholder="Tell me your goal..."
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 pr-24 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-500/30 transition"
              />
              <button
                onClick={() => void run(goal)}
                disabled={!goal.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-500 text-xs font-bold text-white disabled:opacity-20 hover:bg-cyan-400 transition"
              >
                <Send className="w-3 h-3" /> Go
              </button>
            </div>

            {/* Suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => { setGoal(s); inputRef.current?.focus(); }}
                  className="px-2.5 py-1 rounded-lg border border-white/[0.05] text-[10px] text-white/25 hover:text-white/50 hover:border-white/[0.1] transition">
                  {s}
                </button>
              ))}
            </div>

            {/* Quiz fallback */}
            {!hasWork && (
              <button onClick={() => { setShowQuiz(true); setQuizStep(0); setQuizAnswers([]); }}
                className="mt-4 flex items-center gap-1.5 mx-auto text-[11px] text-white/20 hover:text-white/40 transition">
                <HelpCircle className="w-3 h-3" /> Not sure? Answer 3 quick questions
              </button>
            )}
          </div>
        )}

        {/* ── Quiz ── */}
        {showQuiz && (
          <div className="mt-6 mb-8">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold text-white/20">{quizStep + 1}/{QUIZ.length}</p>
                <button onClick={() => setShowQuiz(false)} className="text-[10px] text-white/20 hover:text-white/40">Cancel</button>
              </div>
              <div className="h-0.5 rounded bg-white/[0.06] mb-5">
                <div className="h-full rounded bg-cyan-500 transition-all" style={{ width: `${((quizStep + 1) / QUIZ.length) * 100}%` }} />
              </div>
              <p className="text-lg font-bold text-white mb-4">{QUIZ[quizStep].q}</p>
              <div className="space-y-2">
                {QUIZ[quizStep].opts.map(o => (
                  <button key={o.val} onClick={() => quizAnswer(o.val)}
                    className="w-full text-left px-4 py-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-sm text-white/60 hover:border-cyan-500/20 hover:text-white transition">
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Live status (returning users) ── */}
        {hasWork && !loading && stats && (
          <div className="mb-6 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.04]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[10px] font-bold text-white/30">Live</p>
            </div>
            <div className="grid grid-cols-4 divide-x divide-white/[0.04]">
              {([
                { l: "Campaigns", v: stats.campaigns, a: stats.activeCampaigns, h: "/campaigns", c: "text-cyan-400", i: Zap },
                { l: "Sites", v: stats.sites, a: stats.publishedSites, h: "/websites", c: "text-violet-400", i: Globe },
                { l: "Emails", v: stats.emailFlows, a: stats.activeFlows, h: "/emails", c: "text-blue-400", i: Mail },
                { l: "Leads", v: stats.leads, a: null, h: "/leads", c: "text-emerald-400", i: Users },
              ] as const).map(m => (
                <Link key={m.l} href={m.h} className="px-3 py-3 hover:bg-white/[0.02] transition text-center">
                  <m.i className={`w-3 h-3 ${m.c} mx-auto mb-1`} />
                  <p className="text-lg font-black text-white">{m.v}</p>
                  <p className="text-[9px] text-white/20">{m.a !== null ? `${m.a} active` : m.l}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Daily commands — "do this now" ── */}
        {commands.length > 0 && !loading && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-white/15">TODAY&apos;S COMMANDS</p>
              {commandStats && commandStats.streak > 0 && (
                <p className="text-[10px] font-bold text-cyan-400/40">{commandStats.streak}-day streak</p>
              )}
            </div>
            <div className="space-y-2">
              {commands.map((cmd, i) => {
                const priorityStyle = cmd.priority === 1 ? "border-cyan-500/15 bg-cyan-500/[0.03]" : "border-white/[0.04]";
                return (
                  <div key={cmd.id} className={`rounded-xl border ${priorityStyle} px-4 py-3`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${cmd.priority === 1 ? "border-cyan-500/30 text-cyan-400" : "border-white/[0.08] text-white/20"}`}>
                          <span className="text-[9px] font-black">{i + 1}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white">{cmd.action}</p>
                          <p className="text-[11px] text-white/25 mt-0.5">{cmd.details}</p>
                          {cmd.content && (
                            <div className="mt-2 rounded-lg bg-white/[0.03] border border-white/[0.04] px-3 py-2">
                              <p className="text-[11px] text-white/50 italic">&ldquo;{cmd.content}&rdquo;</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] text-white/15">{cmd.estimatedTime}</span>
                        {cmd.href && (
                          <Link href={cmd.href} className="text-[10px] font-bold text-cyan-400/60 hover:text-cyan-400 transition">
                            Do it →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Fallback actions if no commands ── */}
        {commands.length === 0 && actions.length > 0 && !loading && (
          <div className="mb-6 space-y-1.5">
            {actions.slice(0, 3).map(a => (
              <Link key={a.id} href={a.href}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.04] px-4 py-2.5 hover:border-white/[0.08] transition group">
                <p className="text-xs text-white/40 group-hover:text-white/70 transition truncate">{a.title}</p>
                <ChevronRight className="w-3 h-3 text-white/10 shrink-0" />
              </Link>
            ))}
          </div>
        )}

        {/* ── Quick access ── */}
        <div className="mb-6">
          <p className="text-[10px] font-bold text-white/15 mb-2">{hasWork ? "JUMP TO" : "GO DIRECTLY TO"}</p>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { l: "Campaigns", h: "/campaigns", i: Zap, c: "text-cyan-400" },
              { l: "Sites", h: "/websites", i: Globe, c: "text-violet-400" },
              { l: "Emails", h: "/emails", i: Mail, c: "text-blue-400" },
              { l: "CRM", h: "/clients", i: Users, c: "text-emerald-400" },
              { l: "Analytics", h: "/analytics", i: BarChart2, c: "text-amber-400" },
              { l: "Tools", h: "/tools", i: Target, c: "text-pink-400" },
            ].map(item => (
              <Link key={item.l} href={item.h}
                className="flex items-center gap-2 rounded-lg border border-white/[0.04] px-3 py-2.5 hover:border-white/[0.08] hover:bg-white/[0.02] transition group">
                <item.i className={`w-3.5 h-3.5 ${item.c}`} />
                <span className="text-[11px] font-semibold text-white/35 group-hover:text-white/60 transition">{item.l}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Himalaya link ── */}
        <div className="text-center space-y-2">
          {hasWork && (
            <Link href="/dashboard"
              className="inline-flex items-center gap-2 text-[11px] text-white/25 hover:text-white/50 transition">
              <BarChart2 className="w-3 h-3" /> Open full dashboard <ArrowRight className="w-3 h-3" />
            </Link>
          )}
          <br />
          <Link href="/himalaya"
            className="inline-flex items-center gap-2 text-[11px] text-white/15 hover:text-white/35 transition">
            <Sparkles className="w-3 h-3" /> Open Himalaya system <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </main>
  );
}
