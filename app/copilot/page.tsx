"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AppNav from "@/components/AppNav";
import AISubNav from "@/components/AISubNav";
import DatabaseFallbackNotice from "@/components/DatabaseFallbackNotice";
import { Send, Loader2, Zap, RefreshCw, User, Sparkles } from "lucide-react";
import { COPILOT_SUGGESTIONS } from "@/lib/copilot-prompt";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type ExecutionTier = "core" | "elite";

type OsStats = {
  effectiveSystemScore?: number;
  databaseUnavailable?: boolean;
  osVerdict?: {
    status?: string;
    label?: string;
    reason?: string;
  };
  unsyncedSystems?: string[];
};

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  // Basic markdown rendering: **bold**, *italic*, bullet points, inline code, links
  function renderContent(text: string) {
    const lines = text.split("\n");
    let inCodeBlock = false;
    let codeLines: string[] = [];

    const elements: React.ReactNode[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block toggle
      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${i}`} className="bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3 my-2 overflow-x-auto text-xs text-white/70 font-mono leading-relaxed">
              {codeLines.join("\n")}
            </pre>
          );
          codeLines = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      if (!line.trim()) { elements.push(<br key={i} />); continue; }

      // Convert inline formatting
      const formatted = line
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/`(.+?)`/g, '<code style="background:rgba(255,255,255,0.06);padding:1px 5px;border-radius:4px;font-size:12px">$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#06b6d4;text-decoration:underline">$1</a>');

      // Numbered lists
      const numMatch = line.match(/^(\d+)\.\s(.+)/);
      if (numMatch) {
        elements.push(
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
            <span style={{ color: "#06b6d4", flexShrink: 0, fontWeight: 800, fontSize: 12, minWidth: 16 }}>{numMatch[1]}.</span>
            <span dangerouslySetInnerHTML={{ __html: formatted.replace(/^\d+\.\s/, "") }} />
          </div>
        );
        continue;
      }

      // Bullet points
      if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
        elements.push(
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
            <span style={{ color: "#06b6d4", flexShrink: 0, marginTop: 2 }}>•</span>
            <span dangerouslySetInnerHTML={{ __html: formatted.replace(/^[-•]\s/, "") }} />
          </div>
        );
        continue;
      }

      // Headers
      if (line.startsWith("### ")) {
        elements.push(<p key={i} style={{ fontWeight: 800, fontSize: 15, margin: "12px 0 4px" }} dangerouslySetInnerHTML={{ __html: formatted.replace(/^###\s/, "") }} />);
        continue;
      }
      if (line.startsWith("## ")) {
        elements.push(<p key={i} style={{ fontWeight: 800, fontSize: 16, margin: "16px 0 4px" }} dangerouslySetInnerHTML={{ __html: formatted.replace(/^##\s/, "") }} />);
        continue;
      }
      if (line.startsWith("**→")) {
        elements.push(<p key={i} style={{ fontWeight: 700, color: "#06b6d4", margin: "8px 0 2px" }} dangerouslySetInnerHTML={{ __html: formatted }} />);
        continue;
      }

      elements.push(<p key={i} style={{ margin: "4px 0" }} dangerouslySetInnerHTML={{ __html: formatted }} />);
    }

    return elements;
  }

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[75%] bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-500/25 rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-sm text-white leading-relaxed">{message.content}</p>
        </div>
        <div className="w-7 h-7 rounded-full bg-white/10 border border-white/15 flex items-center justify-center ml-2 shrink-0 mt-auto">
          <User className="w-3.5 h-3.5 text-white/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-5">
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shrink-0 mt-0.5">
        <Zap className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="max-w-[85%] bg-white/[0.035] border border-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="text-sm text-white/85 leading-relaxed">
          {renderContent(message.content)}
        </div>
      </div>
    </div>
  );
}

const INTRO_MESSAGE: Message = {
  role: "assistant",
  content: `Hey! I'm the Himalaya Copilot — your AI business consultant and platform guide.

I can help you:
- **Figure out where to start** based on your business type
- **Navigate the platform** (sites, emails, CRM, campaigns)
- **Make better marketing decisions** with data-backed strategies
- **Troubleshoot** anything you're stuck on

What's your situation? Tell me about your business or ask me anything.`,
};

const ONBOARDING_INTRO_MESSAGE: Message = {
  role: "assistant",
  content: `No problem — you're in the right place. I'm the Himalaya Copilot and I'll help you figure out exactly where to start.

Let me ask you one question: **What are you trying to accomplish?**

For example:
- "I want to get more clients for my consulting business"
- "I'm selling a product and need a website and ads"
- "I run a local business and want more leads"
- "I'm not sure — I just want to make more money online"

Tell me in your own words and I'll give you a specific 3-step plan for using Himalaya.`,
};

function CopilotPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fromOnboarding = searchParams.get("onboarding") === "1";
  const prefill = searchParams.get("prefill") ?? "";
  const [messages, setMessages] = useState<Message[]>(() => {
    // Restore from localStorage if available
    try {
      const saved = localStorage.getItem("copilot-messages");
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        if (parsed.length > 1) return parsed;
      }
    } catch { /* ignore */ }
    return [fromOnboarding ? ONBOARDING_INTRO_MESSAGE : INTRO_MESSAGE];
  });
  const [input, setInput] = useState(prefill);

  // Persist messages to localStorage
  useEffect(() => {
    if (messages.length > 1) {
      try { localStorage.setItem("copilot-messages", JSON.stringify(messages.slice(-20))); } catch { /* ignore */ }
    }
  }, [messages]);
  const [streaming, setStreaming] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");
  const [osStats, setOsStats] = useState<OsStats | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    async function loadOsStats() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json() as { ok: boolean; stats?: OsStats | null };
        if (!cancelled && data.ok) {
          setOsStats(data.stats ?? null);
        }
      } catch {
        if (!cancelled) setOsStats(null);
      }
    }
    void loadOsStats();
    return () => {
      cancelled = true;
    };
  }, []);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;

    const userMsg: Message = { role: "user", content };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");

    // Show scanning indicator if a URL was detected
    const hasUrl = /https?:\/\/[^\s]+/.test(content);
    if (hasUrl) setScanning(true);
    setStreaming(true);

    // Add empty assistant placeholder
    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...history, assistantMsg]);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history
            .filter((m) => m.content) // skip empty
            .map((m) => ({ role: m.role, content: m.content })),
          executionTier,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: accumulated };
          return next;
        });
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: "Connection error — the AI couldn't respond. Check your internet connection and try again. If the issue persists, your API key may need attention in Settings." };
        return next;
      });
    } finally {
      setStreaming(false);
      setScanning(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function reset() {
    setMessages([INTRO_MESSAGE]);
    setInput("");
  }

  async function skipOnboarding() {
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingCompleted: true }),
      });
    } finally {
      router.push("/");
    }
  }

  return (
    <div className="min-h-screen bg-[#020509] text-white flex flex-col">
      <AppNav />
      <AISubNav />

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 pt-8 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <h1 className="text-lg font-black text-white">Himalaya Copilot</h1>
              {messages.length > 1 && (
                <button
                  onClick={() => {
                    setMessages([INTRO_MESSAGE]);
                    try { localStorage.removeItem("copilot-messages"); } catch { /* ignore */ }
                  }}
                  className="ml-auto text-[10px] font-bold text-white/20 hover:text-white/50 transition"
                >
                  New chat
                </button>
              )}
            </div>
            <p className="text-xs text-white/35">
              {fromOnboarding
                ? "Let's figure out where you should start →"
                : "AI business consultant · Knows everything about the platform"}
            </p>
            {osStats?.osVerdict?.label && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                  osStats.osVerdict.status === "healthy"
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                    : osStats.osVerdict.status === "stale"
                      ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-100"
                      : "border-amber-500/20 bg-amber-500/10 text-amber-100"
                }`}>
                  {osStats.osVerdict.label}
                </span>
                <span className="text-[11px] text-white/35">
                  {osStats.effectiveSystemScore ?? 0}/100
                </span>
                {(osStats.unsyncedSystems?.length ?? 0) > 0 && (
                  <span className="text-[11px] text-amber-200/80">
                    {osStats?.unsyncedSystems?.length} unsynced
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
              {(["core", "elite"] as const).map((tier) => {
                const active = executionTier === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setExecutionTier(tier)}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] transition ${
                      active
                        ? "bg-cyan-500/15 text-cyan-300"
                        : "text-white/35 hover:bg-white/[0.05] hover:text-white/75"
                    }`}
                  >
                    {tier}
                  </button>
                );
              })}
            </div>
            {fromOnboarding && (
              <>
                <Link
                  href="/setup"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold transition hover:bg-cyan-500/20"
                >
                  ← Back to setup
                </Link>
                <button
                  onClick={() => void skipOnboarding()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] text-white/35 hover:text-white/60 text-xs font-bold transition hover:bg-white/[0.05]"
                >
                  Skip for now
                </button>
              </>
            )}
            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.1] text-white/30 hover:text-white/60 text-xs transition"
            >
              <RefreshCw className="w-3 h-3" />
              New chat
            </button>
          </div>
        </div>

        {/* Suggestion chips — always visible, condensed after first message */}
        {!streaming && (
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 sm:hidden">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Execution Lane</p>
                <p className="mt-1 text-xs text-white/55">
                  {executionTier === "elite"
                    ? "Elite: premium positioning and stronger operator judgment"
                    : "Core: strong pragmatic guidance and fast execution"}
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-black/20 p-1">
                {(["core", "elite"] as const).map((tier) => {
                  const active = executionTier === tier;
                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setExecutionTier(tier)}
                      className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] transition ${
                        active
                          ? "bg-cyan-500/15 text-cyan-300"
                          : "text-white/35 hover:bg-white/[0.05] hover:text-white/75"
                      }`}
                    >
                      {tier}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
            {(messages.length === 1 ? COPILOT_SUGGESTIONS : COPILOT_SUGGESTIONS.slice(0, 3)).map((s) => (
              <button
                key={s}
                onClick={() => void sendMessage(s)}
                className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-cyan-500/30 hover:bg-cyan-500/[0.06] text-xs text-white/50 hover:text-white/80 transition"
              >
                {s}
              </button>
            ))}
            </div>
          </div>
        )}

        <DatabaseFallbackNotice visible={osStats?.databaseUnavailable} compact className="mb-4" />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-1 mb-4 min-h-0" style={{ maxHeight: "60vh" }}>
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}
          {streaming && messages[messages.length - 1]?.content === "" && (
            <div className="flex gap-3 mb-5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white/[0.035] border border-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3">
                {scanning ? (
                  <div className="flex items-center gap-2 text-[11px] text-cyan-400/80">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Scanning site…
                  </div>
                ) : (
                  <div className="flex gap-1.5 items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white/[0.03] border border-white/[0.1] rounded-2xl p-3 flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
            placeholder="Ask anything, or drop a URL to scan it instantly…"
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-white/25 focus:outline-none resize-none leading-relaxed"
            style={{ maxHeight: 120, overflowY: "auto" }}
          />
          <button
            onClick={() => void sendMessage()}
            disabled={!input.trim() || streaming}
            className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white disabled:opacity-30 disabled:cursor-not-allowed transition shrink-0"
          >
            {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-center text-[10px] text-white/20 mt-3">
          Himalaya Copilot · {executionTier === "elite" ? "Elite lane" : "Core lane"} · Powered by Claude · <Link href="/settings" className="hover:text-white/40 transition">Settings</Link>
        </p>
      </div>
    </div>
  );
}

export default function CopilotPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020509] text-white"><AppNav /></div>}>
      <CopilotPageContent />
    </Suspense>
  );
}
