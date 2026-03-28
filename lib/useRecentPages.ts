"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "himalaya-recent-pages";
const MAX_RECENT = 8;

type RecentPage = {
  path: string;
  title: string;
  timestamp: number;
};

// Route patterns to track (with label extraction)
const TRACKABLE: { pattern: RegExp; label: (path: string) => string }[] = [
  { pattern: /^\/clients\/[^/]+$/, label: () => "Client Detail" },
  { pattern: /^\/campaigns\/[^/]+$/, label: () => "Campaign" },
  { pattern: /^\/analyses\/[^/]+$/, label: () => "Analysis Report" },
  { pattern: /^\/websites\/[^/]+$/, label: () => "Site" },
  { pattern: /^\/emails\/flows\/[^/]+$/, label: () => "Email Flow" },
  { pattern: /^\/leads\/[^/]+$/, label: () => "Lead Detail" },
  { pattern: /^\/affiliate\/offers\/[^/]+$/, label: () => "Affiliate Offer" },
];

export function useTrackRecentPage() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const match = TRACKABLE.find(t => t.pattern.test(pathname));
    if (!match) return;

    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as RecentPage[];
      const filtered = stored.filter(p => p.path !== pathname);
      const updated: RecentPage[] = [
        { path: pathname, title: match.label(pathname), timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // localStorage not available
    }
  }, [pathname]);
}

export function getRecentPages(): RecentPage[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as RecentPage[];
  } catch {
    return [];
  }
}
