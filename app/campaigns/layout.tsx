import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campaigns — Himalaya Marketing OS",
  description: "Manage your ad campaigns, email sequences, and marketing automations.",
};

export default function CampaignsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
