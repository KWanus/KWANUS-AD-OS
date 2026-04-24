"use client";

import { useState, useEffect, use, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  Eye,
  Globe,
  Loader2,
  Plus,
  GripVertical,
  Layers,
  Settings2,
  Check,
  ExternalLink,
  Search,
  Wand2,
  Undo2,
  Redo2,
  Copy,
  Trash2,
  LayoutTemplate,
  Monitor,
  Tablet,
  Smartphone,
} from "lucide-react";
import BlockRenderer, { Block, BlockType } from "@/components/site-builder/BlockRenderer";
import BlockPropsEditor from "@/components/site-builder/BlockPropsEditor";
import WebsiteCopilotPanel from "@/components/site-builder/WebsiteCopilotPanel";
import { auditSitePage } from "@/lib/site-builder/publishAudit";
import { contextualizeBlockProps } from "@/lib/sites/smartBlockDefaults";

// ---------------------------------------------------------------------------
// Block library
// ---------------------------------------------------------------------------

const BLOCK_LIBRARY: {
  type: BlockType;
  label: string;
  emoji: string;
  category: string;
  defaultProps: Record<string, unknown>;
}[] = [
  { type: "hero",         label: "Hero",          emoji: "🎯", category: "Layout",     defaultProps: { headline: "Your Headline", subheadline: "Supporting text goes here.", buttonText: "Get Started", buttonUrl: "#", textAlign: "center", socialProofText: "Trusted by 500+ businesses", trustItems: ["No contracts", "Cancel anytime", "Results guaranteed"] } },
  { type: "features",     label: "Features",      emoji: "⚡", category: "Layout",     defaultProps: { eyebrow: "Why choose us", title: "Everything You Need", columns: 3, items: [{ icon: "⚡", title: "Fast Results", body: "See measurable improvements in days, not months." }, { icon: "🎯", title: "Laser Focused", body: "Every recommendation is tailored to your specific business." }, { icon: "💎", title: "Premium Quality", body: "World-class outputs that stand out from the competition." }] } },
  { type: "cta",          label: "Call to Action", emoji: "📣", category: "Layout",   defaultProps: { eyebrow: "Get started today", headline: "Ready to grow your business?", subheadline: "Join thousands of businesses already seeing results.", buttonText: "Get Started Free", secondaryButtonText: "See How It Works", trustItems: ["No credit card required", "Setup in 5 minutes", "Cancel anytime"] } },
  { type: "stats",        label: "Stats Bar",     emoji: "📊", category: "Layout",     defaultProps: { stats: [{ number: "500+", label: "Happy Clients" }, { number: "98%", label: "Satisfaction Rate" }, { number: "5★", label: "Average Rating" }, { number: "24h", label: "Response Time" }] } },
  { type: "process",      label: "Process Steps", emoji: "🔢", category: "Layout",     defaultProps: { eyebrow: "How it works", title: "Simple 3-Step Process", steps: [{ icon: "1", title: "Tell Us About You", body: "Share your business goals and what you want to achieve." }, { icon: "2", title: "We Build Your Strategy", body: "Our AI creates a custom growth plan tailored to your niche." }, { icon: "3", title: "Watch Results Come In", body: "Launch your campaigns and track performance in real time." }] } },
  { type: "text",         label: "Text",          emoji: "📝", category: "Content",    defaultProps: { content: "Your text content here..." } },
  { type: "image",        label: "Image",         emoji: "🖼️", category: "Content",   defaultProps: { src: "", alt: "", rounded: true } },
  { type: "video",        label: "Video",         emoji: "🎥", category: "Content",    defaultProps: { url: "" } },
  { type: "before_after", label: "Before / After", emoji: "↔️", category: "Content",  defaultProps: { title: "The Difference We Make", beforeLabel: "Without Us", afterLabel: "With Us", beforeItems: ["No online presence", "Missing leads every day", "Competitors outranking you", "Generic, forgettable brand"], afterItems: ["Professional website that converts", "Leads coming in on autopilot", "Ranking above competitors", "Memorable brand that builds trust"] } },
  { type: "testimonials", label: "Testimonials",  emoji: "💬", category: "Social",     defaultProps: { eyebrow: "Don't take our word for it", title: "Real Results From Real Clients", items: [{ name: "Sarah Johnson", role: "Owner", company: "Green Valley Spa", quote: "Within 2 weeks of launching our new site, inquiries tripled. I was skeptical but the results speak for themselves.", stars: 5, result: "+300% Leads", verified: true }, { name: "Mike Torres", role: "Founder", company: "Torres HVAC", quote: "Finally a website that actually brings in customers. Booked out 3 months ahead for the first time.", stars: 5, result: "Booked Out", verified: true }] } },
  { type: "pricing",      label: "Pricing",       emoji: "💰", category: "Social",     defaultProps: { eyebrow: "Simple, transparent pricing", title: "Choose Your Plan", tiers: [{ label: "Starter", price: "$0", period: "/mo", description: "Perfect for getting started.", features: ["1 website", "Basic analytics", "Email support"], buttonText: "Start Free" }, { label: "Growth", price: "$49", period: "/mo", description: "Everything you need to scale.", features: ["Unlimited websites", "Advanced analytics", "Priority support", "Custom domain", "AI content generation"], buttonText: "Start Growing", highlight: true, badge: "Most Popular" }, { label: "Agency", price: "$149", period: "/mo", description: "Built for agencies and power users.", features: ["Everything in Growth", "White-label reports", "Client management", "API access"], buttonText: "Go Agency" }], guarantee: "30-day money-back guarantee — no questions asked." } },
  { type: "faq",          label: "FAQ",           emoji: "❓", category: "Social",     defaultProps: { eyebrow: "Got questions?", title: "Frequently Asked Questions", items: [{ q: "How quickly will I see results?", a: "Most clients see measurable improvement within the first 2 weeks. Website traffic typically starts climbing within 30 days." }, { q: "Do I need any technical experience?", a: "None at all. Our system handles everything for you — no coding, no design skills required." }, { q: "What if I'm not satisfied?", a: "We offer a 30-day money-back guarantee. If you're not happy, we'll refund every penny — no questions asked." }], ctaText: "Still have questions?", ctaButtonText: "Chat With Us" } },
  { type: "guarantee",    label: "Guarantee",     emoji: "🛡️", category: "Social",    defaultProps: { icon: "🛡️", headline: "100% Money-Back Guarantee", body: "We're so confident in our results that we back every plan with a 30-day money-back guarantee. If you don't see improvement in your online presence, we'll refund every penny. No questions asked, no hassle." } },
  { type: "trust_badges", label: "Trust Badges",  emoji: "✅", category: "Social",     defaultProps: { title: "Trusted & Secure", badges: [{ icon: "🔒", label: "SSL Secured" }, { icon: "💳", label: "Secure Payment" }, { icon: "✅", label: "Verified Business" }, { icon: "⭐", label: "5-Star Rated" }, { icon: "🔄", label: "Money-Back" }] } },
  { type: "products",     label: "Products",      emoji: "🛍️", category: "Commerce",  defaultProps: { title: "Shop", columns: 3 } },
  { type: "checkout",     label: "Checkout",      emoji: "💳", category: "Commerce",   defaultProps: { title: "Complete Your Order", productName: "Digital Product", price: "$97.00", buttonText: "Complete Purchase →", showOrderBump: true } },
  { type: "urgency",      label: "Urgency Bar",   emoji: "🔥", category: "Utility",    defaultProps: { text: "⚡ Limited Time — Get 50% Off Today Only!", items: ["Offer ends at midnight", "Only 12 spots left"] } },
  { type: "divider",      label: "Spacer",        emoji: "⬜", category: "Utility",    defaultProps: { height: 60, showLine: false } },
  { type: "footer",       label: "Footer",        emoji: "🔻", category: "Utility",    defaultProps: { copyright: `© ${new Date().getFullYear()} All rights reserved.`, links: [{ label: "Privacy Policy", url: "#" }, { label: "Terms of Service", url: "#" }], showPoweredBy: true } },
];

