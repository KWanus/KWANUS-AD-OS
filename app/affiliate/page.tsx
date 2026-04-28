"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SimplifiedNav from "@/components/SimplifiedNav";
import {
  Copy, Check, Users, DollarSign, Share2, Mail, ArrowRight,
  MousePointerClick, TrendingUp, Loader2,
} from "lucide-react";

type ReferralData = {
  code: string;
  clicks: number;
  conversions: number;
  earnings: number;
};

export default function AffiliatePage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/referrals")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setData(d.referral ?? d);
        else setData({ code: "HIMALAYA-" + Math.random().toString(36).slice(2, 8).toUpperCase(), clicks: 0, conversions: 0, earnings: 0 });
      })
      .catch(() => {
        setData({ code: "HIMALAYA-DEMO", clicks: 0, conversions: 0, earnings: 0 });
      })
      .finally(() => setLoading(false));
  }, []);

  const referralUrl = data ? `${typeof window !== "undefined" ? window.location.origin : ""}/start?ref=${data.code}` : "";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const dmTemplate = `I've been using Himalaya to build my business — everything auto-built in 60 seconds. Try it: ${referralUrl}`;
  const emailSubject = "You need to see this — build a business in 60 seconds";
  const emailBody = `Hey,\n\nI just found Himalaya and it literally built my entire business system in under a minute — site, emails, ads, everything.\n\nYou should check it out: ${referralUrl}\n\nSeriously, it's wild.`;
  const tweetTemplate = `Just discovered @HimalayaAI — it auto-builds your entire business in 60 seconds. Site, emails, ads, everything. Wild. ${referralUrl}`;

  const CopyBtn = ({ label, text, icon: Icon, iconLabel }: { label: string; text: string; icon: React.ElementType; iconLabel: string }) => (
    <button
      onClick={() => copyToClipboard(text, label)}
      className="flex items-center gap-2 px-4 py-3 rounded-lg border border-[#f5a623]/20 bg-[#f5a623]/5 hover:bg-[#f5a623]/10 transition-colors text-left w-full"
    >
      <Icon className="w-4 h-4 text-[#f5a623] shrink-0" />
      <span className="text-sm text-white/90 font-medium flex-1">{iconLabel}</span>
      {copied === label ? (
        <Check className="w-4 h-4 text-green-400 shrink-0" />
      ) : (
        <Copy className="w-4 h-4 text-white/40 shrink-0" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SimplifiedNav />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Share2 className="w-7 h-7 text-[#f5a623]" />
          <h1 className="text-2xl font-bold">Referral Program</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#f5a623]" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Referral Code */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Your Referral Code</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-mono font-bold text-[#f5a623] tracking-wide">{data.code}</span>
                <button
                  onClick={() => copyToClipboard(data.code, "code")}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  {copied === "code" ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/40" />}
                </button>
              </div>
            </div>

            {/* Referral URL */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Your Referral Link</p>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-white/70 truncate flex-1">{referralUrl}</span>
                <button
                  onClick={() => copyToClipboard(referralUrl, "url")}
                  className="px-3 py-1.5 rounded-lg bg-[#f5a623] text-black text-sm font-semibold hover:bg-[#e09000] transition-colors shrink-0"
                >
                  {copied === "url" ? "Copied!" : "Copy Link"}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
                <MousePointerClick className="w-5 h-5 text-[#f5a623] mx-auto mb-2" />
                <p className="text-2xl font-bold">{data.clicks}</p>
                <p className="text-xs text-white/50 mt-1">Clicks</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
                <Users className="w-5 h-5 text-[#f5a623] mx-auto mb-2" />
                <p className="text-2xl font-bold">{data.conversions}</p>
                <p className="text-xs text-white/50 mt-1">Conversions</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
                <DollarSign className="w-5 h-5 text-[#f5a623] mx-auto mb-2" />
                <p className="text-2xl font-bold">${data.earnings.toFixed(2)}</p>
                <p className="text-xs text-white/50 mt-1">Earnings</p>
              </div>
            </div>

            {/* Share Templates */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#f5a623]" />
                Share Templates
              </h2>
              <div className="space-y-3">
                <CopyBtn label="dm" text={dmTemplate} icon={Share2} iconLabel="Copy DM" />
                <CopyBtn label="email" text={`Subject: ${emailSubject}\n\n${emailBody}`} icon={Mail} iconLabel="Copy Email" />
                <CopyBtn label="tweet" text={tweetTemplate} icon={Share2} iconLabel="Copy Tweet" />
              </div>
            </div>

            {/* How it works */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold mb-4">How It Works</h2>
              <div className="space-y-4">
                {[
                  { step: "1", text: "Share your link with friends, followers, or clients" },
                  { step: "2", text: "They sign up and build their business with Himalaya" },
                  { step: "3", text: "You earn commission on every conversion" },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#f5a623]/20 text-[#f5a623] flex items-center justify-center text-sm font-bold shrink-0">
                      {item.step}
                    </span>
                    <p className="text-sm text-white/70 pt-1">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-xl border border-[#f5a623]/30 bg-gradient-to-r from-[#f5a623]/10 to-[#f5a623]/5 p-6 text-center">
              <p className="text-lg font-semibold text-[#f5a623] mb-1">The more you share, the more you earn</p>
              <p className="text-sm text-white/50">Start sharing your link today and build passive income.</p>
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-lg bg-[#f5a623] text-black font-semibold text-sm hover:bg-[#e09000] transition-colors"
              >
                Explore Marketplace <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
