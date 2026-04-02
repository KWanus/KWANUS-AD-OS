"use client";

import { useState } from "react";
import { Copy, Check, Download, FileText, FileCode, Printer, Loader2 } from "lucide-react";
import { exportSummary, exportAllResults, exportJSON } from "@/lib/himalaya/exportResults";
import type { HimalayaResultsViewModel } from "@/lib/himalaya/types";

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  function copy(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }
  return { copied, copy };
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportMenu({ vm }: { vm: HimalayaResultsViewModel }) {
  const { copied, copy } = useCopy();
  const [docxLoading, setDocxLoading] = useState(false);

  const slug = vm.analysisId.slice(0, 8);

  function downloadMarkdown() {
    const md = exportAllResults(vm);
    downloadFile(md, `himalaya-${slug}.md`, "text/markdown");
  }

  function downloadJSON() {
    const json = exportJSON(vm);
    downloadFile(json, `himalaya-${slug}.json`, "application/json");
  }

  async function downloadDocx() {
    setDocxLoading(true);
    try {
      const { generateDocx } = await import("@/lib/himalaya/exportDocx");
      const blob = await generateDocx(vm);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `himalaya-${slug}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("DOCX export failed:", err);
    } finally {
      setDocxLoading(false);
    }
  }

  function printPDF() {
    window.print();
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
      <h2 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">
        Export
      </h2>
      <div className="flex flex-wrap gap-2">
        {/* Copy actions */}
        <button
          onClick={() => copy("summary", exportSummary(vm))}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] transition text-xs font-semibold text-white/50 hover:text-white/80"
        >
          {copied === "summary" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied === "summary" ? "Copied" : "Copy Summary"}
        </button>

        <button
          onClick={() => copy("all", exportAllResults(vm))}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] transition text-xs font-semibold text-white/50 hover:text-white/80"
        >
          {copied === "all" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied === "all" ? "Copied" : "Copy All"}
        </button>

        {/* Download actions */}
        <button
          onClick={downloadMarkdown}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] transition text-xs font-semibold text-white/50 hover:text-white/80"
        >
          <FileText className="w-3 h-3" />
          Markdown
        </button>

        <button
          onClick={() => void downloadDocx()}
          disabled={docxLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] transition text-xs font-semibold text-white/50 hover:text-white/80 disabled:opacity-40"
        >
          {docxLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
          DOCX
        </button>

        <button
          onClick={downloadJSON}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] transition text-xs font-semibold text-white/50 hover:text-white/80"
        >
          <FileCode className="w-3 h-3" />
          JSON
        </button>

        <button
          onClick={printPDF}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] transition text-xs font-semibold text-white/50 hover:text-white/80"
        >
          <Printer className="w-3 h-3" />
          Print / PDF
        </button>
      </div>
    </div>
  );
}
