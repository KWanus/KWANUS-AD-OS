"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import Link from "next/link";
import {
  Search, Users, Mail, Send, Loader2, Check, X, ChevronRight,
  MapPin, Globe, Phone, Star, ArrowRight, RefreshCw, Zap,
} from "lucide-react";

type Business = {
  id?: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  rating?: number;
  reviewCount?: number;
  category?: string;
  enriched?: boolean;
  emailGenerated?: string;
  outreachStatus?: "pending" | "sending" | "sent" | "failed";
  selected?: boolean;
};

export default function OutreachPage() {
  const [niche, setNiche] = useState("");
  const [city, setCity] = useState("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [scraping, setScraping] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Scrape businesses
  async function scrapeBusinesses() {
    if (!niche.trim() || !city.trim()) return;
    setScraping(true);
    try {
      // Try Google Maps scraper first
      const res = await fetch("/api/leads/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, location: city }),
      });
      const data = await res.json();
      if (data.ok && data.businesses?.length > 0) {
        setBusinesses(data.businesses.map((b: Business) => ({ ...b, selected: true })));
        setStep(2);
      } else {
        // Fallback: create placeholder leads for manual entry
        setBusinesses([]);
      }
    } catch { /* ignore */ }
    setScraping(false);
  }

  // Step 2: Enrich selected businesses
  async function enrichSelected() {
    setEnriching(true);
    const selected = businesses.filter(b => b.selected);
    const enriched = [...businesses];

    for (const biz of selected) {
      const idx = enriched.findIndex(b => b.name === biz.name);
      if (idx === -1) continue;
      try {
        // Create lead + enrich
        const createRes = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: biz.name,
            niche,
            location: city,
            website: biz.website,
            phone: biz.phone,
            email: biz.email,
            rating: biz.rating,
            reviewCount: biz.reviewCount,
          }),
        });
        const createData = await createRes.json();
        if (createData.ok && createData.lead?.id) {
          enriched[idx] = { ...enriched[idx], id: createData.lead.id, enriched: true };

          // Try to enrich with email
          if (biz.website) {
            const enrichRes = await fetch("/api/leads/enrich", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: `info@${new URL(biz.website).hostname}` }),
            }).catch(() => null);
            if (enrichRes) {
              const enrichData = await enrichRes.json().catch(() => null);
              if (enrichData?.ok) {
                enriched[idx].email = enrichData.result?.email ?? enriched[idx].email ?? `info@${new URL(biz.website).hostname}`;
              }
            }
          }
        }
      } catch { /* continue */ }
    }

    setBusinesses(enriched);
    setStep(3);
    setEnriching(false);
  }

  // Step 3: Generate cold emails
  async function generateEmails() {
    setGenerating(true);
    const updated = [...businesses];

    for (let i = 0; i < updated.length; i++) {
      if (!updated[i].selected || !updated[i].id) continue;
      try {
        const res = await fetch(`/api/leads/${updated[i].id}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "outreach" }),
        });
        const data = await res.json();
        if (data.ok) {
          updated[i].emailGenerated = data.outreachEmail?.subject ?? "Personalized outreach ready";
        }
      } catch { /* continue */ }
    }

    setBusinesses(updated);
    setStep(4);
    setGenerating(false);
  }

  // Step 4: Send outreach
  async function sendAll() {
    setSending(true);
    const updated = [...businesses];

    for (let i = 0; i < updated.length; i++) {
      if (!updated[i].selected || !updated[i].id || !updated[i].email) continue;
      updated[i].outreachStatus = "sending";
      setBusinesses([...updated]);

      try {
        const res = await fetch(`/api/leads/${updated[i].id}/outreach`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toEmail: updated[i].email }),
        });
        const data = await res.json();
        updated[i].outreachStatus = data.ok ? "sent" : "failed";
      } catch {
        updated[i].outreachStatus = "failed";
      }
      setBusinesses([...updated]);
    }

    setSending(false);
  }

  function toggleAll(checked: boolean) {
    setBusinesses(prev => prev.map(b => ({ ...b, selected: checked })));
  }

  function toggleBusiness(idx: number) {
    setBusinesses(prev => prev.map((b, i) => i === idx ? { ...b, selected: !b.selected } : b));
  }

  const selectedCount = businesses.filter(b => b.selected).length;
  const sentCount = businesses.filter(b => b.outreachStatus === "sent").length;
  const enrichedCount = businesses.filter(b => b.enriched).length;

  return (
    <main className="min-h-screen bg-t-bg text-t-text">
      <AppNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">

        {/* Header */}
        <div className="pt-6 pb-4">
          <h1 className="text-xl font-black">Cold Outreach Pipeline</h1>
          <p className="text-xs text-t-text-faint">Find businesses → Enrich → Generate emails → Send. All in one page.</p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-6">
          {[
            { n: 1, label: "Find" },
            { n: 2, label: "Enrich" },
            { n: 3, label: "Generate" },
            { n: 4, label: "Send" },
          ].map((s) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                step >= s.n ? "bg-[#f5a623] text-[#0c0a08]" : "bg-t-bg-card border border-t-border text-t-text-faint"
              }`}>{step > s.n ? "✓" : s.n}</div>
              <span className={`text-xs font-bold ${step >= s.n ? "text-[#f5a623]" : "text-t-text-faint"}`}>{s.label}</span>
              {s.n < 4 && <ChevronRight className="w-3 h-3 text-t-text-faint" />}
            </div>
          ))}
        </div>

        {/* Step 1: Find businesses */}
        <div className="rounded-2xl border border-t-border bg-t-bg-raised p-5 mb-4">
          <p className="text-[10px] font-black text-[#f5a623] tracking-widest mb-3">STEP 1 — FIND BUSINESSES</p>
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <input type="text" value={niche} onChange={e => setNiche(e.target.value)}
                placeholder="Niche (e.g., dentists, HVAC, law firms)"
                className="w-full rounded-xl border border-t-border bg-t-bg-card px-4 py-3 text-sm placeholder-t-text-faint outline-none focus:border-[#f5a623]/25 transition" />
            </div>
            <div className="flex-1">
              <input type="text" value={city} onChange={e => setCity(e.target.value)}
                placeholder="City (e.g., Austin TX, Miami FL)"
                onKeyDown={e => { if (e.key === "Enter") void scrapeBusinesses(); }}
                className="w-full rounded-xl border border-t-border bg-t-bg-card px-4 py-3 text-sm placeholder-t-text-faint outline-none focus:border-[#f5a623]/25 transition" />
            </div>
            <button onClick={() => void scrapeBusinesses()} disabled={scraping || !niche.trim() || !city.trim()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-sm font-bold text-[#0c0a08] hover:opacity-90 transition disabled:opacity-30">
              {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {scraping ? "Searching..." : "Find"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Dentists", "HVAC", "Law Firms", "Med Spas", "Real Estate", "Chiropractors", "Plumbers", "Roofing"].map(s => (
              <button key={s} onClick={() => setNiche(s.toLowerCase())}
                className="px-3 py-1.5 rounded-lg border border-t-border text-[10px] font-bold text-t-text-faint hover:text-[#f5a623] hover:border-[#f5a623]/20 transition">{s}</button>
            ))}
          </div>
        </div>

        {/* Business list */}
        {businesses.length > 0 && (
          <div className="rounded-2xl border border-t-border bg-t-bg-raised p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black text-t-text-faint tracking-widest">
                {businesses.length} BUSINESSES FOUND · {selectedCount} SELECTED
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleAll(selectedCount < businesses.length)}
                  className="text-[10px] font-bold text-[#f5a623] hover:text-[#e07850] transition">
                  {selectedCount < businesses.length ? "Select All" : "Deselect All"}
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {businesses.map((biz, idx) => (
                <div key={idx} className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
                  biz.selected ? "border-[#f5a623]/15 bg-[#f5a623]/[0.03]" : "border-t-border"
                }`}>
                  <input type="checkbox" checked={biz.selected} onChange={() => toggleBusiness(idx)}
                    className="w-4 h-4 rounded accent-[#f5a623]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{biz.name}</p>
                    <div className="flex items-center gap-3 text-[10px] text-t-text-faint mt-0.5">
                      {biz.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {biz.phone}</span>}
                      {biz.website && <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {new URL(biz.website).hostname}</span>}
                      {biz.rating && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-[#f5a623]" /> {biz.rating}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {biz.enriched && <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Enriched</span>}
                    {biz.emailGenerated && <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-400/10 text-blue-400 border border-blue-400/20">Email Ready</span>}
                    {biz.outreachStatus === "sent" && <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Sent</span>}
                    {biz.outreachStatus === "sending" && <Loader2 className="w-3 h-3 text-[#f5a623] animate-spin" />}
                    {biz.outreachStatus === "failed" && <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-red-400/10 text-red-400 border border-red-400/20">Failed</span>}
                    {biz.email && <span className="text-[10px] text-t-text-faint">{biz.email}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons based on current step */}
            <div className="flex gap-3 mt-4">
              {step === 2 && (
                <button onClick={() => void enrichSelected()} disabled={enriching || selectedCount === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-sm font-bold text-[#0c0a08] hover:opacity-90 transition disabled:opacity-30">
                  {enriching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  {enriching ? `Enriching ${selectedCount}...` : `Enrich ${selectedCount} Businesses`}
                </button>
              )}
              {step === 3 && (
                <button onClick={() => void generateEmails()} disabled={generating || enrichedCount === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-sm font-bold text-[#0c0a08] hover:opacity-90 transition disabled:opacity-30">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  {generating ? "Generating emails..." : `Generate Cold Emails for ${enrichedCount}`}
                </button>
              )}
              {step === 4 && (
                <button onClick={() => void sendAll()} disabled={sending}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-sm font-bold text-white hover:opacity-90 transition disabled:opacity-30">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? `Sending... (${sentCount}/${selectedCount})` : `Send ${selectedCount} Cold Emails`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results summary */}
        {sentCount > 0 && (
          <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.03] p-5 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <Check className="w-5 h-5 text-emerald-400" />
              <p className="text-sm font-black text-emerald-400">{sentCount} emails sent!</p>
            </div>
            <p className="text-xs text-t-text-faint">Follow-ups will be sent automatically on Day 3, Day 7, and Day 14. Check your leads page for replies.</p>
            <div className="flex gap-3 mt-3">
              <Link href="/leads" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f5a623]/10 border border-[#f5a623]/20 text-xs font-bold text-[#f5a623] hover:bg-[#f5a623]/20 transition">
                <Users className="w-3 h-3" /> View Leads
              </Link>
              <button onClick={() => { setBusinesses([]); setStep(1); setNiche(""); setCity(""); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-t-border text-xs font-bold text-t-text-muted hover:text-t-text transition">
                <RefreshCw className="w-3 h-3" /> New Search
              </button>
            </div>
          </div>
        )}

        {/* Quick tips */}
        <div className="rounded-2xl border border-t-border bg-t-bg-raised p-5">
          <p className="text-[10px] font-black text-t-text-faint tracking-widest mb-3">OUTREACH TIPS</p>
          <div className="space-y-2">
            {[
              "Send 50 emails/day max to avoid spam filters. Quality > quantity.",
              "Personalize the first line — mention their Google rating or a specific page on their site.",
              "Follow up 3 times. 80% of sales happen after the 5th contact.",
              "Your reply rate will be 1-3%. That's normal. 500 emails = 5-15 conversations.",
              "Best niches for AI automation: dentists, med spas, HVAC, law firms, real estate.",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <Zap className="w-3 h-3 text-[#f5a623] shrink-0 mt-0.5" />
                <p className="text-xs text-t-text-faint">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
