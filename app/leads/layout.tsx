import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leads — Himalaya Marketing OS",
  description: "Find, analyze, and manage business leads for outreach.",
};

export default function LeadsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
