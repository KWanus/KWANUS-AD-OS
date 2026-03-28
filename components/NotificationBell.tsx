"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, AlertTriangle, Users, Megaphone, Globe, Mail, Zap, Settings, X } from "lucide-react";

type QuickAction = {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  category: string;
  title: string;
  description: string;
  href: string;
  cta: string;
};

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  client: { icon: Users, color: "text-cyan-400" },
  campaign: { icon: Megaphone, color: "text-purple-400" },
  scan: { icon: Zap, color: "text-emerald-400" },
  email: { icon: Mail, color: "text-pink-400" },
  site: { icon: Globe, color: "text-blue-400" },
  setup: { icon: Settings, color: "text-amber-400" },
  system: { icon: AlertTriangle, color: "text-red-400" },
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-amber-500",
  medium: "bg-cyan-500",
  low: "bg-white/30",
};

export default function NotificationBell() {
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/quick-actions");
        const data = await res.json() as { ok: boolean; actions?: QuickAction[] };
        if (data.ok) setActions(data.actions ?? []);
      } catch {
        // non-fatal
      }
    }
    void load();
    const interval = setInterval(() => void load(), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const visible = actions.filter(a => !dismissed.has(a.id));
  const criticalCount = visible.filter(a => a.priority === "critical").length;
  const totalCount = visible.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`relative p-2 rounded-xl transition-all ${
          open ? "bg-white/[0.07] text-white" : "text-white/25 hover:text-white/60 hover:bg-white/[0.04]"
        }`}
      >
        <Bell className="w-3.5 h-3.5" />
        {totalCount > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center text-white ${
            criticalCount > 0 ? "bg-red-500 animate-pulse" : "bg-cyan-500"
          }`}>
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 rounded-2xl border border-white/[0.1] bg-[#0a1020] shadow-2xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/30">Actions</h3>
            <span className="text-[10px] text-white/20">{totalCount} pending</span>
          </div>

          <div className="max-h-[50vh] overflow-y-auto">
            {visible.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-white/25">
                All caught up — no actions needed right now.
              </div>
            ) : (
              visible.map(action => {
                const cfg = CATEGORY_CONFIG[action.category] ?? CATEGORY_CONFIG.system;
                const Icon = cfg.icon;
                return (
                  <div key={action.id} className="border-b border-white/[0.04] last:border-0">
                    <Link
                      href={action.href}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition group"
                    >
                      <div className="flex items-center gap-2 shrink-0 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_COLORS[action.priority]}`} />
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white/70 group-hover:text-white transition truncate">
                          {action.title}
                        </p>
                        <p className="text-[10px] text-white/30 line-clamp-1 mt-0.5">{action.description}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDismissed(prev => new Set([...prev, action.id]));
                        }}
                        className="shrink-0 p-1 rounded-lg hover:bg-white/5 text-white/15 hover:text-white/40 transition opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
