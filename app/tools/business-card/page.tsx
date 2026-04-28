"use client";

import { useState, useEffect } from "react";
import SimplifiedNav from "@/components/SimplifiedNav";
import { CreditCard, Copy, Check, Download, QrCode } from "lucide-react";

export default function BusinessCardPage() {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [company, setCompany] = useState("");
  const [tagline, setTagline] = useState("");
  const [color, setColor] = useState("#f5a623");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Auto-fill from profile
  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then(r => r.json()),
      fetch("/api/business-profile").then(r => r.json()),
    ]).then(([settingsData, profileData]) => {
      if (settingsData.ok && settingsData.settings) {
        setName(settingsData.settings.name ?? "");
        setEmail(settingsData.settings.email ?? "");
        setCompany(settingsData.settings.workspaceName ?? "");
        setWebsite(settingsData.settings.businessUrl ?? "");
      }
      if (profileData.ok && profileData.profile) {
        if (!company) setCompany(profileData.profile.businessName ?? "");
        setTitle(profileData.profile.businessType?.replace(/_/g, " ") ?? "");
        setTagline(profileData.profile.mainOffer ?? "");
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const qrUrl = website ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(website.startsWith("http") ? website : `https://${website}`)}&format=png` : null;

  function copyVCard() {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${name}
ORG:${company}
TITLE:${title}
EMAIL:${email}
TEL:${phone}
URL:${website}
NOTE:${tagline}
END:VCARD`;
    navigator.clipboard.writeText(vcard);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#f5a623]/10 border border-[#f5a623]/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-[#f5a623]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Digital Business Card</h1>
            <p className="text-xs text-white/35">Create a shareable digital card with QR code</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="space-y-3">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition font-bold" />
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Your title (e.g. Founder & CEO)"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition" />
            <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition" />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition" />
            <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website URL"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition" />
            <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Tagline (what you do)"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition" />
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-white/30">Brand color:</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer" />
            </div>
          </div>

          {/* Preview */}
          <div>
            <div className="sticky top-20">
              <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: `linear-gradient(135deg, ${color}15, ${color}05)`, border: `1px solid ${color}30` }}>
                <div className="h-2" style={{ backgroundColor: color }} />
                <div className="p-8">
                  <h2 className="text-xl font-black text-white">{name || "Your Name"}</h2>
                  {title && <p className="text-sm text-white/50 mt-0.5">{title}</p>}
                  {company && <p className="text-xs font-bold mt-1" style={{ color }}>{company}</p>}
                  {tagline && <p className="text-xs text-white/30 mt-2 italic">{tagline}</p>}

                  <div className="mt-6 space-y-2">
                    {email && <p className="text-xs text-white/50">{email}</p>}
                    {phone && <p className="text-xs text-white/50">{phone}</p>}
                    {website && <p className="text-xs" style={{ color }}>{website}</p>}
                  </div>

                  {qrUrl && (
                    <div className="mt-6 flex justify-end">
                      <img src={qrUrl} alt="QR Code" className="w-20 h-20 rounded-lg bg-white p-1" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button onClick={copyVCard}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#f5a623] text-[#0a0f1e] text-xs font-bold hover:bg-[#e07850] transition">
                  {copied ? <><Check className="w-3.5 h-3.5" /> Copied vCard!</> : <><Copy className="w-3.5 h-3.5" /> Copy vCard</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
