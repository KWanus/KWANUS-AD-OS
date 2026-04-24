import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import GlobalCopilotDock from "@/components/GlobalCopilotDock";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import GlobalSearch from "@/components/GlobalSearch";
import RecentPageTracker from "@/components/RecentPageTracker";
import ScrollToTop from "@/components/ScrollToTop";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Himalaya — AI Marketing OS",
  description: "The complete marketing engine: AI-powered funnel builder, ad creatives, email automations, and competitive intelligence. All in one platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} ${outfit.variable} antialiased bg-[#020509] text-white`}>
          {children}
          <GlobalCopilotDock />
          <KeyboardShortcuts />
          <GlobalSearch />
          <RecentPageTracker />
          <ScrollToTop />
          <Toaster position="bottom-right" theme="dark" richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
