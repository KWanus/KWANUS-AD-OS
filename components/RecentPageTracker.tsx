"use client";

import { useTrackRecentPage } from "@/lib/useRecentPages";

export default function RecentPageTracker() {
  useTrackRecentPage();
  return null;
}
