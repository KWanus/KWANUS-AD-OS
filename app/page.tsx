"use client";
import Link from "next/link";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#0a0f1e] text-white flex flex-col">
      <header className="px-8 py-6 border-b border-white/10">
        <h1 className="text-2xl font-bold tracking-tight text-cyan-400">KWANUS AD OS</h1>
        <p className="text-sm text-white/40 mt-1">Autonomous Digital Operating System</p>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        <h2 className="text-4xl font-bold mb-3">What do you want to do?</h2>
        <p className="text-white/40 mb-12 text-lg">Choose your next action below.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          <Link href="/scan-products" className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/40 p-8 transition-all duration-200 flex flex-col gap-3">
            <div className="text-3xl">📦</div>
            <h3 className="text-xl font-semibold group-hover:text-cyan-400 transition-colors">Scan Products</h3>
            <p className="text-white/40 text-sm">Analyze product demand, competition, and opportunity score.</p>
          </Link>
          <Link href="/scan-businesses" className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/40 p-8 transition-all duration-200 flex flex-col gap-3">
            <div className="text-3xl">🔍</div>
            <h3 className="text-xl font-semibold group-hover:text-cyan-400 transition-colors">Scan Businesses</h3>
            <p className="text-white/40 text-sm">Audit any business URL and get a structured diagnostic report.</p>
          </Link>
          <Link href="/projects" className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/40 p-8 transition-all duration-200 flex flex-col gap-3">
            <div className="text-3xl">🗂️</div>
            <h3 className="text-xl font-semibold group-hover:text-cyan-400 transition-colors">Projects</h3>
            <p className="text-white/40 text-sm">View and manage your saved scans and projects.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
