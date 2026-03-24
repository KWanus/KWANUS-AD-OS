"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, Plus } from "lucide-react";

export default function CreditsDisplay() {
  const [credits, setCredits] = useState<number | null>(null);

  async function fetchCredits() {
    try {
      const res = await fetch("/api/user/credits");
      if (!res.ok) return;
      const data = (await res.json()) as { ok: boolean; credits: number };
      if (data.ok) setCredits(data.credits);
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    void fetchCredits();
    const interval = setInterval(() => void fetchCredits(), 30_000);
    return () => clearInterval(interval);
  }, []);

  if (credits === null) return null;

  const low = credits < 20;

  return (
    <div className="flex items-center gap-1.5">
      <Link href="/billing"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold tabular-nums transition
          ${low
            ? "bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/15"
            : "bg-cyan-500/[0.07] border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/12"
          }`}
      >
        <Zap className="w-3 h-3" />
        {credits} credits
      </Link>
      <Link href="/billing"
        className="w-6 h-6 rounded-full border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] flex items-center justify-center transition"
        title="Buy more credits"
      >
        <Plus className="w-3 h-3 text-white/30 hover:text-white/60" />
      </Link>
    </div>
  );
}
