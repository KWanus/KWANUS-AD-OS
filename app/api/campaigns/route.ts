import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailable } from "@/lib/db/runtime";

// GET /api/campaigns — list campaigns scoped to user
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    const campaigns = await prisma.campaign.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            adVariations: true,
            emailDrafts: true,
            checklistItems: true,
          },
        },
      },
    });
    return NextResponse.json({ ok: true, campaigns });
  } catch (err) {
    console.error("Campaigns GET error:", err);
    if (isDatabaseUnavailable(err)) {
      return NextResponse.json({ ok: true, campaigns: [], databaseUnavailable: true });
    }
    return NextResponse.json({ ok: false, error: "Failed to load campaigns" }, { status: 500 });
  }
}

// POST /api/campaigns — create a campaign from an asset package
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      name: string;
      mode: string;
      productName?: string;
      productUrl?: string;
      analysisRunId?: string;
      assets?: {
        adHooks?: { format: string; hook: string }[];
        adScripts?: {
          title: string;
          duration: string;
          sections: { timestamp: string; direction: string; copy: string }[];
        }[];
        adBriefs?: {
          id: string;
          format: string;
          title: string;
          duration: string;
          platform: string;
          concept: string;
          scenes: { timestamp: string; shotType: string; visual: string; audio: string; textOverlay: string }[];
          productionKit: object;
          imageAd?: object;
        }[];
        landingPage?: {
          headline?: string;
          subheadline?: string;
          trustBar?: string[];
          benefitBullets?: string[];
          socialProofGuidance?: string;
          guaranteeText?: string;
          faqItems?: { question: string; answer: string }[];
          ctaCopy?: string;
          urgencyLine?: string;
        };
        emailSequences?: {
          welcome?: { subject: string; preview: string; body: string; timing: string }[];
          abandonedCart?: { subject: string; preview: string; body: string; timing: string }[];
          postPurchase?: { subject: string; preview: string; body: string; timing: string }[];
        };
        executionChecklist?: {
          day1?: string[];
          day2?: string[];
          day3?: string[];
          week2?: string[];
          scalingTrigger?: string;
          killCriteria?: string;
        };
      };
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ ok: false, error: "Name is required" }, { status: 400 });
    }

    const userId = req.headers.get("x-user-id");

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        name: body.name.trim(),
        mode: body.mode ?? "operator",
        productName: body.productName,
        productUrl: body.productUrl,
        analysisRunId: body.analysisRunId,
        userId: userId ?? undefined,
        status: "draft",
      },
    });

    const assets = body.assets;

    if (assets) {
      // Ad hook variations
      if (assets.adHooks?.length) {
        await prisma.adVariation.createMany({
          data: assets.adHooks.map((h, i) => ({
            campaignId: campaign.id,
            name: h.format,
            type: "hook",
            content: h as object,
            status: "draft",
            sortOrder: i,
          })),
        });
      }

      // Ad script variations
      if (assets.adScripts?.length) {
        await prisma.adVariation.createMany({
          data: assets.adScripts.map((s, i) => ({
            campaignId: campaign.id,
            name: s.title,
            type: "script",
            content: s as object,
            status: "draft",
            sortOrder: i,
          })),
        });
      }

      // Ad brief variations
      if (assets.adBriefs?.length) {
        await prisma.adVariation.createMany({
          data: assets.adBriefs.map((b, i) => ({
            campaignId: campaign.id,
            name: b.title,
            type: "brief",
            content: b as object,
            status: "draft",
            sortOrder: i,
          })),
        });
      }

      // Landing page draft
      if (assets.landingPage) {
        const lp = assets.landingPage;
        await prisma.landingDraft.create({
          data: {
            campaignId: campaign.id,
            headline: lp.headline,
            subheadline: lp.subheadline,
            trustBar: lp.trustBar as object,
            bullets: lp.benefitBullets as object,
            socialProof: lp.socialProofGuidance,
            guarantee: lp.guaranteeText,
            faqItems: lp.faqItems as object,
            ctaCopy: lp.ctaCopy,
            urgencyLine: lp.urgencyLine,
            status: "draft",
          },
        });
      }

      // Email drafts
      if (assets.emailSequences) {
        const rows: {
          campaignId: string;
          sequence: string;
          position: number;
          subject: string | undefined;
          preview: string | undefined;
          body: string | undefined;
          timing: string | undefined;
          status: string;
        }[] = [];

        const seqMap: [string, { subject: string; preview: string; body: string; timing: string }[] | undefined][] = [
          ["welcome", assets.emailSequences.welcome],
          ["cart", assets.emailSequences.abandonedCart],
          ["post-purchase", assets.emailSequences.postPurchase],
        ];

        for (const [seq, emails] of seqMap) {
          if (emails?.length) {
            emails.forEach((e, i) => {
              rows.push({
                campaignId: campaign.id,
                sequence: seq,
                position: i + 1,
                subject: e.subject,
                preview: e.preview,
                body: e.body,
                timing: e.timing,
                status: "draft",
              });
            });
          }
        }

        if (rows.length) {
          await prisma.emailDraft.createMany({ data: rows });
        }
      }

      // Checklist items
      if (assets.executionChecklist) {
        const cl = assets.executionChecklist;
        const items: {
          campaignId: string;
          day: string;
          position: number;
          text: string;
          done: boolean;
        }[] = [];

        const dayMap: [string, string[] | undefined][] = [
          ["day1", cl.day1],
          ["day2", cl.day2],
          ["day3", cl.day3],
          ["week2", cl.week2],
        ];
        for (const [day, tasks] of dayMap) {
          tasks?.forEach((t, i) => items.push({ campaignId: campaign.id, day, position: i, text: t, done: false }));
        }
        if (cl.scalingTrigger) {
          items.push({ campaignId: campaign.id, day: "scaling", position: 0, text: cl.scalingTrigger, done: false });
        }
        if (cl.killCriteria) {
          items.push({ campaignId: campaign.id, day: "kill", position: 0, text: cl.killCriteria, done: false });
        }
        if (items.length) {
          await prisma.checklistItem.createMany({ data: items });
        }
      }
    }

    return NextResponse.json({ ok: true, campaign: { id: campaign.id } });
  } catch (err) {
    console.error("Campaign create error:", err);
    return NextResponse.json({ ok: false, error: "Failed to create campaign" }, { status: 500 });
  }
}
