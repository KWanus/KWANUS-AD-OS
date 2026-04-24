"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  ArrowLeft,
  Loader2,
  Download,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Eye,
} from "lucide-react";

interface Submission {
  id: string;
  siteId: string;
  pageId: string;
  blockId: string;
  data: Record<string, string>;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface SubmissionsResponse {
  ok: boolean;
  submissions: Submission[];
  total: number;
  page: number;
  pages: number;
}

export default function SubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: siteId } = use(params);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/sites/${siteId}/submissions?page=${currentPage}`)
      .then((r) => r.json() as Promise<SubmissionsResponse>)
      .then((data) => {
        if (data.ok) {
          setSubmissions(data.submissions);
          setTotalPages(data.pages);
          setTotal(data.total);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteId, currentPage]);

  function getDisplayName(data: Record<string, string>): string {
    const name = data.name || data.fullName || data.full_name || data.firstName || "";
    const email = data.email || data.Email || "";
    if (name && email) return `${name} (${email})`;
    if (name) return name;
    if (email) return email;
    return "Anonymous";
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function exportCsv() {
    if (!submissions.length) return;

    // Collect all unique keys across all submissions
    const allKeys = new Set<string>();
    submissions.forEach((sub) => {
      Object.keys(sub.data).forEach((key) => allKeys.add(key));
    });
    const dataKeys = Array.from(allKeys);

    const headers = ["Date", "Page ID", "IP", ...dataKeys];
    const rows = submissions.map((sub) => {
      const row = [
        formatDate(sub.createdAt),
        sub.pageId,
        sub.ip ?? "",
        ...dataKeys.map((key) => sub.data[key] ?? ""),
      ];
      return row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `submissions-${siteId}-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[#020509] text-white">
      <AppNav />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Back */}
        <Link
          href={`/websites/${siteId}`}
          className="inline-flex items-center gap-1.5 text-white/30 hover:text-white/60 text-sm transition mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Site
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-white">Form Submissions</h1>
            <p className="text-sm text-white/40 mt-1">
              {total} total lead{total !== 1 ? "s" : ""} captured
            </p>
          </div>

          <button
            onClick={exportCsv}
            disabled={!submissions.length}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 text-sm font-bold transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && submissions.length === 0 && (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-12 text-center">
            <Inbox className="w-10 h-10 text-white/10 mx-auto mb-4" />
            <p className="text-lg font-bold text-white/40">No submissions yet</p>
            <p className="text-sm text-white/25 mt-2 max-w-md mx-auto">
              Form submissions will appear here once visitors start filling out
              contact forms, lead captures, or signup blocks on your site.
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && submissions.length > 0 && (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.07]">
                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                      Date
                    </th>
                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                      Email / Name
                    </th>
                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                      Page
                    </th>
                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                      IP
                    </th>
                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <SubmissionRow
                      key={sub.id}
                      submission={sub}
                      getDisplayName={getDisplayName}
                      formatDate={formatDate}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.07]">
                <p className="text-xs text-white/30">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl border border-white/[0.1] text-white/40 hover:text-white/70 hover:border-white/[0.2] text-xs font-bold transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl border border-white/[0.1] text-white/40 hover:text-white/70 hover:border-white/[0.2] text-xs font-bold transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function SubmissionRow({
  submission,
  getDisplayName,
  formatDate,
}: {
  submission: Submission;
  getDisplayName: (data: Record<string, string>) => string;
  formatDate: (iso: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="border-b border-white/[0.04] hover:bg-white/[0.02] transition">
        <td className="px-5 py-4 text-sm text-white/60 whitespace-nowrap">
          {formatDate(submission.createdAt)}
        </td>
        <td className="px-5 py-4 text-sm font-bold text-white truncate max-w-[200px]">
          {getDisplayName(submission.data)}
        </td>
        <td className="px-5 py-4 text-sm text-white/50 whitespace-nowrap font-mono text-xs">
          {submission.pageId.slice(0, 8)}...
        </td>
        <td className="px-5 py-4 text-sm text-white/40 whitespace-nowrap font-mono text-xs">
          {submission.ip ?? "—"}
        </td>
        <td className="px-5 py-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-cyan-300 hover:border-cyan-500/20 text-xs font-bold transition"
          >
            <Eye className="w-3 h-3" />
            {expanded ? "Hide" : "View"}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-white/[0.04]">
          <td colSpan={5} className="px-5 py-4 bg-white/[0.015]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(submission.data).map(([key, value]) => (
                <div key={key} className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25 mb-1">
                    {key}
                  </p>
                  <p className="text-sm text-white/80 break-words">{value || "—"}</p>
                </div>
              ))}
              {submission.userAgent && (
                <div className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5 sm:col-span-2 lg:col-span-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25 mb-1">
                    User Agent
                  </p>
                  <p className="text-xs text-white/40 break-all">{submission.userAgent}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
