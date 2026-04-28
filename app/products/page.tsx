"use client";

import { useState, useEffect } from "react";
import SimplifiedNav from "@/components/SimplifiedNav";
import DatabaseFallbackNotice from "@/components/DatabaseFallbackNotice";
import { WorkspaceHero, WorkspaceShell } from "@/components/ui/WorkspaceShell";
import Link from "next/link";
import {
  Search, Loader2, Plus, Copy, CheckCircle, Trash2,
  Megaphone, Globe, AlertCircle, Zap, Package, ArrowRight, Link2,
} from "lucide-react";
type ExecutionTier = "core" | "elite";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  platform: string;
  productUrl: string;
  affiliateUrl: string | null;
  commission: string | null;
  niche: string | null;
  createdAt: string;
  scanData?: {
    executionTier?: ExecutionTier;
  } | null;
};

type BusinessProfileSummary = {
  businessType: string;
  businessName: string | null;
  niche: string | null;
  location: string | null;
  mainGoal: string | null;
  recommendedSystems?: {
    firstAction?: string;
    strategicSummary?: string;
  } | null;
};

type StatsSummary = {
  effectiveSystemScore?: number;
  unsyncedSystems?: string[];
  databaseUnavailable?: boolean;
  osVerdict?: {
    status?: string;
    label?: string;
    reason?: string;
  };
};

type ScanResult = {
  ok: boolean;
  executionTier?: ExecutionTier;
  platform: string;
  affiliateUrl: string | null;
  hasAffiliateId: boolean;
  missingIdPlatform: string | null;
  product: {
    name: string;
    description: string;
    price: string;
    commission: string;
    niche: string;
    hooks: string[];
    targetAudience: string;
    painPoint: string;
    topBenefit: string;
  };
  error?: string;
};

