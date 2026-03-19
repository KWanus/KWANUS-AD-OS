import Link from "next/link";

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-[#0a0f1e] text-white flex flex-col">
      <header className="px-8 py-6 border-b border-white/10">
        <Link href="/" className="text-cyan-400 text-sm hover:underline">← Back to Dashboard</Link>
        <h1 className="text-2xl font-bold mt-2">Projects</h1>
      </header>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🗂️</div>
          <h2 className="text-2xl font-semibold mb-2">Projects coming in Phase 6</h2>
          <p className="text-white/40">Your saved scans will appear here.</p>
        </div>
      </div>
    </main>
  );
}
