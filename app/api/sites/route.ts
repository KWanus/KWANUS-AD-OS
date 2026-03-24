import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const sites = await prisma.site.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        pages: { select: { id: true }, orderBy: { order: "asc" } },
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json({ ok: true, sites });
  } catch (err) {
    console.error("Sites GET:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { name: string; description?: string; template?: string; campaignId?: string };
    if (!body.name?.trim()) {
      return NextResponse.json({ ok: false, error: "Site name required" }, { status: 400 });
    }

    // Generate unique slug
    const base = slugify(body.name.trim());
    let slug = base;
    let attempt = 0;
    while (await prisma.site.findUnique({ where: { slug } })) {
      attempt++;
      slug = `${base}-${attempt}`;
    }

    let draft = null;
    if (body.campaignId) {
      // @ts-ignore
      draft = await prisma.landingDraft.findFirst({ where: { campaignId: body.campaignId } });
    }

    // Create site + home page in a transaction
    const site = await prisma.site.create({
      data: {
        userId: user.id,
        name: body.name.trim(),
        slug,
        description: body.description?.trim() || null,
        pages: {
          create: {
            title: "Home",
            slug: "home",
            order: 0,
            blocks: getStarterBlocks(body.template ?? "blank", body.name.trim(), draft),
          },
        },
      },
      include: {
        pages: { select: { id: true, slug: true } },
      },
    });

    return NextResponse.json({ ok: true, site });
  } catch (err) {
    console.error("Sites POST:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getStarterBlocks(template: string, siteName: string, draft?: any): any[] {
  if (template === "blank") return [];

  const hero = {
    id: "hero-1",
    type: "hero",
    props: {
      headline: `Welcome to ${siteName}`,
      subheadline: "Built with Himalaya — the fastest way to launch a site.",
      buttonText: "Get Started",
      buttonUrl: "#",
      bgColor: "#050a14",
      textAlign: "center",
    },
  };

  const features = {
    id: "features-1",
    type: "features",
    props: {
      title: "Why Choose Us",
      columns: 3,
      items: [
        { icon: "⚡", title: "Lightning Fast", body: "Optimized for speed from day one." },
        { icon: "🎯", title: "Conversion Ready", body: "Every element drives action." },
        { icon: "📱", title: "Mobile First", body: "Perfect on every device." },
      ],
    },
  };

  const cta = {
    id: "cta-1",
    type: "cta",
    props: {
      headline: "Ready to launch?",
      subheadline: "Join thousands of businesses growing with Himalaya.",
      buttonText: "Start Free",
      buttonUrl: "#",
    },
  };

  if (template === "golden") {
    // If we have AI-generated copy, use it! Otherwise fallback to placeholders.
    const h1 = draft?.headline || "Stop Searching. Start Scaling.";
    const subh1 = draft?.subheadline || "The exact system you've been looking for to double your conversions and eliminate platform fees forever.";
    const ctaCopy = draft?.ctaCopy || "Claim Your Discount Now";
    const urgency = draft?.urgencyLine || "Join the elite group of founders scaling to 8-figures today.";

    // Parse AI lists
    let bulletStrings = ["Targeted Precision", "Instant Deployment", "Zero Hidden Fees"];
    if (draft?.bullets && Array.isArray(draft.bullets) && draft.bullets.length >= 3) {
      bulletStrings = draft.bullets.slice(0, 3) as string[];
    }

    let trustStrings = ["5/5 Stars", "Secure", "Blazing Fast", "Premium"];
    if (draft?.trustBar && Array.isArray(draft.trustBar) && draft.trustBar.length >= 4) {
      trustStrings = draft.trustBar.slice(0, 4) as string[];
    }

    return [
      { id: "hero-1", type: "hero", props: { headline: h1, subheadline: subh1, buttonText: "Get Started Now", buttonUrl: "#pricing", textAlign: "center", bgColor: "#020509" } },
      { id: "feat-trust-1", type: "features", props: { title: "Trusted by Industry Leaders", columns: 4, items: [{ icon: "⭐", title: trustStrings[0], body: "Over 10,000 happy customers" }, { icon: "🛡️", title: trustStrings[1], body: "Bank-level encryption" }, { icon: "⚡", title: trustStrings[2], body: "Built for speed" }, { icon: "💎", title: trustStrings[3], body: "Unmatched quality" }], bgColor: "#050a14" } },
      { id: "text-1", type: "text", props: { content: "### The Old Way is Broken\n\nYou're tired of paying 2% transaction fees and fighting with clunky software that breaks when you scale. You know there's a better way to generate sales, but every other platform over-promises and under-delivers.\n\nImagine if you could launch a beautifully designed, high-converting funnel in just 5 minutes without writing a single line of code—and keep 100% of the profits.", textAlign: "center", bgColor: "#07101f" } },
      { id: "feat-2", type: "features", props: { title: "Here's Exactly What You're Getting", columns: 3, items: [{ icon: "🎯", title: "Key Benefit #1", body: bulletStrings[0] }, { icon: "🚀", title: "Key Benefit #2", body: bulletStrings[1] }, { icon: "💰", title: "Key Benefit #3", body: bulletStrings[2] }], bgColor: "#050a14" } },
      { id: "test-1", type: "testimonials", props: { title: "Don't Just Take Our Word For It", items: [{ name: "Sarah J.", role: "Verified Buyer", quote: "This changed everything for my business. I saved $3,000 in fees in just one month.", stars: 5 }, { name: "Mark T.", role: "Agency Owner", quote: "The conversion rate on this funnel is unmatched. Highly recommended.", stars: 5 }], bgColor: "#020509" } },
      { id: "pricing-1", type: "pricing", props: { title: "Choose Your Plan", tiers: [{ label: "Standard", price: "$97", period: "one-time", features: ["Core Training", "Community Access"], buttonText: "Get Standard" }, { label: "VIP Mastery", price: "$297", period: "one-time", features: ["Everything in Standard", "1-on-1 Coaching", "Private Network"], buttonText: "Get VIP Access", highlight: true }], bgColor: "#050a14" } },
      { id: "checkout-1", type: "checkout", props: { title: "Secure Checkout", subtitle: "Complete your order below to get instant access.", buttonText: "Complete Order ($97)", showOrderBump: true, bumpHeadline: "Yes, add the Accelerator Bonus!", bumpText: "Get the 3-day rapid launch workshop for just $37 extra." } },
      { id: "faq-1", type: "faq", props: { title: "Frequently Asked Questions", items: [{ q: "Is there a guarantee?", a: draft?.guarantee || "Yes, you are backed by our ironclad 30-day money-back guarantee." }, { q: "How quickly do I get access?", a: "Instantly. You'll receive an email with login credentials the moment you purchase." }], bgColor: "#07101f" } },
      { id: "cta-2", type: "cta", props: { headline: ctaCopy, subheadline: urgency, buttonText: "Get Started Now", bgColor: "#020509" } },
      { id: "footer-1", type: "footer", props: { copyright: `© 2026 ${siteName}. All rights reserved.`, links: [{ label: "Terms of Service", url: "#" }, { label: "Privacy Policy", url: "#" }], showPoweredBy: true } }
    ];
  }

  if (template === "landing") return [hero, features, cta];
  if (template === "store") return [hero, { id: "products-1", type: "products", props: { title: "Shop", columns: 3 } }, cta];

  // Default to the highest converting funnel baseline
  return getStarterBlocks("golden", siteName, draft);
}
