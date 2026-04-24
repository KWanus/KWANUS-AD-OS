"use client";
import { useState, Suspense, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CreativeStudio from "@/components/studio/CreativeStudio";
import { getUserId } from "@/lib/userId";
import AppNav from "@/components/AppNav";

type AnalysisMode = "operator" | "consultant" | "saas";
type ExecutionTier = "core" | "elite";

type DecisionPacket = {
  summary: string;
  verdict: string;
  confidence: string;
  score: number;
  linkType: string;
  audience: string;
  painDesire: string;
  angle: string;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  nextActions: string[];
};

type DimensionScores = {
  demandPotential: number;
  offerStrength: number;
  emotionalLeverage: number;
  trustCredibility: number;
  conversionReadiness: number;
  adViability: number;
  emailLifecyclePotential: number;
  seoPotential: number;
  differentiation: number;
  risk: number;
};

type OpportunityAssessment = {
  status: string;
  totalScore: number;
  dimensionScores: DimensionScores;
  topGaps: string[];
  topStrengths: string[];
  recommendedPath: string;
  priorityActions: string[];
  whyCouldWin: string;
  whyCouldFail: string;
};

type AdHook = { format: string; hook: string };
type AdScriptSection = { timestamp: string; direction: string; copy: string };
type AdScript = { title: string; duration: string; sections: AdScriptSection[] };
type LandingPage = {
  headline: string;
  subheadline: string;
  trustBar: string[];
  benefitBullets: string[];
  socialProofGuidance: string;
  guaranteeText: string;
  faqItems: { question: string; answer: string }[];
  ctaCopy: string;
  urgencyLine: string;
};
type AdBriefScene = {
  timestamp: string;
  shotType: string;
  visual: string;
  audio: string;
  textOverlay: string;
};
type AdBrief = {
  id: string;
  format: string;
  title: string;
  duration: string;
  platform: string;
  concept: string;
  scenes: AdBriefScene[];
  productionKit: {
    location: string;
    props: string[];
    casting: string;
    lighting: string;
    audioStyle: string;
    colorGrade: string;
  };
  imageAd?: {
    headline: string;
    visualDirection: string;
    bodyCopy: string;
    cta: string;
  };
};
type EmailItem = { subject: string; preview: string; body: string; timing: string };
type EmailSequences = { welcome: EmailItem[]; abandonedCart: EmailItem[]; postPurchase: EmailItem[] };
type ExecutionChecklist = {
  day1: string[];
  day2: string[];
  day3: string[];
  week2: string[];
  scalingTrigger: string;
  killCriteria: string;
};
type AssetPackage = {
  mode: string;
  executionTier?: ExecutionTier;
  adHooks: AdHook[];
  adScripts: AdScript[];
  adBriefs: AdBrief[];
  landingPage: LandingPage;
  emailSequences: EmailSequences;
  executionChecklist: ExecutionChecklist;
};

type AnalysisResult = {
  id: string | null;
  mode: string;
  executionTier?: ExecutionTier;
  inputUrl: string;
  linkType: string;
  title: string;
  score: number;
  verdict: string;
  confidence: string;
  summary: string;
  decisionPacket: DecisionPacket;
};

type LoadingStep = "idle" | "fetching" | "diagnosing" | "building" | "done";
type AssetTab = "briefs" | "hooks" | "scripts" | "landing" | "emails" | "checklist";
type EmailTab = "welcome" | "cart" | "postpurchase";

const VERDICT_COLORS: Record<string, string> = {
  "Strong Opportunity": "text-green-400",
  "Testable": "text-yellow-400",
  "Weak": "text-orange-400",
  "Reject": "text-red-400",
};

const STATUS_COLORS: Record<string, string> = {
  "Build Immediately": "text-green-400 border-green-500/30 bg-green-500/5",
  "Strong Opportunity": "text-cyan-400 border-cyan-500/30 bg-cyan-500/5",
  "Test Carefully": "text-yellow-400 border-yellow-500/30 bg-yellow-500/5",
  "Needs Rework": "text-orange-400 border-orange-500/30 bg-orange-500/5",
  "Reject": "text-red-400 border-red-500/30 bg-red-500/5",
};

const CONFIDENCE_COLORS: Record<string, string> = {
  "High": "border-green-500/30 bg-green-500/10 text-green-400",
  "Medium": "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  "Low": "border-red-500/30 bg-red-500/10 text-red-400",
};

const LOADING_STEPS: Record<LoadingStep, string> = {
  idle: "",
  fetching: "Extracting page...",
  diagnosing: "Diagnosing offer...",
  building: "Building decision packet...",
  done: "",
};

const DIMENSION_LABELS: Record<keyof DimensionScores, string> = {
  demandPotential: "Demand Potential",
  offerStrength: "Offer Strength",
  emotionalLeverage: "Emotional Leverage",
  trustCredibility: "Trust & Credibility",
  conversionReadiness: "Conversion Readiness",
  adViability: "Ad Viability",
  emailLifecyclePotential: "Email Potential",
  seoPotential: "SEO Potential",
  differentiation: "Differentiation",
  risk: "Risk (lower = better)",
};

function scoreColor(score: number): string {
  if (score >= 75) return "text-green-400";
  if (score >= 55) return "text-yellow-400";
  if (score >= 35) return "text-orange-400";
  return "text-red-400";
}

function DimensionRow({ label, value, isRisk }: { label: string; value: number; isRisk: boolean }) {
  const color = isRisk
    ? value <= 30 ? "bg-green-500" : value <= 60 ? "bg-yellow-500" : "bg-red-500"
    : value >= 70 ? "bg-green-500" : value >= 50 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/50 w-36 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%`, boxShadow: `0 0 8px ${color.includes("green") ? "rgba(34,197,94,0.3)" : color.includes("yellow") ? "rgba(234,179,8,0.3)" : "rgba(239,68,68,0.3)"}` }} />
      </div>
      <span className={`text-xs font-semibold w-7 text-right ${isRisk ? (value <= 30 ? "text-green-400" : value <= 60 ? "text-yellow-400" : "text-red-400") : scoreColor(value)}`}>
        {value}
      </span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }
  return (
    <button
      onClick={handleCopy}
      className={`text-xs px-2.5 py-1 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-sm transition shrink-0 ${copied ? "text-cyan-400 border-cyan-500/20" : "text-white/50 hover:text-white/80"}`}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// AssetSection — tab bar + content, no outer wrapper border (lives inside the right panel)
function AssetSection({ assets, onOpenStudio }: { assets: AssetPackage; onOpenStudio: (brief: AdBrief) => void }) {
  const [activeTab, setActiveTab] = useState<AssetTab>("briefs");
  const [emailTab, setEmailTab] = useState<EmailTab>("welcome");

  const tabs: { id: AssetTab; label: string }[] = [
    { id: "briefs", label: "🎬 Creative Briefs" },
    { id: "hooks", label: "🪝 Hooks" },
    { id: "scripts", label: "📝 Scripts" },
    { id: "landing", label: "🏠 Landing" },
    { id: "emails", label: "📧 Emails" },
    { id: "checklist", label: "✅ Checklist" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar — sticky at top of right panel */}
      <div className="sticky top-0 z-10 bg-[#020509]/80 backdrop-blur-2xl border-b border-white/[0.08] flex gap-0.5 px-4 pt-3 pb-0 overflow-x-auto shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg whitespace-nowrap transition ${activeTab === t.id
              ? "bg-white/10 text-white border-b-2 border-cyan-400"
              : "text-white/40 hover:text-white/70"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-4 flex-1">
        {/* ── Ad Briefs ── */}
        {activeTab === "briefs" && (
          <div className="space-y-8">
            {assets.adBriefs.map((brief) => (
              <BriefCard
                key={brief.id}
                brief={brief}
                onOpenStudio={() => onOpenStudio(brief)}
              />
            ))}
          </div>
        )}

        {/* ── Ad Hooks ── */}
        {activeTab === "hooks" && (
          <div className="space-y-3">
            {assets.adHooks.map((hook, i) => (
              <div key={i} className="rounded-xl border border-white/[0.08] bg-black/20 backdrop-blur-sm p-4 hover:border-white/[0.12] transition">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">{hook.format}</span>
                  <CopyButton text={hook.hook} />
                </div>
                <p className="text-sm text-white/80 leading-relaxed">{hook.hook}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Ad Scripts ── */}
        {activeTab === "scripts" && (
          <div className="space-y-6">
            {assets.adScripts.map((script, i) => (
              <div key={i} className="rounded-xl border border-white/[0.08] bg-black/20 backdrop-blur-sm overflow-hidden hover:border-white/[0.12] transition">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <span className="text-sm font-semibold text-white/80">{script.title}</span>
                  <CopyButton text={script.sections.map((s) => `[${s.timestamp}] ${s.copy}`).join("\n\n")} />
                </div>
                <div className="divide-y divide-white/5">
                  {script.sections.map((section, j) => (
                    <div key={j} className="px-4 py-3 flex gap-4">
                      <div className="shrink-0 w-12">
                        <span className="text-xs font-bold text-cyan-400">{section.timestamp}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-white/40 mb-1">{section.direction}</p>
                        <p className="text-sm text-white/80">{section.copy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Landing Page ── */}
        {activeTab === "landing" && (
          <div className="space-y-4">
            <LandingPageRow label="Headline" value={assets.landingPage.headline} />
            <LandingPageRow label="Subheadline" value={assets.landingPage.subheadline} />
            <LandingPageRow label="CTA Copy" value={assets.landingPage.ctaCopy} />
            <LandingPageRow label="Urgency Line" value={assets.landingPage.urgencyLine} />
            <div className="rounded-xl border border-white/[0.08] bg-black/20 backdrop-blur-sm p-4 hover:border-white/[0.12] transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/40 uppercase tracking-wide">Trust Bar</span>
                <CopyButton text={assets.landingPage.trustBar.join(" • ")} />
              </div>
              <div className="flex flex-wrap gap-2">
                {assets.landingPage.trustBar.map((item, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-full border border-white/10 text-white/60">{item}</span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-black/20 backdrop-blur-sm p-4 hover:border-white/[0.12] transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/40 uppercase tracking-wide">Benefit Bullets</span>
                <CopyButton text={assets.landingPage.benefitBullets.join("\n")} />
              </div>
              <ul className="space-y-1">
                {assets.landingPage.benefitBullets.map((b, i) => (
                  <li key={i} className="text-sm text-white/70">{b}</li>
                ))}
              </ul>
            </div>
            <LandingPageRow label="Social Proof Guidance" value={assets.landingPage.socialProofGuidance} />
            <LandingPageRow label="Guarantee" value={assets.landingPage.guaranteeText} />
            <div className="rounded-xl border border-white/[0.08] bg-black/20 backdrop-blur-sm p-4 hover:border-white/[0.12] transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/40 uppercase tracking-wide">FAQ Items</span>
              </div>
              <div className="space-y-3">
                {assets.landingPage.faqItems.map((faq, i) => (
                  <div key={i} className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-semibold text-white/80 mb-1">{faq.question}</p>
                      <CopyButton text={`Q: ${faq.question}\nA: ${faq.answer}`} />
                    </div>
                    <p className="text-xs text-white/50">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Email Sequences ── */}
        {activeTab === "emails" && (
          <div>
            <div className="flex gap-2 mb-4">
              {([
                { id: "welcome" as EmailTab, label: "Welcome (6)" },
                { id: "cart" as EmailTab, label: "Abandoned Cart (3)" },
                { id: "postpurchase" as EmailTab, label: "Post-Purchase (4)" },
              ]).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setEmailTab(t.id)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition ${emailTab === t.id
                    ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-300"
                    : "border-white/10 text-white/40 hover:text-white/60"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {emailTab === "welcome" && <EmailList emails={assets.emailSequences.welcome} />}
            {emailTab === "cart" && <EmailList emails={assets.emailSequences.abandonedCart} />}
            {emailTab === "postpurchase" && <EmailList emails={assets.emailSequences.postPurchase} />}
          </div>
        )}

        {/* ── Execution Checklist ── */}
        {activeTab === "checklist" && (
          <div className="space-y-4">
            <ChecklistDay label="Day 1 — Today" items={assets.executionChecklist.day1} />
            <ChecklistDay label="Day 2" items={assets.executionChecklist.day2} />
            <ChecklistDay label="Day 3" items={assets.executionChecklist.day3} />
            <ChecklistDay label="Week 2" items={assets.executionChecklist.week2} />
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <p className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-1">Scale Trigger</p>
              <p className="text-sm text-white/70">{assets.executionChecklist.scalingTrigger}</p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">Kill Criteria</p>
              <p className="text-sm text-white/70">{assets.executionChecklist.killCriteria}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LandingPageRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/20 backdrop-blur-sm p-4 hover:border-white/[0.12] transition">
      <div className="flex items-start justify-between gap-3 mb-1">
        <span className="text-xs text-white/40 uppercase tracking-wide">{label}</span>
        <CopyButton text={value} />
      </div>
      <p className="text-sm text-white/80">{value}</p>
    </div>
  );
}

function EmailList({ emails }: { emails: EmailItem[] }) {
  return (
    <div className="space-y-3">
      {emails.map((email, i) => (
        <div key={i} className="rounded-xl border border-white/[0.08] bg-black/20 backdrop-blur-sm overflow-hidden hover:border-white/[0.12] transition">
          <div className="flex items-start justify-between px-4 py-3 border-b border-white/5">
            <div>
              <span className="text-xs text-cyan-400 font-semibold">{email.timing}</span>
              <p className="text-sm font-semibold text-white/80 mt-0.5">{email.subject}</p>
              <p className="text-xs text-white/40 mt-0.5">{email.preview}</p>
            </div>
            <CopyButton text={`Subject: ${email.subject}\nPreview: ${email.preview}\n\n${email.body}`} />
          </div>
          <div className="px-4 py-3">
            <pre className="text-xs text-white/60 whitespace-pre-wrap font-sans leading-relaxed">{email.body}</pre>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChecklistDay({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/20 backdrop-blur-sm p-4 hover:border-white/[0.12] transition">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">{label}</span>
        <CopyButton text={items.map((item, i) => `${i + 1}. ${item}`).join("\n")} />
      </div>
      <ol className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-white/70">
            <span className="text-cyan-400 font-bold shrink-0 mt-0.5">{i + 1}.</span>
            {item}
          </li>
        ))}
      </ol>
    </div>
  );
}

function BriefCard({ brief, onOpenStudio }: { brief: AdBrief; onOpenStudio: () => void }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm overflow-hidden shadow-2xl relative">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      {/* Brief Header */}
      <div className="px-6 py-5 border-b border-white/[0.08] bg-gradient-to-r from-cyan-500/[0.08] to-transparent">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-gradient-to-r from-cyan-500 to-blue-500 text-[10px] font-bold text-[#020509] uppercase">{brief.platform}</span>
              <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest">{brief.format}</span>
            </div>
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">{brief.title}</h3>
            <p className="text-xs text-white/40 mt-1">Expected Duration: {brief.duration}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenStudio}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-[#020509] text-[11px] font-bold uppercase transition shadow-[0_0_12px_rgba(6,182,212,0.15)]"
            >
              Open in Studio →
            </button>
            <CopyButton text={JSON.stringify(brief, null, 2)} />
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-black/40 border border-white/5">
          <p className="text-xs font-semibold text-cyan-400/80 uppercase tracking-wide mb-1">Creative Concept</p>
          <p className="text-sm text-white/70 leading-relaxed italic">&quot;{brief.concept}&quot;</p>
        </div>
      </div>

      {/* Brief Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
        {/* Storyboard */}
        <div className="lg:col-span-2 p-6 space-y-6">
          <h4 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Storyboard / Flow</h4>
          {brief.scenes.length > 0 ? (
            <div className="space-y-6">
              {brief.scenes.map((scene, i) => (
                <SceneRow key={i} scene={scene} index={i} />
              ))}
            </div>
          ) : (
            brief.imageAd && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5">
                  <p className="text-[10px] font-bold text-cyan-400 uppercase mb-2">Primary Headline</p>
                  <p className="text-lg font-bold text-white leading-tight">{brief.imageAd.headline}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase mb-2">Visual Direction</p>
                  <p className="text-sm text-white/70 leading-relaxed">{brief.imageAd.visualDirection}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase mb-2">Body Copy / Overlay</p>
                  <p className="text-sm text-white/70 leading-relaxed">{brief.imageAd.bodyCopy}</p>
                </div>
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-white/40 uppercase block mb-1">Call to Action</span>
                  <span className="px-3 py-1 rounded bg-white/10 text-xs font-bold text-white">{brief.imageAd.cta}</span>
                </div>
              </div>
            )
          )}
        </div>

        {/* Production Kit */}
        <div className="p-6 bg-black/20">
          <h4 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Production Kit</h4>
          <div className="space-y-5">
            <KitItem label="Location" value={brief.productionKit.location} />
            <KitItem label="Casting" value={brief.productionKit.casting} />
            <KitItem label="Props" value={brief.productionKit.props.join(", ")} />
            <KitItem label="Lighting" value={brief.productionKit.lighting} />
            <KitItem label="Audio Style" value={brief.productionKit.audioStyle} />
            <KitItem label="Color Grade" value={brief.productionKit.colorGrade} />
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-[10px] text-white/20 uppercase font-medium">Production Status</p>
            <p className="text-xs text-cyan-400/50 mt-1 font-bold">READY FOR SHOOT</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneRow({ scene, index }: { scene: AdBriefScene; index: number }) {
  return (
    <div className="relative pl-8 border-l border-white/10 pb-2">
      <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[10px] font-black text-cyan-400/60 uppercase">Scene {index + 1}</span>
        <span className="px-1.5 py-0.5 rounded bg-white/[0.03] text-[10px] font-mono text-white/40">{scene.timestamp}</span>
        <span className="text-[10px] font-bold text-white/20 uppercase tracking-wider">{scene.shotType}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
          <p className="text-[9px] font-bold text-white/30 uppercase mb-1">Visual Action</p>
          <p className="text-sm text-white/90 leading-snug">{scene.visual}</p>
        </div>
        <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
          <p className="text-[9px] font-bold text-cyan-400/50 uppercase mb-1">Audio / VO</p>
          <p className="text-sm text-cyan-100/80 leading-snug">{scene.audio}</p>
          {scene.textOverlay && (
            <div className="mt-2 pt-2 border-t border-cyan-500/10">
              <p className="text-[9px] font-bold text-white/30 uppercase mb-1">Text Overlay</p>
              <p className="text-xs font-bold text-white italic tracking-tight">{scene.textOverlay}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KitItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-white/20 uppercase mb-1">{label}</p>
      <p className="text-sm text-white/80 leading-relaxed capitalize">{value || "Standard"}</p>
    </div>
  );
}

export default function AnalyzePage() {
  return <Suspense><AnalyzeContent /></Suspense>;
}

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState(() => searchParams.get("url") ?? "");
  const [mode, setMode] = useState<AnalysisMode>("operator");
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");
  const [loadingStep, setLoadingStep] = useState<LoadingStep>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [opportunity, setOpportunity] = useState<OpportunityAssessment | null>(null);
  const [assets, setAssets] = useState<AssetPackage | null>(null);

  // Save to workspace state
  const [saving, setSaving] = useState(false);
  const [savedCampaignId, setSavedCampaignId] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  // Creative Studio state
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [activeBrief, setActiveBrief] = useState<AdBrief | null>(null);

  const isLoading = loadingStep !== "idle" && loadingStep !== "done";

  const handleAnalyze = useCallback(async () => {
    const raw = url.trim();
    if (!raw) {
      setError("Please enter a URL to analyze.");
      return;
    }
    // Auto-prepend https:// if user typed a bare domain
    const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    if (normalized !== url) setUrl(normalized);

    setError("");
    setResult(null);
    setOpportunity(null);
    setAssets(null);
    setLoadingStep("fetching");

    const t1 = setTimeout(() => setLoadingStep("diagnosing"), 1200);
    const t2 = setTimeout(() => setLoadingStep("building"), 2800);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalized, mode, executionTier }),
      });

      clearTimeout(t1);
      clearTimeout(t2);

      const payload = await res.json() as {
        ok: boolean;
        analysis?: AnalysisResult;
        opportunityAssessment?: OpportunityAssessment | null;
        assetPackage?: AssetPackage | null;
        error?: string;
      };

      if (!payload.ok || !payload.analysis) {
        setError(payload.error ?? "Analysis failed. Please try again.");
        setLoadingStep("idle");
        return;
      }

      setResult(payload.analysis);
      setOpportunity(payload.opportunityAssessment ?? null);
      setAssets(payload.assetPackage ?? null);
      setLoadingStep("done");
    } catch {
      setError("Network error. Please check your connection.");
      setLoadingStep("idle");
    }
  }, [url, mode, executionTier]);

  useEffect(() => {
    const autoUrl = searchParams.get("url");
    if (autoUrl && !result && !isLoading) {
      handleAnalyze();
    }
  }, [searchParams, handleAnalyze, result, isLoading]);

  function handleReset() {
    setResult(null);
    setOpportunity(null);
    setAssets(null);
    setLoadingStep("idle");
    setError("");
    setUrl("");
    setSavedCampaignId(null);
    setCampaignName("");
    setShowSaveForm(false);
  }

  async function handleSave() {
    if (!result || !assets) return;
    setSaving(true);
    try {
      const name = campaignName.trim() || result.title || result.inputUrl;
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": getUserId() },
        body: JSON.stringify({
          name,
          mode: result.mode,
          productName: result.title || null,
          productUrl: result.inputUrl,
          analysisRunId: result.id,
          assets,
        }),
      });
      const data = await res.json() as { ok: boolean; campaign?: { id: string } };
      if (data.ok && data.campaign) {
        setSavedCampaignId(data.campaign.id);
        setShowSaveForm(false);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  // ── NO RESULT: Master Intake Scanner (ChatGPT-style) ──────────────────────────
  if (!result) {
    return (
      <main className="h-screen bg-[#020509] text-white flex flex-col font-sans">
        <AppNav />

        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 relative">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="w-full max-w-3xl z-10 flex flex-col items-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4 text-center tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Himalaya Copilot
            </h1>
            <p className="text-white/50 text-base md:text-lg text-center mb-12 max-w-xl leading-relaxed">
              Drop a competitor's link, your current store, or a raw idea. The AI will scan the market, build your strategy, and **auto-generate your funnel and ads**.
            </p>

          <div className="w-full bg-[#020509] border border-white/[0.08] shadow-2xl rounded-3xl p-3 flex flex-col transition-all focus-within:border-cyan-500/40 focus-within:shadow-[0_0_40px_rgba(6,182,212,0.1)]">
              <textarea
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a URL (e.g. https://competitor.com) or describe your product..."
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAnalyze();
                  }
                }}
                className="w-full bg-transparent min-h-[100px] resize-none px-4 py-3 text-lg text-white placeholder-white/20 outline-none disabled:opacity-50"
              />

              <div className="flex items-center justify-between px-2 pt-2 border-t border-white/5 mt-2">
                <div className="flex gap-2">
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as AnalysisMode)}
                    disabled={isLoading}
                    className="appearance-none bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] rounded-xl px-4 py-2 text-xs font-semibold text-white/70 outline-none cursor-pointer transition disabled:opacity-50"
                  >
                    <option value="operator">🛒 E-Commerce / Dropship</option>
                    <option value="consultant">💼 Agency / Consultant</option>
                    <option value="saas">💻 SaaS / Software</option>
                  </select>
                  <select
                    value={executionTier}
                    onChange={(e) => setExecutionTier(e.target.value as ExecutionTier)}
                    disabled={isLoading}
                    className="appearance-none bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] rounded-xl px-4 py-2 text-xs font-semibold text-white/70 outline-none cursor-pointer transition disabled:opacity-50"
                  >
                    <option value="core">⚙️ Core Execution</option>
                    <option value="elite">🏆 Elite Execution</option>
                  </select>
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={isLoading || !url.trim()}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 disabled:from-white/5 disabled:to-white/5 disabled:text-white/20 hover:opacity-90 px-6 py-2.5 text-sm font-black text-white transition shadow-lg disabled:shadow-none"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Scanning...
                    </>
                  ) : "Generate Strategy →"}
                </button>
              </div>
            </div>

            {/* Loading Status Array */}
            {isLoading && (
              <div className="mt-8 flex flex-col items-center">
                <div className="flex items-center gap-3 text-cyan-400 font-semibold mb-2">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                  </div>
                  {LOADING_STEPS[loadingStep]}
                </div>
                <div className="w-64 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500" style={{ width: loadingStep === 'fetching' ? '30%' : loadingStep === 'diagnosing' ? '60%' : '90%' }} />
                </div>
              </div>
            )}

            {error && (
              <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-sm font-semibold text-red-300 text-center max-w-lg">
                ⚠️ {error}
              </div>
            )}

            {!isLoading && !error && (
              <div className="mt-12 flex flex-wrap justify-center gap-4 text-xs font-semibold text-white/30 uppercase tracking-widest">
                <span>1. Scan The Market</span>
                <span className="text-white/10">•</span>
                <span>2. AI Generates Assets</span>
                <span className="text-white/10">•</span>
                <span>3. 1-Click Funnel Launch</span>
                <span className="text-white/10">•</span>
                <span>{executionTier === "elite" ? "Elite Quality" : "Core Quality"}</span>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ── WITH RESULT: two-panel layout ────────────────────────────────────────
  return (
    <main className="h-screen overflow-hidden bg-[#020509] text-white flex flex-col">
      <AppNav />
      {/* Action bar */}
      <header className="shrink-0 px-6 py-2 border-b border-white/[0.06] flex items-center gap-4 backdrop-blur-xl">
        <div className="flex-1" />

        {/* Save / Saved state */}
        {result.verdict !== "Reject" && assets && (
          savedCampaignId ? (
            <Link
              href={`/campaigns/${savedCampaignId}`}
              className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
            >
              Open Workspace →
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-1 rounded-lg border ${
                (assets.executionTier ?? result.executionTier ?? "core") === "elite"
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  : "border-white/10 bg-white/[0.03] text-white/40"
              }`}>
                {(assets.executionTier ?? result.executionTier ?? "core").toUpperCase()}
              </span>
              <span className="text-xs px-2 py-1 rounded-lg border border-white/10 bg-white/[0.03] text-white/40">
                Not saved
              </span>
            </div>
          )
        )}

        <button
          onClick={handleReset}
          className="rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/60 hover:text-white transition"
        >
          New Analysis
        </button>
      </header>

      {/* Two-panel layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[340px_1fr] overflow-hidden">

        {/* LEFT PANEL: Analysis signals (scrollable) */}
        <aside className="border-r border-white/10 overflow-y-auto p-5 space-y-4 backdrop-blur-xl relative">
          <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-cyan-500/20 via-transparent to-transparent" />

          {/* Verdict card */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Verdict</p>
            <p className={`text-3xl font-bold ${VERDICT_COLORS[result.verdict] ?? "text-white"}`}>
              {result.verdict}
            </p>
            <div className="flex items-end justify-between mt-3">
              <div className="flex flex-wrap gap-1.5">
                <span className={`text-xs px-2.5 py-0.5 rounded-full border ${CONFIDENCE_COLORS[result.confidence] ?? ""}`}>
                  {result.confidence} confidence
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full border border-white/10 text-white/40">
                  {result.linkType}
                </span>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-bold ${scoreColor(result.score)}`}>
                  {result.score}<span className="text-sm text-white/30">/100</span>
                </p>
              </div>
            </div>
            {result.title && (
              <p className="text-xs text-white/30 mt-2 truncate">{result.title}</p>
            )}
            <p className="text-xs text-white/20 mt-1 truncate">{result.inputUrl}</p>
          </div>

          {/* Summary */}
          <p className="text-xs text-white/60 leading-relaxed px-1">{result.summary}</p>

          {/* Opportunity status + score */}
          {opportunity && (
            <div className={`rounded-xl border p-4 ${STATUS_COLORS[opportunity.status] ?? "border-white/10 bg-white/[0.03]"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-0.5">Opportunity</p>
                  <p className={`text-lg font-bold ${STATUS_COLORS[opportunity.status]?.split(" ")[0] ?? "text-white"}`}>
                    {opportunity.status}
                  </p>
                </div>
                <p className={`text-2xl font-bold ${scoreColor(opportunity.totalScore)}`}>
                  {opportunity.totalScore}<span className="text-xs text-white/30">/100</span>
                </p>
              </div>
            </div>
          )}

          {/* Why win / fail mini grid */}
          {opportunity && (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-white/[0.08] bg-black/20 backdrop-blur-sm p-3">
                <p className="text-[10px] text-white/30 mb-1">Why Could Win</p>
                <p className="text-xs text-white/70 leading-relaxed">{opportunity.whyCouldWin}</p>
              </div>
              <div className="rounded-lg border border-white/[0.08] bg-black/20 backdrop-blur-sm p-3">
                <p className="text-[10px] text-white/30 mb-1">Why Could Fail</p>
                <p className="text-xs text-white/70 leading-relaxed">{opportunity.whyCouldFail}</p>
              </div>
            </div>
          )}

          {/* Audience chip */}
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-3">
            <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Audience</p>
            <p className="text-xs text-white/80">{result.decisionPacket.audience}</p>
          </div>

          {/* Pain / Desire chip */}
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-3">
            <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Core Pain / Desire</p>
            <p className="text-xs text-white/80">{result.decisionPacket.painDesire}</p>
          </div>

          {/* Angle chip */}
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-3">
            <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Selling Angle</p>
            <p className="text-xs text-white/80">{result.decisionPacket.angle}</p>
          </div>

          {/* Score bars */}
          {opportunity && (
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-3 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Score Breakdown</p>
              {(Object.keys(DIMENSION_LABELS) as Array<keyof DimensionScores>).map((key) => (
                <DimensionRow
                  key={key}
                  label={DIMENSION_LABELS[key]}
                  value={opportunity.dimensionScores[key]}
                  isRisk={key === "risk"}
                />
              ))}
            </div>
          )}

          {/* Strengths */}
          {result.decisionPacket.strengths.length > 0 && (
            <div className="rounded-lg border border-green-500/15 bg-green-500/[0.04] backdrop-blur-sm p-3">
              <p className="text-[10px] font-semibold text-green-400 uppercase tracking-widest mb-2">Strengths</p>
              <ul className="space-y-1.5">
                {result.decisionPacket.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-white/70">
                    <span className="text-green-400 mt-0.5 shrink-0">✓</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {result.decisionPacket.weaknesses.length > 0 && (
            <div className="rounded-lg border border-red-500/15 bg-red-500/[0.04] backdrop-blur-sm p-3">
              <p className="text-[10px] font-semibold text-red-400 uppercase tracking-widest mb-2">Weaknesses</p>
              <ul className="space-y-1.5">
                {result.decisionPacket.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-white/70">
                    <span className="text-red-400 mt-0.5 shrink-0">✗</span>{w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next actions */}
          {result.decisionPacket.nextActions.length > 0 && (
            <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/[0.04] backdrop-blur-sm p-3">
              <p className="text-[10px] font-semibold text-cyan-400 uppercase tracking-widest mb-2">Next Actions</p>
              <ol className="space-y-1.5">
                {result.decisionPacket.nextActions.map((a, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-white/70">
                    <span className="text-cyan-400 font-bold shrink-0">{i + 1}.</span>{a}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Save to workspace — inside left panel */}
          {result.verdict !== "Reject" && assets && (
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
              {savedCampaignId ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-cyan-400">Saved to workspace</p>
                  <Link
                    href={`/campaigns/${savedCampaignId}`}
                    className="block w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 px-4 py-2 text-xs font-semibold text-[#020509] text-center transition shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  >
                    Open Workspace →
                  </Link>
                </div>
              ) : showSaveForm ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-white/70 mb-1">Name this campaign</p>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder={result.title || result.inputUrl}
                    onKeyDown={(e) => { if (e.key === "Enter") void handleSave(); }}
                    autoFocus
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-cyan-400/60 transition"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => void handleSave()}
                      disabled={saving}
                      className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 px-3 py-2 text-xs font-semibold text-[#020509] transition shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => setShowSaveForm(false)}
                      className="rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/10 px-3 py-2 text-xs text-white/50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-white/70">Save to workspace</p>
                  <p className="text-[10px] text-white/30">Keep drafts, track what&apos;s live, and A/B test variations.</p>
                  <button
                    onClick={() => { setCampaignName(result.title || ""); setShowSaveForm(true); }}
                    className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 px-4 py-2 text-xs font-semibold text-[#020509] transition shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  >
                    Save to Workspace →
                  </button>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* RIGHT PANEL: Asset package (scrollable) */}
        <div className="overflow-y-auto">
          {assets ? (
            <AssetSection
              assets={assets}
              onOpenStudio={(brief) => {
                setActiveBrief(brief);
                setIsStudioOpen(true);
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white/20 text-sm">
              Asset package unavailable.
            </div>
          )}
        </div>
      </div>

      {activeBrief && (
        <CreativeStudio
          isOpen={isStudioOpen}
          onClose={() => setIsStudioOpen(false)}
          brief={activeBrief}
          executionTier={executionTier}
        />
      )}
    </main>
  );
}
