"use client";

import AppNav from "@/components/AppNav";
import CRMSubNav from "@/components/CRMSubNav";

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <CRMSubNav showAddButton />
      {children}
    </div>
  );
}
