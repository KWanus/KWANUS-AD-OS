"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// ---------------------------------------------------------------------------
// Three modes — like Apple's appearance settings
// ---------------------------------------------------------------------------

export type ThemeMode = "dark" | "light" | "himalaya";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: "himalaya",
  setMode: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

const STORAGE_KEY = "himalaya-theme";

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("himalaya");
  const [mounted, setMounted] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (saved && ["dark", "light", "himalaya"].includes(saved)) {
        setModeState(saved);
        document.documentElement.setAttribute("data-theme", saved);
      } else {
        document.documentElement.setAttribute("data-theme", "himalaya");
      }
    } catch {
      document.documentElement.setAttribute("data-theme", "himalaya");
    }
  }, []);

  function setMode(newMode: ThemeMode) {
    setModeState(newMode);
    document.documentElement.setAttribute("data-theme", newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // Storage unavailable
    }
  }

  // Prevent flash — don't render until we know the theme
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
