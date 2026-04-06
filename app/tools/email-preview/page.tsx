"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import { Mail, Smartphone, Monitor, Copy, Check } from "lucide-react";

export default function EmailPreviewPage() {
  const [subject, setSubject] = useState("Your order is confirmed — here's what happens next");
  const [previewText, setPreviewText] = useState("Everything you need to know about your purchase.");
  const [fromName, setFromName] = useState("Himalaya");
  const [body, setBody] = useState(`Hey there,

Thank you for your purchase! You made a great decision.

Here's what happens next:

1. You'll receive a confirmation email shortly
2. Your order is being processed
3. We'll send you onboarding instructions within the hour

If you have any questions, just reply to this email.

Best,
The Team`);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);

  const htmlBody = body.split("\n\n").map((p) =>
    `<p style="margin:0 0 16px;line-height:1.6;color:#333;font-size:15px;">${p.replace(/\n/g, "<br>")}</p>`
  ).join("");

  const fullHtml = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:32px 40px;background:#fff;border-radius:8px;">${htmlBody}</div>`;

  function copyHtml() {
    navigator.clipboard.writeText(fullHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Email Preview</h1>
            <p className="text-xs text-white/35">See how your email looks before sending — desktop & mobile</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="space-y-3">
            <input type="text" value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="From name"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition" />
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition font-bold" />
            <input type="text" value={previewText} onChange={(e) => setPreviewText(e.target.value)} placeholder="Preview text"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} placeholder="Email body..."
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition resize-none font-mono" />
            <button onClick={copyHtml} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-white text-xs font-bold hover:bg-blue-400 transition">
              {copied ? <><Check className="w-3.5 h-3.5" /> HTML Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy HTML</>}
            </button>
          </div>

          {/* Preview */}
          <div>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setDevice("desktop")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${device === "desktop" ? "border-blue-500/40 bg-blue-500/10 text-blue-300" : "border-white/10 text-white/30"}`}>
                <Monitor className="w-3.5 h-3.5" /> Desktop
              </button>
              <button onClick={() => setDevice("mobile")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${device === "mobile" ? "border-blue-500/40 bg-blue-500/10 text-blue-300" : "border-white/10 text-white/30"}`}>
                <Smartphone className="w-3.5 h-3.5" /> Mobile
              </button>
            </div>

            <div className={`mx-auto rounded-2xl border-2 border-gray-300 bg-white overflow-hidden shadow-2xl transition-all ${device === "mobile" ? "max-w-[375px]" : "max-w-full"}`}>
              {/* Inbox preview */}
              <div className="border-b border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">
                    {fromName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{fromName}</p>
                      <p className="text-xs text-gray-400">now</p>
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate">{subject}</p>
                    <p className="text-xs text-gray-400 truncate">{previewText}</p>
                  </div>
                </div>
              </div>

              {/* Email body */}
              <div className="p-4" style={{ backgroundColor: "#f9fafb" }}>
                <div dangerouslySetInnerHTML={{ __html: fullHtml }} />
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 mt-3 justify-center text-[10px] text-white/20">
              <span>Subject: {subject.length} chars</span>
              <span>Preview: {previewText.length} chars</span>
              <span>Body: {body.split(/\s+/).length} words</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
