"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AppMode = "simple" | "pro";

type ModeContextValue = {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
};

const ModeContext = createContext<ModeContextValue>({
  mode: "simple",
  setMode: () => {},
});

export function useAppMode() {
  return useContext(ModeContext);
}

const STORAGE_KEY = "himalaya-mode";

export default function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>("simple");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AppMode | null;
      if (saved && (saved === "simple" || saved === "pro")) {
        setModeState(saved);
      }
    } catch { /* ignore */ }
  }, []);

  function setMode(newMode: AppMode) {
    setModeState(newMode);
    try { localStorage.setItem(STORAGE_KEY, newMode); } catch { /* ignore */ }
  }

  if (!mounted) return <>{children}</>;

  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
}
