"use client";

import { useState } from "react";
import SimplifiedNav from "@/components/SimplifiedNav";
import { Webhook, Send, Check, X, Loader2, Copy } from "lucide-react";

export default function WebhookTesterPage() {
  const [url, setUrl] = useState("");
  const [payload, setPayload] = useState(JSON.stringify({
    event: "lead.created",
    timestamp: new Date().toISOString(),
    data: {
      name: "Test Lead",
      email: "test@example.com",
      phone: "555-0100",
      source: "Himalaya Test",
      score: 45,
    },
  }, null, 2));
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; status?: number; body?: string; error?: string } | null>(null);
  const [history, setHistory] = useState<{ url: string; status: number | string; time: string }[]>([]);

  async function sendTest() {
    if (!url.trim()) return;
    setSending(true);
    setResult(null);

    try {
      let parsed;
      try { parsed = JSON.parse(payload); } catch { parsed = { raw: payload }; }

      const start = Date.now();
      const res = await fetch("/api/webhooks/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), payload: parsed }),
      });
      const data = await res.json() as { ok: boolean; status?: number; body?: string; error?: string };
      const duration = Date.now() - start;

      setResult(data);
      setHistory((prev) => [
        { url: url.trim(), status: data.status ?? (data.ok ? 200 : 0), time: `${duration}ms` },
        ...prev.slice(0, 9),
      ]);
    } catch (err) {
      setResult({ ok: false, error: err instanceof Error ? err.message : "Failed" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#e07850]/10 border border-[#e07850]/20 flex items-center justify-center">
            <Webhook className="w-5 h-5 text-[#e07850]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Webhook Tester</h1>
            <p className="text-xs text-white/35">Test your n8n, Zapier, or Make.com webhook connections</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* URL */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Webhook URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://hooks.zapier.com/... or https://n8n.yourdomain.com/webhook/..."
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#e07850]/50 transition font-mono"
            />
          </div>

          {/* Payload */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Test Payload (JSON)</label>
            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              rows={10}
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#e07850]/50 transition font-mono resize-none"
            />
          </div>

          {/* Quick payloads */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Lead Created", event: "lead.created", data: { name: "Test Lead", email: "test@example.com", score: 45 } },
              { label: "Payment", event: "payment.completed", data: { amount: 9700, email: "buyer@example.com" } },
              { label: "Form Submit", event: "form.submitted", data: { email: "visitor@example.com", siteId: "test" } },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => setPayload(JSON.stringify({ event: preset.event, timestamp: new Date().toISOString(), data: preset.data }, null, 2))}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white/30 hover:text-white/60 transition"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Send button */}
          <button
            onClick={sendTest}
            disabled={sending || !url.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#e07850] to-[#f5a623] text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-40"
          >
            {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Test Webhook</>}
          </button>

          {/* Result */}
          {result && (
            <div className={`rounded-xl border p-4 ${result.ok ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.ok ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-red-400" />}
                <span className={`text-sm font-bold ${result.ok ? "text-emerald-300" : "text-red-300"}`}>
                  {result.ok ? `Success (${result.status})` : `Failed${result.error ? `: ${result.error}` : ""}`}
                </span>
              </div>
              {result.body && (
                <pre className="text-[10px] text-white/30 font-mono bg-black/20 rounded-lg p-3 overflow-x-auto max-h-32">
                  {result.body.slice(0, 500)}
                </pre>
              )}
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Recent Tests</p>
              <div className="space-y-1.5">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 text-[10px]">
                    <span className={`font-mono font-bold ${Number(h.status) >= 200 && Number(h.status) < 300 ? "text-emerald-400" : "text-red-400"}`}>
                      {h.status}
                    </span>
                    <span className="text-white/30 truncate flex-1 font-mono">{h.url}</span>
                    <span className="text-white/15 shrink-0">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
