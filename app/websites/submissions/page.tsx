"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import Link from "next/link";
import {
  ArrowLeft, Users, Mail, Phone, Globe, Calendar,
  Download, Search, Loader2, ExternalLink, ChevronDown,
} from "lucide-react";

type Submission = {
  id: string;
  siteId: string;
  siteName: string;
  email: string;
  name?: string;
  phone?: string;
  message?: string;
  source?: string;
  createdAt: string;
  fields: Record<string, string>;
};

export default function SubmissionsPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace("/sign-in");
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/forms/submissions")
      .then(r => r.json())
      .then(data => {
        if (data.ok) setSubmissions(data.submissions ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isSignedIn]);

  if (!isLoaded || !isSignedIn) return null;

  const filtered = submissions.filter(s =>
    !search || s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.siteName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function exportCsv() {
    const headers = ["Date", "Name", "Email", "Phone", "Site", "Message"];
    const rows = filtered.map(s => [
      new Date(s.createdAt).toLocaleDateString(),
      s.name ?? "",
      s.email,
      s.phone ?? "",
      s.siteName ?? "",
      s.message ?? "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `submissions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-t-bg text-t-text">
      <AppNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        <div className="pt-6 pb-4">
          <Link href="/websites" className="inline-flex items-center gap-1.5 text-xs text-t-text-faint hover:text-t-text-muted transition mb-3">
            <ArrowLeft className="w-3 h-3" /> Back to Sites
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black">Form Submissions</h1>
              <p className="text-xs text-t-text-faint">{submissions.length} total leads from your sites</p>
            </div>
            <button onClick={exportCsv} disabled={filtered.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-t-border text-xs font-bold text-t-text-muted hover:text-t-text disabled:opacity-30 transition">
              <Download className="w-3 h-3" /> Export CSV
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-t-text-faint" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or site..."
            className="w-full rounded-xl border border-t-border bg-t-bg-raised pl-10 pr-4 py-3 text-sm placeholder-t-text-faint outline-none focus:border-[#f5a623]/25 transition" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="w-6 h-6 text-t-text-faint animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-t-border bg-t-bg-raised p-8 text-center">
            <Users className="w-8 h-8 text-t-text-faint mx-auto mb-3" />
            <h3 className="text-base font-bold mb-1">{search ? "No matches" : "No submissions yet"}</h3>
            <p className="text-xs text-t-text-muted">{search ? "Try a different search" : "When visitors fill out forms on your sites, their submissions appear here."}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(sub => (
              <div key={sub.id} className="rounded-xl border border-t-border bg-t-bg-raised overflow-hidden">
                <button onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-t-bg-card transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/20 flex items-center justify-center shrink-0">
                      <Users className="w-3.5 h-3.5 text-[#f5a623]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{sub.name || sub.email}</p>
                      <div className="flex items-center gap-2 text-[10px] text-t-text-faint">
                        <span>{sub.email}</span>
                        {sub.phone && <><span>·</span><span>{sub.phone}</span></>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] text-t-text-faint">{sub.siteName}</p>
                      <p className="text-[9px] text-t-text-faint">{new Date(sub.createdAt).toLocaleDateString()}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-t-text-faint transition ${expandedId === sub.id ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {expandedId === sub.id && (
                  <div className="px-4 pb-4 pt-1 border-t border-t-border space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {sub.name && (
                        <div className="rounded-lg bg-t-bg-card border border-t-border p-2.5">
                          <p className="text-[9px] font-black text-t-text-faint tracking-wider mb-0.5">NAME</p>
                          <p className="text-xs font-bold">{sub.name}</p>
                        </div>
                      )}
                      <div className="rounded-lg bg-t-bg-card border border-t-border p-2.5">
                        <p className="text-[9px] font-black text-t-text-faint tracking-wider mb-0.5">EMAIL</p>
                        <p className="text-xs font-bold">{sub.email}</p>
                      </div>
                      {sub.phone && (
                        <div className="rounded-lg bg-t-bg-card border border-t-border p-2.5">
                          <p className="text-[9px] font-black text-t-text-faint tracking-wider mb-0.5">PHONE</p>
                          <p className="text-xs font-bold">{sub.phone}</p>
                        </div>
                      )}
                      <div className="rounded-lg bg-t-bg-card border border-t-border p-2.5">
                        <p className="text-[9px] font-black text-t-text-faint tracking-wider mb-0.5">SITE</p>
                        <p className="text-xs font-bold">{sub.siteName}</p>
                      </div>
                    </div>
                    {sub.message && (
                      <div className="rounded-lg bg-t-bg-card border border-t-border p-2.5">
                        <p className="text-[9px] font-black text-t-text-faint tracking-wider mb-0.5">MESSAGE</p>
                        <p className="text-xs text-t-text-muted">{sub.message}</p>
                      </div>
                    )}
                    {Object.entries(sub.fields).filter(([k]) => !["name", "email", "phone", "message"].includes(k)).map(([key, val]) => (
                      <div key={key} className="rounded-lg bg-t-bg-card border border-t-border p-2.5">
                        <p className="text-[9px] font-black text-t-text-faint tracking-wider mb-0.5">{key.toUpperCase()}</p>
                        <p className="text-xs text-t-text-muted">{val}</p>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <a href={`mailto:${sub.email}`} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/20 text-[10px] font-bold text-[#f5a623] hover:bg-[#f5a623]/20 transition">
                        <Mail className="w-3 h-3" /> Email
                      </a>
                      {sub.phone && (
                        <a href={`tel:${sub.phone}`} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-t-border text-[10px] font-bold text-t-text-muted hover:text-t-text transition">
                          <Phone className="w-3 h-3" /> Call
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
