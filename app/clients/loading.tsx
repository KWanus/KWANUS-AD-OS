export default function ClientsLoading() {
  return (
    <div className="min-h-screen bg-[#020509] text-white">
      <div className="h-14 bg-[#020509] border-b border-white/[0.06]" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-7 w-32 bg-white/[0.04] rounded-lg animate-pulse" />
            <div className="h-4 w-20 bg-white/[0.03] rounded animate-pulse mt-2" />
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-white/[0.04]">
              <div className="w-9 h-9 rounded-xl bg-white/[0.04] animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-white/[0.04] rounded-lg animate-pulse w-40" />
                <div className="h-2.5 bg-white/[0.04] rounded animate-pulse w-24" />
              </div>
              <div className="h-5 w-16 bg-white/[0.04] rounded-md animate-pulse hidden sm:block" />
              <div className="h-10 w-20 bg-white/[0.04] rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
