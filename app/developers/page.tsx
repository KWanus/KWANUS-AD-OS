"use client";

import { useState, useEffect } from "react";
import AppNav from "@/components/AppNav";
import {
  Key, Plus, Copy, Trash2, Loader2, AlertTriangle,
  Code2, Activity, Shield, CheckCircle2, XCircle,
} from "lucide-react";

type ApiKeyItem = {
  id: string;
  name: string;
  keyPrefix: string;
  tier: "free" | "pro" | "enterprise";
  callsThisMonth: number;
  monthlyLimit: number;
  lastUsedAt: string | null;
  active: boolean;
  createdAt: string;
};

type Usage = {
  totalKeys: number;
  activeKeys: number;
  totalCallsThisMonth: number;
  totalLimit: number;
};

const TIER_COLORS: Record<string, string> = {
  free: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  pro: "text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20",
  enterprise: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

export default function DeveloperConsolePage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchKeys = () => {
    fetch("/api/developers/keys")
      .then(r => r.json() as Promise<{ ok: boolean; keys?: ApiKeyItem[]; usage?: Usage }>)
      .then(d => {
        if (d.ok) {
          if (d.keys) setKeys(d.keys);
          if (d.usage) setUsage(d.usage);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/developers/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: newKeyName.trim() }),
      });
      const data = await res.json() as { ok: boolean; rawKey?: string };
      if (data.ok && data.rawKey) {
        setRevealedKey(data.rawKey);
        setNewKeyName("");
        fetchKeys();
      }
    } catch { /* ignore */ }
    setCreating(false);
  };

  const handleRevoke = async (keyId: string) => {
    setRevoking(keyId);
    try {
      await fetch("/api/developers/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", keyId }),
      });
      fetchKeys();
    } catch { /* ignore */ }
    setRevoking(null);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetDate = new Date();
  resetDate.setMonth(resetDate.getMonth() + 1, 1);
  resetDate.setHours(0, 0, 0, 0);

  return (
    <main className="min-h-screen bg-t-bg text-t-text">
      <AppNav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        {/* Header */}
        <div className="pt-8 pb-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#f5a623] to-[#e07850] flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(245,166,35,0.3)]">
            <Code2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Developer Console</h1>
          <p className="text-sm text-white/40 max-w-md mx-auto">
            Manage API keys, monitor usage, and integrate Himalaya into your stack.
          </p>
        </div>

        {/* Revealed key banner */}
        {revealedKey && (
          <div className="mb-6 rounded-xl border border-[#f5a623]/30 bg-[#f5a623]/[0.05] p-5">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-[#f5a623] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#f5a623]">Copy this now — it won't be shown again</p>
                <p className="text-xs text-white/40 mt-1">Store this key securely. You will not be able to see it again after closing this banner.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-lg bg-t-bg-card text-xs text-white font-mono break-all select-all border border-t-border">
                {revealedKey}
              </code>
              <button
                onClick={() => handleCopy(revealedKey)}
                className="shrink-0 px-3 py-2 rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/20 text-xs font-bold text-[#f5a623] hover:bg-[#f5a623]/20 transition flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <button
              onClick={() => setRevealedKey(null)}
              className="mt-3 text-[10px] text-white/30 hover:text-white/50 transition"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Usage stats */}
        {usage && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl border border-t-border bg-t-bg-raised p-4 text-center">
              <p className="text-[9px] font-bold tracking-widest text-white/30 uppercase mb-1">CALLS THIS MONTH</p>
              <p className="text-2xl font-black text-white">{usage.totalCallsThisMonth.toLocaleString()}</p>
              <p className="text-[10px] text-white/30">of {usage.totalLimit.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-t-border bg-t-bg-raised p-4 text-center">
              <p className="text-[9px] font-bold tracking-widest text-white/30 uppercase mb-1">REMAINING</p>
              <p className="text-2xl font-black text-emerald-400">
                {(usage.totalLimit - usage.totalCallsThisMonth).toLocaleString()}
              </p>
              <p className="text-[10px] text-white/30">calls left</p>
            </div>
            <div className="rounded-xl border border-t-border bg-t-bg-raised p-4 text-center">
              <p className="text-[9px] font-bold tracking-widest text-white/30 uppercase mb-1">RESETS ON</p>
              <p className="text-lg font-black text-white">
                {resetDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
              <p className="text-[10px] text-white/30">{usage.activeKeys} active key{usage.activeKeys !== 1 ? "s" : ""}</p>
            </div>
          </div>
        )}

        {/* Create key */}
        <div className="rounded-xl border border-t-border bg-t-bg-raised p-5 mb-6">
          <p className="text-[9px] font-bold tracking-widest text-white/30 uppercase mb-3">CREATE API KEY</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g. Production, Staging)"
              className="flex-1 px-3 py-2 rounded-lg bg-t-bg-card border border-t-border text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#f5a623]/40"
              onKeyDown={e => e.key === "Enter" && handleCreate()}
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newKeyName.trim()}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#f5a623] to-[#e07850] text-sm font-bold text-white hover:opacity-90 transition disabled:opacity-40 flex items-center gap-1.5"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Generate Key
            </button>
          </div>
        </div>

        {/* Key list */}
        <div className="mb-8">
          <p className="text-[9px] font-bold tracking-widest text-white/30 uppercase mb-3">YOUR API KEYS</p>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 text-t-text-faint animate-spin" />
            </div>
          ) : keys.length === 0 ? (
            <div className="rounded-xl border border-t-border bg-t-bg-raised p-8 text-center">
              <Key className="w-8 h-8 text-white/10 mx-auto mb-2" />
              <p className="text-sm text-white/30">No API keys yet. Create one above to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {keys.map(key => (
                <div
                  key={key.id}
                  className={`rounded-xl border p-4 ${
                    key.active
                      ? "border-t-border bg-t-bg-raised"
                      : "border-red-500/10 bg-red-500/[0.02] opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        {key.active ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        )}
                        <span className="text-sm font-bold text-white">{key.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${TIER_COLORS[key.tier]}`}>
                          {key.tier.toUpperCase()}
                        </span>
                        {!key.active && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                            REVOKED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white/30">
                        <code className="font-mono text-white/50">{key.keyPrefix}...</code>
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {key.callsThisMonth.toLocaleString()} / {key.monthlyLimit.toLocaleString()}
                        </span>
                        <span>
                          {key.lastUsedAt
                            ? `Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`
                            : "Never used"}
                        </span>
                      </div>
                    </div>

                    {key.active && (
                      <button
                        onClick={() => handleRevoke(key.id)}
                        disabled={revoking === key.id}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 hover:bg-red-500/20 transition disabled:opacity-40 flex items-center gap-1"
                      >
                        {revoking === key.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documentation */}
        <div className="rounded-xl border border-t-border bg-t-bg-raised p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-[#f5a623]" />
            <p className="text-[9px] font-bold tracking-widest text-white/30 uppercase">API DOCUMENTATION</p>
          </div>

          <p className="text-xs text-white/40 mb-4">
            Include your API key in the <code className="px-1 py-0.5 rounded bg-t-bg-card text-white/60">Authorization</code> header as a Bearer token.
          </p>

          <div className="space-y-4">
            {/* cURL example */}
            <div>
              <p className="text-[9px] font-bold tracking-widest text-white/30 uppercase mb-2">CURL</p>
              <div className="relative group">
                <pre className="px-4 py-3 rounded-lg bg-t-bg-card border border-t-border text-xs text-white/70 font-mono overflow-x-auto whitespace-pre">
{`curl -X POST https://your-domain.com/api/mcp \\
  -H "Authorization: Bearer hk_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"action": "generate", "prompt": "..."}'`}
                </pre>
                <button
                  onClick={() => handleCopy(`curl -X POST https://your-domain.com/api/mcp \\\n  -H "Authorization: Bearer hk_your_key_here" \\\n  -H "Content-Type: application/json" \\\n  -d '{"action": "generate", "prompt": "..."}'`)}
                  className="absolute top-2 right-2 p-1.5 rounded bg-t-bg-raised border border-t-border text-white/30 hover:text-white/60 opacity-0 group-hover:opacity-100 transition"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Fetch example */}
            <div>
              <p className="text-[9px] font-bold tracking-widest text-white/30 uppercase mb-2">JAVASCRIPT (FETCH)</p>
              <div className="relative group">
                <pre className="px-4 py-3 rounded-lg bg-t-bg-card border border-t-border text-xs text-white/70 font-mono overflow-x-auto whitespace-pre">
{`const res = await fetch("/api/mcp", {
  method: "POST",
  headers: {
    "Authorization": "Bearer hk_your_key_here",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    action: "generate",
    prompt: "...",
  }),
});
const data = await res.json();`}
                </pre>
                <button
                  onClick={() => handleCopy(`const res = await fetch("/api/mcp", {\n  method: "POST",\n  headers: {\n    "Authorization": "Bearer hk_your_key_here",\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify({\n    action: "generate",\n    prompt: "...",\n  }),\n});\nconst data = await res.json();`)}
                  className="absolute top-2 right-2 p-1.5 rounded bg-t-bg-raised border border-t-border text-white/30 hover:text-white/60 opacity-0 group-hover:opacity-100 transition"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-t-border">
            <p className="text-[10px] text-white/25">
              Rate limits reset on the 1st of each month. Free tier: 1,000 calls/mo. Pro: 100,000. Enterprise: unlimited.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