const CATEGORIES = ["Layout", "Content", "Social", "Commerce", "Utility"];

// ---------------------------------------------------------------------------
// Section templates — pre-built groups of blocks
// ---------------------------------------------------------------------------

function heroTrustTemplate(): Block[] {
  return [
    {
      id: `hero-${nanoid()}`,
      type: "hero",
      props: {
        headline: "Grow Your Business With Confidence",
        subheadline: "Join hundreds of businesses already seeing real results.",
        buttonText: "Get Started",
        buttonUrl: "#",
        textAlign: "center",
        socialProofText: "Trusted by 500+ businesses",
        trustItems: ["No contracts", "Cancel anytime", "Results guaranteed"],
      },
    },
    {
      id: `trust_badges-${nanoid()}`,
      type: "trust_badges",
      props: {
        title: "Why Businesses Trust Us",
        badges: [
          { icon: "👥", label: "500+ Clients" },
          { icon: "⭐", label: "4.9\u2605 Rating" },
          { icon: "📅", label: "Since 2020" },
          { icon: "🔒", label: "SSL Secured" },
          { icon: "🔄", label: "Money-Back Guarantee" },
        ],
      },
    },
  ];
}

function featuresGridTemplate(): Block[] {
  return [
    {
      id: `features-${nanoid()}`,
      type: "features",
      props: {
        eyebrow: "Why choose us",
        title: "Everything You Need to Succeed",
        columns: 3,
        items: [
          { icon: "🚀", title: "Lightning Fast Setup", body: "Go from sign-up to live in under 10 minutes. No technical skills required." },
          { icon: "📊", title: "Real-Time Analytics", body: "Track every visitor, click, and conversion with our built-in dashboard." },
          { icon: "🎯", title: "Targeted Campaigns", body: "Reach the right audience at the right time with AI-powered targeting." },
        ],
      },
    },
  ];
}

function testimonialCtaTemplate(): Block[] {
  return [
    {
      id: `testimonials-${nanoid()}`,
      type: "testimonials",
      props: {
        eyebrow: "Don't take our word for it",
        title: "What Our Clients Say",
        items: [
          {
            name: "Jessica Martin",
            role: "Owner",
            company: "Bloom Beauty Studio",
            quote: "We doubled our bookings in the first month. The ROI has been incredible — I wish we started sooner.",
            stars: 5,
            result: "+200% Bookings",
            verified: true,
          },
          {
            name: "David Chen",
            role: "Founder",
            company: "Chen Legal Group",
            quote: "Our website finally converts. We went from 2 inquiries a week to 15. Game changer for our firm.",
            stars: 5,
            result: "7x More Leads",
            verified: true,
          },
        ],
      },
    },
    {
      id: `cta-${nanoid()}`,
      type: "cta",
      props: {
        eyebrow: "Ready to see results like these?",
        headline: "Start Growing Your Business Today",
        subheadline: "Join thousands of businesses already seeing results.",
        buttonText: "Get Started Free",
        secondaryButtonText: "See How It Works",
        trustItems: ["No credit card required", "Setup in 5 minutes", "Cancel anytime"],
      },
    },
  ];
}

function faqSectionTemplate(): Block[] {
  return [
    {
      id: `faq-${nanoid()}`,
      type: "faq",
      props: {
        eyebrow: "Got questions?",
        title: "Frequently Asked Questions",
        items: [
          { q: "How quickly will I see results?", a: "Most clients see measurable improvement within the first 2 weeks. Website traffic typically starts climbing within 30 days." },
          { q: "Do I need any technical experience?", a: "None at all. Our system handles everything for you — no coding, no design skills required." },
          { q: "What if I'm not satisfied?", a: "We offer a 30-day money-back guarantee. If you're not happy, we'll refund every penny — no questions asked." },
          { q: "Can I cancel at any time?", a: "Absolutely. There are no long-term contracts or hidden fees. Cancel with one click whenever you want." },
        ],
        ctaText: "Still have questions?",
        ctaButtonText: "Chat With Us",
      },
    },
  ];
}

