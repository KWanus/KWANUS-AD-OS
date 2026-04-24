"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useHotkeys } from "react-hotkeys-hook";
import { getRecentPages } from "@/lib/useRecentPages";
import {
  Search,
  Users,
  Megaphone,
  Globe,
  BarChart2,
  Building2,
  Mail,
  TrendingUp,
  FileText,
  Loader2,
  Clock,
} from "lucide-react";

type SearchResult = {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  href: string;
  score?: number;
};

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  client: { icon: Users, color: "text-cyan-400", label: "Client" },
  campaign: { icon: Megaphone, color: "text-purple-400", label: "Campaign" },
  site: { icon: Globe, color: "text-blue-400", label: "Site" },
  analysis: { icon: BarChart2, color: "text-emerald-400", label: "Scan" },
  lead: { icon: Building2, color: "text-amber-400", label: "Lead" },
  email_flow: { icon: Mail, color: "text-pink-400", label: "Flow" },
  affiliate: { icon: TrendingUp, color: "text-violet-400", label: "Offer" },
  proposal: { icon: FileText, color: "text-orange-400", label: "Proposal" },
};

export default function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Open with / key (when not typing in input)
  useHotkeys("/", (e) => {
    const el = document.activeElement;
    const tag = el?.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;
    e.preventDefault();
    setOpen(true);
  });

  useHotkeys("meta+k", (e) => {
    e.preventDefault();
    setOpen(true);
  });

  // Allow opening from other components via custom event
  useEffect(() => {
    function handleOpen() { setOpen(true); }
    window.addEventListener("open-global-search", handleOpen);
    return () => window.removeEventListener("open-global-search", handleOpen);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json() as { ok: boolean; results?: SearchResult[] };
        if (data.ok) {
          setResults(data.results ?? []);
          setSelectedIndex(0);
        }
      } catch {
        // non-fatal
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const navigate = useCallback((href: string) => {
    setOpen(false);
    router.push(href);
  }, [router]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      navigate(results[selectedIndex].href);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Search dialog */}
      <div className="relative w-full max-w-xl mx-4 bg-[#020509]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <Search className="w-5 h-5 text-white/25 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search clients, campaigns, scans, sites, leads..."
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-white/20 animate-spin shrink-0" />}
          <kbd className="px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-[10px] font-mono text-white/30">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {results.length === 0 && query.length >= 2 && !loading && (
            <div className="px-4 py-8 text-center text-xs text-white/25">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {results.length === 0 && query.length < 2 && (() => {
            const recent = getRecentPages();
            return (
              <div className="px-4 py-4">
                {recent.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Recently Viewed</p>
                    {recent.slice(0, 5).map((page) => (
                      <button
                        key={page.path}
                        onClick={() => navigate(page.path)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-white/[0.03] transition"
                      >
                        <Clock className="w-3.5 h-3.5 text-white/15 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/50 truncate">{page.title}</p>
                          <p className="text-[10px] text-white/20 truncate">{page.path}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-center text-xs text-white/20">
                  Type 2+ characters to search across your entire workspace
                </p>
              </div>
            );
          })()}

          {results.map((result, i) => {
            const cfg = TYPE_CONFIG[result.type] ?? TYPE_CONFIG.client;
            const Icon = cfg.icon;
            const isSelected = i === selectedIndex;

            return (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => navigate(result.href)}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                  isSelected ? "bg-cyan-500/10" : "hover:bg-white/[0.03]"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 ${cfg.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isSelected ? "text-white" : "text-white/70"}`}>
                    {result.title}
                  </p>
                  <p className="text-[10px] text-white/30 truncate">{result.subtitle}</p>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${cfg.color} bg-white/[0.02] border-white/[0.06]`}>
                  {cfg.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] text-white/20">
              <span><kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] font-mono">↑↓</kbd> Navigate</span>
              <span><kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] font-mono">↵</kbd> Open</span>
              <span><kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] font-mono">Esc</kbd> Close</span>
            </div>
            <span className="text-[10px] text-white/20">{results.length} result{results.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>
    </div>
  );
}
