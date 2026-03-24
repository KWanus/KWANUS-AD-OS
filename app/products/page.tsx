"use client";

import { useState, useEffect } from "react";
import AppNav from "@/components/AppNav";
import Link from "next/link";
import {
  Search, Loader2, Plus, Copy, CheckCircle, Trash2,
  Megaphone, Globe, AlertCircle, Zap, Package, ArrowRight, Link2,
} from "lucide-react";

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
};

type ScanResult = {
  ok: boolean;
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
  warriorplus: { emoji: "⚔️", label: "WarriorPlus",  color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  cj:          { emoji: "🔗", label: "CJ/ShareASale", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  dropship:    { emoji: "🚢", label: "Dropship",     color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
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
  const launchUrl = (skill: string) => {
    const u = product.affiliateUrl ?? product.productUrl;
    return `/skills?skill=${skill}&prefill_url=${encodeURIComponent(u)}&prefill_mode=operator`;
  };

  return (
    <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 hover:border-white/[0.12] transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black text-white truncate">{product.name}</h3>
          <div className="flex flex-wrap gap-2 mt-1.5">
            <PlatformBadge platform={product.platform} />
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
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-bold hover:bg-cyan-500/15 transition"
        >
          <Megaphone className="w-3 h-3" /> Ad Campaign
        </Link>
        <Link
          href={launchUrl("landing-page")}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[11px] font-bold hover:bg-purple-500/15 transition"
        >
          <Globe className="w-3 h-3" /> Build Site
        </Link>
        <Link
          href={`/scan?url=${encodeURIComponent(product.productUrl)}&mode=operator`}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/[0.03] border border-white/[0.07] text-white/30 text-[11px] font-bold hover:text-white/60 transition"
        >
          <Search className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [tab, setTab] = useState<"library" | "add">("library");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function fetchProducts() {
    const res = await fetch("/api/products");
    const data = await res.json() as { ok: boolean; products: Product[] };
    if (data.ok) setProducts(data.products);
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
      body: JSON.stringify({ url: url.trim() }),
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
        scanData: scanResult.product,
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

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-20">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-black text-white">Product Library</h1>
            </div>
            <p className="text-sm text-white/35">ClickBank · Amazon · Dropship · JVZoo · WarriorPlus · Any URL</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/settings#accounts"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] text-white/30 hover:text-white/60 text-xs transition"
            >
              Connect Accounts
            </Link>
            <button
              onClick={() => setTab("add")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
        </div>

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
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void scanProduct()}
                  placeholder="https://clickbank.com/product... or https://amazon.com/dp/..."
                  className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-cyan-500/40 transition"
                />
                <button
                  onClick={() => void scanProduct()}
                  disabled={!url.trim() || scanning}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 disabled:opacity-30 transition flex items-center gap-2"
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
                      <span className="text-cyan-400/70 capitalize"><span className="text-white/25">Niche:</span> {scanResult.product.niche}</span>
                    )}
                  </div>
                </div>

                {scanResult.product.hooks?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">AI-Detected Hooks</p>
                    <ul className="space-y-1">
                      {scanResult.product.hooks.slice(0, 3).map((h, i) => (
                        <li key={i} className="text-xs text-white/55 flex items-start gap-1.5">
                          <span className="text-cyan-400/50 shrink-0">{i + 1}.</span>{h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
                  <button
                    onClick={() => void saveProduct()}
                    disabled={saving || saved}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 transition"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {saved ? "Saved!" : "Save to Library"}
                  </button>
                  <Link
                    href={`/skills?skill=ad-campaign&prefill_url=${encodeURIComponent(scanResult.affiliateUrl ?? url)}&prefill_mode=operator`}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-bold hover:bg-cyan-500/15 transition"
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
                  className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-bold hover:bg-cyan-500/15 transition mx-auto"
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
      </div>
    </div>
  );
}
