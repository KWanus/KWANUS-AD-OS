import Link from "next/link";
import { Mountain, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0c0a08] text-[#f5f0e8] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-8xl font-black text-[#f5f0e8]/[0.03] mb-4 select-none">404</div>
        <div className="w-16 h-16 rounded-2xl bg-[#f5a623]/10 border border-[#f5a623]/20 flex items-center justify-center mx-auto mb-6 -mt-14">
          <Mountain className="w-7 h-7 text-[#f5a623]/60" />
        </div>
        <h1 className="text-2xl font-black mb-2">Page not found</h1>
        <p className="text-sm text-[#f5f0e8]/40 mb-8 leading-relaxed">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-[#0c0a08] text-sm font-bold hover:opacity-90 transition"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            href="/himalaya"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#f5f0e8]/10 bg-[#f5f0e8]/[0.03] text-[#f5f0e8]/60 text-sm font-semibold hover:text-[#f5f0e8] hover:border-[#f5f0e8]/20 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Build Something
          </Link>
        </div>
      </div>
    </div>
  );
}
