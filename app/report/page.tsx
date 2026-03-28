"use client";
import { useState } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";

type ReportOption = null | "upload";
type SubmitState = "idle" | "submitting" | "success" | "error";
type ExecutionTier = "core" | "elite";

function ExecutionTierPicker({
  value,
  onChange,
}: {
  value: ExecutionTier;
  onChange: (tier: ExecutionTier) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {[
        {
          id: "core" as const,
          label: "Core",
          description: "Strong, practical intake that gets you into action fast.",
        },
        {
          id: "elite" as const,
          label: "Elite",
          description: "Sharper strategy lane for higher-conviction execution after intake.",
        },
      ].map((tier) => {
        const active = value === tier.id;
        return (
          <button
            key={tier.id}
            type="button"
            onClick={() => onChange(tier.id)}
            className={`rounded-2xl border p-4 text-left transition-all ${
              active
                ? "border-cyan-500/40 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.12)]"
                : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className={`text-sm font-black ${active ? "text-cyan-300" : "text-white"}`}>{tier.label}</span>
              <span className={`text-[10px] font-black uppercase tracking-[0.24em] ${active ? "text-cyan-300" : "text-white/20"}`}>
                {tier.id}
              </span>
            </div>
            <p className={`mt-2 text-xs leading-relaxed ${active ? "text-cyan-100/80" : "text-white/45"}`}>
              {tier.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

export default function ReportPage() {
  const [selected, setSelected] = useState<ReportOption>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [reportType, setReportType] = useState("personal_credit");
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");
  const [notes, setNotes] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [nextPath, setNextPath] = useState("/analyze?execution_tier=elite");

  async function handleSubmit() {
    if (!files || files.length === 0) {
      setErrorMsg("Please select at least one file.");
      return;
    }
    setErrorMsg("");
    setSubmitState("submitting");

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      formData.append("reportType", reportType);
      formData.append("executionTier", executionTier);
      formData.append("notes", notes);

      const res = await fetch("/api/report", { method: "POST", body: formData });
      const payload = await res.json() as {
        success: boolean;
        error?: string;
        nextPath?: string;
      };

      if (!payload.success) {
        setErrorMsg(payload.error ?? "Submission failed. Please try again.");
        setSubmitState("error");
        return;
      }
      setNextPath(payload.nextPath ?? `/analyze?execution_tier=${executionTier}`);
      setSubmitState("success");
    } catch {
      setErrorMsg("Network error. Please check your connection.");
      setSubmitState("error");
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0f1e] text-white flex flex-col">
      <AppNav />
      <header className="px-8 py-6 border-b border-white/10">
        <Link href="/" className="text-cyan-400 text-sm hover:underline">← Back to Dashboard</Link>
        <h1 className="text-2xl font-bold mt-2">Report Intake</h1>
        <p className="text-sm text-white/40 mt-1">Upload your reports, choose the execution lane, and hand off cleanly into strategy.</p>
      </header>

      <div className="flex-1 px-8 py-10 max-w-3xl mx-auto w-full">

        {submitState === "success" ? (
            <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-8 text-center">
              <p className="text-4xl mb-4">✓</p>
              <p className="text-lg font-semibold text-green-400">Reports received.</p>
            <p className="text-sm text-white/50 mt-2">Your intake is saved. Continue into the {executionTier === "elite" ? "Elite" : "Core"} strategy lane and build the campaign from there.</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
              <Link
                href={nextPath}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-6 py-3 text-sm font-semibold text-[#0a0f1e] transition"
              >
                ⚡ Continue to Analyze
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-6 py-3 text-sm font-semibold text-white/60 transition"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Option cards */}
            {selected === null && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setSelected("upload")}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left hover:border-cyan-400/40 hover:bg-white/10 transition"
                >
                  <p className="text-lg font-semibold mb-2">Guided Setup</p>
                  <p className="text-sm text-white/50 mb-4">We&apos;ll walk you through getting your reports.</p>
                  <span className="text-xs text-cyan-400 border border-cyan-400/30 rounded-full px-3 py-1">Upload Reports →</span>
                </button>

                <button
                  onClick={() => setSelected("upload")}
                  className="rounded-2xl border border-cyan-400/30 bg-cyan-500/5 p-6 text-left hover:border-cyan-400/60 hover:bg-cyan-500/10 transition"
                >
                  <p className="text-lg font-semibold mb-2">Upload Reports</p>
                  <p className="text-sm text-white/50 mb-4">Already have your reports? Upload them here.</p>
                  <span className="text-xs text-cyan-400 border border-cyan-400/30 rounded-full px-3 py-1">Start Here</span>
                </button>
              </div>
            )}

            {/* Upload form */}
            {selected === "upload" && (
              <div className="space-y-4">
                <button
                  onClick={() => { setSelected(null); setFiles(null); setErrorMsg(""); setSubmitState("idle"); }}
                  className="text-sm text-white/40 hover:text-white/70 transition"
                >
                  ← Back
                </button>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
                  <div>
                    <label className="block mb-2 text-sm text-white/60">Execution Lane</label>
                    <ExecutionTierPicker value={executionTier} onChange={setExecutionTier} />
                  </div>

                  {/* File upload */}
                  <div>
                    <label className="block mb-2 text-sm text-white/60">Files <span className="text-white/30">(PDF, PNG, JPG)</span></label>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => setFiles(e.target.files)}
                      className="w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30 file:cursor-pointer transition"
                    />
                    {files && files.length > 0 && (
                      <p className="text-xs text-white/30 mt-2">{files.length} file{files.length > 1 ? "s" : ""} selected</p>
                    )}
                  </div>

                  {/* Report type */}
                  <div>
                    <label className="block mb-2 text-sm text-white/60">Report Type</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60 transition"
                    >
                      <option value="personal_credit">Personal Credit</option>
                      <option value="business_credit">Business Credit</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block mb-2 text-sm text-white/60">Notes <span className="text-white/30">(optional)</span></label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any context about these reports..."
                      rows={3}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-400/60 transition resize-none"
                    />
                  </div>

                  {errorMsg && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={submitState === "submitting"}
                    className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 text-sm font-semibold text-[#0a0f1e] transition"
                  >
                    {submitState === "submitting" ? "Submitting..." : "Submit Reports"}
                  </button>
                </div>
              </div>
            )}

          </>
        )}
      </div>
    </main>
  );
}
