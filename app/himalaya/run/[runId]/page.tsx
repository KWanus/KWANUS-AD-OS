"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, Check, ChevronDown, ChevronUp, Copy,
  ExternalLink, Globe, Mail, Megaphone, Target, User, Zap,
  AlertTriangle, TrendingUp, Layout, Loader2, AlertCircle,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface RunData {
  ok: boolean;
  runId: string;
  mode: "scratch" | "improve";
  status: string;
  diagnosis: Record<string, unknown>;
  strategy: Record<string, unknown>;
  generated: Record<string, unknown>;
  created: { siteId?: string | null; emailFlowId?: string | null };
  results: Record<string, unknown>;
  trace: Record<string, unknown> | null;
  createdAt: string;
}

// ── Reusable sub-components ──────────────────────────────────────────────────

function ScoreGauge({ score, size = 80 }: { score: number; size?: number }) {
  const color = score >= 70 ? "#06b6d4" : score >= 40 ? "#f59e0b" : "#ef4444";
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      <text x={size / 2} y={size / 2} textAnchor="middle" dy="0.35em" fill="white" fontSize={size * 0.28} fontWeight="bold" transform={`rotate(90, ${size / 2}, ${size / 2})`}>
        {score}
      </text>
    </svg>
  );
}

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-cyan-400" />
          <h2 className="text-white font-semibold">{title}</h2>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-white/30 hover:text-white/60 transition-colors shrink-0"
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function EmailCard({ index, email }: { index: number; email: Record<string, string> }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white/40 text-xs">Email {index + 1}{email.delayDays ? ` · Day ${email.delayDays}` : ""}</p>
          <p className="text-white text-sm font-medium mt-0.5">{email.subject}</p>
          <p className={`text-white/50 text-sm mt-1 whitespace-pre-line ${expanded ? "" : "line-clamp-2"}`}>
            {email.body}
          </p>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-cyan-400/60 hover:text-cyan-400 text-xs mt-1 transition-colors"
          >
            {expanded ? "Show less" : "Read full email"}
          </button>
        </div>
        <CopyBtn text={`Subject: ${email.subject}\n\n${email.body}`} />
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function HimalayaRunPage() {
  const { runId } = useParams<{ runId: string }>();
  const router = useRouter();
  const [data, setData] = useState<RunData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch(`/api/himalaya/run/${runId}`, { signal: controller.signal });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || "Run not found");
        setData(json);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load run");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    if (runId) load();
    return () => controller.abort();
  }, [runId]);

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050a14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#050a14] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-white text-lg font-medium">{error || "Run not found"}</p>
          <button
            onClick={() => router.push("/himalaya")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/60 text-sm hover:text-white hover:border-white/20 transition-all"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  // ── Extract data ───────────────────────────────────────────────────────
  const { mode, generated, strategy, diagnosis } = data;
  const gen = (generated || {}) as Record<string, unknown>;
  const strat = (strategy || {}) as Record<string, unknown>;
  const diag = (diagnosis || {}) as Record<string, unknown>;

  const profile = gen.profile as Record<string, string> | undefined;
  const idealCustomer = gen.idealCustomer as Record<string, unknown> | undefined;
  const homepage = gen.homepage as Record<string, unknown> | undefined;
  const angles = gen.marketingAngles as Array<Record<string, string>> | undefined;
  const emails = (gen.emails as Record<string, unknown>)?.sequence as Array<Record<string, string>> | undefined;
  const roadmap = gen.roadmap as Record<string, string[]> | undefined;
  const audit = gen.audit as Record<string, unknown> | undefined;
  const fixes = gen.fixes as Array<Record<string, unknown>> | undefined;

  const created = data.created;

  // Collect warnings from all stages
  const allWarnings: string[] = [
    ...((diag.warnings as string[]) || []),
    ...((strat.warnings as string[]) || []),
    ...((gen.warnings as string[]) || []),
  ].filter(Boolean);

  const strategySummary = strat.summary as string | undefined;
  const actions = strat.actions as Array<Record<string, unknown>> | undefined;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050a14] px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── A. Results Header ──────────────────────────────────────────── */}
        <div className="text-center space-y-3 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium">
            <Check className="w-3.5 h-3.5" />
            {mode === "scratch" ? "Foundation built" : "Analysis complete"}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {mode === "scratch" ? "Your Business Foundation" : "Your Business Analysis & Fixes"}
          </h1>
          {strategySummary && (
            <p className="text-white/40 text-sm max-w-xl mx-auto">{strategySummary}</p>
          )}
          <p className="text-white/20 text-xs">
            {new Date(data.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        {/* ── B. Priority Section ────────────────────────────────────────── */}
        {actions && actions.length > 0 && (
          <Section title="Top Priorities" icon={Zap} defaultOpen>
            <div className="space-y-2">
              {actions.slice(0, 5).map((a, i) => (
                <div key={i} className="flex items-start gap-3 py-2">
                  <span className="text-cyan-400 text-xs font-mono mt-0.5">#{Number(a.priority) || i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{String(a.action)}</p>
                    <p className="text-white/40 text-xs mt-0.5">{String(a.why)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                    a.impact === "high" ? "bg-cyan-500/10 text-cyan-400" :
                    a.impact === "medium" ? "bg-amber-500/10 text-amber-400" :
                    "bg-white/10 text-white/40"
                  }`}>{String(a.impact)}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── C. Assets — Improve: Audit ─────────────────────────────────── */}
        {mode === "improve" && audit && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
            <div className="flex items-center gap-6">
              <ScoreGauge score={Number(audit.overallScore) || 0} />
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-lg">Business Health</p>
                <p className="text-white/50 text-sm mt-1">{String(audit.summary || "")}</p>
                {audit.strengths && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(audit.strengths as string[]).slice(0, 3).map((s, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── C. Assets — Improve: Fixes ─────────────────────────────────── */}
        {mode === "improve" && fixes && fixes.length > 0 && (
          <Section title="Priority Fixes" icon={AlertTriangle} defaultOpen>
            <div className="space-y-3">
              {fixes.map((fix, i) => (
                <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          fix.impact === "high" ? "bg-red-500/10 text-red-400" :
                          fix.impact === "medium" ? "bg-amber-500/10 text-amber-400" :
                          "bg-white/10 text-white/60"
                        }`}>{String(fix.impact)} impact</span>
                        <span className="text-white/30 text-xs">{String(fix.area)}</span>
                      </div>
                      <p className="text-white text-sm font-medium mt-2">{String(fix.problem)}</p>
                      <p className="text-white/50 text-sm mt-1">{String(fix.fix)}</p>
                    </div>
                    <span className="text-white/20 text-xs font-mono">#{i + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── C. Assets — Scratch: Business Profile ──────────────────────── */}
        {mode === "scratch" && profile && (
          <Section title="Business Profile" icon={User} defaultOpen>
            <div className="space-y-3">
              {[
                { label: "Business Name", value: profile.businessName },
                { label: "Positioning", value: profile.positioning },
                { label: "Target Audience", value: profile.targetAudience },
                { label: "Core Offer", value: profile.offer },
                { label: "Differentiator", value: profile.differentiator },
                { label: "Price Range", value: profile.priceRange },
              ].filter(r => r.value).map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-white/40 text-xs">{row.label}</p>
                    <p className="text-white text-sm mt-0.5">{row.value}</p>
                  </div>
                  <CopyBtn text={row.value!} />
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── C. Assets — Ideal Customer ─────────────────────────────────── */}
        {idealCustomer && (
          <Section title="Ideal Customer" icon={Target} defaultOpen={mode === "scratch"}>
            <div className="space-y-3">
              {idealCustomer.demographics && (
                <div>
                  <p className="text-white/40 text-xs">Demographics</p>
                  <p className="text-white text-sm mt-0.5">{String(idealCustomer.demographics)}</p>
                </div>
              )}
              {idealCustomer.painPoints && (
                <div>
                  <p className="text-white/40 text-xs mb-1">Pain Points</p>
                  {(idealCustomer.painPoints as string[]).map((p, i) => (
                    <p key={i} className="text-white/70 text-sm">• {p}</p>
                  ))}
                </div>
              )}
              {idealCustomer.desires && (
                <div>
                  <p className="text-white/40 text-xs mb-1">Desires</p>
                  {(idealCustomer.desires as string[]).map((d, i) => (
                    <p key={i} className="text-white/70 text-sm">• {d}</p>
                  ))}
                </div>
              )}
              {idealCustomer.buyingTriggers && (
                <div>
                  <p className="text-white/40 text-xs mb-1">What makes them buy</p>
                  {(idealCustomer.buyingTriggers as string[]).map((t, i) => (
                    <p key={i} className="text-white/70 text-sm">• {t}</p>
                  ))}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ── C. Assets — Homepage Copy ───────────────────────────────────── */}
        {homepage && (
          <Section title={mode === "improve" ? "Improved Homepage" : "Homepage Copy"} icon={Layout}>
            <div className="space-y-4">
              {/* Hero */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-white font-bold text-lg">{String(homepage.headline || "")}</p>
                <p className="text-white/60 text-sm mt-1">{String(homepage.subheadline || "")}</p>
                <div className="mt-3 inline-block px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-medium">
                  {String(homepage.heroButtonText || "Get Started")}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CopyBtn text={`${homepage.headline}\n${homepage.subheadline}`} />
                <span className="text-white/30 text-xs">Copy headline</span>
              </div>

              {/* Sections */}
              {(homepage.sections as Array<Record<string, unknown>> | undefined)?.map((section, i) => (
                <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40 uppercase tracking-wider">
                      {String(section.type)}
                    </span>
                    {section.title && <p className="text-white text-sm font-medium">{String(section.title)}</p>}
                    {!section.title && section.headline && <p className="text-white text-sm font-medium">{String(section.headline)}</p>}
                  </div>
                  {(section.items as Array<Record<string, string>> | undefined)?.map((item, j) => (
                    <div key={j} className="py-1.5 border-t border-white/[0.04] first:border-0">
                      {item.title && <p className="text-white text-sm">{item.title}</p>}
                      {item.body && <p className="text-white/50 text-xs mt-0.5">{item.body}</p>}
                      {item.name && <p className="text-white/60 text-xs">{item.name}</p>}
                      {item.quote && <p className="text-white/50 text-xs italic">"{item.quote}"</p>}
                      {item.q && <p className="text-white text-sm">{item.q}</p>}
                      {item.a && <p className="text-white/50 text-xs mt-0.5">{item.a}</p>}
                    </div>
                  ))}
                  {section.buttonText && (
                    <div className="mt-2 inline-block px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-medium">
                      {String(section.buttonText)}
                    </div>
                  )}
                </div>
              ))}

              {created?.siteId && (
                <Link
                  href={`/websites/${created.siteId}`}
                  className="inline-flex items-center gap-2 text-cyan-400 text-sm hover:text-cyan-300 transition-colors"
                >
                  <Globe className="w-4 h-4" /> View full site <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          </Section>
        )}

        {/* ── C. Assets — Marketing Angles ────────────────────────────────── */}
        {angles && angles.length > 0 && (
          <Section title="Marketing Angles" icon={Megaphone}>
            <div className="space-y-3">
              {angles.map((a, i) => (
                <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{a.angle}</p>
                      <p className="text-white/50 text-sm mt-1">"{a.hook}"</p>
                      <p className="text-white/30 text-xs mt-1">Best on: {a.platform}</p>
                    </div>
                    <CopyBtn text={a.hook} />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── C. Assets — Email Sequence ──────────────────────────────────── */}
        {emails && emails.length > 0 && (
          <Section title="Email Sequence" icon={Mail}>
            <div className="space-y-3">
              {emails.map((email, i) => (
                <EmailCard key={i} index={i} email={email} />
              ))}
              {created?.emailFlowId && (
                <Link
                  href={`/emails/flows/${created.emailFlowId}`}
                  className="inline-flex items-center gap-2 text-cyan-400 text-sm hover:text-cyan-300 transition-colors"
                >
                  <Mail className="w-4 h-4" /> Edit in Email Builder <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          </Section>
        )}

        {/* ── C. Assets — Action Roadmap ──────────────────────────────────── */}
        {roadmap && (
          <Section title="Action Roadmap" icon={TrendingUp}>
            <div className="space-y-4">
              {[
                { label: "This Week", items: roadmap.thisWeek, color: "text-cyan-400" },
                { label: "This Month", items: roadmap.thisMonth, color: "text-purple-400" },
                { label: "This Quarter", items: roadmap.thisQuarter, color: "text-amber-400" },
              ].filter(g => g.items?.length).map((group) => (
                <div key={group.label}>
                  <p className={`text-xs font-medium uppercase tracking-wider mb-2 ${group.color}`}>{group.label}</p>
                  {group.items!.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1.5 shrink-0" />
                      <p className="text-white/70 text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── D. Warnings ────────────────────────────────────────────────── */}
        {allWarnings.length > 0 && (
          <Section title="Run Notes" icon={AlertTriangle} defaultOpen={false}>
            <div className="space-y-1">
              {allWarnings.map((w, i) => (
                <p key={i} className="text-white/40 text-xs">• {w}</p>
              ))}
            </div>
          </Section>
        )}

        {/* ── Unauthenticated note ─────────────────────────────────────── */}
        {!created?.siteId && !created?.emailFlowId && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
            <p className="text-white/40 text-sm">
              Sign in to save generated sites and email flows to your account.
            </p>
          </div>
        )}

        {/* ── E. Next Actions ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {created?.siteId && (
            <Link
              href={`/websites/${created.siteId}`}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-medium text-white hover:bg-cyan-400 transition-colors"
            >
              <Globe className="w-4 h-4" /> View Site Output
            </Link>
          )}
          {created?.emailFlowId && (
            <Link
              href={`/emails/flows/${created.emailFlowId}`}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-purple-500 px-4 py-3 text-sm font-medium text-white hover:bg-purple-400 transition-colors"
            >
              <Mail className="w-4 h-4" /> View Email Output
            </Link>
          )}
          {!created?.siteId && !created?.emailFlowId && (
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-medium text-white hover:bg-cyan-400 transition-colors"
            >
              <Zap className="w-4 h-4" /> Go to Dashboard
            </Link>
          )}
          <button
            onClick={() => router.push("/himalaya")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-medium text-white/60 hover:text-white hover:border-white/20 transition-all`}
          >
            Start Another Run <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
