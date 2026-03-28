export default function EmailsLoading() {
  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <div className="h-14 bg-[#050a14] border-b border-white/[0.06]" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="h-10 w-full max-w-md bg-white/[0.03] rounded-xl animate-pulse mb-6" />
        <div className="flex items-center justify-between mb-6">
          <div className="h-7 w-32 bg-white/[0.04] rounded-lg animate-pulse" />
          <div className="h-10 w-28 bg-white/[0.04] rounded-xl animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/[0.04] rounded-xl animate-pulse" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-28 bg-white/[0.04] rounded animate-pulse" />
                  <div className="h-3 w-20 bg-white/[0.03] rounded animate-pulse" />
                </div>
              </div>
              <div className="h-2 w-full bg-white/[0.03] rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
