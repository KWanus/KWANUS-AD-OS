"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import CampaignSubNav from "@/components/BuildSubNav";
import {
  Search, Plus, Trash2, Upload, Tag, ChevronLeft,
  Users, Mail, CheckCircle, XCircle, Filter, Download
} from "lucide-react";

type Contact = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  tags: string[];
  executionTier?: "core" | "elite";
  status: string;
  source: string | null;
  createdAt: string;
};

type ExecutionTier = "core" | "elite";

const STATUS_STYLE: Record<string, string> = {
  subscribed:   "border-green-500/30 bg-green-500/10 text-green-400",
  unsubscribed: "border-red-500/30 bg-red-500/5 text-red-400/60",
  bounced:      "border-orange-500/30 bg-orange-500/10 text-orange-400",
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // New contact form
  const [newEmail, setNewEmail] = useState("");
  const [newFirst, setNewFirst] = useState("");
  const [newLast, setNewLast] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newExecutionTier, setNewExecutionTier] = useState<ExecutionTier>("elite");
  const [adding, setAdding] = useState(false);

  // Import
  const [importText, setImportText] = useState("");
  const [importExecutionTier, setImportExecutionTier] = useState<ExecutionTier>("elite");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);

  useEffect(() => {
    void loadContacts();
  }, [search, filterTag, filterStatus]);

  async function loadContacts() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterTag) params.set("tag", filterTag);
    if (filterStatus) params.set("status", filterStatus);
    const res = await fetch(`/api/email-contacts?${params.toString()}`);
    const data = await res.json() as { ok: boolean; contacts?: Contact[]; total?: number; allTags?: string[] };
    if (data.ok) {
      setContacts(data.contacts ?? []);
      setTotal(data.total ?? 0);
      setAllTags(data.allTags ?? []);
    }
    setLoading(false);
  }

  async function addContact() {
    if (!newEmail.trim()) return;
    setAdding(true);
    const res = await fetch("/api/email-contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: newEmail.trim(),
        firstName: newFirst.trim() || undefined,
        lastName: newLast.trim() || undefined,
        tags: newTags.split(",").map(t => t.trim()).filter(Boolean),
        executionTier: newExecutionTier,
        source: "manual",
      }),
    });
    const data = await res.json() as { ok: boolean };
    if (data.ok) {
      setNewEmail(""); setNewFirst(""); setNewLast(""); setNewTags(""); setNewExecutionTier("elite");
      setShowAdd(false);
      void loadContacts();
    }
    setAdding(false);
  }

  async function deleteContact(id: string) {
    try {
      await fetch(`/api/email-contacts/${id}`, { method: "DELETE" });
      setContacts(prev => prev.filter(c => c.id !== id));
      setTotal(prev => prev - 1);
      toast.success("Contact deleted");
    } catch {
      toast.error("Failed to delete contact");
    }
  }

  async function deleteSelected() {
    if (!confirm(`Delete ${selected.size} contacts? This cannot be undone.`)) return;
    try {
      await Promise.all([...selected].map(id => fetch(`/api/email-contacts/${id}`, { method: "DELETE" })));
      setContacts(prev => prev.filter(c => !selected.has(c.id)));
      setTotal(prev => prev - selected.size);
      setSelected(new Set());
      toast.success(`${selected.size} contacts deleted`);
    } catch {
      toast.error("Failed to delete some contacts");
    }
  }

  async function handleBulkImport() {
    if (!importText.trim()) return;
    setImporting(true);
    setImportResult(null);

    // Parse CSV or line-separated emails
    const lines = importText.trim().split("\n").filter(Boolean);
    const contacts = lines.map(line => {
      const parts = line.split(",").map(s => s.trim());
      return {
        email: parts[0] ?? "",
        firstName: parts[1] ?? undefined,
        lastName: parts[2] ?? undefined,
        tags: parts[3] ? parts[3].split("|").map(t => t.trim()) : [],
        executionTier: importExecutionTier,
      };
    }).filter(c => c.email.includes("@"));

    const res = await fetch("/api/email-contacts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contacts }),
    });
    const data = await res.json() as { ok: boolean; imported?: number; skipped?: number };
    if (data.ok) {
      setImportResult({ imported: data.imported ?? 0, skipped: data.skipped ?? 0 });
      void loadContacts();
    }
    setImporting(false);
  }

  function exportCSV() {
    const rows = [["Email", "First Name", "Last Name", "Tags", "Status", "Source", "Created"]];
    contacts.forEach(c => {
      rows.push([c.email, c.firstName ?? "", c.lastName ?? "", c.tags.join("|"), c.status, c.source ?? "", new Date(c.createdAt).toLocaleDateString()]);
    });
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "contacts.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === contacts.length) setSelected(new Set());
    else setSelected(new Set(contacts.map(c => c.id)));
  };

  const subscribed = contacts.filter(c => c.status === "subscribed").length;
  const eliteContacts = contacts.filter(c => (c.executionTier ?? "elite") === "elite").length;

  return (
    <main className="min-h-screen bg-[#020509] text-white flex flex-col">
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(#fff 1px,transparent 1px)", backgroundSize: "28px 28px" }} />

      <AppNav />
      <CampaignSubNav />

      <div className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/emails" className="text-white/30 hover:text-white/60 transition">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-white tracking-tight">Contacts</h1>
            <p className="text-sm text-white/30 mt-0.5">
              {total.toLocaleString()} total · {subscribed.toLocaleString()} subscribed
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white/40 hover:text-white text-xs font-bold transition">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white/50 hover:text-white text-xs font-bold transition">
              <Upload className="w-3.5 h-3.5" /> Import
            </button>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050a14] text-xs font-black transition">
              <Plus className="w-3.5 h-3.5" /> Add Contact
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total", value: total.toLocaleString(), icon: Users, color: "text-white" },
            { label: "Subscribed", value: contacts.filter(c=>c.status==="subscribed").length.toLocaleString(), icon: CheckCircle, color: "text-green-400" },
            { label: "Unsubscribed", value: contacts.filter(c=>c.status==="unsubscribed").length.toLocaleString(), icon: XCircle, color: "text-red-400" },
            { label: "Elite Lane", value: eliteContacts.toLocaleString(), icon: Tag, color: "text-cyan-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 flex items-center gap-3">
              <Icon className={`w-5 h-5 shrink-0 ${color}`} />
              <div>
                <p className="text-lg font-black text-white">{value}</p>
                <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email, name..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-cyan-500/40 transition placeholder-white/20" />
          </div>
          {allTags.length > 0 && (
            <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/60 outline-none focus:border-cyan-500/40 transition">
              <option value="">All Tags</option>
              {allTags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/60 outline-none focus:border-cyan-500/40 transition">
            <option value="">All Status</option>
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="bounced">Bounced</option>
          </select>
          {selected.size > 0 && (
            <button onClick={() => void deleteSelected()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-bold transition hover:bg-red-500/10">
              <Trash2 className="w-3.5 h-3.5" /> Delete {selected.size}
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-white/20 text-sm">Loading contacts...</div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-3xl">📋</div>
            <div>
              <h2 className="text-base font-bold text-white/50 mb-1">No contacts yet</h2>
              <p className="text-sm text-white/25 max-w-xs">Add contacts manually or import a CSV to get started.</p>
            </div>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050a14] text-sm font-black transition">
              <Plus className="w-4 h-4" /> Add Your First Contact
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[32px_1fr_1fr_1fr_120px_100px] gap-4 px-4 py-3 border-b border-white/[0.06] text-[10px] font-black text-white/25 uppercase tracking-widest">
              <div>
                <input type="checkbox" checked={selected.size === contacts.length && contacts.length > 0}
                  onChange={toggleAll} className="rounded" />
              </div>
              <div>Email</div>
              <div>Name</div>
              <div>Tags</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

            {/* Rows */}
            {contacts.map(contact => (
              <div key={contact.id}
                className={`grid grid-cols-[32px_1fr_1fr_1fr_120px_100px] gap-4 px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition items-center ${selected.has(contact.id) ? "bg-cyan-500/5" : ""}`}>
                <div>
                  <input type="checkbox" checked={selected.has(contact.id)}
                    onChange={() => toggleSelect(contact.id)} className="rounded" />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center text-xs font-black text-white/60 shrink-0">
                    {(contact.firstName?.[0] ?? contact.email[0]).toUpperCase()}
                  </div>
                  <span className="text-sm text-white/80 truncate">{contact.email}</span>
                </div>
                <div className="text-sm text-white/50 truncate">
                  {contact.firstName || contact.lastName
                    ? `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim()
                    : <span className="text-white/20 italic">—</span>}
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${
                    (contact.executionTier ?? "elite") === "elite"
                      ? "border-cyan-500/20 bg-cyan-500/5 text-cyan-400"
                      : "border-white/10 bg-white/5 text-white/45"
                  }`}>
                    {contact.executionTier ?? "elite"}
                  </span>
                  {contact.tags.length > 0 ? contact.tags.slice(0, 3).map(tag => (
                    <span key={tag}
                      className="text-[9px] px-1.5 py-0.5 rounded border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 font-medium cursor-pointer hover:bg-cyan-500/10 transition"
                      onClick={() => setFilterTag(tag)}>
                      {tag}
                    </span>
                  )) : <span className="text-white/20 text-xs">—</span>}
                  {contact.tags.length > 3 && (
                    <span className="text-[9px] text-white/30">+{contact.tags.length - 3}</span>
                  )}
                </div>
                <div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide ${STATUS_STYLE[contact.status] ?? "border-white/10 text-white/30"}`}>
                    {contact.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/20">
                    {new Date(contact.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <button onClick={() => void deleteContact(contact.id)}
                    className="p-1 rounded hover:bg-red-500/10 text-white/20 hover:text-red-400 transition">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#080d1a] p-6">
            <h3 className="text-lg font-black text-white mb-5">Add Contact</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Email *</label>
                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@example.com"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-400/50 transition" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">First Name</label>
                  <input value={newFirst} onChange={e => setNewFirst(e.target.value)} placeholder="John"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-400/50 transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Last Name</label>
                  <input value={newLast} onChange={e => setNewLast(e.target.value)} placeholder="Doe"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-400/50 transition" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Tags (comma-separated)</label>
                <input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="customer, vip, welcome"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-400/50 transition" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Execution Lane</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "core" as const, label: "Core", note: "Clean standard contact lane." },
                    { value: "elite" as const, label: "Elite", note: "Premium downstream email lane." },
                  ].map((option) => {
                    const active = newExecutionTier === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setNewExecutionTier(option.value)}
                        className={`rounded-xl border px-3 py-3 text-left transition-all ${
                          active
                            ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-100 shadow-[0_0_24px_rgba(6,182,212,0.12)]"
                            : "border-white/[0.08] bg-white/[0.03] text-white/55 hover:bg-white/[0.05]"
                        }`}
                      >
                        <p className="text-xs font-black">{option.label}</p>
                        <p className="mt-1 text-[10px] leading-relaxed text-white/35">{option.note}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white transition">Cancel</button>
              <button onClick={() => void addContact()} disabled={adding || !newEmail.trim()}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050a14] text-sm font-black disabled:opacity-40 transition">
                {adding ? "Adding..." : "Add Contact"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#080d1a] p-6">
            <h3 className="text-lg font-black text-white mb-2">Bulk Import</h3>
            <p className="text-xs text-white/30 mb-4">Paste one contact per line: <span className="text-white/50 font-mono">email, firstname, lastname, tag1|tag2</span></p>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {[
                { value: "core" as const, label: "Core", note: "Standard import lane." },
                { value: "elite" as const, label: "Elite", note: "Sharper downstream execution lane." },
              ].map((option) => {
                const active = importExecutionTier === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setImportExecutionTier(option.value)}
                    className={`rounded-xl border px-3 py-3 text-left transition-all ${
                      active
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-100 shadow-[0_0_24px_rgba(6,182,212,0.12)]"
                        : "border-white/[0.08] bg-white/[0.03] text-white/55 hover:bg-white/[0.05]"
                    }`}
                  >
                    <p className="text-xs font-black">{option.label}</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-white/35">{option.note}</p>
                  </button>
                );
              })}
            </div>
            <textarea value={importText} onChange={e => setImportText(e.target.value)}
              placeholder={"john@example.com, John, Doe, customer|vip\njane@example.com, Jane, Smith"}
              rows={8}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-400/50 transition font-mono resize-none" />
            {importResult && (
              <div className="mt-3 p-3 rounded-xl border border-green-500/20 bg-green-500/5 text-green-400 text-sm">
                ✅ Imported {importResult.imported} contacts · {importResult.skipped} skipped
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowImport(false); setImportResult(null); setImportText(""); }}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white transition">Close</button>
              <button onClick={() => void handleBulkImport()} disabled={importing || !importText.trim()}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#050a14] text-sm font-black disabled:opacity-40 transition">
                {importing ? "Importing..." : "Import Contacts"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
