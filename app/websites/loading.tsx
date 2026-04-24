export default function WebsitesLoading() {
  return (
    <div className="min-h-screen bg-[#0c0a08] text-white">
      <div className="h-14 bg-[#0c0a08] border-b border-white/[0.06]" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-7 w-24 bg-white/[0.04] rounded-lg animate-pulse" />
            <div className="h-4 w-16 bg-white/[0.03] rounded animate-pulse mt-2" />
          </div>
          <div className="h-10 w-28 bg-white/[0.04] rounded-xl animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <div className="h-40 bg-white/[0.03] animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-5 w-32 bg-white/[0.04] rounded-lg animate-pulse" />
                <div className="h-3 w-48 bg-white/[0.03] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
