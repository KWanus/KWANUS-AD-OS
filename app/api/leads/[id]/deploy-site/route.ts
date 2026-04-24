import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ── Types ────────────────────────────────────────────────────────────────────

type WebsiteSection = {
  type: string;
  headline: string;
  body?: string;
  items?: string[] | { question: string; answer: string }[];
  steps?: string[];
  primary_cta?: string;
};

type WebsiteJson = {
  business_name?: string;
  seo?: { title?: string; meta_description?: string };
  hero?: {
    headline?: string;
    subheadline?: string;
    primary_cta?: string;
    secondary_cta?: string;
  };
  sections?: WebsiteSection[];
  visual_direction?: { style?: string; color_direction?: string };
};

type SiteBlock = {
  id: string;
  type: string;
  props: Record<string, unknown>;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${base}-${Date.now().toString(36)}`;
}

function isStringArray(arr: unknown[]): arr is string[] {
  return arr.length === 0 || typeof arr[0] === "string";
}

function convertToBlocks(json: WebsiteJson, leadName: string): SiteBlock[] {
  const blocks: SiteBlock[] = [];

  // Urgency bar (always for local business context)
  blocks.push({
    id: crypto.randomUUID(),
    type: "urgency",
    props: { text: "⚡ Limited Time — Free Strategy Session" },
  });

  // Hero
  if (json.hero) {
    blocks.push({
      id: crypto.randomUUID(),
      type: "hero",
      props: {
        headline: json.hero.headline ?? "",
        subheadline: json.hero.subheadline ?? "",
        buttonText: json.hero.primary_cta ?? "Get Started",
        secondaryButtonText: json.hero.secondary_cta ?? "",
        textAlign: "center",
        socialProofText: "Trusted by local businesses",
      },
    });
  }

  // Sections
  for (const section of json.sections ?? []) {
    switch (section.type) {
      case "benefits": {
        const rawItems = section.items ?? [];
        const mappedItems = isStringArray(rawItems)
          ? rawItems.map((item) => ({ icon: "✓", title: item, body: "" }))
          : [];
        blocks.push({
          id: crypto.randomUUID(),
          type: "features",
          props: {
            title: section.headline,
            subtitle: section.body ?? "",
            items: mappedItems,
          },
        });
        break;
      }

      case "trust": {
        const rawItems = section.items ?? [];
        const badges = isStringArray(rawItems)
          ? rawItems.map((item) => ({ icon: "✅", label: item }))
          : [];
        blocks.push({
          id: crypto.randomUUID(),
          type: "trust_badges",
          props: {
            title: section.headline,
            badges,
          },
        });
        break;
      }

      case "process": {
        const steps = (section.steps ?? []).map((s, i) => ({
          icon: String(i + 1),
          title: s,
          body: "",
        }));
        blocks.push({
          id: crypto.randomUUID(),
          type: "process",
          props: {
            title: section.headline,
            steps,
          },
        });
        break;
      }

      case "faq": {
        const rawItems = section.items ?? [];
        const faqItems = !isStringArray(rawItems)
          ? (rawItems as { question: string; answer: string }[]).map((item) => ({
              q: item.question,
              a: item.answer,
            }))
          : [];
        blocks.push({
          id: crypto.randomUUID(),
          type: "faq",
          props: {
            title: section.headline,
            items: faqItems,
          },
        });
        break;
      }

      case "cta": {
        blocks.push({
          id: crypto.randomUUID(),
          type: "cta",
          props: {
            headline: section.headline,
            subheadline: section.body ?? "",
            buttonText: section.primary_cta ?? "Get Started",
          },
        });
        break;
      }

      case "solution": {
        blocks.push({
          id: crypto.randomUUID(),
          type: "text",
          props: {
            content: `${section.headline}\n\n${section.body ?? ""}`,
          },
        });
        break;
      }

      default:
        break;
    }
  }

  // Testimonials
  blocks.push({
    id: crypto.randomUUID(),
    type: "testimonials",
    props: {
      title: "What Our Clients Say",
      items: [
        {
          name: "Sarah M.",
          role: "Local Business Owner",
          quote: "Best decision we made for our business.",
          stars: 5,
        },
      ],
    },
  });

  // Guarantee
  blocks.push({
    id: crypto.randomUUID(),
    type: "guarantee",
    props: {},
  });

  // Footer
  blocks.push({
    id: crypto.randomUUID(),
    type: "footer",
    props: {
      copyright: `© ${new Date().getFullYear()} ${leadName}`,
    },
  });

  return blocks;
}

// ── Route ────────────────────────────────────────────────────────────────────

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const { id } = await params;
    const lead = await prisma.lead.findFirst({
      where: { id, userId: user.id },
      select: { id: true, name: true, websiteJson: true },
    });
    if (!lead) {
      return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
    }

    if (!lead.websiteJson) {
      return NextResponse.json(
        { ok: false, error: "Lead has no websiteJson. Generate website content first." },
        { status: 400 }
      );
    }

    const websiteJson = lead.websiteJson as WebsiteJson;
    const blocks = convertToBlocks(websiteJson, lead.name);
    const slug = generateSlug(lead.name);

    const site = await prisma.site.create({
      data: {
        userId: user.id,
        name: lead.name,
        slug,
        published: true,
        theme: { primaryColor: "#f5a623", mode: "dark" } as Prisma.InputJsonValue,
        pages: {
          create: {
            title: "Home",
            slug: "home",
            order: 0,
            published: true,
            seoTitle: (websiteJson.seo?.title as string) ?? lead.name,
            seoDesc: (websiteJson.seo?.meta_description as string) ?? undefined,
            blocks: blocks as Prisma.InputJsonValue,
          },
        },
      },
      select: { id: true, slug: true },
    });

    return NextResponse.json({ ok: true, siteId: site.id, slug: site.slug });
  } catch (err) {
    console.error("Deploy site error:", err);
    return NextResponse.json({ ok: false, error: "Failed to deploy site" }, { status: 500 });
  }
}
