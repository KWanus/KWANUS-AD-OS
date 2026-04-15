"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  ArrowRight, Sparkles, Mountain, Send, Loader2,
  Zap, Globe, Mail, Users, ChevronRight, BarChart2,
  Flame, Target,
} from "lucide-react";

type LiveStats = { campaigns: number; activeCampaigns: number; sites: number; publishedSites: number; leads: number; emailFlows: number; activeFlows: number; clients: number };
type Command = { id: string; priority: number; action: string; details: string; estimatedTime: string; content?: string; href?: string };

export default function Home() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState<LiveStats | null>(null);
  const [commands, setCommands] = useState<Command[]>([]);
  const [greeting, setGreeting] = useState("");
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState("");
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState("");

  useEffect(() => { if (isLoaded && !isSignedIn) router.replace("/sign-in"); }, [isLoaded, isSignedIn, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.allSettled([
        fetch("/api/stats").then(r => r.json()),
        fetch("/api/himalaya/commands").then(r => r.json()),
      ]);
      if (s.status === "fulfilled" && s.value.ok && s.value.stats) {
        const d = s.value.stats;
        setStats({ campaigns: d.campaigns ?? 0, activeCampaigns: d.activeCampaigns ?? 0, sites: d.sites ?? 0, publishedSites: d.publishedSites ?? 0, leads: d.leads ?? 0, emailFlows: d.emailFlows ?? 0, activeFlows: d.activeFlows ?? 0, clients: d.clients ?? 0 });
      }
      if (c.status === "fulfilled" && c.value.ok) {
        setCommands(c.value.commands ?? []);
        setGreeting(c.value.greeting ?? "");
        setStreak(c.value.stats?.streak ?? 0);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isSignedIn) void load(); }, [load, isSignedIn]);

  async function run(input: string) {
    if (!input.trim()) return;
    setRunning(true);
    setStage("Understanding your goal...");
    const msgs = ["Understanding your goal...", "Picking your strategy...", "Building everything...", "Going live..."];
    let i = 0;
    const iv = setInterval(() => { i++; if (i < msgs.length) setStage(msgs[i]); }, 3000);
    try {
      const isUrl = /^https?:\/\/.+\..+/.test(input.trim());
      const res = await fetch("/api/himalaya/express", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: input, ...(isUrl ? { url: input } : {}) }),
      });
      const data = await res.json() as { ok: boolean; runId?: string };
      clearInterval(iv);
      if (data.ok && data.runId) { router.push(`/himalaya/run/${data.runId}`); }
      else { try { sessionStorage.setItem("himalaya_goal", input); } catch {} router.push("/himalaya"); }
    } catch { clearInterval(iv); router.push("/himalaya"); }
  }

  if (!isLoaded || !isSignedIn) return null;
  const name = user?.firstName ?? user?.username ?? "there";
  const hasWork = stats && (stats.campaigns > 0 || stats.sites > 0 || stats.leads > 0);

  if (running) {
    return (
      <main className="min-h-screen bg-[#0c0a08] text-white">
        <AppNav />
        <div className="flex flex-col items-center justify-center min-h-[75vh] gap-5 px-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f5a623] to-[#e07850] flex items-center justify-center animate-pulse">
            <Mountain className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg font-black text-white">{stage}</p>
          <p className="text-sm text-white/25">About 60 seconds.</p>
          <Loader2 className="w-4 h-4 text-white/20 animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0c0a08] text-white">
      <AppNav />
      <div className="max-w-xl mx-auto px-4 sm:px-6 pb-20">

        {/* ── Greeting ── */}
        <div className="pt-14 pb-2 text-center">
          {streak > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/20 mb-3">
              <Flame className="w-3 h-3 text-[#f5a623]" />
              <span className="text-[11px] font-bold text-[#f5a623]">{streak}-day streak</span>
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            {greeting || <>Hey {name}.</>}
          </h1>
        </div>

        {/* ── The one input ── */}
        <div className="mt-6 mb-8">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={goal}
              onChange={e => setGoal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") void run(goal); }}
              placeholder="What do you want? Type anything..."
              className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 pr-24 text-base text-white placeholder-white/20 outline-none focus:border-[#f5a623]/30 transition"
            />
            <button onClick={() => void run(goal)} disabled={!goal.trim()}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#f5a623] text-sm font-bold text-white disabled:opacity-20 hover:bg-[#f5a623] transition">
              <Send className="w-3.5 h-3.5" /> Go
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
            {["Make $10k/month", "Get more clients", "Start dropshipping", "Scale my business"].map(s => (
              <button key={s} onClick={() => { setGoal(s); inputRef.current?.focus(); }}
                className="px-3 py-1.5 rounded-xl border border-white/[0.05] text-xs text-white/25 hover:text-white/50 hover:border-white/[0.1] transition">{s}</button>
            ))}
          </div>
        </div>

        {/* ── Live status ── */}
        {hasWork && !loading && stats && (
          <div className="mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.04]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs font-bold text-white/30">Your business is running</p>
            </div>
            <div className="grid grid-cols-4 divide-x divide-white/[0.04]">
              {([
                { l: "Campaigns", v: stats.campaigns, h: "/campaigns", c: "text-[#f5a623]", i: Zap },
                { l: "Sites", v: stats.sites, h: "/websites", c: "text-[#e07850]", i: Globe },
                { l: "Emails", v: stats.emailFlows, h: "/emails", c: "text-blue-400", i: Mail },
                { l: "Leads", v: stats.leads, h: "/leads", c: "text-emerald-400", i: Users },
              ] as const).map(m => (
                <Link key={m.l} href={m.h} className="px-3 py-3 hover:bg-white/[0.02] transition text-center">
                  <m.i className={`w-3.5 h-3.5 ${m.c} mx-auto mb-1`} />
                  <p className="text-xl font-black text-white">{m.v}</p>
                  <p className="text-[10px] text-white/20">{m.l}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Daily commands ── */}
        {commands.length > 0 && !loading && (
          <div className="mb-6">
            <p className="text-xs font-bold text-white/15 mb-2">DO THIS NOW</p>
            <div className="space-y-2">
              {commands.slice(0, 4).map((cmd, i) => (
                <div key={cmd.id} className={`rounded-2xl border px-4 py-3.5 ${cmd.priority === 1 ? "border-[#f5a623]/15 bg-[#f5a623]/[0.03]" : "border-white/[0.04]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${cmd.priority === 1 ? "border-[#f5a623]/30 text-[#f5a623]" : "border-white/[0.08] text-white/20"}`}>
                        <span className="text-[10px] font-black">{i + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white">{cmd.action}</p>
                        <p className="text-xs text-white/25 mt-0.5">{cmd.details}</p>
                        {cmd.content && (
                          <div className="mt-2 rounded-xl bg-white/[0.03] border border-white/[0.04] px-3 py-2">
                            <p className="text-xs text-white/40 italic">&ldquo;{cmd.content}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {cmd.href && (
                      <Link href={cmd.href} className="shrink-0 text-xs font-bold text-[#f5a623]/60 hover:text-[#f5a623] transition whitespace-nowrap">
                        Do it →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Quick access ── */}
        <div className="mb-6">
          <p className="text-xs font-bold text-white/15 mb-2">{hasWork ? "JUMP TO" : "GO TO"}</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { l: "Campaigns", h: "/campaigns", i: Zap, c: "text-[#f5a623]" },
              { l: "Sites", h: "/websites", i: Globe, c: "text-[#e07850]" },
              { l: "Emails", h: "/emails", i: Mail, c: "text-blue-400" },
              { l: "CRM", h: "/clients", i: Users, c: "text-emerald-400" },
              { l: "Analytics", h: "/analytics", i: BarChart2, c: "text-[#f5a623]" },
              { l: "Tools", h: "/tools", i: Target, c: "text-pink-400" },
            ].map(item => (
              <Link key={item.l} href={item.h}
                className="flex items-center gap-2.5 rounded-xl border border-white/[0.04] px-3 py-3 hover:border-white/[0.08] hover:bg-white/[0.02] transition group">
                <item.i className={`w-4 h-4 ${item.c}`} />
                <span className="text-xs font-semibold text-white/35 group-hover:text-white/60 transition">{item.l}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Links ── */}
        <div className="text-center space-y-1">
          {hasWork && (
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs text-white/25 hover:text-white/50 transition">
              <BarChart2 className="w-3 h-3" /> Full dashboard <ArrowRight className="w-3 h-3" />
            </Link>
          )}
          <br />
          <Link href="/himalaya" className="inline-flex items-center gap-2 text-xs text-white/15 hover:text-white/35 transition">
            <Sparkles className="w-3 h-3" /> Himalaya system <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </main>
  );
}
