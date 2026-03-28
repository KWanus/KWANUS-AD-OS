"use client";

import { useEffect, useMemo, useState } from "react";
import { BotMessageSquare, Plus, Sparkles, Wand2 } from "lucide-react";
import type { Block } from "@/components/site-builder/BlockRenderer";
import {
  createFaqPageBlocks,
  createServicesPageBlocks,
  getCopilotDiagnostics,
} from "@/lib/site-builder/copilotActions";

type Props = {
  siteId: string;
  pageId: string;
  siteName: string;
  pageTitle: string;
  blocks: Block[];
  selectedBlock?: Block | null;
  published: boolean;
  queuedInstruction?: { id: number; text: string } | null;
  generationContext?: {
    sourceMode?: string;
    sourceUrl?: string;
    niche?: string;
    location?: string;
    templateId?: string;
    pageType?: string;
    executionTier?: "core" | "elite";
    blueprintScore?: { overall?: number };
    conversionNotes?: {
      primary_goal?: string;
      trust_elements_used?: string[];
      objections_addressed?: string[];
    };
    generationTrace?: {
      template_reason?: string;
      analysis_summary?: string[];
    };
  } | null;
  onApplyBlocks: (blocks: Block[]) => void;
  onCreatePageFromTemplate: (title: string, blocks: Block[]) => Promise<void>;
};

type CopilotMessage = {
  role: "assistant" | "user";
  content: string;
};

type ExecutionTier = "core" | "elite";

type PendingChange = {
  blocks: Block[];
  summary: string;
  before: string[];
  after: string[];
  diff: string[];
  changedBlocks: Array<{
    id: string;
    type: string;
    before: string;
    after: string;
  }>;
};

function summarizeDiff(currentBlocks: Block[], nextBlocks: Block[]) {
  const currentIds = new Set(currentBlocks.map((block) => block.id));
  const nextIds = new Set(nextBlocks.map((block) => block.id));
  const added = nextBlocks.filter((block) => !currentIds.has(block.id));
  const removed = currentBlocks.filter((block) => !nextIds.has(block.id));
  const changed = nextBlocks.filter((block) => {
    const current = currentBlocks.find((item) => item.id === block.id);
    return current && JSON.stringify(current.props) !== JSON.stringify(block.props);
  });

  const diff: string[] = [];
  if (added.length) diff.push(`Add ${added.length} block${added.length > 1 ? "s" : ""}: ${added.map((block) => block.type).join(", ")}`);
  if (changed.length) diff.push(`Update ${changed.length} block${changed.length > 1 ? "s" : ""}: ${changed.map((block) => block.type).join(", ")}`);
  if (removed.length) diff.push(`Remove ${removed.length} block${removed.length > 1 ? "s" : ""}: ${removed.map((block) => block.type).join(", ")}`);
  if (diff.length === 0) diff.push("No structural block changes detected.");
  return diff;
}

function summarizeBlockProps(block: Block | undefined) {
  if (!block) return "No block content.";

  switch (block.type) {
    case "hero":
      return [
        `Headline: ${String(block.props.headline ?? "")}`,
        `Subheadline: ${String(block.props.subheadline ?? "")}`,
        `CTA: ${String(block.props.buttonText ?? "")}`,
      ].filter(Boolean).join("\n");
    case "cta":
      return [
        `Headline: ${String(block.props.headline ?? "")}`,
        `Subheadline: ${String(block.props.subheadline ?? "")}`,
        `CTA: ${String(block.props.buttonText ?? "")}`,
      ].filter(Boolean).join("\n");
    case "faq":
      return [
        `Title: ${String(block.props.title ?? "")}`,
        ...(Array.isArray(block.props.items)
          ? (block.props.items as Array<{ q?: string; a?: string }>).slice(0, 2).map((item) => `Q: ${item.q ?? ""}\nA: ${item.a ?? ""}`)
          : []),
      ].join("\n\n");
    case "testimonials":
      return [
        `Title: ${String(block.props.title ?? "")}`,
        ...(Array.isArray(block.props.items)
          ? (block.props.items as Array<{ quote?: string; name?: string }>).slice(0, 2).map((item) => `${item.name ?? "Client"}: ${item.quote ?? ""}`)
          : []),
      ].join("\n\n");
    case "trust_badges":
      return [
        `Title: ${String(block.props.title ?? "")}`,
        ...(Array.isArray(block.props.badges)
          ? (block.props.badges as Array<{ label?: string }>).slice(0, 4).map((item) => `Badge: ${item.label ?? ""}`)
          : []),
      ].join("\n");
    case "features":
      return [
        `Title: ${String(block.props.title ?? "")}`,
        ...(Array.isArray(block.props.items)
          ? (block.props.items as Array<{ title?: string; body?: string }>).slice(0, 3).map((item) => `${item.title ?? ""}: ${item.body ?? ""}`)
          : []),
      ].join("\n\n");
    case "text":
      return String(block.props.content ?? "");
    case "image":
      return `Image: ${String(block.props.src ?? "")}\nCaption: ${String(block.props.caption ?? "")}`;
    default:
      return JSON.stringify(block.props, null, 2).slice(0, 500);
  }
}

