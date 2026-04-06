"use client";

import { useState, useEffect } from "react";
import { Loader2, Inbox } from "lucide-react";
import TemplateCard from "./TemplateCard";

type Template = {
  id: string;
  name: string;
  assetType: string;
  mode: string;
  content: unknown;
  sourceRunId: string | null;
  createdAt: string;
};

type FilterType = "all" | string;
type FilterMode = "all" | "operator" | "consultant";

const TYPE_OPTIONS: { key: string; label: string }[] = [
  { key: "all", label: "All Types" },
  { key: "adHooks", label: "Marketing Angles" },
  { key: "adScripts", label: "Ad Scripts" },
  { key: "landingPage", label: "Homepage" },
  { key: "emailSequences", label: "Emails" },
  { key: "executionChecklist", label: "Roadmap" },
];

const MODE_OPTIONS: { key: FilterMode; label: string }[] = [
  { key: "all", label: "All Modes" },
  { key: "operator", label: "Scratch" },
  { key: "consultant", label: "Improve" },
];

export default function TemplateList() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterType !== "all") params.set("assetType", filterType);
    if (filterMode !== "all") params.set("mode", filterMode);

    fetch(`/api/himalaya/templates?${params.toString()}`)
      .then((r) => r.json() as Promise<{ ok: boolean; templates?: Template[] }>)
      .then((data) => {
        if (data.ok && data.templates) setTemplates(data.templates);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [filterType, filterMode]);

  return (
    <div className="rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent p-4 sm:p-5">
      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-2">
        {TYPE_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterType(key)}
            className={`rounded-lg px-3 py-2 text-[11px] font-bold transition ${
              filterType === key
                ? "border border-white/[0.15] bg-white/[0.08] text-white/60"
                : "border border-white/[0.06] bg-white/[0.02] text-white/30 hover:border-white/[0.1] hover:text-white/50"
            }`}
          >
            {label}
          </button>
        ))}
        <div className="mx-1 h-6 w-px self-center bg-white/[0.06]" />
        {MODE_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterMode(key)}
            className={`rounded-lg px-3 py-2 text-[11px] font-bold transition ${
              filterMode === key
                ? "border border-white/[0.15] bg-white/[0.08] text-white/60"
                : "border border-white/[0.06] bg-white/[0.02] text-white/30 hover:border-white/[0.1] hover:text-white/50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/[0.05] bg-black/20 py-16">
          <Inbox className="w-10 h-10 text-white/10" />
          <p className="text-sm text-white/30">No templates saved yet</p>
          <p className="text-xs text-white/20">Save asset sections from your run results to create reusable templates</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} onDeleted={load} />
          ))}
        </div>
      )}
    </div>
  );
}
