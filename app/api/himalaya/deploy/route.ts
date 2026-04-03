import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

type DeployTarget = "campaign" | "site" | "emails" | "all";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as { runId: string; targets?: DeployTarget[] };
    if (!body.runId) return NextResponse.json({ ok: false, error: "runId required" }, { status: 400 });

    const targets = body.targets ?? ["all"];
    const shouldDeploy = (t: DeployTarget) => targets.includes("all") || targets.includes(t);

    // Load the analysis run with assets
    const run = await prisma.analysisRun.findFirst({
      where: { id: body.runId, userId: user.id },
      include: { assetPackages: true },
    });

    if (!run) return NextResponse.json({ ok: false, error: "Run not found" }, { status: 404 });

    const assets = run.assetPackages[0];
    const packet = run.decisionPacket as Record<string, unknown> | null;
    const results: Record<string, { id: string; url: string }> = {};

    // ── DEPLOY CAMPAIGN ───────────────────────────────────────────
    if (shouldDeploy("campaign") && assets) {
      const campaign = await prisma.campaign.create({
        data: {
          userId: user.id,
          name: run.title ?? "Himalaya Campaign",
          mode: run.mode,
          productName: run.title ?? "",
          productUrl: run.inputUrl,
          status: "draft",
          workflowState: "elite",
          analysisRunId: run.id,
        },
      });

      // Create ad variations from hooks
      const hooks = (assets.adHooks ?? []) as { format: string; hook: string }[];
      for (let i = 0; i < hooks.length; i++) {
        await prisma.adVariation.create({
          data: {
            campaignId: campaign.id,
            name: `Hook ${i + 1}: ${hooks[i].format}`,
            type: "hook",
            content: { format: hooks[i].format, hook: hooks[i].hook } as object,
            platform: hooks[i].format,
            sortOrder: i,
          },
        });
      }

      // Create ad variations from scripts
      const scripts = (assets.adScripts ?? []) as { title: string; duration: string; sections: unknown[] }[];
      for (let i = 0; i < scripts.length; i++) {
        await prisma.adVariation.create({
          data: {
            campaignId: campaign.id,
            name: scripts[i].title,
            type: "script",
            content: { title: scripts[i].title, duration: scripts[i].duration, sections: scripts[i].sections } as object,
            platform: "video",
            sortOrder: hooks.length + i,
          },
        });
      }

      // Create landing draft
      const lp = assets.landingPage as Record<string, unknown> | null;
      if (lp) {
        await prisma.landingDraft.create({
          data: {
            campaignId: campaign.id,
            headline: (lp.headline as string) ?? null,
            subheadline: (lp.subheadline as string) ?? null,
            ctaCopy: ((lp.ctaCopy ?? lp.ctaText ?? lp.heroCtaText ?? "") as string) || null,
            trustBar: (lp.trustBar ?? lp.trustElements ?? undefined) as object | undefined,
            bullets: (lp.benefitBullets ?? lp.sections ?? undefined) as object | undefined,
            urgencyLine: (lp.urgencyLine as string) ?? null,
            faqItems: (lp.faqItems ?? undefined) as object | undefined,
            guarantee: (lp.guaranteeText as string) ?? null,
            status: "draft",
          },
        });
      }

      results.campaign = { id: campaign.id, url: `/campaigns/${campaign.id}` };
    }

    // ── DEPLOY SITE ───────────────────────────────────────────────
    if (shouldDeploy("site")) {
      const siteName = run.title ?? "Himalaya Site";
      const slug = siteName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) + "-" + Date.now().toString(36);

      const site = await prisma.site.create({
        data: {
          userId: user.id,
          name: siteName,
          slug,
          theme: {
            font: "Inter",
            primaryColor: "#06b6d4",
            backgroundColor: "#050a14",
            textColor: "#ffffff",
          },
          published: false,
        },
      });

      // Create home page with content from assets
      const lp = (assets?.landingPage ?? {}) as Record<string, unknown>;
      const headline = (lp.headline ?? lp.heroCtaText ?? run.title ?? "") as string;
      const subheadline = (lp.subheadline ?? run.summary ?? "") as string;

      await prisma.sitePage.create({
        data: {
          siteId: site.id,
          title: "Home",
          slug: "home",
          order: 0,
          blocks: [
            {
              type: "hero",
              data: {
                headline,
                subheadline,
                ctaText: (lp.ctaCopy ?? lp.ctaText ?? lp.heroCtaText ?? "Get Started") as string,
                ctaUrl: "#",
              },
            },
            ...(Array.isArray(lp.trustElements) ? [{
              type: "trust",
              data: { items: lp.trustElements },
            }] : []),
            ...(Array.isArray(lp.sections) ? [{
              type: "features",
              data: { items: (lp.sections as string[]).map((s: string) => ({ title: s, description: "" })) },
            }] : []),
          ],
        },
      });

      results.site = { id: site.id, url: `/websites/${site.id}` };
    }

    // ── DEPLOY EMAIL FLOW ─────────────────────────────────────────
    if (shouldDeploy("emails") && assets) {
      const es = (assets.emailSequences ?? {}) as Record<string, unknown>;
      const welcomeEmails = (es.welcome ?? []) as { subject: string; purpose?: string; preview?: string; body?: string; timing?: string }[];

      if (welcomeEmails.length > 0) {
        // Build email flow nodes from sequence
        const nodes = welcomeEmails.map((email, i) => ({
          id: `node_${i}`,
          type: i === 0 ? "trigger" : "email",
          data: {
            subject: email.subject,
            preview: email.preview ?? email.purpose ?? "",
            body: email.body ?? "",
            timing: email.timing ?? `Day ${i}`,
          },
          position: { x: 250, y: i * 150 },
        }));

        const edges = welcomeEmails.slice(1).map((_, i) => ({
          id: `edge_${i}`,
          source: `node_${i}`,
          target: `node_${i + 1}`,
        }));

        const flow = await prisma.emailFlow.create({
          data: {
            userId: user.id,
            name: `${run.title ?? "Himalaya"} Welcome Sequence`,
            trigger: "subscribe",
            triggerConfig: {},
            status: "draft",
            nodes: nodes as unknown as object,
            edges: edges as unknown as object,
          },
        });

        results.emails = { id: flow.id, url: `/emails/flows/${flow.id}` };
      }
    }

    return NextResponse.json({ ok: true, deployed: results });
  } catch (err) {
    console.error("Deploy error:", err);
    return NextResponse.json({ ok: false, error: "Deploy failed" }, { status: 500 });
  }
}
