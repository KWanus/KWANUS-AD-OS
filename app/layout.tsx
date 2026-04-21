import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import GlobalCopilotDock from "@/components/GlobalCopilotDock";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import GlobalSearch from "@/components/GlobalSearch";
import RecentPageTracker from "@/components/RecentPageTracker";
import ScrollToTop from "@/components/ScrollToTop";
import ThemeProvider from "@/lib/theme/ThemeProvider";
import ModeProvider from "@/lib/theme/ModeProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://himalaya.app"),
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
      <html lang="en" data-theme="himalaya" suppressHydrationWarning>
        <head>
          {/* Prevent flash of wrong theme */}
          <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('himalaya-theme');if(t&&['dark','light','himalaya'].includes(t))document.documentElement.setAttribute('data-theme',t)}catch(e){}` }} />
        </head>
        <body className={`${inter.variable} ${outfit.variable} antialiased`}>
          <ThemeProvider>
          <ModeProvider>
          {children}
          </ModeProvider>
          <GlobalCopilotDock />
          <KeyboardShortcuts />
          <GlobalSearch />
          <RecentPageTracker />
          <ScrollToTop />
          <Toaster position="bottom-right" theme="dark" richColors />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
