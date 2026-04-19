"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import SimpleMode from "@/components/SimpleMode";
import { useAppMode } from "@/lib/theme/ModeProvider";
import {
  ArrowRight, Sparkles, Mountain, Send, Loader2,
  Zap, Globe, Mail, Users, Flame, BarChart2,
  Target, ExternalLink, Trash2, ToggleLeft, ToggleRight,
} from "lucide-react";

type Project = {
  id: string;
  name: string;
  niche: string;
  createdAt: string;
  site?: { id: string; slug: string; published: boolean; views: number };
  campaign?: { id: string; status: string; variationCount: number };
  emailFlow?: { id: string; status: string; enrolled: number; sent: number };
  leadCount: number;
  revenue: number;
};

type Command = { id: string; priority: number; action: string; details: string; estimatedTime: string; content?: string; href?: string };

export default function Home() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { mode, setMode } = useAppMode();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [projects, setProjects] = useState<Project[]>([]);
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
      const [pRes, cRes] = await Promise.allSettled([
        fetch("/api/himalaya/projects").then(r => r.json()),
        fetch("/api/himalaya/commands").then(r => r.json()),
      ]);
      if (pRes.status === "fulfilled" && pRes.value.ok) setProjects(pRes.value.projects ?? []);
      if (cRes.status === "fulfilled" && cRes.value.ok) {
        setCommands(cRes.value.commands ?? []);
        setGreeting(cRes.value.greeting ?? "");
        setStreak(cRes.value.stats?.streak ?? 0);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isSignedIn) void load(); }, [load, isSignedIn]);

  async function deleteProject(projectId: string) {
    if (!confirm("Delete this business? This removes the site, campaign, and emails. This cannot be undone.")) return;
    try {
      await fetch(`/api/himalaya/projects/${projectId}`, { method: "DELETE" });
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch { /* ignore */ }
  }

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
      if (data.ok && data.runId) router.push(`/himalaya/run/${data.runId}`);
      else router.push("/himalaya");
    } catch { clearInterval(iv); router.push("/himalaya"); }
  }

  if (!isLoaded || !isSignedIn) return null;
  const name = user?.firstName ?? user?.username ?? "there";

  if (running) {
    return (
      <main className="min-h-screen bg-t-bg text-t-text">
        <AppNav />
        <div className="flex flex-col items-center justify-center min-h-[75vh] gap-5 px-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f5a623] to-[#e07850] flex items-center justify-center animate-pulse">
            <Mountain className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg font-black">{stage}</p>
          <p className="text-sm text-t-text-muted">About 60 seconds.</p>
          <Loader2 className="w-4 h-4 text-t-text-faint animate-spin" />
        </div>
      </main>
    );
  }

  // Simple Mode — Duolingo-style one action at a time
  if (mode === "simple") {
    return (
      <main className="min-h-screen bg-t-bg text-t-text">
        <AppNav />
        <div className="px-4 sm:px-6 pb-20">
          {/* Mode toggle + greeting */}
          <div className="max-w-md mx-auto pt-8 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-black">{greeting || `Hey ${name}.`}</h1>
              {/* Only show Pro toggle after user has built at least one business */}
              {projects.length > 0 && (
                <button onClick={() => setMode("pro")}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-t-border text-[10px] font-bold text-t-text-faint hover:text-t-text transition">
                  <ToggleLeft className="w-3.5 h-3.5" /> Pro Mode
                </button>
              )}
            </div>
          </div>

          <SimpleMode />

          {/* Build new */}
          <div className="max-w-md mx-auto mt-8">
            <div className="relative">
              <input ref={inputRef} type="text" value={goal} onChange={e => setGoal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") void run(goal); }}
                placeholder="Build another business..."
                className="w-full rounded-2xl border border-t-border bg-t-bg-raised px-5 py-3.5 pr-20 text-sm placeholder-t-text-faint outline-none focus:border-[#f5a623]/30 transition" />
              <button onClick={() => void run(goal)} disabled={!goal.trim()}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 px-3 py-2 rounded-xl bg-[#f5a623] text-xs font-bold text-[#0c0a08] disabled:opacity-20">
                <Send className="w-3 h-3" /> Go
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Pro Mode — full dashboard with all features
  return (
    <main className="min-h-screen bg-t-bg text-t-text">
      <AppNav />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-20">

        {/* ── Greeting ── */}
        <div className="pt-12 pb-2">
          <div className="flex items-center justify-between">
            <div>
              {streak > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/20 mb-2">
                  <Flame className="w-3 h-3 text-[#f5a623]" />
                  <span className="text-[11px] font-bold text-[#f5a623]">{streak}-day streak</span>
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {greeting || `Hey ${name}.`}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setMode("simple")}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-t-border text-[10px] font-bold text-t-text-faint hover:text-t-text transition">
                <ToggleRight className="w-3.5 h-3.5" /> Simple
              </button>
              <Link href="/dashboard" className="text-xs text-t-text-faint hover:text-t-text-muted transition">
                Dashboard →
              </Link>
            </div>
          </div>
        </div>

        {/* ── Build new ── */}
        <div className="mt-4 mb-6">
          <div className="relative">
            <input ref={inputRef} type="text" value={goal} onChange={e => setGoal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") void run(goal); }}
              placeholder="Build a new business — type your goal..."
              className="w-full rounded-2xl border border-t-border bg-t-bg-raised px-5 py-4 pr-24 text-base placeholder-t-text-faint outline-none focus:border-[#f5a623]/30 transition" />
            <button onClick={() => void run(goal)} disabled={!goal.trim()}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#f5a623] text-sm font-bold text-[#0c0a08] disabled:opacity-20 hover:opacity-90 transition">
              <Send className="w-3.5 h-3.5" /> Go
            </button>
          </div>
        </div>

        {/* ── Your Projects ── */}
        {!loading && projects.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-t-text-faint mb-3">YOUR BUSINESSES</p>
            <div className="space-y-3">
              {projects.map(project => {
                const appUrl = typeof window !== "undefined" ? window.location.origin : "";
                const siteUrl = project.site?.published ? `${appUrl}/s/${project.site.slug}` : null;
                return (
                  <div key={project.id} className="rounded-2xl border border-t-border bg-t-bg-raised p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <Link href={`/project/${project.id}`} className="hover:opacity-80 transition">
                        <h3 className="text-base font-black">{project.name}</h3>
                        <p className="text-xs text-t-text-faint">{project.niche}</p>
                      </Link>
                      <div className="flex items-center gap-2">
                        {project.revenue > 0 && <span className="text-lg font-black text-emerald-500">${project.revenue.toLocaleString()}</span>}
                        <button onClick={() => void deleteProject(project.id)} title="Delete business"
                          className="p-1.5 rounded-lg text-t-text-faint hover:text-red-400 hover:bg-red-500/10 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[
                        { icon: Globe, val: project.site?.views ?? 0, label: "Views", color: "text-[#e07850]" },
                        { icon: Zap, val: project.campaign?.variationCount ?? 0, label: "Ads", color: "text-[#f5a623]" },
                        { icon: Mail, val: project.emailFlow?.sent ?? 0, label: "Emails", color: "text-blue-400" },
                        { icon: Users, val: project.leadCount, label: "Leads", color: "text-emerald-400" },
                      ].map(m => (
                        <div key={m.label} className="rounded-xl bg-t-bg-card px-3 py-2 text-center">
                          <m.icon className={`w-3 h-3 ${m.color} mx-auto mb-0.5`} />
                          <p className="text-sm font-bold">{m.val}</p>
                          <p className="text-[9px] text-t-text-faint">{m.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {siteUrl && (
                        <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500 hover:bg-emerald-500/20 transition">
                          <ExternalLink className="w-3 h-3" /> Live Site
                        </a>
                      )}
                      {project.site && !project.site.published && (
                        <Link href={`/websites/${project.site.id}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-t-bg-card border border-t-border text-[10px] font-bold text-t-text-muted hover:text-t-text transition">
                          <Globe className="w-3 h-3" /> Edit Site
                        </Link>
                      )}
                      {project.campaign && (
                        <Link href={`/campaigns/${project.campaign.id}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-t-bg-card border border-t-border text-[10px] font-bold text-t-text-muted hover:text-t-text transition">
                          <Zap className="w-3 h-3" /> Ads
                        </Link>
                      )}
                      {project.emailFlow && (
                        <Link href={`/emails/flows/${project.emailFlow.id}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-t-bg-card border border-t-border text-[10px] font-bold text-t-text-muted hover:text-t-text transition">
                          <Mail className="w-3 h-3" /> Emails
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && projects.length === 0 && (
          <div className="mb-6 rounded-2xl border border-t-border bg-t-bg-raised p-6 text-center">
            <Mountain className="w-8 h-8 text-t-text-faint mx-auto mb-3" />
            <h3 className="text-base font-bold mb-1">No businesses yet</h3>
            <p className="text-sm text-t-text-muted mb-4">Type your goal above and we&apos;ll build your first business in 60 seconds.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["Make $10k/month", "Start dropshipping", "Get more clients", "Build an agency"].map(s => (
                <button key={s} onClick={() => { setGoal(s); inputRef.current?.focus(); }}
                  className="px-3 py-1.5 rounded-xl border border-t-border text-xs text-t-text-muted hover:text-t-text transition">{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* ── Commands ── */}
        {commands.length > 0 && !loading && (
          <div className="mb-6">
            <p className="text-xs font-bold text-t-text-faint mb-2">DO THIS NOW</p>
            <div className="space-y-2">
              {commands.slice(0, 4).map((cmd, i) => (
                <div key={cmd.id} className={`rounded-2xl border px-4 py-3.5 ${cmd.priority === 1 ? "border-[#f5a623]/15 bg-[#f5a623]/[0.03]" : "border-t-border"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${cmd.priority === 1 ? "border-[#f5a623]/30 text-[#f5a623]" : "border-t-border text-t-text-faint"}`}>
                        <span className="text-[10px] font-black">{i + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold">{cmd.action}</p>
                        <p className="text-xs text-t-text-faint mt-0.5">{cmd.details}</p>
                        {cmd.content && (
                          <div className="mt-2 rounded-xl bg-t-bg-card border border-t-border px-3 py-2">
                            <p className="text-xs text-t-text-muted italic">&ldquo;{cmd.content}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {cmd.href && (
                      <Link href={cmd.href} className="shrink-0 text-xs font-bold text-[#f5a623]/60 hover:text-[#f5a623] transition">Do it →</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tools ── */}
        <div className="mb-6">
          <p className="text-xs font-bold text-t-text-faint mb-2">TOOLS</p>
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
                className="flex items-center gap-2.5 rounded-xl border border-t-border px-3 py-3 hover:bg-t-bg-raised transition group">
                <item.i className={`w-4 h-4 ${item.c}`} />
                <span className="text-xs font-semibold text-t-text-muted group-hover:text-t-text transition">{item.l}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