const PLATFORM_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  clickbank:   { emoji: "💰", label: "ClickBank",    color: "text-green-400 bg-green-500/10 border-green-500/20" },
  amazon:      { emoji: "📦", label: "Amazon",       color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  aliexpress:  { emoji: "🏪", label: "AliExpress",   color: "text-red-400 bg-red-500/10 border-red-500/20" },
  jvzoo:       { emoji: "🎯", label: "JVZoo",        color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  warriorplus: { emoji: "⚔️", label: "WarriorPlus",  color: "text-[#e07850] bg-[#e07850]/10 border-[#e07850]/20" },
  cj:          { emoji: "🔗", label: "CJ/ShareASale", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  dropship:    { emoji: "🚢", label: "Dropship",     color: "text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20" },
  custom:      { emoji: "🔗", label: "Custom",       color: "text-white/40 bg-white/[0.05] border-white/[0.08]" },
};

function PlatformBadge({ platform }: { platform: string }) {
  const cfg = PLATFORM_CONFIG[platform] ?? PLATFORM_CONFIG.custom;
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-black ${cfg.color}`}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { void navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1 text-white/20 hover:text-white/60 transition"
    >
      {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function ProductCard({ product, onDelete }: { product: Product; onDelete: (id: string) => void }) {
  const executionTier: ExecutionTier = product.scanData?.executionTier === "core" ? "core" : "elite";
  const launchUrl = (skill: string) => {
    const u = product.affiliateUrl ?? product.productUrl;
    return `/skills?skill=${skill}&prefill_url=${encodeURIComponent(u)}&prefill_mode=operator&execution_tier=${executionTier}`;
  };

  return (
    <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 hover:border-white/[0.12] transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black text-white truncate">{product.name}</h3>
          <div className="flex flex-wrap gap-2 mt-1.5">
            <PlatformBadge platform={product.platform} />
            <span
              className={`text-[10px] font-black uppercase tracking-[0.16em] px-2 py-0.5 rounded-lg border ${
                executionTier === "elite"
                  ? "border-[#f5a623]/20 bg-[#f5a623]/10 text-[#f5f0e8]"
                  : "border-white/[0.08] bg-white/[0.05] text-white/50"
              }`}
            >
              {executionTier}
            </span>
            {product.niche && (
              <span className="text-[10px] text-white/30 bg-white/[0.04] px-2 py-0.5 rounded-lg border border-white/[0.07] capitalize">
                {product.niche}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(product.id)}
          className="p-1 text-white/15 hover:text-red-400/60 transition shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {product.description && (
        <p className="text-xs text-white/40 leading-relaxed mb-3 line-clamp-2">{product.description}</p>
      )}

      <div className="flex flex-wrap gap-3 mb-3 text-xs">
        {product.price && (
          <span className="text-white/60"><span className="text-white/25">Price:</span> {product.price}</span>
        )}
        {product.commission && (
          <span className="text-emerald-400/80"><span className="text-white/25">Commission:</span> {product.commission}</span>
        )}
      </div>

      {product.affiliateUrl ? (
        <div className="flex items-center gap-1.5 p-2.5 bg-emerald-500/[0.05] border border-emerald-500/15 rounded-xl mb-3">
          <Zap className="w-3 h-3 text-emerald-400 shrink-0" />
          <p className="text-[10px] text-emerald-400/80 truncate flex-1">{product.affiliateUrl}</p>
          <CopyBtn text={product.affiliateUrl} />
        </div>
      ) : (
        <div className="flex items-center gap-1.5 p-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl mb-3">
          <Link2 className="w-3 h-3 text-white/20 shrink-0" />
          <p className="text-[10px] text-white/30 truncate flex-1">{product.productUrl}</p>
          <CopyBtn text={product.productUrl} />
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t border-white/[0.05]">
        <Link
          href={launchUrl("ad-campaign")}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#f5a623]/10 border border-[#f5a623]/20 text-[#f5a623] text-[11px] font-bold hover:bg-[#f5a623]/15 transition"
        >
          <Megaphone className="w-3 h-3" /> Ad Campaign
        </Link>
        <Link
          href={launchUrl("landing-page")}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#e07850]/10 border border-[#e07850]/20 text-[#e07850] text-[11px] font-bold hover:bg-[#e07850]/15 transition"
        >
          <Globe className="w-3 h-3" /> Build Site
        </Link>
        <Link
          href={`/scan?url=${encodeURIComponent(product.productUrl)}&mode=operator&execution_tier=${executionTier}`}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/[0.03] border border-white/[0.07] text-white/30 text-[11px] font-bold hover:text-white/60 transition"
        >
          <Search className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

function verdictTone(status?: string) {
  if (status === "healthy") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  if (status === "stale") return "border-[#f5a623]/20 bg-[#f5a623]/10 text-[#f5f0e8]";
  return "border-amber-500/20 bg-amber-500/10 text-amber-100";
}

export default function ProductsPage() {
  const [tab, setTab] = useState<"library" | "add">("library");
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");
  const [products, setProducts] = useState<Product[]>([]);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileSummary | null>(null);
  const [osStats, setOsStats] = useState<StatsSummary | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncingSystem, setSyncingSystem] = useState(false);
  const [refreshingRecommendations, setRefreshingRecommendations] = useState(false);

  async function fetchProducts() {
    const [productRes, profileRes, statsRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/business-profile"),
      fetch("/api/stats"),
    ]);
    const data = await productRes.json() as { ok: boolean; products: Product[] };
    const profileData = await profileRes.json() as { ok: boolean; profile?: BusinessProfileSummary | null };
    const statsData = await statsRes.json() as { ok: boolean; stats?: StatsSummary | null };
    if (data.ok) setProducts(data.products);
    if (profileData.ok) setBusinessProfile(profileData.profile ?? null);
    if (statsData.ok) setOsStats(statsData.stats ?? null);
    setLoadingProducts(false);
  }

  useEffect(() => { void fetchProducts(); }, []);

  async function scanProduct() {
    if (!url.trim() || scanning) return;
    setScanning(true);
    setScanResult(null);
    setSaved(false);
    const res = await fetch("/api/products/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim(), executionTier }),
    });
    const data = await res.json() as ScanResult;
    setScanResult(data);
    setScanning(false);
  }

  async function saveProduct() {
    if (!scanResult?.ok) return;
    setSaving(true);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: scanResult.product.name,
        productUrl: url.trim(),
        platform: scanResult.platform,
        affiliateUrl: scanResult.affiliateUrl,
        price: scanResult.product.price,
        commission: scanResult.product.commission,
        niche: scanResult.product.niche,
        description: scanResult.product.description,
        scanData: {
          ...scanResult.product,
          executionTier: scanResult.executionTier ?? executionTier,
        },
      }),
    });
    const data = await res.json() as { ok: boolean };
    if (data.ok) {
      setSaved(true);
      setUrl("");
      setScanResult(null);
      await fetchProducts();
      setTab("library");
    }
    setSaving(false);
  }

  async function deleteProduct(id: string) {
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setProducts((p) => p.filter((x) => x.id !== id));
  }

  async function syncBusinessSystem() {
    try {
      setSyncingSystem(true);
      const res = await fetch("/api/business-profile/sync", { method: "POST" });
      const data = await res.json() as { ok?: boolean };
      if (!res.ok || !data.ok) throw new Error("Failed");
      await fetchProducts();
    } finally {
      setSyncingSystem(false);
    }
  }

  async function refreshBusinessSystem() {
    if (!businessProfile?.businessType) return;
    try {
      setRefreshingRecommendations(true);
      const res = await fetch("/api/business-profile/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: businessProfile.businessType,
          niche: businessProfile.niche,
          goal: businessProfile.mainGoal,
        }),
      });
      const data = await res.json() as { ok?: boolean };
      if (!res.ok || !data.ok) throw new Error("Failed");
      await fetchProducts();
    } finally {
      setRefreshingRecommendations(false);
    }
  }

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />
      <WorkspaceShell maxWidth="max-w-5xl">
        <WorkspaceHero
          eyebrow="Products"
          title="Product Intelligence Library"
          description="Capture offers from affiliate networks, Amazon, dropship sources, or direct product URLs. Save them once, then launch campaigns and sites from the same source record."
          actions={(
            <>
              <Link
                href="/settings#accounts"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.08] text-white/45 hover:text-white/70 text-xs transition"
              >
                Connect Accounts
              </Link>
              <button
                onClick={() => setTab("add")}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white text-sm font-bold hover:opacity-90 transition"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </>
          )}
          stats={products.length > 0 ? [
            { label: "Saved Products", value: products.length.toString() },
            { label: "Affiliate Ready", value: products.filter((product) => Boolean(product.affiliateUrl)).length.toString(), tone: "text-emerald-300" },
            { label: "Scanned This Session", value: scanResult ? "1" : "0", tone: "text-[#f5a623]" },
          ] : undefined}
        />

        {businessProfile && (
          <div className="mb-6 rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/35">Business OS Status</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {osStats?.osVerdict?.label && (
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${verdictTone(osStats.osVerdict.status)}`}>
                      {osStats.osVerdict.label}
                    </span>
                  )}
                  <span className="text-sm font-black text-white">{osStats?.effectiveSystemScore ?? 0}/100</span>
                  {(osStats?.unsyncedSystems?.length ?? 0) > 0 && (
                    <span className="text-xs text-amber-200/80">{osStats?.unsyncedSystems?.length} unsynced systems</span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-7 text-white/58">
                  {osStats?.osVerdict?.reason ||
                    "The product library now reads the same Business OS health layer as the rest of the app."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {(osStats?.unsyncedSystems?.length ?? 0) > 0 && (
                  <button
                    onClick={() => void syncBusinessSystem()}
                    disabled={syncingSystem}
                    className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-5 py-3 text-sm font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {syncingSystem ? "Syncing..." : "Sync My System"}
                  </button>
                )}
                {osStats?.osVerdict?.status === "stale" && (
                  <button
                    onClick={() => void refreshBusinessSystem()}
                    disabled={refreshingRecommendations}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[#f5a623]/20 bg-[#f5a623]/10 px-5 py-3 text-sm font-bold text-[#f5f0e8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {refreshingRecommendations ? "Refreshing..." : "Refresh Recommendations"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <DatabaseFallbackNotice visible={osStats?.databaseUnavailable} className="mb-6" />

        {businessProfile && (
          <div className="mb-6 rounded-[28px] border border-[#f5a623]/20 bg-gradient-to-br from-[#f5a623]/[0.08] to-[#e07850]/[0.03] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#f5a623]/70">Recommended Product Move</p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  {businessProfile.mainGoal === "more_sales" ? "Scan and launch your next revenue offer" : "Save a product and connect it to campaigns"}
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/62">
                  {businessProfile.recommendedSystems?.firstAction ||
                    businessProfile.recommendedSystems?.strategicSummary ||
                    "Use the product library as the source record for the offers your campaigns, landing pages, and sales assets should build around."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setTab("add")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#f5a623] to-[#e07850] px-5 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(245,166,35,0.22)]"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
                <Link
                  href="/my-system"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/70"
                >
                  Open My System
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {([["library", "My Products"], ["add", "Add Product"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition ${
                tab === key
                  ? "bg-white/[0.07] text-white border-white/[0.12]"
                  : "text-white/30 border-white/[0.07] hover:text-white/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Add Product tab */}
        {tab === "add" && (
          <div className="space-y-5 max-w-2xl">
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
              <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Paste Product URL</p>
              <p className="text-xs text-white/30 mb-4">
                Works with ClickBank, Amazon, AliExpress, JVZoo, WarriorPlus, Shopify stores, or any product page.
                We detect the platform, build your affiliate link, and scan the product.
              </p>
              <div className="mb-4 grid gap-2 sm:grid-cols-2">
                {([
                  ["core", "Core", "Clean extraction and launch-ready product research."],
                  ["elite", "Elite", "Sharper offer diagnosis, buyer language, and more usable hook research."],
                ] as const).map(([value, label, description]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setExecutionTier(value)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      executionTier === value
                        ? "border-[#f5a623]/25 bg-[#f5a623]/10 text-[#f5f0e8]"
                        : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:border-[#f5a623]/20 hover:bg-[#f5a623]/[0.05]"
                    }`}
                  >
                    <p className="text-sm font-black">{label}</p>
                    <p className="mt-1 text-xs leading-5 text-inherit/75">{description}</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void scanProduct()}
                  placeholder="https://clickbank.com/product... or https://amazon.com/dp/..."
                  className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#f5a623]/40 transition"
                />
                <button
                  onClick={() => void scanProduct()}
                  disabled={!url.trim() || scanning}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white text-sm font-bold hover:opacity-90 disabled:opacity-30 transition flex items-center gap-2"
                >
                  {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {scanning ? "Scanning…" : "Scan"}
                </button>
              </div>
            </div>

            {scanResult && scanResult.ok && (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 space-y-4">
                {/* Platform + affiliate URL */}
                <div className="flex items-center gap-3 flex-wrap">
                  <PlatformBadge platform={scanResult.platform} />
                  <span
                    className={`text-[10px] font-black uppercase tracking-[0.16em] px-2 py-0.5 rounded-lg border ${
                      (scanResult.executionTier ?? executionTier) === "elite"
                        ? "border-[#f5a623]/20 bg-[#f5a623]/10 text-[#f5f0e8]"
                        : "border-white/[0.08] bg-white/[0.05] text-white/50"
                    }`}
                  >
                    {(scanResult.executionTier ?? executionTier).toUpperCase()}
                  </span>
                  {scanResult.hasAffiliateId ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-xl">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <p className="text-xs font-bold text-emerald-400 truncate max-w-xs">{scanResult.affiliateUrl}</p>
                      {scanResult.affiliateUrl && <CopyBtn text={scanResult.affiliateUrl} />}
                    </div>
                  ) : scanResult.missingIdPlatform ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/[0.08] border border-amber-500/20 rounded-xl">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <p className="text-xs text-amber-400">
                        Add your {scanResult.missingIdPlatform} ID in{" "}
                        <Link href="/settings#accounts" className="underline font-bold">Settings → Accounts</Link>{" "}
                        to auto-build your affiliate link
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-white/30">Direct link (no affiliate needed)</span>
                  )}
                </div>

                {/* Product data */}
                <div>
                  <h3 className="text-base font-black text-white mb-1">{scanResult.product.name}</h3>
                  {scanResult.product.description && (
                    <p className="text-xs text-white/50 leading-relaxed mb-3">{scanResult.product.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-xs">
                    {scanResult.product.price && (
                      <span className="text-white/60"><span className="text-white/25">Price:</span> {scanResult.product.price}</span>
                    )}
                    {scanResult.product.commission && (
                      <span className="text-emerald-400/80"><span className="text-white/25">Commission:</span> {scanResult.product.commission}</span>
                    )}
                    {scanResult.product.niche && (
                      <span className="text-[#f5a623]/70 capitalize"><span className="text-white/25">Niche:</span> {scanResult.product.niche}</span>
                    )}
                  </div>
                </div>

                {scanResult.product.hooks?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">AI-Detected Hooks</p>
                    <ul className="space-y-1">
                      {scanResult.product.hooks.slice(0, 3).map((h, i) => (
                        <li key={i} className="text-xs text-white/55 flex items-start gap-1.5">
                          <span className="text-[#f5a623]/50 shrink-0">{i + 1}.</span>{h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
                  <button
                    onClick={() => void saveProduct()}
                    disabled={saving || saved}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 transition"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {saved ? "Saved!" : "Save to Library"}
                  </button>
                  <Link
                    href={`/skills?skill=ad-campaign&prefill_url=${encodeURIComponent(scanResult.affiliateUrl ?? url)}&prefill_mode=operator&execution_tier=${scanResult.executionTier ?? executionTier}`}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f5a623]/10 border border-[#f5a623]/20 text-[#f5a623] text-sm font-bold hover:bg-[#f5a623]/15 transition"
                  >
                    <Megaphone className="w-4 h-4" /> Build Campaign Now
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {scanResult && !scanResult.ok && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {scanResult.error ?? "Scan failed. Check the URL and try again."}
              </div>
            )}
          </div>
        )}

        {/* Library tab */}
        {tab === "library" && (
          <>
            {loadingProducts ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-white/20" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 text-white/20">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-bold">No products yet</p>
                <p className="text-xs mt-1 opacity-60">Add your first product using the "Add Product" tab</p>
                <button
                  onClick={() => setTab("add")}
                  className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f5a623]/10 border border-[#f5a623]/20 text-[#f5a623] text-sm font-bold hover:bg-[#f5a623]/15 transition mx-auto"
                >
                  <Plus className="w-4 h-4" /> Add First Product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} onDelete={(id) => void deleteProduct(id)} />
                ))}
              </div>
            )}
          </>
        )}
      </WorkspaceShell>
    </div>
  );
}
