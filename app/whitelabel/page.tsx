"use client";

import { useState, useEffect } from "react";
import SimplifiedNav from "@/components/SimplifiedNav";
import {
  Building2, Loader2, Save, Check, Plus, Users, Palette, Globe, DollarSign, Trash2,
} from "lucide-react";

type WhiteLabelConfig = {
  enabled: boolean;
  brandName: string;
  logoUrl?: string;
  primaryColor: string;
  domain?: string;
  hideHimalayaBranding: boolean;
  customSupportEmail?: string;
};

type SubAccount = {
  id: string;
  name: string;
  email: string;
  tier: string;
  active: boolean;
  usage: { sites: number; campaigns: number; contacts: number };
  createdAt: string;
};

type PricingTier = {
  name: string;
  price: number;
  interval: string;
  features: string[];
};

export default function WhiteLabelPage() {
  const [config, setConfig] = useState<WhiteLabelConfig>({ enabled: false, brandName: "", primaryColor: "#f5a623", hideHimalayaBranding: false });
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [defaultTiers, setDefaultTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [addingClient, setAddingClient] = useState(false);

  useEffect(() => {
    fetch("/api/whitelabel")
      .then((r) => r.json() as Promise<{ ok: boolean; config?: WhiteLabelConfig; subAccounts?: SubAccount[]; defaultTiers?: PricingTier[] }>)
      .then((data) => {
        if (data.ok) {
          if (data.config) setConfig(data.config);
          if (data.subAccounts) setSubAccounts(data.subAccounts);
          if (data.defaultTiers) setDefaultTiers(data.defaultTiers);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveConfig() {
    setSaving(true);
    await fetch("/api/whitelabel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_config", config }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function addClient() {
    if (!newClientName.trim() || !newClientEmail.trim()) return;
    setAddingClient(true);
    const res = await fetch("/api/whitelabel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_subaccount", clientName: newClientName, clientEmail: newClientEmail, tier: "starter" }),
    });
    const data = await res.json() as { ok: boolean; subAccountId?: string };
    if (data.ok) {
      setSubAccounts([{ id: data.subAccountId ?? "", name: newClientName, email: newClientEmail, tier: "starter", active: true, usage: { sites: 0, campaigns: 0, contacts: 0 }, createdAt: new Date().toISOString() }, ...subAccounts]);
      setNewClientName("");
      setNewClientEmail("");
    }
    setAddingClient(false);
  }

  if (loading) return <div className="min-h-screen bg-t-bg text-white"><SimplifiedNav /><main className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-white/20 animate-spin" /></main></div>;

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e07850]/10 border border-[#e07850]/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#e07850]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">White-Label</h1>
              <p className="text-xs text-white/35">Resell Himalaya under your own brand</p>
            </div>
          </div>
          <button onClick={saveConfig} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e07850] text-white text-sm font-bold hover:bg-[#e07850] transition disabled:opacity-40">
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save</>}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Branding config */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Brand Settings</p>

              <div className="flex items-center gap-3 mb-4">
                <label className="text-xs text-white/50">Enable White-Label</label>
                <button onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                  className={`w-10 h-6 rounded-full transition ${config.enabled ? "bg-[#e07850]" : "bg-white/10"} relative`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition ${config.enabled ? "left-5" : "left-1"}`} />
                </button>
              </div>

              <div>
                <label className="block text-[10px] text-white/30 mb-1">Brand Name</label>
                <input type="text" value={config.brandName} onChange={(e) => setConfig({ ...config, brandName: e.target.value })} placeholder="Your Agency Name"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#e07850]/50 transition" />
              </div>

              <div>
                <label className="block text-[10px] text-white/30 mb-1">Logo URL</label>
                <input type="url" value={config.logoUrl ?? ""} onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })} placeholder="https://yourdomain.com/logo.png"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition" />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-[10px] text-white/30">Primary Color</label>
                <input type="color" value={config.primaryColor} onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })} className="w-8 h-8 rounded border-0 cursor-pointer" />
                <span className="text-xs text-white/20 font-mono">{config.primaryColor}</span>
              </div>

              <div>
                <label className="block text-[10px] text-white/30 mb-1">Custom Domain</label>
                <input type="text" value={config.domain ?? ""} onChange={(e) => setConfig({ ...config, domain: e.target.value })} placeholder="app.youragency.com"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition" />
              </div>

              <div>
                <label className="block text-[10px] text-white/30 mb-1">Support Email</label>
                <input type="email" value={config.customSupportEmail ?? ""} onChange={(e) => setConfig({ ...config, customSupportEmail: e.target.value })} placeholder="support@youragency.com"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition" />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs text-white/50">Hide Himalaya branding</label>
                <button onClick={() => setConfig({ ...config, hideHimalayaBranding: !config.hideHimalayaBranding })}
                  className={`w-10 h-6 rounded-full transition ${config.hideHimalayaBranding ? "bg-[#e07850]" : "bg-white/10"} relative`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition ${config.hideHimalayaBranding ? "left-5" : "left-1"}`} />
                </button>
              </div>
            </div>

            {/* Pricing tiers */}
            {defaultTiers.length > 0 && (
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Suggested Pricing Tiers</p>
                {defaultTiers.map((tier, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] mb-2">
                    <div>
                      <p className="text-xs font-bold text-white">{tier.name}</p>
                      <p className="text-[10px] text-white/25">{tier.features.length} features</p>
                    </div>
                    <p className="text-sm font-bold text-[#f5a623]">${tier.price}/{tier.interval === "monthly" ? "mo" : "yr"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sub-accounts */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Client Accounts ({subAccounts.length})</p>
              </div>

              {/* Add client */}
              <div className="flex gap-2 mb-4">
                <input type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="Client name"
                  className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none transition" />
                <input type="email" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} placeholder="Client email"
                  className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none transition" />
                <button onClick={addClient} disabled={addingClient || !newClientName.trim() || !newClientEmail.trim()}
                  className="px-3 py-2 rounded-lg bg-[#e07850] text-white text-xs font-bold hover:bg-[#e07850] transition disabled:opacity-40">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {subAccounts.length === 0 ? (
                <p className="text-xs text-white/20 text-center py-6">No clients yet. Add your first client above.</p>
              ) : (
                <div className="space-y-2">
                  {subAccounts.map((client) => (
                    <div key={client.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                      <div className="w-8 h-8 rounded-full bg-[#e07850]/20 flex items-center justify-center text-xs font-bold text-[#f5a623]">
                        {client.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{client.name}</p>
                        <p className="text-[10px] text-white/25">{client.email} · {client.tier}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-white/20">{client.usage.sites}s · {client.usage.campaigns}c · {client.usage.contacts}ct</p>
                        <span className={`text-[9px] font-bold ${client.active ? "text-emerald-400" : "text-red-400"}`}>
                          {client.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview */}
            {config.brandName && (
              <div className="rounded-2xl border border-[#e07850]/15 bg-[#e07850]/5 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#e07850]/60 mb-3">Preview</p>
                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${config.primaryColor}30` }}>
                  <div className="h-1.5" style={{ backgroundColor: config.primaryColor }} />
                  <div className="p-4 bg-t-bg-card">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: config.primaryColor }}>
                        {config.brandName.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-white">{config.brandName}</span>
                    </div>
                    <p className="text-[10px] text-white/30">Your clients see this branding everywhere.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
