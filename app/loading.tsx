export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0c0a08] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#f5a623]/30 border-t-[#f5a623] animate-spin" />
        <p className="text-white/20 text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}
