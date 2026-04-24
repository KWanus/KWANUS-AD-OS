"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Zap, ArrowRight, Loader2, Check, Globe, Briefcase,
  ShoppingBag, Users, TrendingUp, Sparkles, Target,
  Mail, Layout, FileText, Package, Search,
} from "lucide-react";
import { PRODUCT_LIBRARY, type ProductEntry, type Niche } from "@/lib/data/productLibrary";

type BusinessType = "consultant" | "ecommerce" | "service" | "affiliate" | "agency";

const NICHES: { key: Niche; label: string; emoji: string }[] = [
  { key: "home-kitchen",     label: "Home & Kitchen",     emoji: "🏠" },
  { key: "pet",              label: "Pet",                emoji: "🐾" },
  { key: "health-wellness",  label: "Health & Wellness",  emoji: "💊" },
  { key: "beauty-grooming",  label: "Beauty & Grooming",  emoji: "✨" },
  { key: "fitness-posture",  label: "Fitness & Posture",  emoji: "💪" },
  { key: "outdoor-survival", label: "Outdoor & Survival", emoji: "🏕️" },
];

// ── Consultant niches ─────────────────────────────────────────────────────────
const CONSULTANT_NICHES = [
  { key: "business",       label: "Business & Marketing",  emoji: "📈", offer: "Scale to $10k/mo+", audience: "Entrepreneurs 0–$5k/mo" },
  { key: "health",         label: "Health & Fitness",      emoji: "💪", offer: "Lose 20lbs in 90 days", audience: "Adults 30–55 wanting transformation" },
  { key: "relationships",  label: "Relationships",          emoji: "❤️", offer: "Date confidently", audience: "Singles 25–45" },
  { key: "career",         label: "Career & Finance",       emoji: "💼", offer: "Land a $100k+ job", audience: "Professionals 22–40" },
  { key: "mindset",        label: "Life & Mindset",         emoji: "🧠", offer: "Build your dream life", audience: "High-achievers 28–45" },
  { key: "realestate",     label: "Real Estate",            emoji: "🏡", offer: "Close your first deal", audience: "Aspiring investors 25–50" },
];

const CONSULTANT_FORMATS = [
  { key: "1on1",    label: "1-on-1 Coaching",   emoji: "🎯", price: "$1,500–$5,000/mo",  cta: "Book a Free Strategy Call" },
  { key: "group",   label: "Group Program",      emoji: "👥", price: "$497–$2,000",        cta: "Apply for the Program" },
  { key: "course",  label: "Online Course",      emoji: "🎓", price: "$297–$997",          cta: "Enroll Now" },
  { key: "dfy",     label: "Done-For-You",        emoji: "⚙️", price: "$3,000–$15,000",    cta: "Get a Free Audit" },
];

// ── Local service types ───────────────────────────────────────────────────────
const SERVICE_TYPES = [
  { key: "roofing",     label: "Roofing",           emoji: "🏠", hook: "Top-rated roofer serving [City]", cta: "Get a Free Roof Inspection" },
  { key: "plumbing",    label: "Plumbing",           emoji: "🔧", hook: "24/7 emergency plumber near you", cta: "Call Now — Same-Day Service" },
  { key: "hvac",        label: "HVAC / Heating & AC",emoji: "❄️", hook: "AC repair done right the first time", cta: "Schedule a Free Estimate" },
  { key: "dental",      label: "Dentist",            emoji: "🦷", hook: "Trusted family dentistry in [City]", cta: "Book Your Appointment" },
  { key: "realestate",  label: "Real Estate Agent",  emoji: "🏡", hook: "Sell your home for top dollar — guaranteed", cta: "Get a Free Home Valuation" },
  { key: "landscaping", label: "Landscaping / Lawn", emoji: "🌿", hook: "Lawn care that makes your neighbors jealous", cta: "Get a Free Quote Today" },
  { key: "cleaning",    label: "Cleaning Service",   emoji: "✨", hook: "Professional cleaning — spotless, every time", cta: "Book Your First Clean" },
  { key: "auto",        label: "Auto Repair",        emoji: "🚗", hook: "Honest auto repair — no surprises, no runaround", cta: "Schedule Service" },
];

// ── Agency focuses ────────────────────────────────────────────────────────────
const AGENCY_FOCUSES = [
  { key: "webdesign",   label: "Website Design",      emoji: "🌐", pitch: "We build high-converting sites that get clients", deliverable: "5-page site in 2 weeks" },
  { key: "ads",         label: "Paid Ads Management", emoji: "🎯", pitch: "We run Meta and Google ads that actually convert", deliverable: "$10k+ ROAS in 90 days" },
  { key: "social",      label: "Social Media Growth", emoji: "📱", pitch: "We grow your brand and generate leads on autopilot", deliverable: "10,000 followers in 60 days" },
  { key: "seo",         label: "SEO & Content",       emoji: "📈", pitch: "We rank you #1 on Google for your top keywords", deliverable: "Page 1 in 90 days" },
  { key: "email",       label: "Email Marketing",     emoji: "📧", pitch: "We build email systems that generate revenue on autopilot", deliverable: "$5k/mo from email in 60 days" },
  { key: "fullservice", label: "Full-Service Agency",  emoji: "⚡", pitch: "Your complete marketing department — ads, site, email, all of it", deliverable: "Full system live in 30 days" },
];

