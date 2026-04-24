export default function AnalysesLoading() {
  return (
    <div className="min-h-screen bg-[#0c0a08] text-white">
      <div className="h-14 bg-[#0c0a08] border-b border-white/[0.06]" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-7 w-40 bg-white/[0.04] rounded-lg animate-pulse" />
            <div className="h-4 w-24 bg-white/[0.03] rounded animate-pulse mt-2" />
          </div>
          <div className="flex gap-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-12 w-20 bg-white/[0.03] border border-white/[0.06] rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-white/[0.04]">
              <div className="w-10 h-10 rounded-full bg-white/[0.04] animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-white/[0.04] rounded-lg animate-pulse w-48" />
                <div className="h-2.5 bg-white/[0.04] rounded animate-pulse w-64" />
              </div>
              <div className="h-5 w-24 bg-white/[0.04] rounded animate-pulse hidden sm:block" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
