"use client";

import Link from "next/link";
import { CheckCircle, Mail, ArrowRight } from "lucide-react";
import SimplifiedNav from "@/components/SimplifiedNav";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />
      <main className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-white mb-3">Thank you for your purchase</h1>
        <p className="text-sm text-white/50 leading-relaxed mb-8 max-w-md mx-auto">
          Your order is confirmed. Check your email for a confirmation and next steps —
          your first email should arrive within the next few minutes.
        </p>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 mb-8 text-left">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-4 h-4 text-[#f5a623]" />
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest">What happens next</p>
          </div>
          <ol className="space-y-3 text-sm text-white/50">
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 font-bold shrink-0">1.</span>
              <span>Confirmation email is on its way to your inbox right now.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 font-bold shrink-0">2.</span>
              <span>You&apos;ll receive onboarding instructions within the next hour telling you exactly what to do first.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 font-bold shrink-0">3.</span>
              <span>Over the next few days, you&apos;ll get a sequence of emails with tips, resources, and support to help you get results fast.</span>
            </li>
          </ol>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white text-sm font-bold hover:opacity-90 transition"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </Link>
      </main>
    </div>
  );
}