const BUSINESS_TYPES: { key: BusinessType; label: string; desc: string; icon: React.ElementType; color: string }[] = [
  { key: "consultant",  label: "Consultant / Coach",      desc: "You sell expertise, programs, or 1:1 services",          icon: Briefcase,   color: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30" },
  { key: "ecommerce",   label: "E-Commerce / Brand",      desc: "You sell physical or digital products",                  icon: ShoppingBag, color: "from-purple-500/20 to-purple-500/5 border-purple-500/30" },
  { key: "service",     label: "Local Service Business",  desc: "Roofer, plumber, dentist, real estate, etc.",            icon: Globe,       color: "from-amber-500/20 to-amber-500/5 border-amber-500/30" },
  { key: "affiliate",   label: "Affiliate / Dropship",    desc: "You promote others' products or run dropship stores",    icon: TrendingUp,  color: "from-green-500/20 to-green-500/5 border-green-500/30" },
  { key: "agency",      label: "Agency / Freelancer",     desc: "You manage marketing/clients for other businesses",      icon: Users,       color: "from-pink-500/20 to-pink-500/5 border-pink-500/30" },
];

interface GeneratedResult {
  campaignId?: string;
  siteId?: string;
  sitePageId?: string;
  siteSlug?: string;
  flowId?: string;
  score?: number;
  verdict?: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [businessUrl, setBusinessUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [error, setError] = useState("");

  async function skipForNow() {
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingCompleted: true }),
      });
    } finally {
      router.push("/");
    }
  }

  // ── Affiliate/Dropship states ─────────────────────────────────────────────
  const [hasProduct, setHasProduct] = useState<"yes" | "no" | null>(null);
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductEntry | null>(null);
  const nicheProducts = selectedNiche
    ? PRODUCT_LIBRARY.filter((p) => p.niche === selectedNiche).sort((a, b) => b.beginnerScore - a.beginnerScore).slice(0, 4)
    : [];

  // ── Consultant/Coach states ───────────────────────────────────────────────
  const [hasOffer, setHasOffer] = useState<"yes" | "no" | null>(null);
  const [selectedConsultantNiche, setSelectedConsultantNiche] = useState<typeof CONSULTANT_NICHES[0] | null>(null);
  const [selectedConsultantFormat, setSelectedConsultantFormat] = useState<typeof CONSULTANT_FORMATS[0] | null>(null);

  // ── Local Service states ──────────────────────────────────────────────────
  const [hasSite, setHasSite] = useState<"yes" | "no" | null>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<typeof SERVICE_TYPES[0] | null>(null);

  // ── Agency states ─────────────────────────────────────────────────────────
  const [hasClientOrFocus, setHasClientOrFocus] = useState<"yes" | "no" | null>(null);
  const [selectedAgencyFocus, setSelectedAgencyFocus] = useState<typeof AGENCY_FOCUSES[0] | null>(null);

  async function handleGenerate() {
    if (!businessType) return;
    setGenerating(true);
    setError("");

    // Default name if they left it blank — use selected product name for affiliate path
    const resolvedName = businessName.trim() ||
      (selectedProduct ? selectedProduct.name : null) ||
      (selectedConsultantNiche ? `${selectedConsultantNiche.label} Coaching` : null) ||
      (selectedServiceType ? selectedServiceType.label : null) ||
      (selectedAgencyFocus ? `${selectedAgencyFocus.label} Agency` : null) ||
      `My ${BUSINESS_TYPES.find(b => b.key === businessType)?.label ?? "Business"}`;

    try {
      setProgress("Saving your business profile...");
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceName: resolvedName,
          businessUrl: businessUrl.trim() || undefined,
          businessType,
        }),
      });

      const generated: GeneratedResult = {};

      if (selectedProduct) {
        // ── Product Library path (affiliate/dropship, no URL yet) ──────────────
        setProgress("Building your campaign from product data...");
        const p = selectedProduct;
        const hooks = [
          { format: "Primary Hook", hook: p.marketing.primaryHook },
          ...p.marketing.creativeAnglesAvailable.map((angle, i) => ({
            format: `Angle ${i + 2}: ${angle}`,
            hook: `${angle} — ${p.marketing.audienceSummary.split(".")[0]}. Here's how to use it.`,
          })),
        ];
        const campaignRes = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${p.name} — Launch`,
            mode: "operator",
            productName: p.name,
            assets: {
              adHooks: hooks,
              landingPage: {
                headline: `The ${p.name} Everyone's Talking About`,
                subheadline: p.description,
                ctaCopy: `Get Yours — $${p.pricing.sellingPriceRecommended}`,
                urgencyLine: `Limited stock. Ships in ${p.shipping.estimatedDaysMin}–${p.shipping.estimatedDaysMax} days.`,
                benefitBullets: p.marketing.creativeAnglesAvailable.slice(0, 3),
                trustBar: ["Free Shipping", "30-Day Returns", "Secure Checkout", "5★ Reviews"],
              },
              emailSequences: {
                welcome: [
                  {
                    subject: `Your ${p.name} is on its way to changing things`,
                    preview: `Here's what to expect...`,
                    body: `Hey {{first_name}},\n\nWelcome — you made a great call.\n\nYour ${p.name} ships in ${p.shipping.estimatedDaysMin}–${p.shipping.estimatedDaysMax} business days.\n\nIn the meantime, here's the exact way to get the most out of it:\n\n${p.marketing.bestAngle}\n\nIf you have any questions just hit reply — we're real people.\n\nTalk soon,\nThe Team`,
                    timing: "Immediately",
                  },
                ],
              },
              executionChecklist: {
                day1: [
                  `Set up CJ Dropshipping / AliExpress account and find: "${p.searchTermCJ}"`,
                  `Target audience: ${p.marketing.audienceSummary}`,
                  `Start with $${p.marketing.startingBudgetPerDay}/day ad spend`,
                  `Film the primary hook: "${p.marketing.primaryHook}"`,
                ],
                day2: [`Launch first ad on ${p.marketing.bestPlatform.join(", ")}`, "Monitor CPM, CTR, hold rate"],
                day3: ["Review results. Kill anything with CTR < 1.5%", "Scale winners 2x budget"],
              },
            },
          }),
        });
        const campaignData = await campaignRes.json() as { ok: boolean; campaign?: { id: string } };
        if (campaignData.ok && campaignData.campaign) {
          generated.campaignId = campaignData.campaign.id;
          generated.score = Math.round(p.beginnerScore * 10);
          generated.verdict = p.beginnerScore >= 8 ? "Strong" : "Good";
        }
      } else if (selectedConsultantNiche && selectedConsultantFormat) {
        // ── Consultant guided path (no URL) ───────────────────────────────────
        setProgress("Building your coaching campaign...");
        const n = selectedConsultantNiche;
        const f = selectedConsultantFormat;
        const campaignRes = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${n.label} — ${f.label}`,
            mode: "consultant",
            productName: `${f.label}: ${n.offer}`,
            assets: {
              adHooks: [
                { format: "Primary Hook", hook: `Are you a ${n.audience.split(" ")[0].toLowerCase()} still stuck? Here's why — and what to do instead.` },
                { format: "Identity Shift", hook: `There are two types of ${n.audience.split(" ")[0].toLowerCase()}s: those who figure it out alone, and those who get a coach. The difference is everything.` },
                { format: "Result Hook", hook: `${n.offer} — without the guesswork. Here's exactly what the process looks like.` },
                { format: "Future Pace", hook: `Imagine waking up 90 days from now and ${n.offer.toLowerCase()}. That's what we build together.` },
              ],
              landingPage: {
                headline: n.offer,
                subheadline: `For ${n.audience} who are done doing it alone and ready for a proven system.`,
                ctaCopy: f.cta,
                urgencyLine: `Only ${f.key === "1on1" ? "3" : "10"} spots available this month.`,
                benefitBullets: [`Personalized strategy for your exact situation`, `${f.label} format — move fast, get results`, `Proven system: ${n.offer}`],
                trustBar: ["Results Guaranteed", "Proven System", "Real Support", "Limited Spots"],
              },
              emailSequences: {
                welcome: [
                  { subject: `Welcome — here's what happens next`, preview: "Your journey starts here.", body: `Hey {{first_name}},\n\nYou took the right step.\n\nHere's what to expect:\n\n1. We'll review your application within 24 hours\n2. If it's a fit, we'll schedule your free strategy call\n3. On the call, we'll map out your exact path to: ${n.offer}\n\nNo pressure, no pitch — just a real conversation about your goals.\n\nTalk soon,\n[Your Name]`, timing: "Immediately" },
                ],
              },
              executionChecklist: {
                day1: [`Set up your booking link (Calendly or similar)`, `Post your first hook: "Are you a ${n.audience.split(" ")[0].toLowerCase()} still stuck at [pain point]?"`, `DM 10 people in your network about ${f.label}`],
                day2: [`Run first ad to booking page with $${f.key === "1on1" ? 30 : 20}/day budget`, `Post a case study or result (even a mini win counts)`],
                day3: [`Follow up with anyone who engaged`, `Review: how many calls booked vs. how many shown?`],
              },
            },
          }),
        });
        const campaignData = await campaignRes.json() as { ok: boolean; campaign?: { id: string } };
        if (campaignData.ok && campaignData.campaign) {
          generated.campaignId = campaignData.campaign.id;
          generated.score = 78;
          generated.verdict = "Strong";
        }
      } else if (selectedServiceType && hasSite === "no") {
        // ── Local service guided path (no site yet) ───────────────────────────
        setProgress("Building your local service campaign...");
        const s = selectedServiceType;
        const campaignRes = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${s.label} — Local Launch`,
            mode: "consultant",
            productName: s.label,
            assets: {
              adHooks: [
                { format: "Local Hero Hook", hook: s.hook },
                { format: "Problem Hook", hook: `Still waiting on that other ${s.label.toLowerCase()} company to call you back? Here's why we're different.` },
                { format: "Trust Hook", hook: `We've served [City] for [X] years. Here's what our customers say — and why they never call anyone else.` },
                { format: "Offer Hook", hook: `Free estimate. No obligation. No pressure. Just honest ${s.label.toLowerCase()} from people who care.` },
              ],
              landingPage: {
                headline: s.hook,
                subheadline: `Licensed, insured, and trusted by [City] homeowners. Fast response, transparent pricing, guaranteed quality.`,
                ctaCopy: s.cta,
                urgencyLine: `Serving [Your City]. Limited slots this week.`,
                benefitBullets: ["Fast response time — same day available", "Fully licensed & insured", "Upfront pricing, no surprises"],
                trustBar: ["Licensed & Insured", "5★ Rated", "Same-Day Available", "Free Estimates"],
              },
              emailSequences: {
                welcome: [
                  { subject: `Your ${s.label.toLowerCase()} request received`, preview: "We'll be in touch shortly.", body: `Hi {{first_name}},\n\nThanks for reaching out!\n\nWe received your request and will contact you within the hour.\n\nWhat to expect:\n• A quick call to understand your needs\n• A free, no-obligation estimate\n• A clear timeline with no surprises\n\nIf it's urgent, call us directly at [PHONE].\n\n— The Team`, timing: "Immediately" },
                ],
              },
              executionChecklist: {
                day1: [`Create Google Business Profile (free — most important for local SEO)`, `Set up the landing page and test the contact form`, `Post in 3 local Facebook groups about your service`],
                day2: [`Run Google Local Service Ads ($15/day to start)`, `Ask your last 5 customers to leave a Google review`],
                day3: [`Check calls/leads from Google ads`, `Follow up with any leads who didn't book`],
              },
            },
          }),
        });
        const campaignData = await campaignRes.json() as { ok: boolean; campaign?: { id: string } };
        if (campaignData.ok && campaignData.campaign) {
          generated.campaignId = campaignData.campaign.id;
          generated.score = 72;
          generated.verdict = "Good";
        }
      } else if (selectedAgencyFocus && hasClientOrFocus === "no") {
        // ── Agency guided path (no client/focus yet) ──────────────────────────
        setProgress("Building your agency launch campaign...");
        const a = selectedAgencyFocus;
        const campaignRes = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${a.label} Agency — Client Acquisition`,
            mode: "consultant",
            productName: a.label,
            assets: {
              adHooks: [
                { format: "Proof Hook", hook: a.pitch },
                { format: "Deliverable Hook", hook: `${a.deliverable} — guaranteed, or you don't pay. Here's the exact system.` },
                { format: "Call-Out Hook", hook: `Are you a business owner spending money on ${a.label.toLowerCase()} and not seeing results? Here's why, and what to do instead.` },
                { format: "Case Study Hook", hook: `Here's how we helped [Client] get [Result] using our ${a.label.toLowerCase()} system — step by step.` },
              ],
              landingPage: {
                headline: a.pitch,
                subheadline: `We don't talk about results. We deliver them. ${a.deliverable} — or we work for free.`,
                ctaCopy: "Book a Free Strategy Call",
                urgencyLine: "We only work with 5 clients at a time. 2 slots left.",
                benefitBullets: [`Specialized in ${a.label.toLowerCase()}`, "Performance-based pricing available", a.deliverable],
                trustBar: ["Results-Driven", "No Long Contracts", "Transparent Reporting", "Proven System"],
              },
              emailSequences: {
                welcome: [
                  { subject: `Your free strategy call is confirmed`, preview: "Here's what we'll cover.", body: `Hey {{first_name}},\n\nYou're booked — here's what to expect on the call:\n\n1. A review of your current ${a.label.toLowerCase()} situation\n2. We'll identify your biggest growth gap\n3. We'll show you exactly how we'd fix it\n\nNo pitch unless it makes sense for you.\n\nSee you soon,\n[Your Name]`, timing: "Immediately" },
                ],
              },
              executionChecklist: {
                day1: [`Build your portfolio page (even 1-2 case studies or speculative work)`, `Reach out to 20 local businesses via LinkedIn/email/DM about ${a.label.toLowerCase()}`, `Post one piece of value content showing your expertise`],
                day2: [`Follow up with anyone who opened/engaged`, `Run a $20/day ad to book a free "audit" call`],
                day3: [`Deliver a quick audit for interested leads (20 min call)`, `Present a paid proposal at the end of each audit`],
              },
            },
          }),
        });
        const campaignData = await campaignRes.json() as { ok: boolean; campaign?: { id: string } };
        if (campaignData.ok && campaignData.campaign) {
          generated.campaignId = campaignData.campaign.id;
          generated.score = 75;
          generated.verdict = "Strong";
        }
      } else if (businessUrl.trim()) {
        // ── URL analysis path (existing flow) ─────────────────────────────────
        setProgress("Scanning your business...");
        const analyzeRes = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: businessUrl.trim(), mode: "operator" }),
        });
        const analyzeData = await analyzeRes.json() as {
          ok: boolean;
          analysis?: { id?: string; score?: number; verdict?: string };
        };

        if (analyzeData.ok && analyzeData.analysis) {
          generated.score = analyzeData.analysis.score;
          generated.verdict = analyzeData.analysis.verdict;

          setProgress("Creating your campaign workspace...");
          if (analyzeData.analysis.id) {
            const campaignRes = await fetch("/api/campaigns", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: `${resolvedName} — Launch`,
                mode: businessType === "consultant" || businessType === "agency" ? "consultant" : "operator",
                productUrl: businessUrl.trim(),
                analysisRunId: analyzeData.analysis.id,
              }),
            });
            const campaignData = await campaignRes.json() as { ok: boolean; campaign?: { id: string } };
            if (campaignData.ok && campaignData.campaign) {
              generated.campaignId = campaignData.campaign.id;
            }
          }
        }
      }

      // Auto-create a site with golden funnel template
      setProgress("Building your site...");
      const siteRes = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: resolvedName,
          template: businessType === "ecommerce" || businessType === "affiliate" ? "store" : "golden",
          campaignId: generated.campaignId,
        }),
      });
      const siteData = await siteRes.json() as {
        ok: boolean;
        site?: { id: string; slug: string; pages: { id: string }[] };
      };
      if (siteData.ok && siteData.site) {
        generated.siteId = siteData.site.id;
        generated.siteSlug = siteData.site.slug;
        generated.sitePageId = siteData.site.pages[0]?.id;
      }

      // Auto-create a welcome email flow
      setProgress("Setting up email automation...");
      const flowRes = await fetch("/api/email-flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${resolvedName} — Welcome Series`,
          trigger: "signup",
          nodes: [
            { id: "start", type: "trigger", position: { x: 250, y: 0 }, data: { label: "New Subscriber", trigger: "signup" } },
            {
              id: "email-1", type: "email", position: { x: 250, y: 120 },
              data: {
                label: "Welcome Email",
                subject: `Welcome to ${resolvedName}!`,
                body: `Hey {{first_name}},\n\nWelcome! We're so glad you're here.\n\nHere's what you can expect from us: valuable insights, exclusive offers, and content that actually helps your business grow.\n\nIf you have any questions, just reply to this email.\n\nTalk soon,\nThe ${resolvedName} Team`,
              },
            },
            {
              id: "delay-1", type: "delay", position: { x: 250, y: 240 },
              data: { label: "Wait 3 days", days: 3 },
            },
            {
              id: "email-2", type: "email", position: { x: 250, y: 360 },
              data: {
                label: "Follow-up",
                subject: `Quick check-in from ${resolvedName}`,
                body: `Hey {{first_name}},\n\nJust checking in — how are things going?\n\nWe'd love to know what you're working on. Hit reply and let us know!\n\nBest,\nThe ${resolvedName} Team`,
              },
            },
          ],
          edges: [
            { id: "e1", source: "start", target: "email-1" },
            { id: "e2", source: "email-1", target: "delay-1" },
            { id: "e3", source: "delay-1", target: "email-2" },
          ],
        }),
      });
      const flowData = await flowRes.json() as { ok: boolean; flow?: { id: string } };
      if (flowData.ok && flowData.flow) {
        generated.flowId = flowData.flow.id;
      }

      // Mark onboarding complete
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingCompleted: true }),
      });

      setResult(generated);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
      setProgress("");
    }
  }

  return (
    <div className="min-h-screen bg-[#020509] text-white flex flex-col items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/4 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.4)]">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-lg font-black text-white leading-none">Himalaya</p>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">Marketing OS</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2">
            {([1, 2, 3] as const).map((s) => (
              <div key={s} className={`w-2 h-2 rounded-full transition-all ${step >= s ? "bg-cyan-400 w-6" : "bg-white/15"}`} />
            ))}
          </div>
        </div>

        {/* Step 1 — Business type */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-black text-center mb-2">What best describes your business?</h1>
            <p className="text-white/40 text-sm text-center mb-8">We&apos;ll personalize everything for you.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BUSINESS_TYPES.map((bt) => (
                <button
                  key={bt.key}
                  onClick={() => setBusinessType(bt.key)}
                  className={`relative text-left p-4 rounded-2xl border bg-gradient-to-br transition-all ${businessType === bt.key ? bt.color : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.16]"}`}
                >
                  <div className="flex items-start gap-3">
                    <bt.icon className="w-5 h-5 mt-0.5 shrink-0 text-white/60" />
                    <div>
                      <p className="text-sm font-bold text-white">{bt.label}</p>
                      <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{bt.desc}</p>
                    </div>
                    {businessType === bt.key && (
                      <Check className="w-4 h-4 text-cyan-400 ml-auto shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-6 flex flex-col items-center gap-3">
              <button
                onClick={() => businessType && setStep(2)}
                disabled={!businessType}
                className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-black hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>

              {/* Not sure escape hatch */}
              <button
                onClick={() => router.push("/copilot?onboarding=1")}
                className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition py-2 px-4 rounded-xl hover:bg-white/[0.04]"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400/60" />
                Not sure yet? Talk to Himalaya Copilot →
              </button>

              <button
                onClick={() => void skipForNow()}
                className="text-xs text-white/25 hover:text-white/50 transition py-1"
              >
                Skip setup for now
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Business details */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-black text-center mb-2">
              {businessType === "affiliate"   ? "Let's find your product"
               : businessType === "consultant" ? "Let's build your offer"
               : businessType === "service"    ? "Let's set up your business"
               : businessType === "agency"     ? "Let's define your agency"
               : "Almost there"}
            </h1>
            <p className="text-white/40 text-sm text-center mb-8">
              {businessType === "affiliate"   ? "Don't worry if you don't have one yet — we'll help you pick a winner."
               : businessType === "consultant" ? "No offer yet? No problem — we'll help you define it."
               : businessType === "service"    ? "No website yet? We'll build one for you automatically."
               : businessType === "agency"     ? "No clients yet? We'll build your acquisition system from scratch."
               : "URL is optional — we'll fill in smart defaults."}
            </p>

            {/* ── AFFILIATE / DROPSHIP FORK ─────────────────────────────────── */}
            {businessType === "affiliate" && (
              <>
                {/* Have a product? */}
                {hasProduct === null && (
                  <div className="space-y-3 mb-6">
                    <p className="text-xs font-black uppercase tracking-widest text-white/30 mb-4">Do you already have a product in mind?</p>
                    <button
                      onClick={() => setHasProduct("yes")}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-cyan-500/40 hover:bg-cyan-500/5 transition text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center shrink-0">
                        <Search className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Yes — I have a URL or product in mind</p>
                        <p className="text-xs text-white/35 mt-0.5">Paste a link to your product, a competitor, or a ClickBank / Amazon offer</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setHasProduct("no")}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-green-500/40 hover:bg-green-500/5 transition text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/20 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">No — help me find a winning product</p>
                        <p className="text-xs text-white/35 mt-0.5">Pick from our curated library of beginner-friendly dropship products with proven ad angles</p>
                      </div>
                    </button>
                  </div>
                )}

                {/* No product → show niche + product picker */}
                {hasProduct === "no" && (
                  <div className="space-y-5 mb-6">
                    {/* Niche selector */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Pick a niche</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {NICHES.map((n) => (
                          <button
                            key={n.key}
                            onClick={() => { setSelectedNiche(n.key); setSelectedProduct(null); }}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition ${
                              selectedNiche === n.key
                                ? "bg-green-500/15 border-green-500/40 text-white"
                                : "border-white/[0.08] text-white/40 hover:border-white/20 hover:text-white/70"
                            }`}
                          >
                            <span className="text-base">{n.emoji}</span>
                            {n.label}
                            {selectedNiche === n.key && <Check className="w-3.5 h-3.5 text-green-400 ml-auto" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Product cards */}
                    {selectedNiche && nicheProducts.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">
                          Top picks in this niche
                        </p>
                        <div className="space-y-2.5">
                          {nicheProducts.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => setSelectedProduct(p)}
                              className={`w-full text-left p-4 rounded-2xl border transition ${
                                selectedProduct?.id === p.id
                                  ? "border-cyan-500/50 bg-cyan-500/10"
                                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-bold text-white">{p.name}</p>
                                    <span className="text-[10px] bg-green-500/15 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-md font-bold shrink-0">
                                      {p.beginnerScore}/10
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2">{p.marketing.primaryHook}</p>
                                  <div className="flex items-center gap-3 mt-2">
                                    <span className="text-[10px] text-white/30">
                                      Sell: <span className="text-white/60">${p.pricing.sellingPriceRecommended}</span>
                                    </span>
                                    <span className="text-[10px] text-white/30">
                                      Margin: <span className="text-green-400">${p.pricing.grossMarginAtRecommended}/unit</span>
                                    </span>
                                    <span className="text-[10px] text-white/30">
                                      Budget: <span className="text-white/60">${p.marketing.startingBudgetPerDay}/day</span>
                                    </span>
                                  </div>
                                  <div className="flex gap-1 mt-2 flex-wrap">
                                    {p.marketing.bestPlatform.map((pl) => (
                                      <span key={pl} className="text-[9px] uppercase tracking-wider bg-white/5 border border-white/[0.06] text-white/30 px-1.5 py-0.5 rounded">
                                        {pl}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                {selectedProduct?.id === p.id && (
                                  <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center shrink-0 mt-1">
                                    <Check className="w-3.5 h-3.5 text-white" />
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setHasProduct(null)}
                      className="text-[11px] text-white/25 hover:text-white/50 transition"
                    >
                      ← I actually have a product URL
                    </button>
                  </div>
                )}

                {/* Has product → URL input */}
                {hasProduct === "yes" && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">
                        Product / Offer URL
                      </label>
                      <input
                        type="url"
                        value={businessUrl}
                        onChange={(e) => setBusinessUrl(e.target.value)}
                        placeholder="https://amazon.com/dp/... or https://clickbank.com/..."
                        autoFocus
                        className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
                      />
                      <p className="text-[10px] text-white/25 mt-1.5">
                        Works with: Amazon, ClickBank, AliExpress, Shopify, any competitor page
                      </p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">
                        Store / Brand Name <span className="normal-case font-normal text-white/20">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="My Store"
                        className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
                      />
                    </div>
                    <button
                      onClick={() => setHasProduct(null)}
                      className="text-[11px] text-white/25 hover:text-white/50 transition"
                    >
                      ← I don&apos;t have a product yet
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── CONSULTANT / COACH ──────────────────────────────────────── */}
            {businessType === "consultant" && (
              <>
                {hasOffer === null && (
                  <div className="space-y-3 mb-6">
                    <p className="text-xs font-black uppercase tracking-widest text-white/30 mb-4">Do you have an offer or program defined?</p>
                    <button onClick={() => setHasOffer("yes")} className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-cyan-500/40 hover:bg-cyan-500/5 transition text-left">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center shrink-0"><Briefcase className="w-5 h-5 text-cyan-400" /></div>
                      <div>
                        <p className="text-sm font-bold text-white">Yes — I have an offer or website</p>
                        <p className="text-xs text-white/35 mt-0.5">Enter your landing page, booking link, or course URL</p>
                      </div>
                    </button>
                    <button onClick={() => setHasOffer("no")} className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-purple-500/40 hover:bg-purple-500/5 transition text-left">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5 text-purple-400" /></div>
                      <div>
                        <p className="text-sm font-bold text-white">No — help me build my coaching offer</p>
                        <p className="text-xs text-white/35 mt-0.5">Pick your niche and format — we&apos;ll generate your funnel, scripts, and email system</p>
                      </div>
                    </button>
                  </div>
                )}

                {hasOffer === "no" && (
                  <div className="space-y-5 mb-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Your coaching niche</p>
                      <div className="grid grid-cols-2 gap-2">
                        {CONSULTANT_NICHES.map((n) => (
                          <button key={n.key} onClick={() => setSelectedConsultantNiche(n)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition ${selectedConsultantNiche?.key === n.key ? "bg-purple-500/15 border-purple-500/40 text-white" : "border-white/[0.08] text-white/40 hover:border-white/20 hover:text-white/70"}`}>
                            <span className="text-base">{n.emoji}</span>{n.label}
                            {selectedConsultantNiche?.key === n.key && <Check className="w-3.5 h-3.5 text-purple-400 ml-auto" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    {selectedConsultantNiche && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Your offer format</p>
                        <div className="grid grid-cols-2 gap-2">
                          {CONSULTANT_FORMATS.map((f) => (
                            <button key={f.key} onClick={() => setSelectedConsultantFormat(f)}
                              className={`flex flex-col gap-1 p-3 rounded-xl border text-left transition ${selectedConsultantFormat?.key === f.key ? "bg-cyan-500/15 border-cyan-500/40" : "border-white/[0.08] hover:border-white/20"}`}>
                              <div className="flex items-center justify-between">
                                <span className="text-base">{f.emoji}</span>
                                {selectedConsultantFormat?.key === f.key && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                              </div>
                              <p className="text-xs font-bold text-white">{f.label}</p>
                              <p className="text-[10px] text-white/35">{f.price}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedConsultantNiche && selectedConsultantFormat && (
                      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300">
                        ✓ We&apos;ll build a {selectedConsultantFormat.label} funnel for <strong>{selectedConsultantNiche.label}</strong> coaches — ad hooks, landing page, booking flow, and email sequence.
                      </div>
                    )}
                    <button onClick={() => setHasOffer(null)} className="text-[11px] text-white/25 hover:text-white/50 transition">← I actually have an offer URL</button>
                  </div>
                )}

                {hasOffer === "yes" && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Your website or offer URL <span className="normal-case font-normal text-white/20">(optional)</span></label>
                      <input type="url" value={businessUrl} onChange={(e) => setBusinessUrl(e.target.value)} placeholder="https://yourcoaching.com" autoFocus className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition" />
                      <p className="text-[10px] text-white/25 mt-1.5">Works with landing pages, Calendly links, course platforms, or any URL</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Your name or brand <span className="normal-case font-normal text-white/20">(optional)</span></label>
                      <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. James Carter Coaching" className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition" />
                    </div>
                    <button onClick={() => setHasOffer(null)} className="text-[11px] text-white/25 hover:text-white/50 transition">← I don&apos;t have an offer yet</button>
                  </div>
                )}
              </>
            )}

            {/* ── LOCAL SERVICE BUSINESS ──────────────────────────────────── */}
            {businessType === "service" && (
              <>
                {hasSite === null && (
                  <div className="space-y-3 mb-6">
                    <p className="text-xs font-black uppercase tracking-widest text-white/30 mb-4">Do you have a website already?</p>
                    <button onClick={() => setHasSite("yes")} className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-cyan-500/40 hover:bg-cyan-500/5 transition text-left">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center shrink-0"><Globe className="w-5 h-5 text-cyan-400" /></div>
                      <div>
                        <p className="text-sm font-bold text-white">Yes — I have a website</p>
                        <p className="text-xs text-white/35 mt-0.5">We&apos;ll scan it, score it, and build you a high-converting upgrade</p>
                      </div>
                    </button>
                    <button onClick={() => setHasSite("no")} className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-amber-500/40 hover:bg-amber-500/5 transition text-left">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0"><Layout className="w-5 h-5 text-amber-400" /></div>
                      <div>
                        <p className="text-sm font-bold text-white">No — build me one from scratch</p>
                        <p className="text-xs text-white/35 mt-0.5">Pick your service type and we&apos;ll build a full local lead gen site automatically</p>
                      </div>
                    </button>
                  </div>
                )}

                {hasSite === "no" && (
                  <div className="space-y-4 mb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">What type of service do you offer?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {SERVICE_TYPES.map((s) => (
                        <button key={s.key} onClick={() => setSelectedServiceType(s)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition ${selectedServiceType?.key === s.key ? "bg-amber-500/15 border-amber-500/40 text-white" : "border-white/[0.08] text-white/40 hover:border-white/20 hover:text-white/70"}`}>
                          <span className="text-base">{s.emoji}</span>{s.label}
                          {selectedServiceType?.key === s.key && <Check className="w-3.5 h-3.5 text-amber-400 ml-auto" />}
                        </button>
                      ))}
                    </div>
                    {selectedServiceType && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                        ✓ We&apos;ll build a {selectedServiceType.label} lead gen site with local ad hooks, Google review strategy, and a lead capture email flow.
                      </div>
                    )}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Business Name <span className="normal-case font-normal text-white/20">(optional)</span></label>
                      <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder={selectedServiceType ? `${selectedServiceType.label} of [Your City]` : "My Service Business"} className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition" />
                    </div>
                    <button onClick={() => setHasSite(null)} className="text-[11px] text-white/25 hover:text-white/50 transition">← I actually have a website</button>
                  </div>
                )}

                {hasSite === "yes" && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Your website URL</label>
                      <input type="url" value={businessUrl} onChange={(e) => setBusinessUrl(e.target.value)} placeholder="https://yourbusiness.com" autoFocus className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition" />
                      <p className="text-[10px] text-white/25 mt-1.5">We&apos;ll score it, find the gaps, and build a better version</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Business Name <span className="normal-case font-normal text-white/20">(optional)</span></label>
                      <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="My Local Business" className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition" />
                    </div>
                    <button onClick={() => setHasSite(null)} className="text-[11px] text-white/25 hover:text-white/50 transition">← I don&apos;t have a website yet</button>
                  </div>
                )}
              </>
            )}

            {/* ── AGENCY / FREELANCER ────────────────────────────────────── */}
            {businessType === "agency" && (
              <>
                {hasClientOrFocus === null && (
                  <div className="space-y-3 mb-6">
                    <p className="text-xs font-black uppercase tracking-widest text-white/30 mb-4">Do you have a specialty or client to build around?</p>
                    <button onClick={() => setHasClientOrFocus("yes")} className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-cyan-500/40 hover:bg-cyan-500/5 transition text-left">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center shrink-0"><Users className="w-5 h-5 text-cyan-400" /></div>
                      <div>
                        <p className="text-sm font-bold text-white">Yes — I have a client URL or my own site</p>
                        <p className="text-xs text-white/35 mt-0.5">Paste a client&apos;s URL to build their campaign, or your own agency site</p>
                      </div>
                    </button>
                    <button onClick={() => setHasClientOrFocus("no")} className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-pink-500/40 hover:bg-pink-500/5 transition text-left">
                      <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/20 flex items-center justify-center shrink-0"><TrendingUp className="w-5 h-5 text-pink-400" /></div>
                      <div>
                        <p className="text-sm font-bold text-white">No — help me define my agency and get clients</p>
                        <p className="text-xs text-white/35 mt-0.5">Pick your specialty and we&apos;ll build your client acquisition system from scratch</p>
                      </div>
                    </button>
                  </div>
                )}

                {hasClientOrFocus === "no" && (
                  <div className="space-y-4 mb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Your agency specialty</p>
                    <div className="grid grid-cols-2 gap-2">
                      {AGENCY_FOCUSES.map((a) => (
                        <button key={a.key} onClick={() => setSelectedAgencyFocus(a)}
                          className={`flex flex-col gap-1.5 p-3 rounded-xl border text-left transition ${selectedAgencyFocus?.key === a.key ? "bg-pink-500/15 border-pink-500/40" : "border-white/[0.08] hover:border-white/20"}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xl">{a.emoji}</span>
                            {selectedAgencyFocus?.key === a.key && <Check className="w-3.5 h-3.5 text-pink-400" />}
                          </div>
                          <p className="text-xs font-bold text-white">{a.label}</p>
                          <p className="text-[10px] text-white/35 leading-relaxed">{a.deliverable}</p>
                        </button>
                      ))}
                    </div>
                    {selectedAgencyFocus && (
                      <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-[11px] text-pink-300">
                        ✓ We&apos;ll build a {selectedAgencyFocus.label} client acquisition funnel — ad hooks to book discovery calls, a portfolio site, and a follow-up email sequence.
                      </div>
                    )}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Agency Name <span className="normal-case font-normal text-white/20">(optional)</span></label>
                      <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder={selectedAgencyFocus ? `${selectedAgencyFocus.label} Studio` : "My Agency"} className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition" />
                    </div>
                    <button onClick={() => setHasClientOrFocus(null)} className="text-[11px] text-white/25 hover:text-white/50 transition">← I have a client URL</button>
                  </div>
                )}

                {hasClientOrFocus === "yes" && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Client or agency website URL <span className="normal-case font-normal text-white/20">(optional)</span></label>
                      <input type="url" value={businessUrl} onChange={(e) => setBusinessUrl(e.target.value)} placeholder="https://clientwebsite.com" autoFocus className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition" />
                      <p className="text-[10px] text-white/25 mt-1.5">We&apos;ll analyze it and build the campaign assets automatically</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Agency / Brand Name <span className="normal-case font-normal text-white/20">(optional)</span></label>
                      <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="My Agency" className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition" />
                    </div>
                    <button onClick={() => setHasClientOrFocus(null)} className="text-[11px] text-white/25 hover:text-white/50 transition">← I&apos;m starting from scratch</button>
                  </div>
                )}
              </>
            )}

            {/* ── E-COMMERCE / BRAND (not dropship — they have their own brand) ── */}
            {businessType === "ecommerce" && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Product or store URL <span className="normal-case font-normal text-white/20">(optional)</span></label>
                  <input type="url" value={businessUrl} onChange={(e) => setBusinessUrl(e.target.value)} placeholder="https://yourshop.com or a product page" autoFocus className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition" />
                  <p className="text-[10px] text-white/25 mt-1.5">✓ We&apos;ll analyze your store and generate ad creatives, email flows, and a conversion-optimized funnel</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Brand Name <span className="normal-case font-normal text-white/20">(optional)</span></label>
                  <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="My Brand" className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition" />
                </div>
              </div>
            )}

            {/* What will be generated — always shown */}
            <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-4 mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">We&apos;ll auto-generate:</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    icon: Target,
                    label: selectedProduct ? `${selectedProduct.name} campaign`
                      : selectedConsultantNiche ? `${selectedConsultantNiche.label} coaching funnel`
                      : selectedServiceType ? `${selectedServiceType.label} lead gen campaign`
                      : selectedAgencyFocus ? `${selectedAgencyFocus.label} client acquisition`
                      : "Campaign workspace"
                  },
                  { icon: Layout, label: "High-converting site" },
                  { icon: Mail, label: "Welcome email series" },
                  {
                    icon: FileText,
                    label: selectedProduct ? `${selectedProduct.marketing.bestPlatform[0]} ad hooks`
                      : selectedConsultantFormat ? `${selectedConsultantFormat.label} scripts`
                      : selectedServiceType ? "Local ad hooks"
                      : selectedAgencyFocus ? "Client pitch scripts"
                      : "Ad hooks & scripts"
                  },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-white/50">
                    <div className="w-5 h-5 rounded-lg bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center shrink-0">
                      <Icon className="w-3 h-3 text-cyan-400" />
                    </div>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-400 text-center mb-4">{error}</p>}

            {/* Can proceed? */}
            {(() => {
              const canProceed = (() => {
                if (businessType === "affiliate") {
                  return selectedProduct !== null || hasProduct === "yes";
                }
                if (businessType === "consultant") {
                  return hasOffer === "yes" || (selectedConsultantNiche !== null && selectedConsultantFormat !== null);
                }
                if (businessType === "service") {
                  return hasSite === "yes" || selectedServiceType !== null;
                }
                if (businessType === "agency") {
                  return hasClientOrFocus === "yes" || selectedAgencyFocus !== null;
                }
                return true; // ecommerce — always can proceed
              })();

              return (
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-2xl border border-white/[0.1] text-white/40 hover:text-white/60 text-sm font-semibold transition">
                    Back
                  </button>
                  <button
                    onClick={() => void handleGenerate()}
                    disabled={generating || !canProceed}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-black hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    {generating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />{progress || "Generating…"}</>
                    ) : (
                      <><Sparkles className="w-4 h-4" />Launch My Platform</>
                    )}
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* Step 3 — Done */}
        {step === 3 && result && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500/20 to-cyan-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(34,197,94,0.15)]">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-2xl font-black mb-2">You&apos;re all set!</h1>
            <p className="text-white/40 text-sm mb-8">Your platform is ready. Here&apos;s what we built for you:</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {[
                result.siteId && {
                  icon: Layout,
                  label: "Site Built",
                  sub: "Golden funnel template",
                  href: result.sitePageId ? `/websites/${result.siteId}/editor/${result.sitePageId}` : `/websites/${result.siteId}`,
                  color: "text-cyan-400",
                  bg: "bg-cyan-500/10 border-cyan-500/20",
                },
                result.campaignId && {
                  icon: Target,
                  label: "Campaign Created",
                  sub: result.score ? `Score: ${result.score}/100 · ${result.verdict}` : "Ready to build",
                  href: `/campaigns/${result.campaignId}`,
                  color: "text-purple-400",
                  bg: "bg-purple-500/10 border-purple-500/20",
                },
                result.flowId && {
                  icon: Mail,
                  label: "Email Flow Ready",
                  sub: "Welcome series (3 emails)",
                  href: `/emails/flows/${result.flowId}`,
                  color: "text-amber-400",
                  bg: "bg-amber-500/10 border-amber-500/20",
                },
              ]
                .filter(Boolean)
                .map((item) => {
                  if (!item) return null;
                  const { icon: Icon, label, sub, href, color, bg } = item;
                  return (
                    <a
                      key={label}
                      href={href}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${bg} hover:opacity-80 transition text-center`}
                    >
                      <Icon className={`w-6 h-6 ${color}`} />
                      <p className="text-sm font-bold text-white">{label}</p>
                      <p className="text-[11px] text-white/40">{sub}</p>
                    </a>
                  );
                })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  if (result.siteId && result.sitePageId) {
                    router.push(`/websites/${result.siteId}/editor/${result.sitePageId}`);
                  } else {
                    router.push("/");
                  }
                }}
                className="flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-black hover:opacity-90 transition"
              >
                <Zap className="w-4 h-4" />
                Go to My Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
