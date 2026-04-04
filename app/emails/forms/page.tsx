"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { Plus, Loader2, Copy, Check, Trash2, ExternalLink, FileText, Eye } from "lucide-react";
import { toast } from "sonner";

type Form = {
  id: string;
  name: string;
  headline: string;
  subheadline: string;
  buttonText: string;
  tags: string[];
  active: boolean;
  views: number;
  submissions: number;
  createdAt: string;
};

export default function EmailFormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHeadline, setNewHeadline] = useState("Join our list");
  const [newButton, setNewButton] = useState("Subscribe");
  const [newTags, setNewTags] = useState("subscriber");
  const [saving, setSaving] = useState(false);

  function load() {
    fetch("/api/email-flows/forms")
      .then((r) => r.json() as Promise<{ ok: boolean; forms?: Form[] }>)
      .then((data) => { if (data.ok && data.forms) setForms(data.forms); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/email-flows/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          headline: newHeadline.trim(),
          buttonText: newButton.trim(),
          tags: newTags.split(",").map(t => t.trim()).filter(Boolean),
        }),
      });
      const data = (await res.json()) as { ok: boolean };
      if (data.ok) {
        toast.success("Form created");
        setCreating(false);
        setNewName("");
        load();
      }
    } catch { toast.error("Failed"); } finally { setSaving(false); }
  }

  function copyEmbed(formId: string) {
    const origin = window.location.origin;
    const code = `<iframe src="${origin}/api/opt-in-forms/${formId}/embed" style="width:100%;max-width:400px;height:300px;border:none;border-radius:12px"></iframe>`;
    navigator.clipboard.writeText(code);
    toast.success("Embed code copied");
  }

  function copyApiUrl(formId: string) {
    const origin = window.location.origin;
    navigator.clipboard.writeText(`${origin}/api/opt-in-forms/${formId}/submit`);
    toast.success("API endpoint copied");
  }

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-white">Signup Forms</h1>
            <p className="text-sm text-white/30">Create forms to capture leads and auto-trigger email flows</p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-bold hover:opacity-90 transition"
          >
            <Plus className="w-3.5 h-3.5" /> New Form
          </button>
        </div>

        {/* Create form */}
        {creating && (
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-bold text-white/60 mb-4">Create Signup Form</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] font-bold text-white/25 uppercase mb-1 block">Form name</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Homepage signup" autoFocus
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/60 focus:outline-none focus:border-cyan-500/30" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/25 uppercase mb-1 block">Headline</label>
                <input value={newHeadline} onChange={(e) => setNewHeadline(e.target.value)} placeholder="Join our list"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/60 focus:outline-none focus:border-cyan-500/30" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/25 uppercase mb-1 block">Button text</label>
                <input value={newButton} onChange={(e) => setNewButton(e.target.value)} placeholder="Subscribe"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/60 focus:outline-none focus:border-cyan-500/30" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/25 uppercase mb-1 block">Auto-tags (comma separated)</label>
                <input value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder="subscriber, lead"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/60 focus:outline-none focus:border-cyan-500/30" />
              </div>
            </div>
            <p className="text-[10px] text-white/20 mb-3">When someone submits this form, they'll be auto-enrolled in any active flow with a "signup" trigger.</p>
            <div className="flex gap-2">
              <button onClick={() => void handleCreate()} disabled={saving || !newName.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-40">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Create Form"}
              </button>
              <button onClick={() => setCreating(false)} className="px-4 py-2 rounded-xl text-xs text-white/30 hover:text-white/60 transition">Cancel</button>
            </div>
          </div>
        )}

        {/* Forms list */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-white/20 animate-spin" /></div>
        ) : forms.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30 mb-1">No signup forms yet</p>
            <p className="text-xs text-white/20 mb-4">Forms capture leads and auto-trigger your email flows</p>
            <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 transition">
              <Plus className="w-3 h-3" /> Create Your First Form
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {forms.map((form) => (
              <div key={form.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.12] transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white/70">{form.name}</h3>
                    <p className="text-xs text-white/30 mt-0.5">"{form.headline}" · Button: {form.buttonText}</p>
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-white/20">
                      <span>{form.views} views</span>
                      <span>{form.submissions} signups</span>
                      <span>{form.views > 0 ? Math.round((form.submissions / form.views) * 100) : 0}% conversion</span>
                      {form.tags.length > 0 && <span>Tags: {form.tags.join(", ")}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => copyEmbed(form.id)} title="Copy embed code"
                      className="p-2 rounded-lg hover:bg-white/[0.05] text-white/20 hover:text-white/50 transition">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => copyApiUrl(form.id)} title="Copy API endpoint"
                      className="p-2 rounded-lg hover:bg-white/[0.05] text-white/20 hover:text-white/50 transition">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* How it works */}
        <div className="mt-8 bg-white/[0.015] border border-white/[0.04] rounded-xl p-4">
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-2">How forms work</p>
          <div className="flex items-center gap-2 text-[10px] text-white/20 font-bold">
            <span className="bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded">Visitor fills form</span>
            <span className="text-white/10">→</span>
            <span className="bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded">Contact created + tagged</span>
            <span className="text-white/10">→</span>
            <span className="bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded">"Signup" trigger fires</span>
            <span className="text-white/10">→</span>
            <span className="bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded">Email flow starts</span>
          </div>
        </div>
      </main>
    </div>
  );
}
