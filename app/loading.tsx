export default function Loading() {
  return (
    <div className="min-h-screen bg-[#050a14] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
        <p className="text-white/20 text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}
