"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#050a14] text-white flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Something went wrong</h1>
        <p className="text-sm text-white/40 mb-6 leading-relaxed">
          An unexpected error occurred. This has been logged automatically.
          {error.digest && (
            <span className="block text-[10px] text-white/20 mt-2 font-mono">
              Error ID: {error.digest}
            </span>
          )}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <a
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-white/60 text-sm font-semibold hover:text-white hover:border-white/20 transition"
          >
            <Home className="w-4 h-4" />
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
