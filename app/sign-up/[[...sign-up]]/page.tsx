import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Mountain, Check } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#0c0a08] flex items-center justify-center px-4 py-10">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] opacity-[0.06] blur-[120px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, #e07850 0%, #f5a623 50%, transparent 70%)" }} />

      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 max-w-4xl w-full">

        {/* Left side — value prop */}
        <div className="flex-1 max-w-md hidden lg:block">
          <Link href="/welcome" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f5a623] to-[#e07850] flex items-center justify-center">
              <Mountain className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-black text-white">Himalaya</span>
          </Link>

          <h1 className="text-3xl font-black text-white leading-tight mb-4">
            Your business.<br />Built in 60 seconds.
          </h1>
          <p className="text-sm text-white/30 mb-6 leading-relaxed">
            Tell us your goal. Himalaya picks the strategy, builds the website, writes the ads, creates the emails, and tells you what to do every day.
          </p>

          <div className="space-y-3">
            {[
              "Website with payment processing — live instantly",
              "20+ ad creatives with real images",
              "Email sequences that send automatically",
              "Daily commands: exactly what to do",
              "Auto-optimization: kills bad ads, scales winners",
              "Free to start. No credit card.",
            ].map(item => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-emerald-400" />
                </div>
                <span className="text-sm text-white/50">{item}</span>
              </div>
            ))}
          </div>

          <p className="mt-8 text-xs text-white/15">
            Trusted by entrepreneurs building real businesses.
          </p>
        </div>

        {/* Right side — sign up form */}
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-6 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f5a623] to-[#e07850] flex items-center justify-center">
              <Mountain className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-black text-white">Himalaya</span>
          </div>

          <SignUp
            appearance={{
              variables: {
                colorPrimary: "#f5a623",
                colorBackground: "#0c0a08",
                colorText: "#ffffff",
                colorTextSecondary: "rgba(255,255,255,0.45)",
                colorInputBackground: "rgba(255,255,255,0.04)",
                colorInputText: "#ffffff",
                borderRadius: "14px",
              },
              elements: {
                card: "shadow-2xl border border-white/[0.08] bg-[#0c0a08]",
                headerTitle: "text-white font-black text-lg",
                headerSubtitle: "text-white/40",
                socialButtonsBlockButton: "border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.07] text-white/70 py-3",
                dividerLine: "bg-white/10",
                dividerText: "text-white/30",
                formFieldLabel: "text-white/40 text-xs font-bold uppercase tracking-widest",
                formFieldInput: "bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 focus:border-[#f5a623]/50 py-3",
                formButtonPrimary: "bg-gradient-to-r from-[#f5a623] to-[#e07850] hover:opacity-90 font-black text-sm py-3",
                footerActionLink: "text-[#f5a623] hover:text-[#f5a623]",
              },
            }}
          />

          <p className="mt-4 text-center text-xs text-white/20">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-[#f5a623] hover:text-[#f5a623] font-bold transition">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
