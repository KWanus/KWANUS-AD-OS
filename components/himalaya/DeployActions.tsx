"use client";

import { useState } from "react";
import Link from "next/link";
import { Rocket, Loader2, CheckCircle, Globe, Mail, Megaphone } from "lucide-react";
import type { HimalayaResultsViewModel } from "@/lib/himalaya/types";

type DeployResult = {
  campaign?: { id: string; url: string };
  site?: { id: string; url: string };
  emails?: { id: string; url: string };
};

export default function DeployActions({ vm }: { vm: HimalayaResultsViewModel }) {
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState<DeployResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDeploy(targets: string[]) {
    setDeploying(true);
    setError(null);
    try {
      const res = await fetch("/api/himalaya/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: vm.analysisId, targets }),
      });
      const data = (await res.json()) as { ok: boolean; deployed?: DeployResult; error?: string };
      if (data.ok && data.deployed) {
        setDeployed(data.deployed);
      } else {
        setError(data.error ?? "Deploy failed");
      }
    } catch {
      setError("Connection failed");
    } finally {
      setDeploying(false);
    }
  }

  // Don't show if no assets
  if (vm.assetGroups.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-cyan-500/[0.05] to-purple-500/[0.05] border border-cyan-500/15 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Rocket className="w-4 h-4 text-cyan-400/60" />
        <h2 className="text-[10px] font-black uppercase tracking-widest text-white/30">Deploy</h2>
      </div>

      {deployed ? (
        <div className="space-y-2">
          <p className="text-xs text-emerald-400/80 font-bold mb-3">Deployed successfully</p>
          {deployed.campaign && (
            <Link href={deployed.campaign.url} className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10 transition">
              <Megaphone className="w-3.5 h-3.5" /> Campaign created — View
            </Link>
          )}
          {deployed.site && (
            <Link href={deployed.site.url} className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10 transition">
              <Globe className="w-3.5 h-3.5" /> Website created — Edit
            </Link>
          )}
          {deployed.emails && (
            <Link href={deployed.emails.url} className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10 transition">
              <Mail className="w-3.5 h-3.5" /> Email flow created — Edit
            </Link>
          )}
        </div>
      ) : (
        <div>
          <p className="text-xs text-white/35 mb-4">
            Push your generated assets directly into the platform. Creates a campaign, website, and email flow from your results.
          </p>

          {error && (
            <p className="text-xs text-red-400/70 mb-3">{error}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void handleDeploy(["all"])}
              disabled={deploying}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-bold hover:opacity-90 transition disabled:opacity-40"
            >
              {deploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
              {deploying ? "Deploying..." : "Deploy Everything"}
            </button>

            <button
              onClick={() => void handleDeploy(["site"])}
              disabled={deploying}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-semibold text-white/40 hover:text-white/70 transition disabled:opacity-40"
            >
              <Globe className="w-3 h-3" /> Site Only
            </button>

            <button
              onClick={() => void handleDeploy(["campaign"])}
              disabled={deploying}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-semibold text-white/40 hover:text-white/70 transition disabled:opacity-40"
            >
              <Megaphone className="w-3 h-3" /> Campaign Only
            </button>

            <button
              onClick={() => void handleDeploy(["emails"])}
              disabled={deploying}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-semibold text-white/40 hover:text-white/70 transition disabled:opacity-40"
            >
              <Mail className="w-3 h-3" /> Emails Only
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
