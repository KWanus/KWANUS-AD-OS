export default function Loading() {
  return (
    <div className="min-h-screen bg-[#020509] text-white">
      <div className="h-14 bg-[#020509] border-b border-white/[0.06]" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="h-7 w-40 bg-white/[0.04] rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-64 bg-white/[0.03] rounded animate-pulse mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      </main>
    </div>
  );
}
