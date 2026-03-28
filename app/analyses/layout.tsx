import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scan History — Himalaya Marketing OS",
  description: "Browse and compare your URL analyses, scores, and diagnostic reports.",
};

export default function AnalysesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
