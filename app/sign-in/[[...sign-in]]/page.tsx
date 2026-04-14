import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Mountain } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#020509] flex flex-col items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] opacity-[0.06] blur-[120px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, #06b6d4 0%, #8b5cf6 50%, transparent 70%)" }} />

      <div className="relative z-10 w-full max-w-sm">
        <Link href="/welcome" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <Mountain className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-black text-white">Himalaya</span>
        </Link>

        <SignIn
          appearance={{
            variables: {
              colorPrimary: "#06b6d4",
              colorBackground: "#07101f",
              colorText: "#ffffff",
              colorTextSecondary: "rgba(255,255,255,0.45)",
              colorInputBackground: "rgba(255,255,255,0.04)",
              colorInputText: "#ffffff",
              borderRadius: "14px",
            },
            elements: {
              card: "shadow-2xl border border-white/[0.08] bg-[#07101f]",
              headerTitle: "text-white font-black text-lg",
              headerSubtitle: "text-white/40",
              socialButtonsBlockButton: "border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.07] text-white/70 py-3",
              dividerLine: "bg-white/10",
              dividerText: "text-white/30",
              formFieldLabel: "text-white/40 text-xs font-bold uppercase tracking-widest",
              formFieldInput: "bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 focus:border-cyan-500/50 py-3",
              formButtonPrimary: "bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90 font-black text-sm py-3",
              footerActionLink: "text-cyan-400 hover:text-cyan-300",
              identityPreviewText: "text-white/60",
              identityPreviewEditButton: "text-cyan-400",
            },
          }}
        />

        <p className="mt-4 text-center text-xs text-white/20">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-cyan-400 hover:text-cyan-300 font-bold transition">
            Sign up free →
          </Link>
        </p>
      </div>
    </div>
  );
}
