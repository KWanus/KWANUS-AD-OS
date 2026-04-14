"use client";

import Link from "next/link";
import { Mountain, ArrowRight, Check, Zap, Globe, Mail, BarChart2, Play, Star } from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-[#020509] text-white">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-[#020509]/90 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <Mountain className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-black text-white">Himalaya</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-xs text-white/40 hover:text-white/70 transition font-semibold">Log in</Link>
            <Link href="/sign-up" className="px-4 py-2 rounded-xl bg-cyan-500 text-xs font-bold text-white hover:bg-cyan-400 transition">
              Start Free →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px] font-bold text-cyan-300">300+ automated systems</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1]">
          Tell us your goal.<br />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">We build the business.</span>
        </h1>

        <p className="mt-6 text-lg text-white/35 max-w-2xl mx-auto leading-relaxed">
          Himalaya builds your website, writes your ads, creates your emails, launches your funnel, and tells you exactly what to do every day — in 60 seconds.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/sign-up"
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-base font-black text-white shadow-[0_0_30px_rgba(6,182,212,0.25)] hover:shadow-[0_0_50px_rgba(6,182,212,0.35)] transition-all">
            Start Free — Build My Business <ArrowRight className="w-4 h-4" />
          </Link>
          <span className="text-xs text-white/20">No credit card. No setup. 60 seconds.</span>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/15 text-center mb-8">HOW IT WORKS</p>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { step: "1", title: "Tell us your goal", desc: "\"I want to make $10k/month\" or \"Grow my coaching business\" — anything works." },
            { step: "2", title: "We build everything", desc: "Website, ads, emails, funnel, tracking, content — all live in 60 seconds. Not templates. Real businesses." },
            { step: "3", title: "Follow the commands", desc: "Every day you open the app and see: \"Do this. Then this.\" No guessing. Just execute." },
          ].map(s => (
            <div key={s.step} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
                <span className="text-lg font-black text-cyan-400">{s.step}</span>
              </div>
              <h3 className="text-lg font-black text-white mb-2">{s.title}</h3>
              <p className="text-sm text-white/30 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What you get ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/15 text-center mb-3">WHAT YOU GET</p>
        <h2 className="text-3xl font-black text-center text-white mb-10">A complete business. Not a tool.</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: Globe, title: "Live Website", desc: "High-converting site with payment processing, forms, chat, legal pages, and tracking. Published on a real URL.", color: "text-violet-400" },
            { icon: Zap, title: "20+ Ad Creatives", desc: "AI-generated ads with real images for Facebook, Instagram, TikTok, and Google. 5 proven angles. Ready to launch.", color: "text-cyan-400" },
            { icon: Mail, title: "Email Automation", desc: "Welcome sequence, cart recovery, post-purchase follow-up. All active. All sending. Automatically.", color: "text-blue-400" },
            { icon: BarChart2, title: "Daily Commands", desc: "Open the app → see exactly what to do today. Post this. Send this. Follow up with this. No thinking required.", color: "text-amber-400" },
          ].map(f => (
            <div key={f.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <f.icon className={`w-6 h-6 ${f.color} mb-3`} />
              <h3 className="text-base font-black text-white mb-1">{f.title}</h3>
              <p className="text-sm text-white/30 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h3 className="text-base font-black text-white mb-3">Plus 300 more systems running in the background:</h3>
          <div className="grid sm:grid-cols-3 gap-2">
            {[
              "Auto-optimize your ads", "Kill underperforming creatives", "Scale what's working",
              "Referral program", "Customer loyalty tiers", "Cart abandonment recovery",
              "SEO blog generation", "Social proof widgets", "Exit intent popups",
              "Lead scoring", "Voice agent calls", "Video spokesperson",
              "Competitor monitoring", "Revenue attribution", "Funnel leak detection",
              "Smart pricing", "Content repurposing", "Business valuation",
            ].map(s => (
              <div key={s} className="flex items-center gap-2 py-1">
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-xs text-white/40">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/15 text-center mb-3">WHY HIMALAYA</p>
        <h2 className="text-3xl font-black text-center text-white mb-10">Others give you tools. We give you a business.</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-3 text-white/20 font-bold text-xs">Feature</th>
                <th className="text-center py-3 text-white/20 font-bold text-xs">GoHighLevel</th>
                <th className="text-center py-3 text-white/20 font-bold text-xs">ClickFunnels</th>
                <th className="text-center py-3 px-2 font-bold text-xs">
                  <span className="text-cyan-400">Himalaya</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Builds your business for you", "❌", "❌", "✅"],
                ["AI picks your strategy", "❌", "❌", "✅"],
                ["Generates ads with images", "❌", "❌", "✅"],
                ["Auto-optimizes campaigns", "❌", "❌", "✅"],
                ["Daily action commands", "❌", "❌", "✅"],
                ["Tells you what's working", "❌", "❌", "✅"],
                ["Niche-specific playbooks", "❌", "❌", "✅"],
                ["Works in 60 seconds", "❌", "❌", "✅"],
                ["Price", "$97-497/mo", "$127-297/mo", "Free"],
              ].map(([feature, ghl, cf, hm]) => (
                <tr key={feature} className="border-b border-white/[0.04]">
                  <td className="py-3 text-white/50">{feature}</td>
                  <td className="text-center py-3 text-white/20">{ghl}</td>
                  <td className="text-center py-3 text-white/20">{cf}</td>
                  <td className="text-center py-3 font-bold text-white">{hm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Social proof ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/15 text-center mb-8">WHAT PEOPLE ARE SAYING</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { name: "Marcus R.", role: "Affiliate Marketer", quote: "I told it I wanted to make $10k/month. 60 seconds later I had a website, ads, and an email sequence. I made my first sale in week 2." },
            { name: "Sarah L.", role: "Coach", quote: "I tried ClickFunnels, Kartra, Kajabi. All tools. Himalaya actually BUILT my business. I just follow the commands." },
            { name: "David K.", role: "Agency Owner", quote: "The daily commands changed everything. I stopped overthinking and started executing. Revenue doubled in 30 days." },
          ].map(t => (
            <div key={t.name} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
              </div>
              <p className="text-sm text-white/50 leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
              <p className="text-xs font-bold text-white/70">{t.name}</p>
              <p className="text-[10px] text-white/25">{t.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/15 text-center mb-8">FAQ</p>
        <div className="space-y-3">
          {[
            { q: "Do I need any experience?", a: "No. Himalaya is designed for complete beginners. You tell it what you want, it builds everything. You just follow the daily commands." },
            { q: "How much does it cost?", a: "Free to start. You get 2 full business builds. After that, Pro is $29/month for unlimited builds." },
            { q: "How is this different from other tools?", a: "Other tools give you a blank canvas. Himalaya builds the entire business FOR you — site, ads, emails, funnel — and tells you exactly what to do every day." },
            { q: "What if my niche is weird?", a: "We validate demand before building. If your niche has low demand, Himalaya will tell you and suggest something better. No wasted time." },
            { q: "Do I need to know how to run ads?", a: "No. Himalaya generates the ads, the images, and the copy. You click one button to launch them. The system auto-optimizes after that." },
            { q: "What if it doesn't work for me?", a: "Then you've lost nothing. It's free to start, and every business comes with a daily action plan. If you follow the commands and it doesn't work, we'll personally review your setup." },
          ].map(f => (
            <details key={f.q} className="group rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-sm font-bold text-white/70 group-hover:text-white transition">
                {f.q}
                <ArrowRight className="w-4 h-4 text-white/15 group-open:rotate-90 transition-transform shrink-0" />
              </summary>
              <p className="px-5 pb-4 text-sm text-white/30 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
          Stop planning. Start making money.
        </h2>
        <p className="text-base text-white/30 mb-8 max-w-lg mx-auto">
          Type your goal. Himalaya builds the business. You follow the commands. That&apos;s it.
        </p>
        <Link href="/sign-up"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-base font-black text-white shadow-[0_0_30px_rgba(6,182,212,0.25)] hover:shadow-[0_0_50px_rgba(6,182,212,0.35)] transition-all">
          Start Free — Build My Business <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="mt-4 text-xs text-white/15">Free to start · No credit card · 60 seconds to your first business</p>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.04] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <Mountain className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-black text-white/40">Himalaya</span>
          </div>
          <div className="flex gap-4 text-[10px] text-white/20">
            <Link href="/privacy" className="hover:text-white/40 transition">Privacy</Link>
            <Link href="/terms" className="hover:text-white/40 transition">Terms</Link>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
