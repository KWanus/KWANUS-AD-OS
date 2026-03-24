import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#020509] flex flex-col items-center justify-center px-4">
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.018]"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] opacity-[0.07] blur-[120px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, #06b6d4 0%, #8b5cf6 50%, transparent 70%)" }} />

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-10 group">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
          <Zap className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-black tracking-tight text-white">Himalaya</span>
          <span className="text-[9px] font-bold tracking-[0.2em] text-white/30 uppercase">Marketing OS</span>
        </div>
      </Link>

      {/* Clerk component */}
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#06b6d4",
            colorBackground: "#07101f",
            colorText: "#ffffff",
            colorTextSecondary: "rgba(255,255,255,0.45)",
            colorInputBackground: "rgba(255,255,255,0.04)",
            colorInputText: "#ffffff",
            borderRadius: "12px",
          },
          elements: {
            card: "shadow-2xl border border-white/[0.08] bg-[#07101f]",
            headerTitle: "text-white font-black",
            headerSubtitle: "text-white/40",
            socialButtonsBlockButton: "border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.07] text-white/70",
            dividerLine: "bg-white/10",
            dividerText: "text-white/30",
            formFieldLabel: "text-white/40 text-xs font-bold uppercase tracking-widest",
            formFieldInput: "bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 focus:border-cyan-500/50",
            formButtonPrimary: "bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90 font-black text-sm",
            footerActionLink: "text-cyan-400 hover:text-cyan-300",
            identityPreviewText: "text-white/60",
            identityPreviewEditButton: "text-cyan-400",
          },
        }}
      />

      <p className="mt-6 text-xs text-white/20">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="text-cyan-400 hover:text-cyan-300 font-bold transition">
          Sign up free →
        </Link>
      </p>
    </div>
  );
}
