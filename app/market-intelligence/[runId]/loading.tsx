export default function Loading() {
  return (
    <div className="min-h-screen bg-[#020509] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        <p className="text-sm text-white/40">Loading results...</p>
      </div>
    </div>
  );
}
