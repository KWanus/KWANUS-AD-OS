"use client";

import { useState, useEffect } from "react";
import AppNav from "@/components/AppNav";
import { Check, X, ExternalLink, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";

type KeyStatus = {
  name: string;
  envVar: string;
  isSet: boolean;
  isWorking: boolean | null;
  required: boolean;
  description: string;
  getKeyUrl: string;
  getKeyLabel: string;
  cost: string;
  unlocks: string;
};

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<KeyStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/api-status")
      .then(r => r.json() as Promise<{ ok: boolean; keys?: KeyStatus[] }>)
      .then(d => { if (d.ok && d.keys) setKeys(d.keys); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const working = keys.filter(k => k.isWorking === true).length;
  const total = keys.length;
  const critical = keys.filter(k => k.required && !k.isSet).length;

  return (
    <main className="min-h-screen bg-t-bg text-t-text">
      <AppNav />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-20">
        <div className="pt-8 pb-4">
          <h1 className="text-2xl font-black">API Keys & Integrations</h1>
          <p className="text-sm text-t-text-muted">Connect services to unlock full power. Most are free.</p>
          {!loading && (
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-xs font-bold ${working === total ? "text-emerald-400" : critical > 0 ? "text-red-400" : "text-amber-400"}`}>
                {working}/{total} connected
              </span>
              {critical > 0 && (
                <span className="flex items-center gap-1 text-xs text-red-400">
                  <AlertTriangle className="w-3 h-3" /> {critical} required
                </span>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 text-t-text-faint animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map(key => (
              <div key={key.envVar} className={`rounded-xl border p-4 ${
                key.isWorking === true ? "border-emerald-500/15 bg-emerald-500/[0.02]" :
                key.isSet ? "border-amber-500/15 bg-amber-500/[0.02]" :
                key.required ? "border-red-500/15 bg-red-500/[0.02]" :
                "border-t-border bg-t-bg-raised"
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {key.isWorking === true ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      ) : key.isSet ? (
                        <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                          <AlertTriangle className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-t-border" />
                      )}
                      <span className="text-sm font-bold">{key.name}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        key.cost === "Free" ? "bg-emerald-500/10 text-emerald-400" : "bg-t-bg-card text-t-text-faint"
                      }`}>{key.cost}</span>
                      {key.required && !key.isSet && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">Required</span>
                      )}
                    </div>
                    <p className="text-xs text-t-text-faint mb-1">{key.description}</p>
                    <p className="text-[10px] text-t-text-faint">Unlocks: {key.unlocks}</p>
                  </div>

                  <div className="shrink-0">
                    {key.isWorking === true ? (
                      <span className="text-[10px] font-bold text-emerald-400">Connected ✓</span>
                    ) : key.isSet ? (
                      <span className="text-[10px] font-bold text-amber-400">Key invalid</span>
                    ) : (
                      <a href={key.getKeyUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/20 text-xs font-bold text-[#f5a623] hover:bg-[#f5a623]/20 transition">
                        {key.getKeyLabel} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-xl border border-t-border bg-t-bg-raised p-4">
          <p className="text-xs font-bold text-t-text-faint mb-2">After getting a key:</p>
          <p className="text-xs text-t-text-faint">Add it to your <code className="px-1 py-0.5 rounded bg-t-bg-card text-t-text-muted">.env</code> file and redeploy, or contact support to have it added to your production environment.</p>
        </div>
      </div>
    </main>
  );
}
