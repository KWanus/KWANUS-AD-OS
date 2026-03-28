"use client";

import { useHotkeys } from "react-hotkeys-hook";
import { useRouter, usePathname } from "next/navigation";
import { useState, useCallback, useEffect } from "react";

// ---------------------------------------------------------------------------
// Shortcut definitions
// ---------------------------------------------------------------------------

type Shortcut = {
  keys: string;
  label: string;
  description: string;
  category: "Navigation" | "Actions" | "Global";
};

const SHORTCUTS: Shortcut[] = [
  // Navigation
  { keys: "g h", label: "G H", description: "Go to Home", category: "Navigation" },
  { keys: "g s", label: "G S", description: "Go to Scan", category: "Navigation" },
  { keys: "g c", label: "G C", description: "Go to Clients", category: "Navigation" },
  { keys: "g p", label: "G P", description: "Go to Pipeline", category: "Navigation" },
  { keys: "g k", label: "G K", description: "Go to Campaigns", category: "Navigation" },
  { keys: "g e", label: "G E", description: "Go to Emails", category: "Navigation" },
  { keys: "g w", label: "G W", description: "Go to Websites", category: "Navigation" },
  { keys: "g l", label: "G L", description: "Go to Leads", category: "Navigation" },
  { keys: "g a", label: "G A", description: "Go to Analyses", category: "Navigation" },
  { keys: "g i", label: "G I", description: "Go to Skills", category: "Navigation" },

  // Actions
  { keys: "n c", label: "N C", description: "New Client", category: "Actions" },
  { keys: "n w", label: "N W", description: "New Website", category: "Actions" },

  // Global
  { keys: "shift+/", label: "?", description: "Show keyboard shortcuts", category: "Global" },
  { keys: "escape", label: "Esc", description: "Close dialog / Go back", category: "Global" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const [showHelp, setShowHelp] = useState(false);

  // Don't fire shortcuts when user is typing in an input
  const isTyping = useCallback(() => {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select" || (el as HTMLElement).isContentEditable;
  }, []);

  // Navigation shortcuts
  useHotkeys("g h", () => { if (!isTyping()) router.push("/"); }, { preventDefault: true });
  useHotkeys("g s", () => { if (!isTyping()) router.push("/scan"); }, { preventDefault: true });
  useHotkeys("g c", () => { if (!isTyping()) router.push("/clients"); }, { preventDefault: true });
  useHotkeys("g p", () => { if (!isTyping()) router.push("/clients/pipeline"); }, { preventDefault: true });
  useHotkeys("g k", () => { if (!isTyping()) router.push("/campaigns"); }, { preventDefault: true });
  useHotkeys("g e", () => { if (!isTyping()) router.push("/emails"); }, { preventDefault: true });
  useHotkeys("g w", () => { if (!isTyping()) router.push("/websites"); }, { preventDefault: true });
  useHotkeys("g l", () => { if (!isTyping()) router.push("/leads"); }, { preventDefault: true });
  useHotkeys("g a", () => { if (!isTyping()) router.push("/analyses"); }, { preventDefault: true });
  useHotkeys("g i", () => { if (!isTyping()) router.push("/skills"); }, { preventDefault: true });

  // Action shortcuts
  useHotkeys("n c", () => { if (!isTyping()) router.push("/clients/new"); }, { preventDefault: true });
  useHotkeys("n w", () => { if (!isTyping()) router.push("/websites/new"); }, { preventDefault: true });

  // Help
  useHotkeys("shift+/", () => { if (!isTyping()) setShowHelp(v => !v); }, { preventDefault: true });
  useHotkeys("escape", () => { setShowHelp(false); });

  // Close on route change
  useEffect(() => { setShowHelp(false); }, [pathname]);

  if (!showHelp) return null;

  const categories = ["Navigation", "Actions", "Global"] as const;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHelp(false)} />

      {/* Dialog */}
      <div className="relative w-full max-w-lg mx-4 bg-[#0a1020] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-black text-white">Keyboard Shortcuts</h2>
          <button
            onClick={() => setShowHelp(false)}
            className="text-white/30 hover:text-white transition text-xs font-semibold"
          >
            ESC
          </button>
        </div>

        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-5">
          {categories.map(cat => {
            const items = SHORTCUTS.filter(s => s.category === cat);
            return (
              <div key={cat}>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2">{cat}</p>
                <div className="space-y-1">
                  {items.map(s => (
                    <div key={s.keys} className="flex items-center justify-between py-1.5">
                      <span className="text-xs text-white/60">{s.description}</span>
                      <div className="flex items-center gap-1">
                        {s.label.split(" ").map((k, i) => (
                          <span key={i}>
                            <kbd className="px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.1] text-[10px] font-mono font-bold text-white/50">
                              {k}
                            </kbd>
                            {i < s.label.split(" ").length - 1 && (
                              <span className="text-white/15 mx-0.5 text-[10px]">then</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t border-white/[0.06] bg-white/[0.02]">
          <p className="text-[10px] text-white/25 text-center">
            Press <kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[9px] font-mono text-white/40">?</kbd> to toggle this dialog
          </p>
        </div>
      </div>
    </div>
  );
}
