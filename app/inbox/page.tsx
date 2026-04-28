"use client";

import { useEffect, useMemo, useState, type ElementType } from "react";
import Link from "next/link";
import SimplifiedNav from "@/components/SimplifiedNav";
import OperatorCallout from "@/components/navigation/OperatorCallout";
import OperatorStatCard from "@/components/navigation/OperatorStatCard";
import WorkflowHeader from "@/components/navigation/WorkflowHeader";
import {
  CalendarDays,
  ChevronRight,
  Copy,
  ExternalLink,
  Inbox as InboxIcon,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Sparkles,
  Star,
} from "lucide-react";

type InboxItem = {
  id: string;
  type: "form" | "chat" | "email" | "booking" | "testimonial";
  from: string;
  email: string | null;
  preview: string;
  read: boolean;
  timestamp: string;
  metadata: Record<string, unknown>;
};

type InboxResponse = {
  ok: boolean;
  items?: InboxItem[];
  unreadCount?: number;
  error?: string;
};

type InboxFilter = "all" | InboxItem["type"];

type DetailRow = {
  label: string;
  value: string;
};

const TYPE_CONFIG: Record<InboxItem["type"], { label: string; icon: ElementType; tone: string }> = {
  form: { label: "Form", icon: Mail, tone: "border-[#f5a623]/20 bg-[#f5a623]/10 text-[#f5a623]" },
  chat: { label: "Chat", icon: MessageCircle, tone: "border-[#e07850]/20 bg-[#e07850]/10 text-[#f5a623]" },
  email: { label: "Email", icon: Mail, tone: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" },
  booking: { label: "Booking", icon: CalendarDays, tone: "border-amber-500/20 bg-amber-500/10 text-amber-300" },
  testimonial: { label: "Testimonial", icon: Star, tone: "border-pink-500/20 bg-pink-500/10 text-pink-300" },
};

function timeAgo(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function getItemHref(item: InboxItem) {
  const leadId = stringValue(item.metadata.leadId);
  if (leadId) return `/leads/${leadId}`;
  if (item.type === "booking") return "/bookings";
  return null;
}

function getPublicSiteHref(item: InboxItem) {
  const slug = stringValue(item.metadata.siteSlug);
  return slug ? `/s/${slug}` : null;
}

function getItemBody(item: InboxItem) {
  const meta = item.metadata;

  if (item.type === "chat") {
    return stringValue(meta.message) ?? item.preview;
  }

  if (item.type === "testimonial") {
    return stringValue(meta.quote) ?? item.preview;
  }

  if (item.type === "booking") {
    return stringValue(meta.notes) ?? "Booking request captured in the workspace.";
  }

  return stringValue(meta.message) ?? item.preview;
}

function getDetailRows(item: InboxItem): DetailRow[] {
  const meta = item.metadata;
  const rows: DetailRow[] = [];

  const push = (label: string, value: unknown) => {
    const normalized = stringValue(value);
    if (normalized) rows.push({ label, value: normalized });
  };

  push("Received", formatTimestamp(item.timestamp));
  push("Email", item.email);

  if (item.type === "form") {
    push("Site", stringValue(meta.siteSlug) ? `/${meta.siteSlug}` : null);
    push("Phone", meta.hasPhone ? "Provided on submission" : null);
    push("Enrollment", meta.enrollmentStatus);
    push("Lead score", meta.score);
    push("Lead verdict", meta.verdict);
  }

  if (item.type === "chat") {
    push("Visitor", meta.visitorName);
    push("Visitor ID", meta.visitorId);
    push("Site", stringValue(meta.siteId) ? "Linked site conversation" : null);
  }

  if (item.type === "booking") {
    const date = stringValue(meta.date);
    const startTime = stringValue(meta.startTime);
    const endTime = stringValue(meta.endTime);
    if (date && startTime) {
      rows.push({
        label: "Appointment",
        value: `${date} at ${startTime}${endTime ? `-${endTime}` : ""}`,
      });
    }
    push("Phone", meta.clientPhone);
    push("Status", meta.status);
  }

  if (item.type === "testimonial") {
    push("Status", meta.status);
  }

  return rows;
}

export default function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadInbox = async (showSpinner: boolean) => {
      if (showSpinner) setRefreshing(true);

      try {
        const response = await fetch("/api/inbox", { cache: "no-store" });
        const data = (await response.json()) as InboxResponse;

        if (!cancelled && data.ok && data.items) {
          const nextItems = data.items;
          setItems(nextItems);
          setSelectedId((current) => current ?? nextItems[0]?.id ?? null);
        }
      } catch {
        // Non-blocking: the page can stay on previous data.
      } finally {
        if (!cancelled) {
          setLoading(false);
          if (showSpinner) setRefreshing(false);
        }
      }
    };

    loadInbox(false);
    const interval = window.setInterval(() => loadInbox(false), 20000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((item) => item.type === filter)),
    [filter, items]
  );

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }

    const hasSelected = filtered.some((item) => item.id === selectedId);
    if (!hasSelected) {
      setSelectedId(filtered[0]?.id ?? null);
    }
  }, [filtered, selectedId]);

  const selectedItem = useMemo(
    () => filtered.find((item) => item.id === selectedId) ?? null,
    [filtered, selectedId]
  );

  const unreadCount = items.filter((item) => !item.read).length;
  const activeConversations = items.filter((item) => !item.read || item.type === "chat").length;
  const detailRows = selectedItem ? getDetailRows(selectedItem) : [];
  const detailBody = selectedItem ? getItemBody(selectedItem) : null;
  const detailHref = selectedItem ? getItemHref(selectedItem) : null;
  const publicSiteHref = selectedItem ? getPublicSiteHref(selectedItem) : null;
  const hasDirectReply = Boolean(selectedItem?.email);

  async function refreshInbox() {
    setRefreshing(true);
    try {
      const response = await fetch("/api/inbox", { cache: "no-store" });
      const data = (await response.json()) as InboxResponse;
      if (data.ok && data.items) {
        setItems(data.items);
      }
    } catch {
      // Keep previous state if refresh fails.
    } finally {
      setRefreshing(false);
    }
  }

  async function copyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      window.setTimeout(() => setCopiedEmail(null), 1800);
    } catch {
      setCopiedEmail(null);
    }
  }

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6 rounded-3xl border border-white/[0.06] bg-gradient-to-br from-[#f5a623]/[0.07] via-white/[0.02] to-[#e07850]/[0.04] p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <WorkflowHeader
              title="Unified Inbox"
              description="Work forms, chat, bookings, and testimonials from one place. Pick a thread to inspect details and jump straight into the right follow-up flow."
              icon={InboxIcon}
            />

            <div className="grid grid-cols-3 gap-2 sm:flex">
              <div className="rounded-2xl border border-white/[0.07] bg-black/20 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Messages</p>
                <p className="mt-1 text-lg font-black text-white">{items.length}</p>
              </div>
              <div className="rounded-2xl border border-[#f5a623]/20 bg-[#f5a623]/10 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f5a623]/60">Unread</p>
                <p className="mt-1 text-lg font-black text-[#f5a623]">{unreadCount}</p>
              </div>
              <button
                onClick={refreshInbox}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-xs font-semibold text-white/55 transition hover:text-white/80"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <OperatorStatCard
              label="Action Queue"
              value={activeConversations}
              description="Unread or chat-led conversations that likely need operator attention first."
            />
            <OperatorStatCard
              label="Current Focus"
              value={selectedItem?.from ?? "Pick a thread"}
              description="Use the detail panel as your triage surface before jumping into leads, bookings, or the live site."
            />
            <OperatorStatCard
              label="Workflow Mode"
              value="Triage first"
              description="This page is tuned for fast inspection and routing until full live reply threads are in place."
            />
          </div>
        </div>

        <div className="sticky top-[108px] z-20 mb-5 rounded-2xl border border-white/[0.06] bg-[#07101d]/90 p-3 backdrop-blur xl:top-[72px]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 overflow-x-auto">
              {(["all", "form", "chat", "booking", "testimonial"] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`shrink-0 rounded-lg border px-3 py-2 text-[11px] font-bold transition ${
                    filter === key
                      ? "border-white/[0.15] bg-white/[0.08] text-white/70"
                      : "border-white/[0.06] bg-white/[0.02] text-white/30 hover:border-white/[0.1] hover:text-white/50"
                  }`}
                >
                  {key === "all" ? "All" : TYPE_CONFIG[key].label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/30">
              <span>{filtered.length} visible</span>
              <span className="h-1 w-1 rounded-full bg-white/15" />
              <span>{selectedItem ? `Focused on ${selectedItem.from}` : "Pick a thread"}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent py-20">
            <Loader2 className="h-6 w-6 animate-spin text-white/20" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent py-20 text-center">
            <InboxIcon className="h-10 w-10 text-white/10" />
            <div>
              <p className="text-sm font-bold text-white/50">Nothing here yet</p>
              <p className="mt-1 text-xs text-white/25">New form submissions, chat messages, and bookings will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
            <section className="rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between px-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                  {filter === "all" ? "All Conversations" : `${TYPE_CONFIG[filter].label} Messages`}
                </p>
                <p className="text-[11px] text-white/25">{filtered.length} shown</p>
              </div>

              <div className="space-y-3">
                {filtered.map((item) => {
                  const config = TYPE_CONFIG[item.type];
                  const Icon = config.icon;
                  const active = item.id === selectedId;

                  return (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-[#f5a623]/30 bg-[#f5a623]/[0.08] shadow-[0_0_0_1px_rgba(34,211,238,0.08)]"
                          : item.read
                            ? "border-white/[0.07] bg-black/20 hover:border-white/[0.12]"
                            : "border-[#f5a623]/20 bg-gradient-to-br from-[#f5a623]/[0.08] via-white/[0.02] to-transparent hover:border-[#f5a623]/30"
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${config.tone}`}>
                              <Icon className="h-3 w-3" />
                              {config.label}
                            </span>
                            {!item.read && (
                              <span className="inline-flex items-center rounded-full border border-[#f5a623]/20 bg-[#f5a623]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#f5a623]">
                                New
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <p className="text-sm font-black text-white">{item.from}</p>
                            {item.email && <p className="text-xs text-white/35">{item.email}</p>}
                            <p className="text-[11px] text-white/20">{timeAgo(item.timestamp)}</p>
                          </div>

                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/55">{item.preview}</p>
                        </div>

                        <ChevronRight className={`mt-0.5 h-4 w-4 shrink-0 transition ${active ? "text-[#f5a623]" : "text-white/20"}`} />
                      </div>

                      {active && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.email && (
                            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                              Email ready
                            </span>
                          )}
                          {getItemHref(item) && (
                            <span className="rounded-full border border-[#f5a623]/20 bg-[#f5a623]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#f5a623]">
                              Workspace route
                            </span>
                          )}
                          {getPublicSiteHref(item) && (
                            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                              Public site
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <aside className="rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] via-white/[0.015] to-transparent p-5 sm:p-6 xl:sticky xl:top-[138px] xl:self-start">
              {!selectedItem ? (
                <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-4 text-center">
                  <InboxIcon className="h-10 w-10 text-white/10" />
                  <div>
                    <p className="text-sm font-bold text-white/50">Select a conversation</p>
                    <p className="mt-1 text-xs text-white/25">Pick any item from the left to inspect details and next actions.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/20">Message Detail</p>
                      <h2 className="mt-2 text-xl font-black text-white">{selectedItem.from}</h2>
                      <p className="mt-1 text-xs text-white/30">{formatTimestamp(selectedItem.timestamp)}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${TYPE_CONFIG[selectedItem.type].tone}`}
                    >
                      {selectedItem.type}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {selectedItem.email && (
                      <>
                        <button
                          type="button"
                          onClick={() => copyEmail(selectedItem.email!)}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/55 transition hover:text-white/80"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copiedEmail === selectedItem.email ? "Copied" : "Copy Email"}
                        </button>
                        <a
                          href={`mailto:${selectedItem.email}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/55 transition hover:text-white/80"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          Draft Reply
                        </a>
                      </>
                    )}

                    {detailHref && (
                      <Link
                        href={detailHref}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/10 px-3 py-2 text-xs font-semibold text-[#f5a623] transition hover:bg-[#f5a623]/15"
                      >
                        Open Workspace
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    )}

                    {publicSiteHref && (
                      <Link
                        href={publicSiteHref}
                        target="_blank"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/55 transition hover:text-white/80"
                      >
                        View Site
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <OperatorStatCard
                      label="Reply State"
                      value={hasDirectReply ? "Reachable" : "No direct channel"}
                      description={hasDirectReply ? "You can move immediately with copy-email or draft-reply actions." : "Use workspace routing or site context because this thread has no direct email target."}
                    />
                    <OperatorStatCard
                      label="Route Depth"
                      value={detailHref ? "Connected" : "Triage only"}
                      description={detailHref ? "This thread can jump directly into a downstream workspace flow." : "Stay in triage mode here, then act from the surrounding operator systems."}
                    />
                    <OperatorStatCard
                      label="Signal Freshness"
                      value={selectedItem.read ? "Known" : "Fresh"}
                      description={selectedItem.read ? "Already present in the system, so prioritize by context and value." : "This looks newly surfaced, so faster follow-up likely matters more."}
                    />
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Message</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/70">{detailBody}</p>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Quick Path</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/20">Inspect</p>
                        <p className="mt-1 text-[11px] leading-5 text-white/45">Read the message and validate urgency, context, and conversion intent.</p>
                      </div>
                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/20">Route</p>
                        <p className="mt-1 text-[11px] leading-5 text-white/45">Jump into leads, bookings, or the live site depending on the message type.</p>
                      </div>
                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/20">Follow Up</p>
                        <p className="mt-1 text-[11px] leading-5 text-white/45">Use copy-email or draft-reply actions to move while the system catches up on live threads.</p>
                      </div>
                    </div>
                  </div>

                  {detailRows.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Context</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {detailRows.map((row) => (
                          <div key={`${row.label}-${row.value}`} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/20">{row.label}</p>
                            <p className="mt-1 text-sm font-semibold text-white/70">{row.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <OperatorCallout
                    icon={Sparkles}
                    eyebrow="Operator Note"
                    title="This workspace is optimized for triage right now."
                    description="Live reply threads are not wired yet, so the fastest path is still: inspect the lead, jump into the right system, and use draft actions to follow up fast."
                    tone="warning"
                    className="mt-4"
                  />

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/20">Best Next Move</p>
                      <p className="mt-2 text-sm font-bold text-white">
                        {selectedItem.type === "booking"
                          ? "Confirm context before the call"
                          : selectedItem.type === "chat"
                            ? "Reply quickly while intent is hot"
                            : selectedItem.type === "testimonial"
                              ? "Review and approve social proof"
                              : "Route into leads or follow-up"}
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-white/35">
                        {selectedItem.type === "booking"
                          ? "Use the booking manager to prep notes, confirm timing, and keep the conversation warm."
                          : selectedItem.type === "chat"
                            ? "Use the draft or workspace jump to keep momentum before the visitor cools off."
                            : selectedItem.type === "testimonial"
                              ? "Pull the quote into marketing assets or review flow once it is approved."
                              : "Inspect the submission context, then move into the operator system best suited to convert it."}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/20">Current Route</p>
                      <p className="mt-2 text-sm font-bold capitalize text-white">{TYPE_CONFIG[selectedItem.type].label}</p>
                      <p className="mt-1 text-[11px] leading-5 text-white/35">
                        {selectedItem.read ? "Already logged in the workspace." : "Still looks fresh and likely needs a timely operator touch."}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
