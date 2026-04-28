"use client";

import SimplifiedNav from "@/components/SimplifiedNav";
import CRMSubNav from "@/components/CRMSubNav";

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0c0a08] text-white">
      <SimplifiedNav />
      <CRMSubNav showAddButton />
      {children}
    </div>
  );
}
