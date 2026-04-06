"use client";

import { useTheme, type ThemeMode } from "@/lib/theme/ThemeProvider";

const MODES: {
  id: ThemeMode;
  label: string;
  description: string;
  preview: {
    bg: string;
    card: string;
    text: string;
    accent: string;
    navBg: string;
  };
}[] = [
  {
    id: "himalaya",
    label: "Himalaya",
    description: "Volcanic warmth. Amber ember on charcoal.",
    preview: {
      bg: "#0c0a08",
      card: "#1c1916",
      text: "#f5f0e8",
      accent: "#f5a623",
      navBg: "#141210",
    },
  },
  {
    id: "dark",
    label: "Dark",
    description: "Clean dark with blue accents",
    preview: {
      bg: "#09090b",
      card: "#18181b",
      text: "#fafafa",
      accent: "#3b82f6",
      navBg: "#111113",
    },
  },
  {
    id: "light",
    label: "Light",
    description: "Clean white, professional",
    preview: {
      bg: "#ffffff",
      card: "#f1f5f9",
      text: "#0f172a",
      accent: "#0891b2",
      navBg: "#f8fafc",
    },
  },
];

export default function ThemePicker() {
  const { mode, setMode } = useTheme();

  return (
    <div className="grid grid-cols-3 gap-3">
      {MODES.map((m) => {
        const active = mode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className="group relative text-left transition-all focus:outline-none"
          >
            {/* Preview window — Apple-style */}
            <div
              className={`rounded-xl overflow-hidden border-2 transition-all ${
                active
                  ? "border-[var(--accent)] shadow-[0_0_24px_var(--accent-glow)]"
                  : "border-transparent hover:border-[var(--border-strong)]"
              }`}
            >
              {/* Mini preview of the theme */}
              <div
                className="aspect-[4/3] p-2.5 flex flex-col gap-1.5"
                style={{ backgroundColor: m.preview.bg }}
              >
                {/* Nav bar */}
                <div
                  className="h-2.5 rounded-full flex items-center gap-1 px-1.5"
                  style={{ backgroundColor: m.preview.navBg, border: `1px solid ${m.preview.text}10` }}
                >
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: m.preview.accent }} />
                  <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: `${m.preview.text}30` }} />
                </div>

                {/* Content area */}
                <div className="flex-1 flex gap-1.5">
                  {/* Sidebar */}
                  <div
                    className="w-1/4 rounded-md p-1 flex flex-col gap-0.5"
                    style={{ backgroundColor: m.preview.card }}
                  >
                    <div className="h-1 rounded-full" style={{ backgroundColor: m.preview.accent, opacity: 0.6 }} />
                    <div className="h-0.5 rounded-full" style={{ backgroundColor: `${m.preview.text}20` }} />
                    <div className="h-0.5 rounded-full" style={{ backgroundColor: `${m.preview.text}15` }} />
                    <div className="h-0.5 rounded-full" style={{ backgroundColor: `${m.preview.text}10` }} />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 rounded-md p-1.5 flex flex-col gap-1" style={{ backgroundColor: m.preview.card }}>
                    <div className="h-1.5 w-2/3 rounded-full" style={{ backgroundColor: `${m.preview.text}40` }} />
                    <div className="h-0.5 w-full rounded-full" style={{ backgroundColor: `${m.preview.text}15` }} />
                    <div className="h-0.5 w-4/5 rounded-full" style={{ backgroundColor: `${m.preview.text}15` }} />
                    <div className="mt-auto flex gap-1">
                      <div className="h-2 flex-1 rounded" style={{ backgroundColor: m.preview.accent }} />
                      <div className="h-2 w-3 rounded" style={{ backgroundColor: `${m.preview.text}10` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Label */}
            <div className="mt-2 text-center">
              <p
                className={`text-xs font-bold transition-colors ${
                  active ? "text-[var(--accent-text)]" : "text-[var(--foreground-muted)]"
                }`}
              >
                {m.label}
              </p>
              <p className="text-[10px] text-[var(--foreground-faint)] mt-0.5">{m.description}</p>
            </div>

            {/* Active indicator */}
            {active && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-lg">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
