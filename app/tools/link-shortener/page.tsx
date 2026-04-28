"use client";

import { useState } from "react";
import SimplifiedNav from "@/components/SimplifiedNav";
import { Link2, Copy, Check, BarChart3, Plus, ExternalLink } from "lucide-react";

type ShortenedLink = {
  id: string;
  original: string;
  short: string;
  clicks: number;
  createdAt: string;
};

export default function LinkShortenerPage() {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [links, setLinks] = useState<ShortenedLink[]>([]);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function createLink() {
    if (!url.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/tools/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), alias: alias.trim() || undefined }),
      });
      const data = await res.json() as { ok: boolean; link?: ShortenedLink };
      if (data.ok && data.link) {
        setLinks([data.link, ...links]);
        setUrl("");
        setAlias("");
      }
    } catch { /* silent */ }
    finally { setCreating(false); }
  }

  function copyLink(id: string, shortUrl: string) {
    navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Link Shortener</h1>
            <p className="text-xs text-white/35">Create branded short links with click tracking</p>
          </div>
        </div>

        {/* Create */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 mb-6">
          <div className="space-y-3">
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste your long URL..."
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition" />
            <div className="flex gap-3">
              <input type="text" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Custom alias (optional)"
                className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition" />
              <button onClick={createLink} disabled={creating || !url.trim()}
                className="px-6 py-3 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-400 transition disabled:opacity-40 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Shorten
              </button>
            </div>
          </div>
        </div>

        {/* Links list */}
        {links.length > 0 && (
          <div className="space-y-2">
            {links.map((link) => (
              <div key={link.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-blue-300 truncate">{link.short}</p>
                  <p className="text-[10px] text-white/25 truncate">{link.original}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-white/20 flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" /> {link.clicks}
                  </span>
                  <button onClick={() => copyLink(link.id, link.short)}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/30 hover:text-white/60 transition">
                    {copiedId === link.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a href={link.original} target="_blank" rel="noreferrer"
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/30 hover:text-white/60 transition">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