function pricingTableTemplate(): Block[] {
  return [
    {
      id: `pricing-${nanoid()}`,
      type: "pricing",
      props: {
        eyebrow: "Simple, transparent pricing",
        title: "Choose Your Plan",
        tiers: [
          {
            label: "Starter",
            price: "$29",
            period: "/mo",
            description: "Perfect for small businesses getting started.",
            features: ["1 website", "Basic analytics", "Email support", "Custom domain", "SSL included"],
            buttonText: "Start Free Trial",
          },
          {
            label: "Pro",
            price: "$79",
            period: "/mo",
            description: "Everything you need to scale and grow.",
            features: ["Unlimited websites", "Advanced analytics", "Priority support", "Custom domain", "AI content generation", "A/B testing", "API access"],
            buttonText: "Go Pro",
            highlight: true,
            badge: "Most Popular",
          },
        ],
        guarantee: "30-day money-back guarantee — no questions asked.",
      },
    },
  ];
}

const SECTION_TEMPLATES: {
  id: string;
  label: string;
  description: string;
  emoji: string;
  factory: () => Block[];
}[] = [
  { id: "hero-trust",       label: "Hero + Trust",       description: "Hero section with trust badges",            emoji: "🎯", factory: heroTrustTemplate },
  { id: "features-grid",    label: "Features Grid",      description: "3-column feature highlights",               emoji: "⚡", factory: featuresGridTemplate },
  { id: "testimonial-cta",  label: "Testimonial + CTA",  description: "Client quotes with call to action",        emoji: "💬", factory: testimonialCtaTemplate },
  { id: "faq-section",      label: "FAQ Section",        description: "4 common questions pre-filled",             emoji: "❓", factory: faqSectionTemplate },
  { id: "pricing-table",    label: "Pricing Table",      description: "Starter + Pro tiers pre-configured",        emoji: "💰", factory: pricingTableTemplate },
];

// ---------------------------------------------------------------------------
// Sortable block row (in left panel)
// ---------------------------------------------------------------------------

