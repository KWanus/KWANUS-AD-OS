"use client";
import dynamic from "next/dynamic";

const FlowBuilder = dynamic(
  () => import("@/components/email-flow/FlowBuilder"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#0c0a08] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#f5a623]/30 border-t-[#f5a623] animate-spin" />
          <p className="text-white/30 text-sm font-medium">Loading flow builder...</p>
        </div>
      </div>
    ),
  }
);

export default function FlowPageClient({ flowId }: { flowId: string }) {
  return <FlowBuilder flowId={flowId} />;
}
