import Link from "next/link";
import { AlertTriangle, Settings, Sparkles } from "lucide-react";

type DatabaseFallbackNoticeProps = {
  visible?: boolean;
  className?: string;
  compact?: boolean;
};

export default function DatabaseFallbackNotice({
  visible,
  className = "",
  compact = false,
}: DatabaseFallbackNoticeProps) {
  if (!visible) return null;

  return (
    <div
      className={[
        "rounded-[24px] border border-amber-500/25 bg-[linear-gradient(135deg,rgba(245,158,11,0.14),rgba(245,158,11,0.05))] p-4 text-amber-50 shadow-[0_18px_50px_rgba(0,0,0,0.18)]",
        className,
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-300" />
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-amber-100/85">
              Production Fallback Mode
            </p>
          </div>
          <p className="mt-3 text-sm font-bold text-amber-50">
            The live app shell is up, but the production database is currently unreachable.
          </p>
          <p className="mt-2 text-sm leading-7 text-amber-50/75">
            Signed-in workspace data may appear empty or incomplete until the production `DATABASE_URL`
            is updated to a Vercel-reachable Postgres or Supabase connection string.
          </p>
        </div>

        {!compact && (
          <div className="flex flex-wrap gap-3">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm font-bold text-amber-50 transition hover:bg-amber-400/15"
            >
              <Settings className="h-4 w-4" />
              Open Settings
            </Link>
            <Link
              href="/my-system"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-bold text-white/80 transition hover:bg-white/10"
            >
              <Sparkles className="h-4 w-4" />
              Check My System
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