function summarizeChangedBlocks(currentBlocks: Block[], nextBlocks: Block[]) {
  return nextBlocks.flatMap((block) => {
    const current = currentBlocks.find((item) => item.id === block.id);
    if (!current) {
      return [{
        id: block.id,
        type: block.type,
        before: "New block",
        after: summarizeBlockProps(block),
      }];
    }

    if (JSON.stringify(current.props) === JSON.stringify(block.props)) {
      return [];
    }

    return [{
      id: block.id,
      type: block.type,
      before: summarizeBlockProps(current),
      after: summarizeBlockProps(block),
    }];
  }).slice(0, 4);
}

export default function WebsiteCopilotPanel({
  siteId,
  pageId,
  siteName,
  pageTitle,
  blocks,
  selectedBlock,
  published,
  queuedInstruction,
  generationContext,
  onApplyBlocks,
  onCreatePageFromTemplate,
}: Props) {
  const diagnostics = useMemo(() => getCopilotDiagnostics(blocks), [blocks]);
  const initialTier: ExecutionTier = generationContext?.executionTier === "core" ? "core" : "elite";
  const [input, setInput] = useState("");
  const [executionTier, setExecutionTier] = useState<ExecutionTier>(initialTier);
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      role: "assistant",
      content: "I can help improve this page, add missing trust or FAQ sections, apply a stronger template direction, or create supporting pages like Services and FAQ.",
    },
  ]);
  const [working, setWorking] = useState(false);
  const [report, setReport] = useState<{ summary: string; before: string[]; after: string[] } | null>(null);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);

  useEffect(() => {
    if (!queuedInstruction?.text || working) return;
    void runAction(queuedInstruction.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queuedInstruction?.id]);

  useEffect(() => {
    setExecutionTier(generationContext?.executionTier === "core" ? "core" : "elite");
  }, [generationContext?.executionTier]);

  async function runAction(raw: string) {
    setMessages((current) => [...current, { role: "user", content: raw }]);
    setWorking(true);

    try {
      const lower = raw.toLowerCase();
      if (lower.includes("create services page") || lower.includes("services page")) {
          await onCreatePageFromTemplate("Services", createServicesPageBlocks(siteName));
          const nextReport = {
            summary: "Copilot created a Services page for this site.",
            before: ["The site did not yet have a dedicated services explanation page."],
            after: ["Visitors now have a focused page that explains service categories and points them toward the CTA."],
          };
          setReport(nextReport);
          setPendingChange(null);
          setMessages((current) => [...current, { role: "assistant", content: nextReport.summary }]);
          return;
      }

      if (lower.includes("create faq page")) {
          await onCreatePageFromTemplate("FAQ", createFaqPageBlocks(siteName));
          const nextReport = {
            summary: "Copilot created a dedicated FAQ page.",
            before: ["The site needed a stronger objection-handling surface beyond the main page."],
            after: ["Visitors now have a dedicated FAQ page that answers common questions before they leave."],
          };
          setReport(nextReport);
          setPendingChange(null);
          setMessages((current) => [...current, { role: "assistant", content: nextReport.summary }]);
          return;
      }

      const response = await fetch(`/api/sites/${siteId}/pages/${pageId}/copilot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: raw,
          blocks,
          pageTitle,
          siteName,
          selectedBlockId: selectedBlock?.id ?? null,
          executionTier,
        }),
      });

      const data = await response.json() as {
        ok: boolean;
        error?: string;
        updatedBlocks?: Block[];
        report?: { summary: string; before: string[]; after: string[] };
      };

      if (!response.ok || !data.ok || !data.updatedBlocks || !data.report) {
        throw new Error(data.error || "Copilot could not apply that change");
      }

      const nextReport = data.report;
      setReport(nextReport);
      setPendingChange({
        blocks: data.updatedBlocks,
        summary: nextReport.summary,
        before: nextReport.before,
        after: nextReport.after,
        diff: summarizeDiff(blocks, data.updatedBlocks),
        changedBlocks: summarizeChangedBlocks(blocks, data.updatedBlocks),
      });
      setMessages((current) => [...current, { role: "assistant", content: `${nextReport.summary} Review the preview below and apply it when you're ready.` }]);
    } finally {
      setWorking(false);
      setInput("");
    }
  }

  function applyPendingChange() {
    if (!pendingChange) return;
    onApplyBlocks(pendingChange.blocks);
    setReport({
      summary: pendingChange.summary,
      before: pendingChange.before,
      after: pendingChange.after,
    });
    setMessages((current) => [...current, { role: "assistant", content: "I applied the previewed change to the page." }]);
    setPendingChange(null);
  }

  function discardPendingChange() {
    setMessages((current) => [...current, { role: "assistant", content: "I discarded that preview. The page is unchanged." }]);
    setPendingChange(null);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-white/[0.06] px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-[0_0_24px_rgba(6,182,212,0.28)]">
            <BotMessageSquare className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300/80">Website Copilot</p>
            <p className="text-sm font-black text-white">Edit this page like Lovable-style guidance</p>
            <p className="text-[11px] leading-5 text-white/35">
              {pageTitle} · {published ? "published" : "draft"} · {diagnostics.blockCount} blocks
            </p>
            <p className="mt-1 text-[11px] font-bold text-cyan-300/90">
              {executionTier === "elite" ? "Elite website copilot lane" : "Core website copilot lane"}
            </p>
            {selectedBlock && (
              <p className="mt-1 text-[11px] font-bold text-cyan-300/90">Selected section: {selectedBlock.type}</p>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-white/[0.06] px-4 py-4">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/25">Execution Lane</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            {
              id: "core" as const,
              label: "Core",
              description: "Strong practical page edits that keep momentum high.",
            },
            {
              id: "elite" as const,
              label: "Elite",
              description: "Sharper conversion rewrites with tighter proof, specificity, and objection handling.",
            },
          ].map((tier) => {
            const active = executionTier === tier.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setExecutionTier(tier.id)}
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
      </div>

      {selectedBlock && (
        <div className="border-b border-white/[0.06] px-4 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/25">Selected Block</p>
          <div className="mt-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-3">
            <p className="text-sm font-bold text-white">{selectedBlock.type}</p>
            <p className="mt-1 text-sm leading-6 text-cyan-50/80">
              Regenerate just this section while keeping the rest of the page intact.
            </p>
            <button
              onClick={() => void runAction(`regenerate this ${selectedBlock.type} section`)}
              disabled={working}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-cyan-900 disabled:opacity-40"
            >
              <Wand2 className="h-4 w-4" />
              Regenerate This Section
            </button>
          </div>
        </div>
      )}

      <div className="border-b border-white/[0.06] px-4 py-4">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/25">What this page needs</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {!diagnostics.hasHero && <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-200">Missing hero</span>}
          {!diagnostics.hasCta && <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-200">Missing CTA</span>}
          {!diagnostics.hasTrust && <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-200">Missing trust</span>}
          {!diagnostics.hasFaq && <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-200">Missing FAQ</span>}
          {!diagnostics.hasTestimonials && <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-200">Missing proof</span>}
          {diagnostics.hasHero && diagnostics.hasCta && diagnostics.hasTrust && diagnostics.hasFaq && diagnostics.hasTestimonials && (
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-200">Core conversion blocks present</span>
          )}
        </div>
      </div>

      {generationContext && (
        <div className="border-b border-white/[0.06] px-4 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/25">Generation Context</p>
          <div className="mt-3 space-y-3">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-3">
              <p className="text-sm font-bold text-white/75">
                {generationContext.templateId ?? "Custom"} · {generationContext.pageType ?? "page"}
              </p>
              <p className="mt-1 text-sm leading-6 text-white/45">
                {generationContext.niche ?? "Unknown niche"} · {generationContext.location ?? "Unknown market"}
              </p>
              {typeof generationContext.blueprintScore?.overall === "number" && (
                <p className="mt-1 text-xs font-bold text-cyan-300">
                  Blueprint score: {generationContext.blueprintScore.overall}/100
                </p>
              )}
            </div>

            {(generationContext.sourceMode || generationContext.sourceUrl) && (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Origin</p>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  {generationContext.sourceMode?.replaceAll("_", " ") ?? "unknown origin"}
                </p>
                {generationContext.sourceUrl && (
                  <p className="mt-1 break-all text-xs leading-5 text-cyan-300/80">{generationContext.sourceUrl}</p>
                )}
              </div>
            )}

            {(generationContext.conversionNotes?.primary_goal || generationContext.generationTrace?.template_reason) && (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Why This Build</p>
                {generationContext.conversionNotes?.primary_goal && (
                  <p className="mt-2 text-sm font-bold text-white/75">Primary goal: {generationContext.conversionNotes.primary_goal}</p>
                )}
                {generationContext.generationTrace?.template_reason && (
                  <p className="mt-2 text-sm leading-6 text-white/50">{generationContext.generationTrace.template_reason}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="border-b border-white/[0.06] px-4 py-4">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/25">Quick Actions</p>
        <div className="mt-3 grid gap-2">
          {[
            { label: "Improve Hero", prompt: "improve the hero", icon: Wand2 },
            { label: "Add Trust", prompt: "add trust section", icon: Sparkles },
            { label: "Add FAQ", prompt: "add faq", icon: Plus },
            { label: "Add Testimonials", prompt: "add testimonials", icon: Plus },
            { label: "Booking Template", prompt: "apply booking template", icon: Wand2 },
            { label: "Services Page", prompt: "create services page", icon: Plus },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => void runAction(item.prompt)}
              disabled={working}
              className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-left text-sm font-bold text-white/70 transition hover:bg-white/[0.06] disabled:opacity-40"
            >
              <item.icon className="h-4 w-4 text-cyan-300" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {report && (
        <div className="border-b border-white/[0.06] px-4 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/25">Before / After</p>
          <div className="mt-3 space-y-3">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/80">Before</p>
              <div className="mt-2 space-y-1">
                {report.before.map((line) => (
                  <p key={line} className="text-sm leading-6 text-amber-50/90">{line}</p>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200/80">After</p>
              <div className="mt-2 space-y-1">
                {report.after.map((line) => (
                  <p key={line} className="text-sm leading-6 text-emerald-50/90">{line}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {pendingChange && (
        <div className="border-b border-white/[0.06] px-4 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/25">Pending Change</p>
          <div className="mt-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-3">
            <p className="text-sm font-bold text-white">{pendingChange.summary}</p>
            <div className="mt-3 space-y-1">
              {pendingChange.diff.map((line) => (
                <p key={line} className="text-sm leading-6 text-cyan-50/90">{line}</p>
              ))}
            </div>
            {pendingChange.changedBlocks.length > 0 && (
              <div className="mt-4 space-y-3">
                {pendingChange.changedBlocks.map((block) => (
                  <div key={block.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/80">{block.type}</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200/80">Before</p>
                        <pre className="mt-2 whitespace-pre-wrap text-xs leading-5 text-amber-50/90">{block.before}</pre>
                      </div>
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200/80">After</p>
                        <pre className="mt-2 whitespace-pre-wrap text-xs leading-5 text-emerald-50/90">{block.after}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={applyPendingChange}
                className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-cyan-900"
              >
                Apply Change
              </button>
              <button
                onClick={discardPendingChange}
                className="flex-1 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold text-white/80"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`rounded-2xl px-3 py-3 text-sm leading-6 ${
              message.role === "assistant"
                ? "border border-white/[0.08] bg-white/[0.03] text-white/70"
                : "border border-cyan-500/20 bg-cyan-500/10 text-cyan-100"
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>

      <div className="border-t border-white/[0.06] px-4 py-4">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-2">
          <textarea
            rows={3}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask: improve the hero, add trust, create services page, apply booking template..."
            className="w-full resize-none bg-transparent px-2 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none"
          />
          <button
            onClick={() => void runAction(input)}
            disabled={!input.trim() || working}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2.5 text-sm font-black text-white disabled:opacity-40"
          >
            {working ? <Sparkles className="h-4 w-4 animate-pulse" /> : <BotMessageSquare className="h-4 w-4" />}
            Run Copilot
          </button>
        </div>
      </div>
    </div>
  );
}
