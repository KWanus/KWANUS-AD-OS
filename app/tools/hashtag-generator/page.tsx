"use client";

import { useState } from "react";
import SimplifiedNav from "@/components/SimplifiedNav";
import { Hash, Copy, Check, Loader2, RefreshCw } from "lucide-react";

const HASHTAG_CATEGORIES = {
  niche: { label: "Niche-Specific", count: 10 },
  trending: { label: "Trending/Viral", count: 5 },
  community: { label: "Community", count: 5 },
  branded: { label: "Branded", count: 3 },
  location: { label: "Location", count: 2 },
};

export default function HashtagGeneratorPage() {
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState<"instagram" | "tiktok" | "twitter">("instagram");
  const [generating, setGenerating] = useState(false);
  const [hashtags, setHashtags] = useState<{ category: string; tags: string[] }[]>([]);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!niche.trim()) return;
    setGenerating(true);
    try {
      const maxTags = platform === "instagram" ? 30 : platform === "tiktok" ? 8 : 5;
      const res = await fetch("/api/ai/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate ${maxTags} hashtags for ${platform} in the "${niche}" niche. Group them:
- Niche-Specific (10 tags): directly related to ${niche}
- Trending (5 tags): currently popular and relevant
- Community (5 tags): where the audience hangs out
- Branded (3 tags): generic brand-building tags
- Location (2 tags): if applicable

Return ONLY the hashtags, one per line, grouped with headers like:
## Niche-Specific
#tag1 #tag2 #tag3

No explanations. Just hashtags.`,
        }),
      });
      const data = await res.json() as { ok: boolean; content?: string };
      if (data.ok && data.content) {
        const groups: { category: string; tags: string[] }[] = [];
        let currentCategory = "General";
        let currentTags: string[] = [];

        for (const line of data.content.split("\n")) {
          if (line.startsWith("##")) {
            if (currentTags.length > 0) groups.push({ category: currentCategory, tags: currentTags });
            currentCategory = line.replace(/^#+\s*/, "").trim();
            currentTags = [];
          } else {
            const tags = line.match(/#\w+/g);
            if (tags) currentTags.push(...tags);
          }
        }
        if (currentTags.length > 0) groups.push({ category: currentCategory, tags: currentTags });
        setHashtags(groups);
      }
    } catch { /* silent */ }
    finally { setGenerating(false); }
  }

  const allTags = hashtags.flatMap((g) => g.tags);

  function copyAll() {
    navigator.clipboard.writeText(allTags.join(" "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
            <Hash className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Hashtag Generator</h1>
            <p className="text-xs text-white/35">AI-generated hashtags grouped by strategy</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <input type="text" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Your niche (e.g. fitness coaching, real estate, SaaS)"
            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-pink-500/50 transition" />
          <div className="flex gap-2">
            {(["instagram", "tiktok", "twitter"] as const).map((p) => (
              <button key={p} onClick={() => setPlatform(p)}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition border ${platform === p ? "border-pink-500/40 bg-pink-500/10 text-pink-300" : "border-white/10 bg-white/[0.03] text-white/30"}`}>
                {p === "instagram" ? "Instagram (30)" : p === "tiktok" ? "TikTok (8)" : "Twitter (5)"}
              </button>
            ))}
          </div>
          <button onClick={generate} disabled={generating || !niche.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-[#e07850] text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-40">
            {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Hash className="w-4 h-4" /> Generate Hashtags</>}
          </button>
        </div>

        {hashtags.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/30">{allTags.length} hashtags</span>
              <button onClick={copyAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-300 text-[10px] font-bold hover:bg-pink-500/20 transition">
                {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy All</>}
              </button>
            </div>

            {hashtags.map((group, i) => (
              <div key={i} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">{group.category}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.tags.map((tag, j) => (
                    <button key={j} onClick={() => { navigator.clipboard.writeText(tag); }}
                      className="px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/15 text-xs text-pink-300 hover:bg-pink-500/20 transition cursor-pointer">
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
