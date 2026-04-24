import Link from "next/link";
import { Search, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#020509] text-white flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-8xl font-black text-white/5 mb-4 select-none">404</div>
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-6 -mt-14">
          <Search className="w-7 h-7 text-cyan-400/60" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Page not found</h1>
        <p className="text-sm text-white/40 mb-8 leading-relaxed">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            href="/scan"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-white/60 text-sm font-semibold hover:text-white hover:border-white/20 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Run a Scan
          </Link>
        </div>
      </div>
    </div>
  );
}
