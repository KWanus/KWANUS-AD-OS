import { prisma } from "@/lib/prisma";
import { runDeploymentQA } from "@/lib/himalaya/deploymentQA";
import { getUserAccess, incrementUsage } from "@/lib/himalaya/access";
import { generateImages, buildAdImagePrompts } from "@/lib/integrations/imageGeneration";
import { generateVideo, adBriefToVideoInput } from "@/lib/integrations/videoGeneration";
import { createPaymentLink, parsePriceToCents } from "@/lib/integrations/stripePayments";
import {
  buildTrackingScript,
  buildFormTrackingScript,
  type TrackingConfig,
} from "@/lib/integrations/trackingPixels";
import { buildPromptKit, extractBusinessContext } from "@/lib/himalaya/promptEngine";
import { getPlaybook } from "@/lib/himalaya/nichePlaybooks";
import { buildHimalayaTrackingScript } from "@/lib/integrations/himalayaTracking";

export type DeployTarget = "campaign" | "site" | "emails" | "all";

export type DeployRunResult =
  | {
      ok: true;
      deployed: Record<string, { id: string; url: string }>;
      qa: ReturnType<typeof runDeploymentQA> | null;
      generated: {
        adImages: number;
        adVideo: boolean;
        paymentLink: string | null;
        trackingEnabled: boolean;
        emailFlowsCreated: number;
      };
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

export async function deployRun(input: {
  userId: string;
  runId: string;
  targets?: DeployTarget[];
}): Promise<DeployRunResult> {
  const targets = input.targets ?? ["all"];
  const shouldDeploy = (target: DeployTarget) =>
    targets.includes("all") || targets.includes(target);

  const access = await getUserAccess(input.userId).catch(() => null);
  if (access && !access.canDeploy) {
    return {
      ok: false,
      status: 403,
      error: `Deploy limit reached (${access.usage.deploysUsed}/${access.limits.deploysLimit}). Upgrade to deploy more.`,
    };
  }

  const run = await prisma.analysisRun.findFirst({
    where: { id: input.runId, userId: input.userId },
    include: { assetPackages: true },
  });

  if (!run) {
    return { ok: false, status: 404, error: "Run not found" };
  }

  const assets = run.assetPackages[0];
  const packet = run.decisionPacket as Record<string, unknown> | null;
  const results: Record<string, { id: string; url: string }> = {};
  const generatedAssets: Record<string, unknown> = {};

  const dbUser = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      metaPixelId: true,
      googleAnalyticsId: true,
      tiktokPixelId: true,
      sendingFromEmail: true,
      sendingFromName: true,
      sendingDomain: true,
    },
  });

  const trackingConfig: TrackingConfig = {
    metaPixelId: dbUser?.metaPixelId,
    googleAnalyticsId: dbUser?.googleAnalyticsId,
    tiktokPixelId: dbUser?.tiktokPixelId,
  };

  const aiGenerationPromises: Promise<void>[] = [];

  if (shouldDeploy("campaign") && assets) {
    aiGenerationPromises.push(
      (async () => {
        try {
          const imagePrompts = buildAdImagePrompts({
            productName: run.title ?? "Product",
            audience: (packet?.audience as string) ?? "customers",
            painPoint:
              ((packet?.painDesire as string) ?? "").split("→")[0]?.trim() ??
              "problems",
            outcome:
              ((packet?.painDesire as string) ?? "").split("→")[1]?.trim() ??
              "results",
            angle: (packet?.angle as string) ?? "unique approach",
            mode: run.mode === "consultant" ? "consultant" : "operator",
          });
          const imageResult = await generateImages(imagePrompts);
          if (imageResult.ok) {
            generatedAssets.adImages = imageResult.images;
          }
        } catch {
          // Image generation is non-blocking.
        }
      })()
    );
  }

  if (shouldDeploy("campaign") && assets?.adBriefs) {
    aiGenerationPromises.push(
      (async () => {
        try {
          const briefs = (assets.adBriefs ?? []) as {
            title: string;
            platform: string;
            scenes: {
              timestamp: string;
              textOverlay: string;
              audio: string;
            }[];
            productionKit: { colorGrade: string };
          }[];

          if (briefs.length > 0) {
            const videoInput = adBriefToVideoInput(briefs[0]);
            const videoResult = await generateVideo(videoInput);
            if (videoResult.ok && videoResult.video) {
              generatedAssets.adVideo = videoResult.video;
            }
          }
        } catch {
          // Video generation is non-blocking.
        }
      })()
    );
  }

  if (shouldDeploy("site")) {
    aiGenerationPromises.push(
      (async () => {
        try {
          const foundation = (run.rawSignals as Record<string, unknown> | null)
            ?.foundation as Record<string, unknown> | undefined;
          const offer = foundation?.offerDirection as
            | Record<string, string>
            | undefined;
          const pricing = offer?.pricing;
          if (pricing) {
            const cents = parsePriceToCents(pricing);
            if (cents && cents > 0) {
              const appUrl =
                process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";
              const linkResult = await createPaymentLink({
                productName: run.title ?? "Product",
                description: offer?.coreOffer,
                priceInCents: cents,
                successUrl: `${appUrl}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
                metadata: { runId: run.id, userId: input.userId },
              });
              if (linkResult.ok) {
                generatedAssets.paymentLink = linkResult.url;
                generatedAssets.paymentLinkId = linkResult.paymentLinkId;
              }
            }
          }
        } catch {
          // Payment link creation is non-blocking.
        }
      })()
    );
  }

  await Promise.allSettled(aiGenerationPromises);

  if (shouldDeploy("campaign") && assets) {
    const campaign = await prisma.campaign.create({
      data: {
        userId: input.userId,
        name: run.title ?? "Himalaya Campaign",
        mode: run.mode,
        productName: run.title ?? "",
        productUrl: run.inputUrl,
        status: "draft",
        workflowState: "elite",
        analysisRunId: run.id,
      },
    });

    let hooks = (assets.adHooks ?? []) as { format: string; hook: string }[];
    const adImages = (generatedAssets.adImages ?? []) as {
      base64: string;
      prompt: string;
      model: string;
    }[];

    // Inject proven ad angles from playbook if generated hooks are weak
    const campaignPlaybook = getPlaybook(
      ((run.rawSignals as Record<string, unknown> | null)?.foundation as Record<string, unknown> | undefined)?.path as string ?? ""
    );
    if (campaignPlaybook && hooks.length < 3) {
      const playbookHooks = campaignPlaybook.adAngles.map(a => ({
        format: `${a.angle} (proven)`,
        hook: a.hook,
      }));
      hooks = [...hooks, ...playbookHooks];
    }

    for (let i = 0; i < hooks.length; i++) {
      await prisma.adVariation.create({
        data: {
          campaignId: campaign.id,
          name: `Hook ${i + 1}: ${hooks[i].format}`,
          type: "hook",
          content: {
            format: hooks[i].format,
            hook: hooks[i].hook,
            ...(adImages[i] && {
              imageBase64: adImages[i].base64,
              imageModel: adImages[i].model,
            }),
          } as object,
          platform: hooks[i].format,
          sortOrder: i,
        },
      });
    }

    const scripts = (assets.adScripts ?? []) as {
      title: string;
      duration: string;
      sections: unknown[];
    }[];
    const adVideo = generatedAssets.adVideo as
      | { url?: string; format: string; model: string }
      | undefined;

    for (let i = 0; i < scripts.length; i++) {
      await prisma.adVariation.create({
        data: {
          campaignId: campaign.id,
          name: scripts[i].title,
          type: "script",
          content: {
            title: scripts[i].title,
            duration: scripts[i].duration,
            sections: scripts[i].sections,
            ...(i === 0 &&
              adVideo?.url && {
                videoUrl: adVideo.url,
                videoModel: adVideo.model,
              }),
          } as object,
          platform: "video",
          sortOrder: hooks.length + i,
        },
      });
    }

    const lp = assets.landingPage as Record<string, unknown> | null;
    if (lp) {
      await prisma.landingDraft.create({
        data: {
          campaignId: campaign.id,
          headline: (lp.headline as string) ?? null,
          subheadline: (lp.subheadline as string) ?? null,
          ctaCopy:
            ((lp.ctaCopy ?? lp.ctaText ?? lp.heroCtaText ?? "") as string) ||
            null,
          trustBar: (lp.trustBar ?? lp.trustElements ?? undefined) as
            | object
            | undefined,
          bullets: (lp.benefitBullets ?? lp.sections ?? undefined) as
            | object
            | undefined,
          urgencyLine: (lp.urgencyLine as string) ?? null,
          faqItems: (lp.faqItems ?? undefined) as object | undefined,
          guarantee: (lp.guaranteeText as string) ?? null,
          status: "draft",
        },
      });
    }

    try {
      const bizCtx = extractBusinessContext(run as {
        title?: string | null;
        mode: string;
        decisionPacket?: Record<string, unknown> | null;
        rawSignals?: Record<string, unknown> | null;
      });
      const promptKit = buildPromptKit(bizCtx);

      const autoGenResults: Record<string, { content: string; type: string }> =
        {};
      const autoGenIds = [
        "ad-fb-pain",
        "ad-tiktok-hook",
        "email-welcome-1",
        "lp-hero",
      ];
      const allKitPrompts = [
        ...promptKit.adCopyPrompts,
        ...promptKit.emailPrompts,
        ...promptKit.landingPrompts,
      ];

      if (process.env.ANTHROPIC_API_KEY) {
        const Anthropic = (await import("@anthropic-ai/sdk")).default;
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const autoGenPromises = autoGenIds.map(async (pid) => {
          const prompt = allKitPrompts.find(
            (candidate) => (candidate as { id: string }).id === pid
          );
          if (!prompt) return;
          try {
            const response = await anthropic.messages.create({
              model: "claude-sonnet-4-20250514",
              max_tokens: 1500,
              system: `You are a world-class direct response copywriter. Write ready-to-use copy for ${bizCtx.niche} targeting ${bizCtx.audience}. No placeholders. No preamble. Output only the copy.`,
              messages: [
                {
                  role: "user",
                  content: (prompt as { prompt: string }).prompt,
                },
              ],
            });
            const text = response.content.find((content) => content.type === "text");
            if (text?.text) {
              autoGenResults[pid] = { content: text.text, type: "text" };
            }
          } catch {
            // Individual generation failure is non-blocking.
          }
        });

        await Promise.allSettled(autoGenPromises);
      }

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          workflowState: {
            tier: "elite",
            promptKit,
            businessContext: bizCtx,
            autoGenerated: autoGenResults,
          },
        },
      });
    } catch {
      // Prompt kit generation is non-blocking.
    }

    results.campaign = { id: campaign.id, url: `/campaigns/${campaign.id}` };
  }

  if (shouldDeploy("site")) {
    const siteName = run.title ?? "Himalaya Site";
    const slug =
      siteName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) +
      "-" +
      Date.now().toString(36);

    const site = await prisma.site.create({
      data: {
        userId: input.userId,
        name: siteName,
        slug,
        theme: {
          font: "Inter",
          primaryColor: "#06b6d4",
          backgroundColor: "#050a14",
          textColor: "#ffffff",
          trackingScript: buildTrackingScript(trackingConfig),
          formTrackingScript: buildFormTrackingScript(trackingConfig),
          himalayaTrackingScript: "", // placeholder — set after site.id is known
          hasTracking: true, // Himalaya tracking always works, no pixel needed
        },
        published: false,
      },
    });

    const lp = (assets?.landingPage ?? {}) as Record<string, unknown>;
    const siteFoundation = (run.rawSignals as Record<string, unknown> | null)
      ?.foundation as Record<string, unknown> | undefined;
    const headline = (lp.headline ?? run.title ?? "") as string;
    const subheadline = (lp.subheadline ?? run.summary ?? "") as string;
    const offer = siteFoundation?.offerDirection as
      | Record<string, string>
      | undefined;
    const icp = siteFoundation?.idealCustomer as Record<string, string> | undefined;
    const paymentUrl = (generatedAssets.paymentLink as string) ?? "#contact";
    const sitePlaybook = getPlaybook(
      (siteFoundation?.path as string) ?? ""
    );
    const ctaText = (lp.ctaCopy ?? lp.ctaText ?? lp.heroCtaText ?? sitePlaybook?.offer.coreOffer ?? "Get Started") as string;

    const blocks: object[] = [
      {
        type: "hero",
        data: {
          headline,
          subheadline,
          ctaText,
          ctaUrl: paymentUrl,
        },
      },
    ];

    if (Array.isArray(lp.trustElements) && (lp.trustElements as string[]).length > 0) {
      blocks.push({ type: "trust", data: { items: lp.trustElements } });
    } else if (Array.isArray(lp.trustBar) && (lp.trustBar as string[]).length > 0) {
      blocks.push({ type: "trust", data: { items: lp.trustBar } });
    }

    if (icp?.who || icp?.buyingTrigger) {
      blocks.push({
        type: "text",
        data: {
          headline: "Who This Is For",
          body: [icp.who, icp.psychographics, icp.buyingTrigger]
            .filter(Boolean)
            .join(". "),
        },
      });
    }

    if (offer?.coreOffer) {
      blocks.push({
        type: "text",
        data: {
          headline: "What You Get",
          body: [
            offer.coreOffer,
            offer.deliverable ? `**Deliverable:** ${offer.deliverable}` : null,
            offer.transformation
              ? `**Result:** ${offer.transformation}`
              : null,
            offer.pricing ? `**Investment:** ${offer.pricing}` : null,
          ]
            .filter(Boolean)
            .join("\n\n"),
        },
      });
    }

    if (Array.isArray(lp.benefitBullets) && (lp.benefitBullets as string[]).length > 0) {
      blocks.push({
        type: "features",
        data: {
          items: (lp.benefitBullets as string[]).map((item: string) => ({
            title: item,
            description: "",
          })),
        },
      });
    } else if (Array.isArray(lp.sections) && (lp.sections as string[]).length > 0) {
      blocks.push({
        type: "features",
        data: {
          items: (lp.sections as string[]).map((item: string) => ({
            title: item,
            description: "",
          })),
        },
      });
    }

    if (lp.socialProofGuidance) {
      blocks.push({
        type: "text",
        data: {
          headline: "What Others Are Saying",
          body: lp.socialProofGuidance as string,
        },
      });
    }

    if (
      Array.isArray(lp.faqItems) &&
      (lp.faqItems as { question: string; answer: string }[]).length > 0
    ) {
      blocks.push({
        type: "faq",
        data: { items: lp.faqItems },
      });
    }

    if (offer?.guarantee || lp.guaranteeText) {
      blocks.push({
        type: "text",
        data: {
          headline: "Our Guarantee",
          body: (offer?.guarantee ?? lp.guaranteeText) as string,
        },
      });
    }

    if (lp.urgencyLine) {
      blocks.push({
        type: "cta",
        data: {
          headline: lp.urgencyLine as string,
          ctaText: ctaText.replace("Get Started", "Get Started Now"),
          ctaUrl: paymentUrl,
        },
      });
    }

    if (generatedAssets.paymentLink) {
      blocks.push({
        type: "payment",
        data: {
          headline: "Ready to Start?",
          paymentUrl: generatedAssets.paymentLink,
          paymentLinkId: generatedAssets.paymentLinkId,
          price: offer?.pricing ?? "",
          buttonText: ctaText,
        },
      });
    }

    // Add playbook benchmarks as social proof if available
    if (sitePlaybook) {
      blocks.push({
        type: "stats",
        data: {
          items: [
            { value: sitePlaybook.benchmarks.avgROAS, label: "Avg ROAS" },
            { value: sitePlaybook.benchmarks.avgConversionRate, label: "Conversion Rate" },
            { value: sitePlaybook.benchmarks.monthsToProfit, label: "Time to Profit" },
          ],
        },
      });
    }

    blocks.push({
      type: "form",
      data: {
        headline: "Questions? Reach Out",
        fields: ["name", "email", "phone", "message"],
        siteId: site.id,
        submitUrl: "/api/forms/submit",
        enrollInFlow: true,
      },
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

    // Inject Himalaya tracking (always works, no pixel setup needed)
    await prisma.site.update({
      where: { id: site.id },
      data: {
        theme: {
          font: "Inter",
          primaryColor: sitePlaybook?.offer.structure ? "#06b6d4" : "#06b6d4",
          backgroundColor: "#050a14",
          textColor: "#ffffff",
          trackingScript: buildTrackingScript(trackingConfig),
          formTrackingScript: buildFormTrackingScript(trackingConfig),
          himalayaTrackingScript: buildHimalayaTrackingScript(site.id),
          hasTracking: true,
        },
      },
    }).catch(() => {});

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";
    results.site = {
      id: site.id,
      url: `/websites/${site.id}`,
      slug,
      publicUrl: `${appUrl}/s/${slug}`,
    } as { id: string; url: string };
  }

  if (shouldDeploy("emails") && assets) {
    // Try to use niche-specific email sequences from playbooks first
    const foundation = (run.rawSignals as Record<string, unknown> | null)?.foundation as Record<string, unknown> | undefined;
    const bizType = (foundation?.path as string) ?? run.mode ?? "";
    const playbook = getPlaybook(bizType);

    const sequences = (assets.emailSequences ?? {}) as Record<string, unknown>;
    let welcomeEmails = (sequences.welcome ?? []) as {
      subject: string;
      purpose?: string;
      preview?: string;
      body?: string;
      timing?: string;
    }[];

    // If playbook has proven sequences and generated ones are weak, use playbook
    if (playbook && (welcomeEmails.length < 3 || !welcomeEmails[0]?.body)) {
      welcomeEmails = playbook.emailSequence[0]?.emails.map(e => ({
        subject: e.subject,
        purpose: e.purpose,
        body: e.body,
        timing: `Day ${e.day}`,
      })) ?? welcomeEmails;
    }

    if (welcomeEmails.length > 0) {
      const nodes: object[] = [
        {
          id: "trigger_0",
          type: "trigger",
          data: { label: "New Signup / Form Submission" },
          position: { x: 250, y: 0 },
        },
      ];
      const edges: object[] = [];
      let prevId = "trigger_0";
      let yPos = 150;

      for (let i = 0; i < welcomeEmails.length; i++) {
        const email = welcomeEmails[i];
        const emailId = `email_${i}`;

        if (i > 0) {
          const delayId = `delay_${i}`;
          const dayMatch = email.timing?.match(/(\d+)/);
          const delayDays = dayMatch ? parseInt(dayMatch[1], 10) : i * 2;
          nodes.push({
            id: delayId,
            type: "delay",
            data: {
              delayValue: delayDays,
              delayUnit: "days",
              label: `Wait ${delayDays} day${delayDays > 1 ? "s" : ""}`,
            },
            position: { x: 250, y: yPos },
          });
          edges.push({
            id: `e_${prevId}_${delayId}`,
            source: prevId,
            target: delayId,
          });
          prevId = delayId;
          yPos += 100;
        }

        nodes.push({
          id: emailId,
          type: "email",
          data: {
            subject: email.subject,
            previewText: email.preview ?? email.purpose ?? "",
            body: email.body ?? `<p>${email.purpose ?? email.subject}</p>`,
            label: email.subject,
            timing: email.timing,
          },
          position: { x: 250, y: yPos },
        });
        edges.push({ id: `e_${prevId}_${emailId}`, source: prevId, target: emailId });
        prevId = emailId;
        yPos += 150;
      }

      const abandonedEmails = (sequences.abandonedCart ?? []) as typeof welcomeEmails;
      const postPurchaseEmails = (sequences.postPurchase ?? []) as typeof welcomeEmails;

      const flow = await prisma.emailFlow.create({
        data: {
          userId: input.userId,
          name: `${run.title ?? "Himalaya"} Welcome Sequence`,
          trigger: "signup",
          triggerConfig: { source: "himalaya", runId: run.id },
          status: "active",
          nodes: nodes as unknown as object,
          edges: edges as unknown as object,
        },
      });

      results.emails = { id: flow.id, url: `/emails/flows/${flow.id}` };

      if (abandonedEmails.length > 0) {
        const cartNodes: object[] = [
          {
            id: "trigger_0",
            type: "trigger",
            data: { label: "Cart Abandoned" },
            position: { x: 250, y: 0 },
          },
        ];
        const cartEdges: object[] = [];
        let cartPrevId = "trigger_0";
        let cartYPos = 150;

        for (let i = 0; i < abandonedEmails.length; i++) {
          const email = abandonedEmails[i];
          const emailId = `email_${i}`;

          if (i > 0) {
            const delayId = `delay_${i}`;
            const delayHours = i === 1 ? 24 : 48;
            cartNodes.push({
              id: delayId,
              type: "delay",
              data: {
                delayValue: delayHours,
                delayUnit: "hours",
                label: `Wait ${delayHours}h`,
              },
              position: { x: 250, y: cartYPos },
            });
            cartEdges.push({
              id: `e_${cartPrevId}_${delayId}`,
              source: cartPrevId,
              target: delayId,
            });
            cartPrevId = delayId;
            cartYPos += 100;
          }

          cartNodes.push({
            id: emailId,
            type: "email",
            data: {
              subject: email.subject,
              previewText: email.preview ?? "",
              body: email.body ?? "",
              label: email.subject,
            },
            position: { x: 250, y: cartYPos },
          });
          cartEdges.push({
            id: `e_${cartPrevId}_${emailId}`,
            source: cartPrevId,
            target: emailId,
          });
          cartPrevId = emailId;
          cartYPos += 150;
        }

        await prisma.emailFlow.create({
          data: {
            userId: input.userId,
            name: `${run.title ?? "Himalaya"} Abandoned Cart`,
            trigger: "cart_abandoned",
            triggerConfig: { source: "himalaya", runId: run.id },
            status: "active",
            nodes: cartNodes as unknown as object,
            edges: cartEdges as unknown as object,
          },
        });
      }

      if (postPurchaseEmails.length > 0) {
        const ppNodes: object[] = [
          {
            id: "trigger_0",
            type: "trigger",
            data: { label: "Purchase Completed" },
            position: { x: 250, y: 0 },
          },
        ];
        const ppEdges: object[] = [];
        let ppPrevId = "trigger_0";
        let ppYPos = 150;

        for (let i = 0; i < postPurchaseEmails.length; i++) {
          const email = postPurchaseEmails[i];
          const emailId = `email_${i}`;

          if (i > 0) {
            const delayId = `delay_${i}`;
            const dayMatch = email.timing?.match(/(\d+)/);
            const delayDays = dayMatch
              ? parseInt(dayMatch[1], 10)
              : (i + 1) * 3;
            ppNodes.push({
              id: delayId,
              type: "delay",
              data: {
                delayValue: delayDays,
                delayUnit: "days",
                label: `Wait ${delayDays} days`,
              },
              position: { x: 250, y: ppYPos },
            });
            ppEdges.push({
              id: `e_${ppPrevId}_${delayId}`,
              source: ppPrevId,
              target: delayId,
            });
            ppPrevId = delayId;
            ppYPos += 100;
          }

          ppNodes.push({
            id: emailId,
            type: "email",
            data: {
              subject: email.subject,
              previewText: email.preview ?? "",
              body: email.body ?? "",
              label: email.subject,
            },
            position: { x: 250, y: ppYPos },
          });
          ppEdges.push({
            id: `e_${ppPrevId}_${emailId}`,
            source: ppPrevId,
            target: emailId,
          });
          ppPrevId = emailId;
          ppYPos += 150;
        }

        await prisma.emailFlow.create({
          data: {
            userId: input.userId,
            name: `${run.title ?? "Himalaya"} Post-Purchase`,
            trigger: "purchase",
            triggerConfig: { source: "himalaya", runId: run.id },
            status: "active",
            nodes: ppNodes as unknown as object,
            edges: ppEdges as unknown as object,
          },
        });
      }
    }
  }

  let qaReport: ReturnType<typeof runDeploymentQA> | null = null;
  if (results.site) {
    try {
      const sitePages = await prisma.sitePage.findMany({
        where: { siteId: results.site.id },
        orderBy: { order: "asc" },
      });
      const homeBlocks = (sitePages[0]?.blocks ?? []) as {
        type: string;
        data: Record<string, unknown>;
      }[];
      qaReport = runDeploymentQA(run.title ?? "Site", results.site.id, homeBlocks);
    } catch {
      // QA is non-blocking.
    }
  }

  try {
    const existingCount = await prisma.himalayaDeployment.count({
      where: { analysisRunId: input.runId, userId: input.userId },
    });

    await prisma.himalayaDeployment.create({
      data: {
        userId: input.userId,
        analysisRunId: input.runId,
        siteId: results.site?.id ?? null,
        campaignId: results.campaign?.id ?? null,
        emailFlowId: results.emails?.id ?? null,
        version: existingCount + 1,
        qaScore: qaReport?.score ?? null,
        qaReport: qaReport ? JSON.parse(JSON.stringify(qaReport)) : undefined,
        sections: {
          blocks: "saved",
          generatedAssets: {
            hasImages: !!generatedAssets.adImages,
            imageCount: ((generatedAssets.adImages as unknown[]) ?? []).length,
            hasVideo: !!generatedAssets.adVideo,
            hasPaymentLink: !!generatedAssets.paymentLink,
            hasTracking: !!(
              trackingConfig.metaPixelId || trackingConfig.googleAnalyticsId
            ),
          },
        },
      },
    });
  } catch {
    // Deployment record is non-blocking.
  }

  await incrementUsage(input.userId, "deploysUsed").catch(() => {});

  return {
    ok: true,
    deployed: results,
    qa: qaReport,
    generated: {
      adImages: ((generatedAssets.adImages as unknown[]) ?? []).length,
      adVideo: !!generatedAssets.adVideo,
      paymentLink: (generatedAssets.paymentLink as string | null) ?? null,
      trackingEnabled: !!(
        trackingConfig.metaPixelId || trackingConfig.googleAnalyticsId
      ),
      emailFlowsCreated: shouldDeploy("emails") ? 3 : 0,
    },
  };
}
