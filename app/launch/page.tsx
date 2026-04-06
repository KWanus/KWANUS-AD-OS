"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import WorkflowGuide from "@/components/navigation/WorkflowGuide";
import WorkflowHeader from "@/components/navigation/WorkflowHeader";
import WorkflowLoading from "@/components/navigation/WorkflowLoading";
import WorkflowSuccess from "@/components/navigation/WorkflowSuccess";
import { Rocket, Loader2, CheckCircle, Globe, Mail, Megaphone, Zap, Image } from "lucide-react";

type DeployedResult = {
  campaign?: { id: string; url: string };
  site?: { id: string; url: string; slug?: string; publicUrl?: string };
  emails?: { id: string; url: string };
};

type GeneratedInfo = {
  adImages: number;
  adVideo: boolean;
  paymentLink: string | null;
  trackingEnabled: boolean;
  emailFlowsCreated: number;
};

const STAGES = [
  { label: "Researching competitors", icon: "🔍" },
  { label: "Building your strategy", icon: "📋" },
  { label: "Generating ad images", icon: "🖼️" },
  { label: "Writing ad copy", icon: "✍️" },
  { label: "Creating your website", icon: "🌐" },
  { label: "Setting up email flows", icon: "📧" },
  { label: "Creating payment link", icon: "💳" },
  { label: "Deploying everything", icon: "🚀" },
];

export default function LaunchPage() {
  const router = useRouter();
  const [niche, setNiche] = useState("");
  const [launching, setLaunching] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [result, setResult] = useState<{
    runId: string;
    deployed: DeployedResult | null;
    generated: GeneratedInfo | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function launch() {
    if (!niche.trim()) return;
    setLaunching(true);
    setError(null);
    setStageIdx(0);

    // Animate through stages
    const stageInterval = setInterval(() => {
      setStageIdx((prev) => Math.min(prev + 1, STAGES.length - 1));
    }, 8000);

    try {
      const res = await fetch("/api/himalaya/express", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: niche.trim() }),
      });
      const data = await res.json() as {
        ok: boolean;
        runId?: string;
        deployed?: DeployedResult;
        generated?: GeneratedInfo;
        error?: string;
      };

      clearInterval(stageInterval);

      if (data.ok && data.runId) {
        setStageIdx(STAGES.length);
        setResult({
          runId: data.runId,
          deployed: (data.deployed as DeployedResult) ?? null,
          generated: (data.generated as GeneratedInfo) ?? null,
        });
      } else {
        setError(data.error ?? "Something went wrong. Try again.");
      }
    } catch {
      clearInterval(stageInterval);
      setError("Connection failed. Try again.");
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <main className="max-w-xl mx-auto px-4 py-20">
        {!launching && !result ? (
          /* ── Input Stage ── */
          <div className="text-center">
            <WorkflowHeader
              className="mb-8"
              title="Launch Wizard"
              description="Type your niche. The system builds your website, creates your ads, sets up your emails, and launches the stack in one shot."
              icon={Rocket}
              center
            />

            <WorkflowGuide
              className="mb-8 text-left"
              items={[
                {
                  title: "Need validation first?",
                  description: "Start with Scan if you want to judge a market or competitor before launching.",
                  href: "/scan",
                },
                {
                  title: "Need assets before launch?",
                  description: "Use Analysis Studio for hooks, briefs, landing copy, and email assets you can edit first.",
                  href: "/analyze",
                },
                {
                  title: "Want more control?",
                  description: "Open Himalaya for guided paths, improve flows, templates, and deeper routing than one-shot launch.",
                  href: "/himalaya",
                  active: true,
                },
              ]}
            />

            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && launch()}
                placeholder="e.g. dental practices in Texas"
                className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl px-5 py-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
                autoFocus
              />
              <button
                onClick={launch}
                disabled={!niche.trim()}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-30 shadow-[0_0_24px_rgba(6,182,212,0.2)]"
              >
                Launch
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-3 text-[10px] text-white/20">
              <span>Website</span>
              <span>+</span>
              <span>Ad Images</span>
              <span>+</span>
              <span>Email Flows</span>
              <span>+</span>
              <span>Payment Link</span>
              <span>+</span>
              <span>Ad Copy</span>
            </div>

            {error && (
              <p className="text-sm text-red-400 mt-4">{error}</p>
            )}
          </div>
        ) : launching ? (
          /* ── Building Stage ── */
          <div>
            <WorkflowLoading
              title="Building your business..."
              subtitle="This takes about 60-90 seconds. We're doing a lot."
              icon={Loader2}
              steps={STAGES.map((stage) => stage.label)}
              activeIndex={stageIdx}
            />

            <div className="mx-auto max-w-xs space-y-2 text-left">
              {STAGES.map((stage, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-xl p-2.5 transition-all ${
                    i < stageIdx
                      ? "border border-emerald-500/15 bg-emerald-500/5"
                      : i === stageIdx
                        ? "animate-pulse border border-cyan-500/20 bg-cyan-500/5"
                        : "border border-white/[0.05] bg-white/[0.02] opacity-40"
                  }`}
                >
                  <span className="text-base">{i < stageIdx ? "✓" : stage.icon}</span>
                  <span className={`text-xs font-semibold ${i < stageIdx ? "text-emerald-300" : i === stageIdx ? "text-cyan-300" : "text-white/30"}`}>
                    {stage.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : result ? (
          /* ── Done Stage ── */
          <div>
            <WorkflowSuccess
              title="Your business is live"
              description="The launch finished successfully and your assets are ready to review."
              icon={CheckCircle}
              className="mb-6 text-left"
            >
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {result.generated?.adImages ? (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-3 text-center">
                  <Image className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                  <p className="text-sm font-bold text-white">{result.generated.adImages}</p>
                  <p className="text-[10px] text-white/30">Images</p>
                </div>
              ) : null}
              {result.generated?.emailFlowsCreated ? (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-3 text-center">
                  <Mail className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                  <p className="text-sm font-bold text-white">{result.generated.emailFlowsCreated}</p>
                  <p className="text-[10px] text-white/30">Email Flows</p>
                </div>
              ) : null}
              {result.generated?.paymentLink ? (
                <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-3 text-center">
                  <Zap className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <p className="text-sm font-bold text-emerald-300">Live</p>
                  <p className="text-[10px] text-white/30">Payment</p>
                </div>
              ) : null}
            </div>

            {/* Links */}
            <div className="space-y-2 mb-6 text-left">
              {result.deployed?.site && (
                <a
                  href={(result.deployed.site as { publicUrl?: string }).publicUrl ?? result.deployed.site.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 hover:bg-emerald-500/10 transition"
                >
                  <Globe className="w-5 h-5 text-emerald-400" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-emerald-300">Your Website</p>
                    <p className="text-[10px] text-white/30 truncate">{(result.deployed.site as { publicUrl?: string }).publicUrl ?? "View site"}</p>
                  </div>
                </a>
              )}
              {result.deployed?.campaign && (
                <button
                  onClick={() => router.push(result.deployed!.campaign!.url)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/15 hover:bg-cyan-500/10 transition text-left"
                >
                  <Megaphone className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-xs font-bold text-cyan-300">Your Campaign</p>
                    <p className="text-[10px] text-white/30">Ad images + AI generators ready</p>
                  </div>
                </button>
              )}
            </div>

            {/* Main CTA */}
            <button
              onClick={() => router.push(`/himalaya/run/${result.runId}`)}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition shadow-[0_0_24px_rgba(6,182,212,0.2)]"
            >
              View Full Results
            </button>
            </WorkflowSuccess>
          </div>
        ) : null}
      </main>
    </div>
  );
}
