import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scan & Build — Himalaya Marketing OS",
  description: "Analyze any URL, score opportunities, and generate marketing assets.",
};

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
