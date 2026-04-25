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
  Target, ExternalLink, Trash2, Copy, ToggleLeft, ToggleRight,
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
  const [insights, setInsights] = useState<{ notifications: number; advisor?: string; opportunities: number }| null>(null);
  const [bizType, setBizType] = useState("");
  const [playbookWeek, setPlaybookWeek] = useState(1);

  // Don't redirect logged-out users — show landing page
  // But redirect NEW signed-in users to onboarding if they have no projects
  const [checkedOnboarding, setCheckedOnboarding] = useState(false);

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
        setBizType(cRes.value.stats?.bizType ?? "");
        setPlaybookWeek(cRes.value.stats?.playbookWeek ?? 1);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    void load();
    // Fetch insights from autonomous systems (non-blocking)
    Promise.allSettled([
      fetch("/api/notifications").then(r => r.json()),
      fetch("/api/himalaya/advisor").then(r => r.json()),
    ]).then(([notifRes, advisorRes]) => {
      const notifs = notifRes.status === "fulfilled" ? notifRes.value : {};
      const advisor = advisorRes.status === "fulfilled" ? advisorRes.value : {};
      const unread = (notifs.notifications ?? []).filter((n: { read: boolean }) => !n.read).length;
      setInsights({
        notifications: unread,
        advisor: advisor.advice ?? advisor.recommendation ?? undefined,
        opportunities: (notifs.notifications ?? []).filter((n: { type: string }) => n.type === "new_lead" || n.type === "insight").length,
      });
    }).catch(() => {});

    // Check if new user needs onboarding
    fetch("/api/settings").then(r => r.json()).then(data => {
      if (data.ok && !data.settings?.onboardingCompleted) {
        // Preserve ?plan param from pricing page through signup flow
        const params = typeof window !== "undefined" ? window.location.search : "";
        router.replace(`/setup${params}`);
      } else {
        setCheckedOnboarding(true);
      }
    }).catch(() => setCheckedOnboarding(true));
  }, [load, isSignedIn, router]);

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
      if (data.ok && data.runId) router.push(`/built/${data.runId}`);
      else router.push("/himalaya");
    } catch { clearInterval(iv); router.push("/himalaya"); }
  }

  if (!isLoaded) return null;
  if (isSignedIn && !checkedOnboarding) return null; // Wait for onboarding check

  // ═══ PUBLIC LANDING PAGE (logged out) ═══
  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-[#0c0a08] text-[#f5f0e8]">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f5a623] to-[#e07850] flex items-center justify-center">
              <Mountain className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black">Himalaya</span>
          </div>
          <Link href="/sign-in"
            className="px-4 py-2 rounded-xl bg-[#f5a623] text-sm font-bold text-[#0c0a08] hover:opacity-90 transition">
            Get Started
          </Link>
        </nav>

        {/* Hero */}
        <section className="max-w-3xl mx-auto px-6 pt-16 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/20 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#f5a623]" />
            <span className="text-[11px] font-bold text-[#f5a623]">AI-Powered Business Builder</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
            Tell us your goal.<br />
            <span className="text-[#f5a623]">We build the business.</span>
          </h1>
          <p className="text-lg text-[#f5f0e8]/50 max-w-xl mx-auto mb-8">
            Website, ads, emails, scripts, funnels — built in 60 seconds.
            You just approve and launch. No skills required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sign-up"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-base font-bold text-[#0c0a08] hover:opacity-90 transition">
              <Mountain className="w-5 h-5" /> Start Free — Build in 60 Seconds
            </Link>
            <Link href="/sign-in"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-[#f5f0e8]/10 text-base font-bold text-[#f5f0e8]/60 hover:text-[#f5f0e8] hover:border-[#f5f0e8]/20 transition">
              I have an account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* What you get */}
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <p className="text-[10px] font-black text-[#f5a623] tracking-[0.3em] text-center mb-8">EVERYTHING BUILT FOR YOU</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Globe, label: "Website", desc: "Conversion-optimized landing page", color: "text-[#e07850]" },
              { icon: Zap, label: "Ad Creatives", desc: "Images + copy for every platform", color: "text-[#f5a623]" },
              { icon: Mail, label: "Email Flows", desc: "Welcome, cart recovery, follow-up", color: "text-blue-400" },
              { icon: Target, label: "Video Scripts", desc: "15-sec TikTok/Reels scripts", color: "text-emerald-400" },
            ].map(f => (
              <div key={f.label} className="rounded-2xl border border-[#f5f0e8]/[0.06] bg-[#f5f0e8]/[0.02] p-5">
                <f.icon className={`w-6 h-6 ${f.color} mb-3`} />
                <p className="text-sm font-black mb-1">{f.label}</p>
                <p className="text-xs text-[#f5f0e8]/30">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Social proof */}
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <div className="flex flex-wrap items-center justify-center gap-6 text-center">
            {[
              { val: "500+", label: "Businesses Built" },
              { val: "24", label: "Ad Templates" },
              { val: "11", label: "Automations Running Daily" },
              { val: "60s", label: "Average Build Time" },
            ].map(s => (
              <div key={s.label} className="px-4">
                <p className="text-2xl font-black text-[#f5a623]">{s.val}</p>
                <p className="text-[10px] text-[#f5f0e8]/25 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <p className="text-[10px] font-black text-[#f5a623] tracking-[0.3em] text-center mb-8">WHAT USERS SAY</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { quote: "I had no idea what I was doing. Told Himalaya I wanted to coach people and in 60 seconds I had a site, emails, and ad scripts. Made my first sale in 3 days.", name: "Marcus T.", role: "Online Coach", stars: 5 },
              { quote: "I was paying $200/month for 4 different tools. Switched to Himalaya and it does everything in one place — plus the AI actually writes better copy than I could.", name: "Sarah K.", role: "E-commerce", stars: 5 },
              { quote: "The auto-optimizer killed my losing ads and doubled my winners. My ROAS went from 1.2 to 3.4 in the first month without me touching anything.", name: "David R.", role: "Agency Owner", stars: 5 },
            ].map(t => (
              <div key={t.name} className="rounded-2xl border border-[#f5f0e8]/[0.06] bg-[#f5f0e8]/[0.02] p-5">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <span key={i} className="text-[#f5a623] text-sm">★</span>
                  ))}
                </div>
                <p className="text-xs text-[#f5f0e8]/50 leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-xs font-black">{t.name}</p>
                  <p className="text-[10px] text-[#f5f0e8]/25">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* What replaces */}
        <section className="max-w-3xl mx-auto px-6 pb-20">
          <p className="text-[10px] font-black text-[#f5a623] tracking-[0.3em] text-center mb-8">REPLACES YOUR ENTIRE TOOL STACK</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { tool: "Shopify", replaced: "Website Builder", savings: "$39/mo" },
              { tool: "Mailchimp", replaced: "Email Automation", savings: "$20/mo" },
              { tool: "Canva", replaced: "Ad Creator", savings: "$13/mo" },
              { tool: "HubSpot", replaced: "CRM + Pipeline", savings: "$50/mo" },
              { tool: "Google Analytics", replaced: "Analytics + Funnels", savings: "$0" },
              { tool: "Calendly", replaced: "Booking System", savings: "$12/mo" },
            ].map(t => (
              <div key={t.tool} className="rounded-xl border border-[#f5f0e8]/[0.06] bg-[#f5f0e8]/[0.02] px-4 py-3 text-center">
                <p className="text-xs font-black text-[#f5f0e8]/20 line-through">{t.tool}</p>
                <p className="text-[10px] font-bold text-[#f5a623] mt-0.5">{t.replaced}</p>
                <p className="text-[9px] text-[#f5f0e8]/20 mt-0.5">Saves {t.savings}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-[#f5f0e8]/20 mt-4">Total savings: <span className="text-[#f5a623] font-bold">$134+/month</span></p>
        </section>

        {/* How it works */}
        <section className="max-w-3xl mx-auto px-6 pb-20">
          <p className="text-[10px] font-black text-[#f5a623] tracking-[0.3em] text-center mb-8">HOW IT WORKS</p>
          <div className="space-y-4">
            {[
              { step: "1", title: "Tell us your goal", desc: "\"I want to make $10k/month coaching\" or paste your website URL. That's all we need." },
              { step: "2", title: "We build everything", desc: "In 60 seconds: website, ads, emails, scripts, funnels — all customized to your niche." },
              { step: "3", title: "You approve and launch", desc: "Review what we built. Edit anything you want. Hit approve. You're live." },
            ].map(s => (
              <div key={s.step} className="flex gap-4 rounded-2xl border border-[#f5f0e8]/[0.06] bg-[#f5f0e8]/[0.02] p-5">
                <div className="w-10 h-10 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-[#f5a623]">{s.step}</span>
                </div>
                <div>
                  <p className="text-sm font-black mb-1">{s.title}</p>
                  <p className="text-xs text-[#f5f0e8]/40 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-2xl mx-auto px-6 pb-20 text-center">
          <div className="rounded-2xl border border-[#f5a623]/15 bg-gradient-to-br from-[#f5a623]/[0.06] to-transparent p-8">
            <h2 className="text-2xl font-black mb-2">Ready to start?</h2>
            <p className="text-sm text-[#f5f0e8]/40 mb-6">No credit card. No technical skills. Just tell us your goal.</p>
            <Link href="/sign-up"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-base font-bold text-[#0c0a08] hover:opacity-90 transition">
              <Mountain className="w-5 h-5" /> Build My Business Now
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#f5f0e8]/[0.06] py-6 text-center">
          <p className="text-[10px] text-[#f5f0e8]/20">Himalaya — The autonomous business operating system</p>
        </footer>
      </main>
    );
  }

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

          {/* Build new — only show after first business is built */}
          {projects.length > 0 && (
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
          )}
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

        {/* ── Playbook progress ── */}
        {bizType && projects.length > 0 && (
          <Link href="/playbook/tasks"
            className="flex items-center justify-between rounded-xl border border-[#f5a623]/15 bg-[#f5a623]/[0.03] px-4 py-3 mb-4 group hover:border-[#f5a623]/25 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-black text-[#f5a623]">{playbookWeek}</span>
              </div>
              <div>
                <p className="text-xs font-bold">Week {playbookWeek} of 6 — {
                  playbookWeek <= 1 ? "Foundation" :
                  playbookWeek <= 2 ? "Launch & Test" :
                  playbookWeek <= 3 ? "First Wins" :
                  playbookWeek <= 4 ? "Deliver & Scale" :
                  playbookWeek <= 5 ? "Systemize" : "Full Speed"
                }</p>
                <p className="text-[10px] text-t-text-faint">Your {bizType.replace(/_/g, " ")} playbook</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#f5a623]/40 group-hover:text-[#f5a623] transition" />
          </Link>
        )}

        {/* ── Insights — what happened while you were away ── */}
        {insights && (insights.notifications > 0 || insights.advisor || insights.opportunities > 0) && (
          <div className="mb-6 rounded-2xl border border-[#f5a623]/15 bg-gradient-to-br from-[#f5a623]/[0.04] to-transparent p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black text-[#f5a623] tracking-widest">WHILE YOU WERE AWAY</p>
              <Link href="/notifications" className="text-[10px] font-bold text-t-text-faint hover:text-[#f5a623] transition">
                View all →
              </Link>
            </div>
            <div className="space-y-2">
              {insights.notifications > 0 && (
                <Link href="/notifications" className="flex items-center gap-3 rounded-xl bg-t-bg-card border border-t-border px-4 py-3 hover:border-[#f5a623]/20 transition">
                  <div className="w-8 h-8 rounded-full bg-[#f5a623]/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-black text-[#f5a623]">{insights.notifications}</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold">New notifications</p>
                    <p className="text-[10px] text-t-text-faint">Opportunities, leads, and system updates</p>
                  </div>
                </Link>
              )}
              {insights.advisor && (
                <div className="rounded-xl bg-t-bg-card border border-t-border px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-3 h-3 text-[#f5a623]" />
                    <p className="text-[10px] font-black text-[#f5a623]">AI ADVISOR</p>
                  </div>
                  <p className="text-xs text-t-text-muted leading-relaxed">{insights.advisor}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Your Projects ── */}
        {!loading && projects.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] font-black text-t-text-faint tracking-widest mb-3">YOUR BUSINESSES</p>
            <div className="space-y-3">
              {projects.map(project => {
                const appUrl = typeof window !== "undefined" ? window.location.origin : "";
                const siteUrl = project.site?.published ? `${appUrl}/s/${project.site.slug}` : null;
                return (
                  <div key={project.id} className="rounded-2xl border border-t-border bg-t-bg-raised overflow-hidden hover:border-[#f5a623]/15 transition group">
                    {/* Main clickable area → project hub */}
                    <Link href={`/project/${project.id}`} className="block p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="text-base font-black group-hover:text-[#f5a623] transition">{project.name}</h3>
                          <p className="text-xs text-t-text-faint">{project.niche}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {project.revenue > 0 && (
                            <div className="text-right">
                              <p className="text-lg font-black text-emerald-400">${project.revenue.toLocaleString()}</p>
                              <p className="text-[8px] text-emerald-400/60">Revenue</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status badges */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {project.site?.published && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Site Live</span>}
                        {!project.site?.published && project.site && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20">Site Ready</span>}
                        {(project.campaign?.variationCount ?? 0) > 0 && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20">{project.campaign?.variationCount} Ads</span>}
                        {project.emailFlow && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-400/10 text-blue-400 border border-blue-400/20">Emails Active</span>}
                      </div>

                      {/* Quick stats row */}
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { icon: Globe, val: project.site?.views ?? 0, label: "Views", color: "text-[#e07850]" },
                          { icon: Zap, val: project.campaign?.variationCount ?? 0, label: "Ads", color: "text-[#f5a623]" },
                          { icon: Mail, val: project.emailFlow?.sent ?? 0, label: "Emails", color: "text-blue-400" },
                          { icon: Users, val: project.leadCount, label: "Leads", color: "text-emerald-400" },
                        ].map(m => (
                          <div key={m.label} className="rounded-lg bg-t-bg-card border border-t-border px-2 py-2 text-center">
                            <m.icon className={`w-3 h-3 ${m.color} mx-auto mb-0.5`} />
                            <p className="text-sm font-black">{m.val}</p>
                            <p className="text-[8px] text-t-text-faint">{m.label}</p>
                          </div>
                        ))}
                      </div>
                    </Link>

                    {/* Action bar */}
                    <div className="flex items-center justify-between px-5 py-2.5 border-t border-t-border bg-t-bg-card/50">
                      <div className="flex items-center gap-2">
                        {siteUrl && (
                          <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 hover:text-emerald-400 transition">
                            <ExternalLink className="w-3 h-3" /> View Site
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Link href={`/project/${project.id}`}
                          className="flex items-center gap-1 text-[10px] font-bold text-[#f5a623] hover:text-[#e07850] transition">
                          Open Hub <ArrowRight className="w-3 h-3" />
                        </Link>
                        <button onClick={async (e) => {
                          e.preventDefault();
                          try {
                            const res = await fetch(`/api/himalaya/projects/${project.id}/clone`, { method: "POST" });
                            const data = await res.json();
                            if (data.ok) void load();
                          } catch { /* ignore */ }
                        }} title="Clone business"
                          className="p-1 rounded text-t-text-faint/30 hover:text-[#f5a623] transition">
                          <Copy className="w-3 h-3" />
                        </button>
                        <button onClick={(e) => { e.preventDefault(); void deleteProject(project.id); }} title="Delete business"
                          className="p-1 rounded text-t-text-faint/30 hover:text-red-400 transition">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && projects.length === 0 && (
          <div className="mb-6 rounded-2xl border border-[#f5a623]/15 bg-gradient-to-br from-[#f5a623]/[0.04] to-transparent p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f5a623] to-[#e07850] flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(245,166,35,0.15)]">
              <Mountain className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-black mb-1">Build your first business</h3>
            <p className="text-sm text-t-text-muted mb-5">Type your goal above. Himalaya builds your site, ads, emails, and scripts — you just approve.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["Make $10k/month coaching", "Start a dropshipping store", "Get more clients for my agency", "Build an affiliate business"].map(s => (
                <button key={s} onClick={() => { setGoal(s); inputRef.current?.focus(); }}
                  className="px-3.5 py-2 rounded-xl border border-t-border bg-t-bg-card text-xs font-bold text-t-text-muted hover:text-[#f5a623] hover:border-[#f5a623]/20 transition">{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* ── Commands ── */}
        {commands.length > 0 && !loading && (
          <div className="mb-6">
            <p className="text-[10px] font-black text-t-text-faint tracking-widest mb-3">DO THIS NOW</p>
            <div className="space-y-2">
              {commands.slice(0, 4).map((cmd, i) => (
                <div key={cmd.id} className={`rounded-xl border px-4 py-3.5 ${cmd.priority === 1 ? "border-[#f5a623]/15 bg-[#f5a623]/[0.03]" : "border-t-border bg-t-bg-raised"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${cmd.priority === 1 ? "border-[#f5a623] text-[#f5a623]" : "border-t-border text-t-text-faint"}`}>
                        <span className="text-[10px] font-black">{i + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold">{cmd.action}</p>
                        <p className="text-xs text-t-text-faint mt-0.5">{cmd.details}</p>
                        {cmd.content && (
                          <div className="mt-2 rounded-lg bg-t-bg-card border border-t-border px-3 py-2">
                            <p className="text-xs text-t-text-muted italic">&ldquo;{cmd.content}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {cmd.href && (
                      <Link href={cmd.href} className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/20 text-[10px] font-bold text-[#f5a623] hover:bg-[#f5a623]/20 transition">
                        Do it <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tools ── */}
        <div className="mb-6">
          <p className="text-[10px] font-black text-t-text-faint tracking-widest mb-3">QUICK ACCESS</p>
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
                className="flex items-center gap-2.5 rounded-xl border border-t-border bg-t-bg-raised px-3 py-3 hover:border-[#f5a623]/15 transition group">
                <item.i className={`w-4 h-4 ${item.c}`} />
                <span className="text-xs font-bold text-t-text-muted group-hover:text-t-text transition">{item.l}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
