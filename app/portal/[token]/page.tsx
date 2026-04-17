"use client";

import { useState, useEffect, use } from "react";
import { CheckCircle, TrendingUp, Target, Zap, FileText, Mail, BarChart3 } from "lucide-react";

type PortalData = {
  title: string;
  score: number | null;
  verdict: string | null;
  summary: string | null;
  createdAt: string;
  priorities: { label: string; reason: string }[];
  reasoning: string[];
  businessProfile: Record<string, string> | null;
  idealCustomer: Record<string, string> | null;
  offerDirection: Record<string, string> | null;
  adHooks: { format: string; hook: string }[];
  landingPage: { headline: string; subheadline: string; ctaCopy: string; benefitBullets: string[]; guaranteeText: string } | null;
  emailSequences: { welcome: { subject: string; timing: string }[] } | null;
  executionChecklist: { week1?: string[]; week2?: string[] } | null;
  audience: string | null;
  painDesire: string | null;
  angle: string | null;
  strengths: string[];
  weaknesses: string[];
};

export default function ClientPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [portal, setPortal] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/portal/${token}`)
      .then((r) => r.json() as Promise<{ ok: boolean; portal?: PortalData; error?: string }>)
      .then((data) => {
        if (data.ok && data.portal) setPortal(data.portal);
        else setError(data.error ?? "Portal not found");
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-t-bg text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#f5a623]/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !portal) {
    return (
      <div className="min-h-screen bg-t-bg text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/40 mb-2">{error ?? "Not found"}</p>
          <p className="text-xs text-white/20">This portal link may have expired or is invalid.</p>
        </div>
      </div>
    );
  }

  const scoreColor = (portal.score ?? 0) >= 70 ? "text-emerald-400" : (portal.score ?? 0) >= 45 ? "text-amber-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-t-bg text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#f5a623] to-[#e07850] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Himalaya</p>
              <p className="text-[10px] text-white/30">Client Deliverables</p>
            </div>
          </div>
          {portal.score != null && (
            <div className="text-right">
              <span className={`text-2xl font-bold ${scoreColor}`}>{portal.score}</span>
              <span className="text-xs text-white/30">/100</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black text-white">{portal.title}</h1>
          {portal.verdict && (
            <span className={`inline-block mt-2 text-sm font-bold ${scoreColor}`}>{portal.verdict}</span>
          )}
          {portal.summary && (
            <p className="text-sm text-white/50 mt-2 leading-relaxed">{portal.summary}</p>
          )}
        </div>

        {/* Priorities */}
        {portal.priorities.length > 0 && (
          <Section icon={Target} title="Top Priorities">
            <div className="space-y-3">
              {portal.priorities.map((p, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#f5a623]/5 border border-[#f5a623]/15">
                  <span className="text-[#f5a623] font-bold text-sm shrink-0">{i + 1}.</span>
                  <div>
                    <p className="text-sm font-bold text-white">{p.label}</p>
                    <p className="text-xs text-white/40 mt-0.5">{p.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Business Profile */}
        {portal.businessProfile && (
          <Section icon={TrendingUp} title="Business Profile">
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(portal.businessProfile).map(([key, val]) => (
                <div key={key} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                  <p className="text-sm text-white/70 mt-1">{val}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Ad Hooks */}
        {portal.adHooks.length > 0 && (
          <Section icon={Zap} title="Ad Hooks">
            <div className="space-y-2">
              {portal.adHooks.slice(0, 5).map((hook, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-[10px] text-[#f5a623]/60 font-bold uppercase mb-1">{hook.format}</p>
                  <p className="text-sm text-white/80 leading-relaxed">&ldquo;{hook.hook}&rdquo;</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Landing Page */}
        {portal.landingPage && (
          <Section icon={FileText} title="Landing Page Blueprint">
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-[#f5a623]/5 border border-[#f5a623]/15">
                <p className="text-lg font-bold text-white">{portal.landingPage.headline}</p>
                <p className="text-sm text-white/50 mt-1">{portal.landingPage.subheadline}</p>
              </div>
              {portal.landingPage.benefitBullets?.length > 0 && (
                <div className="space-y-1.5">
                  {portal.landingPage.benefitBullets.map((b, i) => (
                    <p key={i} className="text-sm text-white/60 flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {b}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Email Sequence */}
        {portal.emailSequences?.welcome && portal.emailSequences.welcome.length > 0 && (
          <Section icon={Mail} title="Email Sequence">
            <div className="space-y-2">
              {portal.emailSequences.welcome.map((e, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-xs text-white/20 font-mono shrink-0 w-12">{e.timing}</span>
                  <p className="text-sm text-white/60">{e.subject}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Strengths & Weaknesses */}
        {(portal.strengths.length > 0 || portal.weaknesses.length > 0) && (
          <Section icon={BarChart3} title="Analysis">
            <div className="grid grid-cols-2 gap-4">
              {portal.strengths.length > 0 && (
                <div>
                  <p className="text-[10px] text-emerald-400/60 font-bold uppercase mb-2">Strengths</p>
                  {portal.strengths.map((s, i) => (
                    <p key={i} className="text-xs text-white/50 mb-1">+ {s}</p>
                  ))}
                </div>
              )}
              {portal.weaknesses.length > 0 && (
                <div>
                  <p className="text-[10px] text-red-400/60 font-bold uppercase mb-2">Gaps to Fix</p>
                  {portal.weaknesses.map((w, i) => (
                    <p key={i} className="text-xs text-white/50 mb-1">- {w}</p>
                  ))}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Footer */}
        <div className="text-center pt-8 pb-12 border-t border-white/[0.06]">
          <p className="text-[10px] text-white/15">Generated by Himalaya Marketing OS</p>
        </div>
      </main>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-[#f5a623]/60" />
        <h2 className="text-[10px] font-black uppercase tracking-widest text-white/30">{title}</h2>
      </div>
      {children}
    </div>
  );
}
