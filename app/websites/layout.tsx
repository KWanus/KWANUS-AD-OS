import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sites — Himalaya Marketing OS",
  description: "Build, edit, and publish conversion-optimized websites and funnels.",
};

export default function WebsitesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
