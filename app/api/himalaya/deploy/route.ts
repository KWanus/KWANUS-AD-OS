import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { runDeploymentQA } from "@/lib/himalaya/deploymentQA";
import { getUserAccess, incrementUsage } from "@/lib/himalaya/access";

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

    // Check deploy access
    const access = await getUserAccess(user.id).catch(() => null);
    if (access && !access.canDeploy) {
      return NextResponse.json({ ok: false, error: `Deploy limit reached (${access.usage.deploysUsed}/${access.limits.deploysLimit}). Upgrade to deploy more.` }, { status: 403 });
    }

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

      // Create home page with rich content from all generated assets
      const lp = (assets?.landingPage ?? {}) as Record<string, unknown>;
      const foundation = (run.rawSignals as Record<string, unknown> | null)?.foundation as Record<string, unknown> | undefined;
      const headline = (lp.headline ?? run.title ?? "") as string;
      const subheadline = (lp.subheadline ?? run.summary ?? "") as string;
      const offer = foundation?.offerDirection as Record<string, string> | undefined;
      const icp = foundation?.idealCustomer as Record<string, string> | undefined;

      const blocks: object[] = [
        // Hero
        {
          type: "hero",
          data: {
            headline,
            subheadline,
            ctaText: (lp.ctaCopy ?? lp.ctaText ?? lp.heroCtaText ?? "Get Started") as string,
            ctaUrl: "#contact",
          },
        },
      ];

      // Trust bar
      if (Array.isArray(lp.trustElements) && (lp.trustElements as string[]).length > 0) {
        blocks.push({ type: "trust", data: { items: lp.trustElements } });
      }

      // Problem section (from ICP pain)
      if (icp?.who || icp?.buyingTrigger) {
        blocks.push({
          type: "text",
          data: {
            headline: "Who This Is For",
            body: [icp.who, icp.psychographics, icp.buyingTrigger].filter(Boolean).join(". "),
          },
        });
      }

      // Offer section
      if (offer?.coreOffer) {
        blocks.push({
          type: "text",
          data: {
            headline: "What You Get",
            body: [
              offer.coreOffer,
              offer.deliverable ? `Deliverable: ${offer.deliverable}` : null,
              offer.transformation ? `Result: ${offer.transformation}` : null,
              offer.pricing ? `Investment: ${offer.pricing}` : null,
            ].filter(Boolean).join("\n\n"),
          },
        });
      }

      // Features/sections
      if (Array.isArray(lp.sections) && (lp.sections as string[]).length > 0) {
        blocks.push({
          type: "features",
          data: { items: (lp.sections as string[]).map((s: string) => ({ title: s, description: "" })) },
        });
      }

      // Guarantee
      if (offer?.guarantee) {
        blocks.push({
          type: "text",
          data: { headline: "Our Guarantee", body: offer.guarantee },
        });
      }

      // Urgency + CTA
      if (lp.urgencyLine) {
        blocks.push({
          type: "cta",
          data: {
            headline: lp.urgencyLine as string,
            ctaText: (lp.ctaCopy ?? lp.ctaText ?? lp.heroCtaText ?? "Get Started Now") as string,
            ctaUrl: "#contact",
          },
        });
      }

      // Contact form
      blocks.push({
        type: "form",
        data: { headline: "Ready to Start?", fields: ["name", "email", "phone", "message"] },
      });

      await prisma.sitePage.create({
        data: {
          siteId: site.id,
          title: "Home",
          slug: "home",
          order: 0,
          blocks,
        },
      });

      results.site = { id: site.id, url: `/websites/${site.id}` };
    }

    // ── DEPLOY EMAIL FLOW ─────────────────────────────────────────
    if (shouldDeploy("emails") && assets) {
      const es = (assets.emailSequences ?? {}) as Record<string, unknown>;
      const welcomeEmails = (es.welcome ?? []) as { subject: string; purpose?: string; preview?: string; body?: string; timing?: string }[];

      if (welcomeEmails.length > 0) {
        // Build email flow nodes: trigger → email → delay → email → delay → ...
        const nodes: object[] = [
          { id: "trigger_0", type: "trigger", data: { label: "New Signup" }, position: { x: 250, y: 0 } },
        ];
        const edges: object[] = [];
        let prevId = "trigger_0";
        let yPos = 150;

        for (let i = 0; i < welcomeEmails.length; i++) {
          const email = welcomeEmails[i];
          const emailId = `email_${i}`;

          // Add delay between emails (except before first)
          if (i > 0) {
            const delayId = `delay_${i}`;
            const dayMatch = email.timing?.match(/(\d+)/);
            const delayDays = dayMatch ? parseInt(dayMatch[1]) : i * 2;
            nodes.push({
              id: delayId, type: "delay",
              data: { delayValue: delayDays, delayUnit: "days", label: `Wait ${delayDays} day${delayDays > 1 ? "s" : ""}` },
              position: { x: 250, y: yPos },
            });
            edges.push({ id: `e_${prevId}_${delayId}`, source: prevId, target: delayId });
            prevId = delayId;
            yPos += 100;
          }

          // Add email node
          nodes.push({
            id: emailId, type: "email",
            data: {
              subject: email.subject,
              previewText: email.preview ?? email.purpose ?? "",
              body: email.body ?? `<p>${email.purpose ?? email.subject}</p>`,
              label: email.subject,
            },
            position: { x: 250, y: yPos },
          });
          edges.push({ id: `e_${prevId}_${emailId}`, source: prevId, target: emailId });
          prevId = emailId;
          yPos += 150;
        }

        const flow = await prisma.emailFlow.create({
          data: {
            userId: user.id,
            name: `${run.title ?? "Himalaya"} Welcome Sequence`,
            trigger: "signup",
            triggerConfig: {},
            status: "draft",
            nodes: nodes as unknown as object,
            edges: edges as unknown as object,
          },
        });

        results.emails = { id: flow.id, url: `/emails/flows/${flow.id}` };
      }
    }

    // ── RUN QA ON DEPLOYED SITE ────────────────────────────────────
    let qaReport = null;
    if (results.site) {
      try {
        const sitePages = await prisma.sitePage.findMany({ where: { siteId: results.site.id }, orderBy: { order: "asc" } });
        const homeBlocks = (sitePages[0]?.blocks ?? []) as { type: string; data: Record<string, unknown> }[];
        qaReport = runDeploymentQA(run.title ?? "Site", results.site.id, homeBlocks);
      } catch {
        // QA is non-blocking
      }
    }

    // ── SAVE DEPLOYMENT RECORD ──────────────────────────────────────
    try {
      // Count existing deployments for versioning
      const existingCount = await prisma.himalayaDeployment.count({
        where: { analysisRunId: body.runId, userId: user.id },
      });

      await prisma.himalayaDeployment.create({
        data: {
          userId: user.id,
          analysisRunId: body.runId,
          siteId: results.site?.id ?? null,
          campaignId: results.campaign?.id ?? null,
          emailFlowId: results.emails?.id ?? null,
          version: existingCount + 1,
          qaScore: qaReport?.score ?? null,
          qaReport: qaReport ? JSON.parse(JSON.stringify(qaReport)) : undefined,
          sections: results.site ? { blocks: "saved" } : undefined,
        },
      });
    } catch {
      // deployment record is non-blocking
    }

    // Track usage
    await incrementUsage(user.id, "deploysUsed").catch(() => {});

    return NextResponse.json({ ok: true, deployed: results, qa: qaReport });
  } catch (err) {
    console.error("Deploy error:", err);
    return NextResponse.json({ ok: false, error: "Deploy failed" }, { status: 500 });
  }
}