function SortableBlockRow({
  block,
  selected,
  onClick,
  onDuplicate,
  onDelete,
}: {
  block: Block;
  selected: boolean;
  onClick: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const lib = BLOCK_LIBRARY.find((b) => b.type === block.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all ${
        selected ? "bg-[#f5a623]/15 border border-[#f5a623]/30" : "hover:bg-white/[0.04] border border-transparent"
      }`}
    >
      <span {...attributes} {...listeners} className="text-white/20 hover:text-white/50 cursor-grab active:cursor-grabbing shrink-0">
        <GripVertical className="w-3.5 h-3.5" />
      </span>
      <span className="text-base leading-none shrink-0">{lib?.emoji ?? "\uD83D\uDCE6"}</span>
      <span className={`text-xs font-semibold truncate flex-1 ${selected ? "text-white" : "text-white/55"}`}>{lib?.label ?? block.type}</span>
      <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          title="Duplicate block"
          className="p-1 rounded-md text-white/25 hover:text-[#f5a623] hover:bg-[#f5a623]/10 transition"
        >
          <Copy className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete block"
          className="p-1 rounded-md text-white/25 hover:text-red-400 hover:bg-red-500/10 transition"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page editor
// ---------------------------------------------------------------------------

interface SitePage {
  id: string;
  title: string;
  slug: string;
  blocks: Block[];
  published: boolean;
  seoTitle?: string;
  seoDesc?: string;
}

interface Site {
  id: string;
  name: string;
  slug: string;
  theme: Record<string, unknown>;
  published: boolean;
  pages: Array<{ id: string; title: string; slug: string }>;
}

type GenerationContext = {
  sourceMode?: string;
  sourceUrl?: string;
  niche?: string;
  location?: string;
  templateId?: string;
  pageType?: string;
  executionTier?: "core" | "elite";
  blueprintScore?: { overall?: number };
  conversionNotes?: {
    primary_goal?: string;
    trust_elements_used?: string[];
    objections_addressed?: string[];
  };
  generationTrace?: {
    template_reason?: string;
    analysis_summary?: string[];
  };
};

function nanoid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function PageEditorPage({ params }: { params: Promise<{ id: string; pageId: string }> }) {
  const { id: siteId, pageId } = use(params);
  const router = useRouter();

  const [site, setSite] = useState<Site | null>(null);
  const [page, setPage] = useState<SitePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"blocks" | "add" | "seo">("blocks");
  const [rightTab, setRightTab] = useState<"properties" | "copilot">("copilot");
  const [seoSaving, setSeoSaving] = useState(false);
  const [autoFillingSeo, setAutoFillingSeo] = useState(false);
  const [addCategory, setAddCategory] = useState("Layout");
  const [previewMode, setPreviewMode] = useState(false);
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [publishing, setPublishing] = useState(false);
  const [queuedCopilotInstruction, setQueuedCopilotInstruction] = useState<{ id: number; text: string } | null>(null);
  const [bizData, setBizData] = useState<{
    businessName?: string; niche?: string; audience?: string;
    painPoint?: string; outcome?: string; offer?: string;
    pricing?: string; guarantee?: string; location?: string;
  } | null>(null);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const [history, setHistory] = useState<Block[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load
  useEffect(() => {
    async function load() {
      try {
        const [siteRes, pagesRes] = await Promise.all([
          fetch(`/api/sites/${siteId}`),
          fetch(`/api/sites/${siteId}`),
        ]);
        const siteData = await siteRes.json() as { ok: boolean; site?: { id: string; name: string; slug: string; theme: Record<string, unknown>; published: boolean; pages: SitePage[] } };
        if (siteData.ok && siteData.site) {
          setSite(siteData.site);
          const p = siteData.site.pages.find((pg) => pg.id === pageId);
          if (p) {
            setPage({
              ...p,
              blocks: (p.blocks as unknown as Block[]) ?? [],
            });
          }
        }
      } catch { /* non-fatal */ }
      finally { setLoading(false); }
    }
    void load();

    // Load business context from deployment (for smart block defaults)
    fetch(`/api/sites/${siteId}/analytics`)
      .then((r) => r.json())
      .then((data: { ok?: boolean; analytics?: { deployment?: { version?: number } } }) => {
        if (!data.ok) return;
        // Also try loading from campaign's businessContext
        return fetch(`/api/himalaya/prompts?siteId=${siteId}`).catch(() => null);
      })
      .catch(() => null);

    // Try loading business profile as fallback
    fetch("/api/business-profile")
      .then((r) => r.json())
      .then((data: { ok?: boolean; profile?: { businessName?: string; niche?: string; targetAudience?: string; mainOffer?: string; location?: string } }) => {
        if (data.ok && data.profile) {
          setBizData({
            businessName: data.profile.businessName ?? undefined,
            niche: data.profile.niche ?? undefined,
            audience: data.profile.targetAudience ?? undefined,
            offer: data.profile.mainOffer ?? undefined,
            location: data.profile.location ?? undefined,
          });
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, pageId]);

  // Auto-save with debounce
  const scheduleSave = useCallback(
    (blocks: Block[]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setSaving(true);
        try {
          await fetch(`/api/sites/${siteId}/pages/${pageId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ blocks }),
          });
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        } finally {
          setSaving(false);
        }
      }, 800);
    },
    [siteId, pageId]
  );

  function pushHistory(newBlocks: Block[]) {
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, newBlocks];
    });
    setHistoryIndex((prev) => prev + 1);
  }

  function undo() {
    if (historyIndex <= 0) return;
    const prevIndex = historyIndex - 1;
    const prevBlocks = history[prevIndex];
    if (!prevBlocks) return;
    setHistoryIndex(prevIndex);
    setPage((prev) => prev ? { ...prev, blocks: prevBlocks } : prev);
    scheduleSave(prevBlocks);
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    const nextBlocks = history[nextIndex];
    if (!nextBlocks) return;
    setHistoryIndex(nextIndex);
    setPage((prev) => prev ? { ...prev, blocks: nextBlocks } : prev);
    scheduleSave(nextBlocks);
  }

  function updateBlocks(blocks: Block[]) {
    setPage((prev) => prev ? { ...prev, blocks } : prev);
    pushHistory(blocks);
    scheduleSave(blocks);
  }

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyIndex, history]);

  function addBlock(type: BlockType) {
    const lib = BLOCK_LIBRARY.find((b) => b.type === type);
    const baseProps = { ...(lib?.defaultProps ?? {}) };
    // Contextualize with business data if available
    const smartProps = bizData
      ? contextualizeBlockProps(type, baseProps, bizData)
      : baseProps;
    const newBlock: Block = {
      id: `${type}-${nanoid()}`,
      type,
      props: smartProps,
    };
    const next = page ? [...page.blocks, newBlock] : [newBlock];
    updateBlocks(next);
    setSelectedId(newBlock.id);
    setTab("blocks");
  }

  function addTemplate(factory: () => Block[]) {
    const newBlocks = factory().map((b) => {
      const baseProps = { ...b.props };
      const smartProps = bizData
        ? contextualizeBlockProps(b.type as BlockType, baseProps, bizData)
        : baseProps;
      return { ...b, props: smartProps };
    });
    const next = page ? [...page.blocks, ...newBlocks] : [...newBlocks];
    updateBlocks(next);
    if (newBlocks.length > 0) setSelectedId(newBlocks[0].id);
    setTab("blocks");
  }

  function updateBlock(updated: Block) {
    if (!page) return;
    const next = page.blocks.map((b) => (b.id === updated.id ? updated : b));
    updateBlocks(next);
    setPage((prev) => prev ? { ...prev, blocks: next } : prev);
  }

  function deleteBlock(id: string) {
    if (!page) return;
    const next = page.blocks.filter((b) => b.id !== id);
    updateBlocks(next);
    setSelectedId(null);
  }

  function duplicateBlock(blockId: string) {
    if (!page) return;
    const block = page.blocks.find((b) => b.id === blockId);
    if (!block) return;
    const newBlock: Block = { ...block, id: `${block.type}-${nanoid()}`, props: { ...block.props } };
    const idx = page.blocks.findIndex((b) => b.id === blockId);
    const updated = [...page.blocks];
    updated.splice(idx + 1, 0, newBlock);
    updateBlocks(updated);
    setSelectedId(newBlock.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !page) return;
    const oldIndex = page.blocks.findIndex((b) => b.id === active.id);
    const newIndex = page.blocks.findIndex((b) => b.id === over.id);
    const next = arrayMove(page.blocks, oldIndex, newIndex);
    updateBlocks(next);
  }

  async function togglePublish() {
    if (!site) return;
    setPublishing(true);
    try {
      await fetch(`/api/sites/${siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !site.published }),
      });
      setSite((prev) => prev ? { ...prev, published: !prev.published } : prev);
    } finally {
      setPublishing(false);
    }
  }

  async function saveSeo(fields: { seoTitle?: string; seoDesc?: string }) {
    if (!page) return;
    setSeoSaving(true);
    try {
      await fetch(`/api/sites/${siteId}/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      setPage((prev) => prev ? { ...prev, ...fields } : prev);
    } finally {
      setSeoSaving(false);
    }
  }

  async function applyLaunchBasics() {
    setAutoFillingSeo(true);
    try {
      const response = await fetch(`/api/sites/${siteId}/launch-basics`, { method: "POST" });
      const data = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Failed to generate SEO");
      }

      const siteResponse = await fetch(`/api/sites/${siteId}`);
      const siteData = await siteResponse.json() as { ok: boolean; site?: { id: string; name: string; slug: string; theme: Record<string, unknown>; published: boolean; pages: SitePage[] } };
      if (siteData.ok && siteData.site) {
        setSite(siteData.site);
        const refreshedPage = siteData.site.pages.find((candidate) => candidate.id === pageId);
        if (refreshedPage) {
          setPage({
            ...refreshedPage,
            blocks: (refreshedPage.blocks as unknown as Block[]) ?? [],
          });
        }
      }
    } finally {
      setAutoFillingSeo(false);
    }
  }

  async function saveTheme(themeFields: Record<string, unknown>) {
    if (!site) return;
    const newTheme = { ...site.theme, ...themeFields };
    await fetch(`/api/sites/${siteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: newTheme }),
    });
    setSite((prev) => prev ? { ...prev, theme: newTheme } : prev);
  }

  async function saveShellTheme(shellFields: Record<string, unknown>) {
    if (!site) return;
    const currentShell = (site.theme.shell as Record<string, unknown> | undefined) ?? {};
    await saveTheme({
      shell: {
        ...currentShell,
        ...shellFields,
      },
    });
  }

  async function createPageFromTemplate(title: string, blocks: Block[]) {
    const response = await fetch(`/api/sites/${siteId}/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const data = await response.json() as { ok: boolean; page?: SitePage; error?: string };
    if (!data.ok || !data.page) {
      throw new Error(data.error ?? "Failed to create page");
    }

    await fetch(`/api/sites/${siteId}/pages/${data.page.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });

    router.push(`/websites/${siteId}/editor/${data.page.id}`);
  }

  function queueCopilotInstruction(text: string) {
    setRightTab("copilot");
    setQueuedCopilotInstruction({ id: Date.now(), text });
  }

  const selectedBlock = page?.blocks.find((b) => b.id === selectedId) ?? null;
  const theme = site?.theme ?? {};
  const shellTheme = (theme.shell as {
    navLabels?: Record<string, string>;
    headerCtaLabel?: string;
    headerCtaHref?: string;
    footerDescription?: string;
    footerLinks?: Array<{ label?: string; url?: string }>;
  } | undefined) ?? {};
  const generationContext = (theme.generation as GenerationContext | undefined) ?? null;

  if (loading) {
    return (
      <div className="min-h-screen bg-t-bg flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
      </div>
    );
  }

  if (!site || !page) {
    return (
      <div className="min-h-screen bg-t-bg flex items-center justify-center">
        <p className="text-white/30">Page not found.</p>
      </div>
    );
  }

  const pageAudit = auditSitePage({
    id: page.id,
    title: page.title,
    slug: page.slug,
    published: true,
    blocks: page.blocks,
    seoTitle: page.seoTitle,
    seoDesc: page.seoDesc,
  });

  return (
    <div className="h-screen bg-t-bg flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="h-12 shrink-0 bg-[#07101f] border-b border-white/[0.07] flex items-center px-4 gap-3 z-10">
        <button onClick={() => router.push(`/websites/${siteId}`)} className="flex items-center gap-1.5 text-white/30 hover:text-white/60 transition shrink-0">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="text-xs font-medium hidden sm:block">{site.name}</span>
        </button>
        <span className="text-white/10">|</span>
        <span className="text-sm font-black text-white/70 truncate">{page.title}</span>

        <div className="flex-1" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Undo (Cmd+Z)"
            className="p-1.5 rounded-lg text-white/30 hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed transition"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Redo (Cmd+Shift+Z)"
            className="p-1.5 rounded-lg text-white/30 hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed transition"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Save indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          {saving && <><Loader2 className="w-3 h-3 text-white/30 animate-spin" /><span className="text-[11px] text-white/25">Saving…</span></>}
          {saved && <><Check className="w-3 h-3 text-green-400" /><span className="text-[11px] text-green-400/70">Saved</span></>}
        </div>

        {/* Preview toggle + responsive breakpoints */}
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${previewMode ? "bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/30" : "bg-white/[0.05] text-white/40 hover:text-white/60 border border-white/[0.08]"}`}
        >
          <Eye className="w-3.5 h-3.5" />
          Preview
        </button>

        {previewMode && (
          <div className="flex items-center gap-0.5 shrink-0">
            {([
              ["desktop", Monitor, "Desktop (1200px)"] as const,
              ["tablet", Tablet, "Tablet (768px)"] as const,
              ["mobile", Smartphone, "Mobile (375px)"] as const,
            ]).map(([key, Icon, title]) => (
              <button
                key={key}
                onClick={() => setPreviewWidth(key)}
                title={title}
                className={`p-1.5 rounded-lg transition-all ${
                  previewWidth === key
                    ? "bg-[#f5a623]/20 text-[#f5a623]"
                    : "text-white/30 hover:text-white/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        )}

        {/* Publish */}
        <button
          onClick={() => void togglePublish()}
          disabled={publishing}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
            site.published
              ? "bg-green-500/15 text-green-300 border border-green-500/30 hover:bg-red-500/15 hover:text-red-300 hover:border-red-500/30"
              : "bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white hover:opacity-90"
          }`}
        >
          {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
          {site.published ? "Published" : "Publish"}
        </button>

        {/* View live */}
        {site.published && (
          <a href={`/s/${site.slug}`} target="_blank" rel="noreferrer" className="p-1.5 rounded-xl border border-white/[0.08] hover:bg-white/[0.05] text-white/30 hover:text-white/60 transition">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </header>

      {!previewMode && (
        <div className="shrink-0 border-b border-white/[0.07] bg-[#081120] px-4 py-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#f5a623]/80">Publish Readiness</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <p className="text-lg font-black text-white">{pageAudit.score}/100</p>
                <p className="text-xs text-white/35">
                  {pageAudit.blockCount} blocks ·
                  {pageAudit.seoReady ? " SEO ready" : " SEO missing"} ·
                  {pageAudit.hasPrimaryCta ? " CTA ready" : " CTA missing"} ·
                  {pageAudit.hasTrust ? " trust ready" : " trust missing"}
                </p>
              </div>
              <p className="mt-1 text-xs leading-5 text-white/45">
                {pageAudit.issues[0] ?? "This page has the key conversion ingredients in place."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {!pageAudit.hasPrimaryCta && (
                <button
                  onClick={() => queueCopilotInstruction("add a stronger CTA section to this page")}
                  className="rounded-xl border border-[#f5a623]/25 bg-[#f5a623]/10 px-3 py-2 text-[11px] font-black text-[#f5a623]"
                >
                  Add CTA
                </button>
              )}
              {!pageAudit.hasTrust && (
                <button
                  onClick={() => queueCopilotInstruction("add trust proof to this page")}
                  className="rounded-xl border border-[#f5a623]/25 bg-[#f5a623]/10 px-3 py-2 text-[11px] font-black text-[#f5a623]"
                >
                  Add Trust
                </button>
              )}
              {!pageAudit.hasFaq && (
                <button
                  onClick={() => queueCopilotInstruction("add faq to this page")}
                  className="rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2 text-[11px] font-black text-white/75"
                >
                  Add FAQ
                </button>
              )}
              {!pageAudit.seoReady && (
                <button
                  onClick={() => setTab("seo")}
                  className="rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2 text-[11px] font-black text-white/75"
                >
                  Fix SEO
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main 3-panel layout */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!previewMode && pageAudit && (
          <div className="shrink-0 border-b border-white/[0.07] bg-[#060d19] px-4 py-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[#f5a623]/20 bg-[#f5a623]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#f5a623]">
                  Page Readiness
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-white">{pageAudit.score}</span>
                  <span className="text-xs font-bold text-white/35">/ 100</span>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                  pageAudit.score >= 80
                    ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                    : pageAudit.score >= 60
                      ? "border border-amber-500/20 bg-amber-500/10 text-amber-100"
                      : "border border-red-500/20 bg-red-500/10 text-red-200"
                }`}>
                  {pageAudit.score >= 80 ? "Strong" : pageAudit.score >= 60 ? "Needs Work" : "Critical"}
                </span>
                <span className="text-xs text-white/35">
                  {pageAudit.blockCount} blocks · {pageAudit.seoReady ? "SEO ready" : "SEO missing"} · {pageAudit.hasPrimaryCta ? "CTA ready" : "CTA missing"} · {pageAudit.hasTrust ? "Trust ready" : "Trust missing"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {!pageAudit.seoReady && (
                  <button
                    onClick={() => setTab("seo")}
                    className="rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2 text-[11px] font-black text-white/75"
                  >
                    Fix SEO
                  </button>
                )}
                {!pageAudit.hasTrust && (
                  <button
                    onClick={() => queueCopilotInstruction("improve trust on this page")}
                    className="rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/10 px-3 py-2 text-[11px] font-black text-[#f5a623]"
                  >
                    Add Trust
                  </button>
                )}
                {!pageAudit.hasPrimaryCta && (
                  <button
                    onClick={() => queueCopilotInstruction("add a stronger CTA to this page")}
                    className="rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/10 px-3 py-2 text-[11px] font-black text-[#f5a623]"
                  >
                    Add CTA
                  </button>
                )}
                {!pageAudit.hasHero && (
                  <button
                    onClick={() => queueCopilotInstruction("add or improve the hero section on this page")}
                    className="rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/10 px-3 py-2 text-[11px] font-black text-[#f5a623]"
                  >
                    Improve Hero
                  </button>
                )}
              </div>
            </div>
            {pageAudit.issues.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {pageAudit.issues.slice(0, 3).map((issue) => (
                  <span key={issue} className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1 text-[11px] text-white/60">
                    {issue}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">

        {/* Left panel — block list + add */}
        {!previewMode && (
          <aside className="w-56 shrink-0 border-r border-white/[0.07] flex flex-col bg-[#07101f]">
            {/* Tabs */}
            <div className="flex border-b border-white/[0.07] shrink-0">
              {([["blocks", Layers, "Layers"] as const, ["add", Plus, "Add"] as const, ["seo", Search, "SEO"] as const]).map(([key, Icon, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key as "blocks" | "add" | "seo")}
                  className={`flex-1 flex items-center justify-center gap-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                    tab === key ? "text-[#f5a623] border-b-2 border-[#f5a623]" : "text-white/25 hover:text-white/50"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>

            {tab === "blocks" && (
              <div className="flex-1 overflow-y-auto p-2">
                {page.blocks.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-xs text-white/25 mb-3">No blocks yet</p>
                    <button onClick={() => setTab("add")} className="text-[11px] text-[#f5a623] hover:text-[#f5a623] font-bold">+ Add your first block</button>
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={page.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                      {page.blocks.map((block) => (
                        <SortableBlockRow
                          key={block.id}
                          block={block}
                          selected={selectedId === block.id}
                          onClick={() => setSelectedId(block.id === selectedId ? null : block.id)}
                          onDuplicate={() => duplicateBlock(block.id)}
                          onDelete={() => deleteBlock(block.id)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            )}

            {tab === "add" && (
              <div className="flex-1 overflow-y-auto">
                {/* Section templates */}
                <div className="p-2 border-b border-white/[0.05]">
                  <div className="flex items-center gap-1.5 px-1 pb-1.5">
                    <LayoutTemplate className="w-3 h-3 text-[#f5a623]/60" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#f5a623]/60">Templates</p>
                  </div>
                  <div className="space-y-1">
                    {SECTION_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => addTemplate(tpl.factory)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#f5a623]/[0.08] border border-transparent hover:border-[#f5a623]/20 text-left transition-all group"
                      >
                        <span className="text-lg leading-none shrink-0">{tpl.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white/70 group-hover:text-white transition truncate">{tpl.label}</p>
                          <p className="text-[10px] text-white/25 group-hover:text-white/40 transition truncate">{tpl.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Category filter */}
                <div className="flex gap-1 p-2 flex-wrap shrink-0 border-b border-white/[0.05]">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setAddCategory(cat)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${addCategory === cat ? "bg-[#f5a623]/20 text-[#f5a623]" : "text-white/30 hover:text-white/50"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="p-2 space-y-1">
                  {BLOCK_LIBRARY.filter((b) => b.category === addCategory).map((b) => (
                    <button
                      key={b.type}
                      onClick={() => addBlock(b.type)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] text-left transition-all group"
                    >
                      <span className="text-xl">{b.emoji}</span>
                      <div>
                        <p className="text-xs font-bold text-white/60 group-hover:text-white transition">{b.label}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {tab === "seo" && (
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/25 px-1 pt-1">Page SEO</p>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/25">SEO Title</label>
                  <input
                    type="text"
                    value={page.seoTitle ?? ""}
                    onChange={(e) => setPage((prev) => prev ? { ...prev, seoTitle: e.target.value } : prev)}
                    placeholder={page.title}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition"
                  />
                  <p className="text-[9px] text-white/20">{(page.seoTitle ?? "").length}/60 chars</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/25">Meta Description</label>
                  <textarea
                    value={page.seoDesc ?? ""}
                    onChange={(e) => setPage((prev) => prev ? { ...prev, seoDesc: e.target.value } : prev)}
                    placeholder="Brief description for search results…"
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition resize-none"
                  />
                  <p className="text-[9px] text-white/20">{(page.seoDesc ?? "").length}/160 chars</p>
                </div>

                <button
                  onClick={() => void saveSeo({ seoTitle: page.seoTitle, seoDesc: page.seoDesc })}
                  disabled={seoSaving}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#f5a623]/15 border border-[#f5a623]/25 text-[#f5a623] text-[11px] font-bold hover:bg-[#f5a623]/25 transition disabled:opacity-40"
                >
                  {seoSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Save SEO
                </button>

                <button
                  onClick={() => void applyLaunchBasics()}
                  disabled={autoFillingSeo}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/70 text-[11px] font-bold hover:bg-white/[0.06] transition disabled:opacity-40"
                >
                  {autoFillingSeo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  Auto-Fill Launch SEO
                </button>

                <div className="border-t border-white/[0.06] pt-4 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/25">Theme</p>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/20">Accent Color</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={(site.theme.primaryColor as string) ?? "#f5a623"}
                        onChange={(e) => setSite((prev) => prev ? { ...prev, theme: { ...prev.theme, primaryColor: e.target.value } } : prev)}
                        onBlur={(e) => void saveTheme({ primaryColor: e.target.value })}
                        className="w-8 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                      />
                      <span className="text-[11px] text-white/30 font-mono">{(site.theme.primaryColor as string) ?? "#f5a623"}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/20">Mode</label>
                    <div className="flex gap-1">
                      {(["dark", "light"] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => void saveTheme({ mode: m })}
                          className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold capitalize border transition ${
                            (site.theme.mode ?? "dark") === m
                              ? "bg-[#f5a623]/20 border-[#f5a623]/30 text-[#f5a623]"
                              : "border-white/[0.08] text-white/30 hover:text-white/50"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/20">Font</label>
                    <div className="flex gap-1">
                      {(["inter", "system"] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => void saveTheme({ font: f })}
                          className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold capitalize border transition ${
                            (site.theme.font ?? "inter") === f
                              ? "bg-[#f5a623]/20 border-[#f5a623]/30 text-[#f5a623]"
                              : "border-white/[0.08] text-white/30 hover:text-white/50"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/[0.06] pt-4 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/25">Public Shell</p>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/20">Header CTA Label</label>
                      <input
                        type="text"
                        value={shellTheme.headerCtaLabel ?? ""}
                        onChange={(e) => setSite((prev) => prev ? {
                          ...prev,
                          theme: {
                            ...prev.theme,
                            shell: {
                              ...(((prev.theme.shell as Record<string, unknown> | undefined) ?? {})),
                              headerCtaLabel: e.target.value,
                            },
                          },
                        } : prev)}
                        onBlur={(e) => void saveShellTheme({ headerCtaLabel: e.target.value })}
                        placeholder="Book Now"
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/20">Header CTA URL</label>
                      <input
                        type="text"
                        value={shellTheme.headerCtaHref ?? ""}
                        onChange={(e) => setSite((prev) => prev ? {
                          ...prev,
                          theme: {
                            ...prev.theme,
                            shell: {
                              ...(((prev.theme.shell as Record<string, unknown> | undefined) ?? {})),
                              headerCtaHref: e.target.value,
                            },
                          },
                        } : prev)}
                        onBlur={(e) => void saveShellTheme({ headerCtaHref: e.target.value })}
                        placeholder="#contact"
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/20">Footer Description</label>
                      <textarea
                        rows={3}
                        value={shellTheme.footerDescription ?? ""}
                        onChange={(e) => setSite((prev) => prev ? {
                          ...prev,
                          theme: {
                            ...prev.theme,
                            shell: {
                              ...(((prev.theme.shell as Record<string, unknown> | undefined) ?? {})),
                              footerDescription: e.target.value,
                            },
                          },
                        } : prev)}
                        onBlur={(e) => void saveShellTheme({ footerDescription: e.target.value })}
                        placeholder="Built as a multi-page conversion site with connected navigation."
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Nav Labels</p>
                      {site.pages.map((sitePage) => (
                        <div key={sitePage.id} className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-white/20">{sitePage.slug}</label>
                          <input
                            type="text"
                            value={shellTheme.navLabels?.[sitePage.slug] ?? ""}
                            onChange={(e) => {
                              const nextNavLabels = {
                                ...(shellTheme.navLabels ?? {}),
                                [sitePage.slug]: e.target.value,
                              };
                              setSite((prev) => prev ? {
                                ...prev,
                                theme: {
                                  ...prev.theme,
                                  shell: {
                                    ...(((prev.theme.shell as Record<string, unknown> | undefined) ?? {})),
                                    navLabels: nextNavLabels,
                                  },
                                },
                              } : prev);
                            }}
                            onBlur={(e) => void saveShellTheme({
                              navLabels: {
                                ...(shellTheme.navLabels ?? {}),
                                [sitePage.slug]: e.target.value,
                              },
                            })}
                            placeholder={sitePage.title}
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Footer Links</p>
                      {[0, 1].map((index) => {
                        const footerLink = shellTheme.footerLinks?.[index] ?? {};
                        return (
                          <div key={index} className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={footerLink.label ?? ""}
                              onChange={(e) => {
                                const nextFooterLinks = [...(shellTheme.footerLinks ?? [])];
                                nextFooterLinks[index] = { ...nextFooterLinks[index], label: e.target.value };
                                setSite((prev) => prev ? {
                                  ...prev,
                                  theme: {
                                    ...prev.theme,
                                    shell: {
                                      ...(((prev.theme.shell as Record<string, unknown> | undefined) ?? {})),
                                      footerLinks: nextFooterLinks,
                                    },
                                  },
                                } : prev);
                              }}
                              onBlur={(e) => {
                                const nextFooterLinks = [...(shellTheme.footerLinks ?? [])];
                                nextFooterLinks[index] = { ...nextFooterLinks[index], label: e.target.value };
                                void saveShellTheme({ footerLinks: nextFooterLinks });
                              }}
                              placeholder={`Link ${index + 1} label`}
                              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition"
                            />
                            <input
                              type="text"
                              value={footerLink.url ?? ""}
                              onChange={(e) => {
                                const nextFooterLinks = [...(shellTheme.footerLinks ?? [])];
                                nextFooterLinks[index] = { ...nextFooterLinks[index], url: e.target.value };
                                setSite((prev) => prev ? {
                                  ...prev,
                                  theme: {
                                    ...prev.theme,
                                    shell: {
                                      ...(((prev.theme.shell as Record<string, unknown> | undefined) ?? {})),
                                      footerLinks: nextFooterLinks,
                                    },
                                  },
                                } : prev);
                              }}
                              onBlur={(e) => {
                                const nextFooterLinks = [...(shellTheme.footerLinks ?? [])];
                                nextFooterLinks[index] = { ...nextFooterLinks[index], url: e.target.value };
                                void saveShellTheme({ footerLinks: nextFooterLinks });
                              }}
                              placeholder="/privacy"
                              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Google preview */}
                <div className="border border-white/[0.06] rounded-xl p-3 space-y-1 bg-white/[0.01]">
                  <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-2">Google Preview</p>
                  <p className="text-[13px] font-semibold text-blue-400 truncate">{page.seoTitle || page.title}</p>
                  <p className="text-[10px] text-green-500/70 truncate">himalaya.app/s/{site.slug}</p>
                  <p className="text-[10px] text-white/30 leading-snug line-clamp-2">{page.seoDesc || "No description set."}</p>
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Center — canvas */}
        <main className="flex-1 overflow-y-auto bg-[#040810]">
          {page.blocks.length === 0 && !previewMode ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#f5a623]/15 to-[#e07850]/15 border border-white/10 flex items-center justify-center text-3xl mb-5">🏗️</div>
              <h2 className="text-xl font-black text-white mb-2">Start building</h2>
              <p className="text-sm text-white/35 max-w-xs mb-6">Add blocks from the left panel to start designing your page.</p>
              <button onClick={() => setTab("add")} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white text-sm font-bold hover:opacity-90 transition">
                <Plus className="w-4 h-4" /> Add First Block
              </button>
            </div>
          ) : (
            <div className={`min-h-full ${previewMode && previewWidth !== "desktop" ? "flex justify-center" : ""}`}>
              <div
                className={`min-h-full ${previewMode && previewWidth !== "desktop" ? "border-x border-white/[0.08] shadow-2xl" : ""}`}
                style={{
                  fontFamily: (theme.font as string) === "inter" ? "Inter, sans-serif" : "inherit",
                  maxWidth: previewMode
                    ? previewWidth === "tablet" ? "768px" : previewWidth === "mobile" ? "375px" : "100%"
                    : undefined,
                  width: previewMode && previewWidth !== "desktop" ? "100%" : undefined,
                  transition: "max-width 0.3s ease",
                }}
              >
                {page.blocks.map((block) => (
                  <BlockRenderer
                    key={block.id}
                    block={block}
                    theme={theme as { primaryColor?: string; font?: string; mode?: "dark" | "light" }}
                    preview={!previewMode}
                    selected={selectedId === block.id && !previewMode}
                    overlayActions={selectedId === block.id && !previewMode ? [
                      { label: "Regenerate", onClick: () => queueCopilotInstruction(`regenerate this ${block.type} section`) },
                      { label: "Improve Copy", onClick: () => queueCopilotInstruction(`improve the copy in this ${block.type} section`) },
                      { label: "Swap Variant", onClick: () => queueCopilotInstruction(`swap the variant of this ${block.type} section while keeping its goal`) },
                    ] : undefined}
                    onClick={() => !previewMode && setSelectedId(block.id === selectedId ? null : block.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Right panel — properties */}
        {!previewMode && (
          <aside className="w-64 shrink-0 border-l border-white/[0.07] bg-[#07101f] overflow-hidden flex flex-col">
            <div className="flex border-b border-white/[0.07] shrink-0">
              {([
                ["copilot", Search, "Copilot"] as const,
                ["properties", Settings2, "Properties"] as const,
              ]).map(([key, Icon, label]) => (
                <button
                  key={key}
                  onClick={() => setRightTab(key)}
                  className={`flex-1 flex items-center justify-center gap-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                    rightTab === key ? "text-[#f5a623] border-b-2 border-[#f5a623]" : "text-white/25 hover:text-white/50"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>

            {rightTab === "copilot" ? (
              <WebsiteCopilotPanel
                siteId={siteId}
                pageId={pageId}
                siteName={site.name}
                pageTitle={page.title}
                blocks={page.blocks}
                selectedBlock={selectedBlock}
                published={site.published}
                queuedInstruction={queuedCopilotInstruction}
                generationContext={generationContext}
                onApplyBlocks={updateBlocks}
                onCreatePageFromTemplate={createPageFromTemplate}
              />
            ) : selectedBlock ? (
              <BlockPropsEditor
                block={selectedBlock}
                onChange={updateBlock}
                onDelete={() => deleteBlock(selectedBlock.id)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <Settings2 className="w-8 h-8 text-white/15 mb-3" />
                <p className="text-xs text-white/25 font-semibold">Click a block to edit its properties</p>
              </div>
            )}
          </aside>
        )}
        </div>
      </div>
    </div>
  );
}
