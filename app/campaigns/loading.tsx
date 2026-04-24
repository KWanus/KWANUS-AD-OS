export default function CampaignsLoading() {
  return (
    <div className="min-h-screen bg-[#020509] text-white">
      <div className="h-14 bg-[#020509] border-b border-white/[0.06]" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-7 w-36 bg-white/[0.04] rounded-lg animate-pulse" />
            <div className="h-4 w-20 bg-white/[0.03] rounded animate-pulse mt-2" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-5 w-32 bg-white/[0.04] rounded-lg animate-pulse" />
                <div className="h-5 w-16 bg-white/[0.04] rounded-md animate-pulse" />
              </div>
              <div className="h-3 w-full bg-white/[0.03] rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-white/[0.03] rounded animate-pulse" />
              <div className="flex gap-2 pt-2">
                <div className="h-8 w-20 bg-white/[0.04] rounded-lg animate-pulse" />
                <div className="h-8 w-20 bg-white/[0.04] rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
