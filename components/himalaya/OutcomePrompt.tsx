"use client";

import { useState, useEffect } from "react";
import { CheckCircle, MinusCircle, TrendingDown, Clock, Loader2, MessageSquare } from "lucide-react";
import UpgradeNudge from "./UpgradeNudge";
import { track } from "@/lib/himalaya/tracking";

type OutcomeResult = "improved" | "no_change" | "worse" | "not_done";
type OutcomeData = { result: OutcomeResult; note?: string; timestamp: string };

const OUTCOMES: { value: OutcomeResult; label: string; icon: React.ElementType; color: string }[] = [
  { value: "improved", label: "Improved results", icon: CheckCircle, color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20" },
  { value: "no_change", label: "No change", icon: MinusCircle, color: "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20" },
  { value: "worse", label: "Got worse", icon: TrendingDown, color: "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20" },
  { value: "not_done", label: "Not implemented yet", icon: Clock, color: "bg-white/[0.04] border-white/[0.08] text-white/40 hover:bg-white/[0.06]" },
];

export default function OutcomePrompt({ runId }: { runId: string }) {
  const [outcome, setOutcome] = useState<OutcomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OutcomeResult | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [showNote, setShowNote] = useState(false);

  useEffect(() => {
    fetch(`/api/analyses/${runId}/outcome`)
      .then((r) => r.json() as Promise<{ ok: boolean; outcome?: OutcomeData | null }>)
      .then((data) => {
        if (data.ok && data.outcome) setOutcome(data.outcome);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [runId]);

  async function handleSubmit(result: OutcomeResult) {
    setSelected(result);
    setSaving(true);
    try {
      const res = await fetch(`/api/analyses/${runId}/outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result, note: note.trim() || undefined }),
      });
      const data = (await res.json()) as { ok: boolean; outcome?: OutcomeData };
      if (data.ok && data.outcome) {
        setOutcome(data.outcome);
        track.outcomeSubmit(runId, result);
      }
    } catch {
      // non-fatal
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  // Already reported
  if (outcome) {
    const config = OUTCOMES.find((o) => o.value === outcome.result);
    const Icon = config?.icon ?? CheckCircle;
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.02] to-transparent p-4">
          <div className="flex items-center gap-3">
            <Icon className={`w-4 h-4 ${
              outcome.result === "improved" ? "text-emerald-400" :
              outcome.result === "worse" ? "text-red-400" :
              outcome.result === "no_change" ? "text-amber-400" : "text-white/30"
            }`} />
            <div>
              <p className="text-xs font-bold text-white/50">Outcome reported: {config?.label}</p>
              {outcome.note && <p className="text-[10px] text-white/25 mt-0.5">{outcome.note}</p>}
            </div>
          </div>
        </div>
        <UpgradeNudge context="after_outcome" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.03] via-white/[0.02] to-transparent p-4 sm:p-5">
      <h3 className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/30">How did this perform?</h3>
      <p className="mb-4 text-xs text-white/25">Your feedback improves future recommendations.</p>

      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {OUTCOMES.map(({ value, label, icon: Icon, color }) => (
          <button
            key={value}
            onClick={() => { if (!showNote) void handleSubmit(value); else setSelected(value); }}
            disabled={saving}
            className={`flex items-center gap-2 rounded-xl border p-3 text-left text-xs font-semibold transition disabled:opacity-40 ${
              selected === value ? color : "bg-white/[0.02] border-white/[0.06] text-white/35 hover:border-white/[0.12]"
            }`}
          >
            {saving && selected === value ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
            {label}
          </button>
        ))}
      </div>

      {!showNote ? (
        <button
          onClick={() => setShowNote(true)}
          className="flex items-center gap-1 text-[10px] text-white/20 transition hover:text-white/40"
        >
          <MessageSquare className="w-2.5 h-2.5" /> Add a note (optional)
        </button>
      ) : (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What happened? Any details that would help improve next time?"
            rows={2}
            className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.03] p-2.5 text-xs text-white/50 placeholder-white/15 focus:border-cyan-500/20 focus:outline-none"
          />
          {selected && (
            <button
              onClick={() => void handleSubmit(selected)}
              disabled={saving}
              className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-400 transition hover:bg-cyan-500/20 disabled:opacity-40"
            >
              {saving ? "Saving..." : "Submit Feedback"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
