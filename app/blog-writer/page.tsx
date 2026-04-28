"use client";

import { useState } from "react";
import SimplifiedNav from "@/components/SimplifiedNav";
import { FileText, Loader2, Copy, Check, Download } from "lucide-react";

type BlogResult = {
  title: string;
  description: string;
  keywords: string;
  content: string;
  wordCount: number;
};

export default function BlogWriterPage() {
  const [topic, setTopic] = useState("");
  const [keyword, setKeyword] = useState("");
  const [wordCount, setWordCount] = useState(1500);
  const [generating, setGenerating] = useState(false);
  const [blog, setBlog] = useState<BlogResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          targetKeyword: keyword.trim() || undefined,
          wordCount,
        }),
      });
      const data = await res.json() as { ok: boolean; blog?: BlogResult };
      if (data.ok && data.blog) setBlog(data.blog);
    } catch { /* silent */ }
    finally { setGenerating(false); }
  }

  function copyAll() {
    if (!blog) return;
    navigator.clipboard.writeText(`# ${blog.title}\n\n${blog.content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadMd() {
    if (!blog) return;
    const md = `---\ntitle: "${blog.title}"\ndescription: "${blog.description}"\nkeywords: "${blog.keywords}"\n---\n\n# ${blog.title}\n\n${blog.content}`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.trim().replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#f5a623]/10 border border-[#f5a623]/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#f5a623]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Blog Writer</h1>
            <p className="text-xs text-white/35">AI generates a full SEO-optimized blog post from your topic</p>
          </div>
        </div>

        {!blog ? (
          <div className="space-y-4 max-w-lg mx-auto">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Topic *</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. How to get more dental patients from Google"
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Target Keyword (optional)</label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. dental marketing"
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Word Count</label>
              <div className="flex gap-2">
                {[800, 1200, 1500, 2500].map((wc) => (
                  <button
                    key={wc}
                    onClick={() => setWordCount(wc)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition border ${
                      wordCount === wc ? "border-[#f5a623]/40 bg-[#f5a623]/10 text-[#f5a623]" : "border-white/10 bg-white/[0.03] text-white/30"
                    }`}
                  >
                    {wc}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={generate}
              disabled={generating || !topic.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-40"
            >
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Writing ~{wordCount} words...</> : <><FileText className="w-4 h-4" /> Write Blog Post</>}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Actions */}
            <div className="flex items-center gap-2">
              <button onClick={copyAll} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f5a623] text-[#0a0f1e] text-xs font-bold hover:bg-[#e07850] transition">
                {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy All</>}
              </button>
              <button onClick={downloadMd} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-bold text-white/50 hover:text-white/70 transition">
                <Download className="w-3.5 h-3.5" /> Download .md
              </button>
              <button onClick={() => setBlog(null)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-bold text-white/50 hover:text-white/70 transition">
                New Post
              </button>
              <span className="text-[10px] text-white/20 ml-auto">{blog.wordCount} words</span>
            </div>

            {/* SEO preview */}
            <div className="rounded-xl bg-white p-4">
              <p className="text-[#1a0dab] text-base font-medium leading-tight">{blog.title}</p>
              <p className="text-[#006621] text-xs mt-1">yourdomain.com/blog/{topic.trim().replace(/\s+/g, "-").toLowerCase()}</p>
              <p className="text-[#545454] text-xs mt-1 leading-relaxed">{blog.description}</p>
            </div>

            {/* Blog content */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8">
              <article className="prose prose-sm prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-white/75 leading-relaxed">
                  {blog.content}
                </pre>
              </article>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
