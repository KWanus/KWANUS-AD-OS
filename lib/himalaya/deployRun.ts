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

  // 🔥 CRITICAL: Extract foundation data from rawSignals (product-specific data from research)
  const rawSignals = run.rawSignals as Record<string, unknown> | null;
  const foundation = rawSignals?.foundation as {
    path?: string;
    pathLabel?: string;
    businessProfile?: {
      businessType?: string;
      niche?: string;
      targetCustomer?: string;
      painPoint?: string;
      uniqueAngle?: string;
    };
    idealCustomer?: {
      who?: string;
      demographics?: string;
      psychographics?: string;
      whereToBuy?: string;
      buyingTrigger?: string;
    };
    offerDirection?: {
      coreOffer?: string;
      pricing?: string;
      deliverable?: string;
      transformation?: string;
      guarantee?: string;
    };
    websiteBlueprint?: {
      headline?: string;
      subheadline?: string;
      heroCtaText?: string;
      sections?: string[];
      trustElements?: string[];
      urgencyLine?: string;
    };
    marketingAngles?: Array<{
      hook: string;
      angle: string;
      platform: string;
    }>;
    emailSequence?: Array<{
      subject: string;
      purpose: string;
      timing: string;
    }>;
    actionRoadmap?: Array<{
      phase: string;
      timeframe: string;
      tasks: string[];
    }>;
  } | undefined;

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
    // Extract product-specific naming from foundation
    const productName = foundation?.offerDirection?.coreOffer?.split(" and earn")[0] ??
                       foundation?.websiteBlueprint?.headline?.split(":")[0] ??
                       run.title ??
                       "Product";
    const campaignName = `${foundation?.pathLabel ?? "Campaign"}: ${productName}`;

    const campaign = await prisma.campaign.create({
      data: {
        userId: input.userId,
        name: campaignName,
        mode: run.mode,
        productName: productName,
        productUrl: run.inputUrl,
        status: "draft",
        workflowState: "elite",
        analysisRunId: run.id,
      },
    });

    // 🔥 PRIORITY 1: Use foundation.marketingAngles (product-specific from research)
    let hooks: { format: string; hook: string; platform?: string }[] = [];

    if (foundation?.marketingAngles && foundation.marketingAngles.length > 0) {
      console.log(`[Deploy] Using ${foundation.marketingAngles.length} product-specific marketing angles from foundation`);
      hooks = foundation.marketingAngles.map(a => ({
        format: a.angle,
        hook: a.hook,
        platform: a.platform,
      }));
    } else {
      // Fallback to generic assets if no foundation data
      hooks = (assets.adHooks ?? []) as { format: string; hook: string }[];
    }

    const adImages = (generatedAssets.adImages ?? []) as {
      base64: string;
      prompt: string;
      model: string;
    }[];

    // PRIORITY 2: Inject proven ad angles from playbook if we still need more
    const campaignPlaybook = getPlaybook(foundation?.path ?? "");
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
          primaryColor: "#f5a623",
          backgroundColor: "#0c0a08",
          textColor: "#ffffff",
          trackingScript: buildTrackingScript(trackingConfig),
          formTrackingScript: buildFormTrackingScript(trackingConfig),
          himalayaTrackingScript: "", // placeholder — set after site.id is known
          hasTracking: true, // Himalaya tracking always works, no pixel needed
        },
        published: true, // Auto-publish like Shopify — site is immediately accessible
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
        props: {
          title: headline,
          subtitle: subheadline,
          buttonText: ctaText,
          buttonUrl: paymentUrl,
          socialProofText: sitePlaybook ? `Trusted by ${sitePlaybook.niche} professionals` : "Trusted by thousands",
          trustItems: ["✓ Satisfaction Guaranteed", "✓ Secure Checkout", "✓ Fast Results"],
        },
      },
    ];

    // Trust bar — always show something
    if (Array.isArray(lp.trustElements) && (lp.trustElements as string[]).length > 0) {
      blocks.push({ type: "trust", data: { items: lp.trustElements } });
    } else if (Array.isArray(lp.trustBar) && (lp.trustBar as string[]).length > 0) {
      blocks.push({ type: "trust", data: { items: lp.trustBar } });
    } else {
      blocks.push({ type: "trust", data: { items: ["100% Satisfaction Guarantee", "Secure Checkout", "Fast Results", "24/7 Support"] } });
    }

    // Problem section — agitate the pain (from playbook if available)
    if (sitePlaybook) {
      blocks.push({
        type: "text",
        props: {
          title: "Sound Familiar?",
          body: sitePlaybook.mistakes.slice(0, 3).map(m => `❌ ${m}`).join("\n\n") + "\n\nIf any of this resonates, you're in the right place.",
        },
      });
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

    // Guarantee — always show one
    const guaranteeText = (offer?.guarantee ?? lp.guaranteeText ?? sitePlaybook?.offer.guarantee ?? "30-day money-back guarantee. If you're not satisfied, we'll refund every penny. No questions asked.") as string;
    blocks.push({
      type: "text",
      props: {
        title: "Our Guarantee",
        body: `🛡️ ${guaranteeText}`,
      },
    });

    // Testimonials from playbook
    if (sitePlaybook?.emailSequence[0]?.emails.length) {
      blocks.push({
        type: "testimonials",
        props: {
          title: "What People Are Saying",
          items: [
            { name: "Sarah K.", text: "This changed everything for me. I was skeptical but the results speak for themselves.", rating: 5 },
            { name: "Michael R.", text: "I tried 4 different solutions before this. Nothing else even came close.", rating: 5 },
            { name: "Jennifer L.", text: "Simple, effective, and the support is incredible. Highly recommend.", rating: 5 },
          ],
        },
      });
    }

    // Final CTA with urgency — always show
    blocks.push({
      type: "cta",
      props: {
        title: (lp.urgencyLine as string) ?? "Ready to Get Started?",
        subtitle: "Join thousands of people who stopped overthinking and started seeing results.",
        buttonText: ctaText.replace("Get Started", "Get Started Now"),
        buttonUrl: paymentUrl,
      },
    });

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

    // Business-type-specific blocks
    const bizProfile = await prisma.businessProfile.findUnique({
      where: { userId: input.userId },
      select: { businessType: true },
    }).catch(() => null);

    const siteAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";

    if (bizProfile?.businessType === "local_service") {
      blocks.push({
        type: "trust_badges",
        props: {
          headline: "Why Choose Us",
          badges: [
            "Licensed & Insured",
            "5-Star Google Rating",
            "Same-Day Service Available",
            "Free Estimates",
            "100% Satisfaction Guarantee",
          ],
        },
      });
    }

    if (bizProfile?.businessType === "dropship") {
      blocks.push({
        type: "products",
        props: {
          headline: "Our Products",
          siteId: site.id,
        },
      });
    }

    if (bizProfile?.businessType === "consultant_coach") {
      blocks.push({
        type: "booking",
        props: {
          headline: "Book a Free Strategy Session",
          subheadline: "30 minutes. No obligation. Let's see how I can help.",
          bookingUrl: `${siteAppUrl}/book/${input.userId}`,
          buttonText: "Book My Free Session",
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
          primaryColor: sitePlaybook?.offer.structure ? "#f5a623" : "#f5a623",
          backgroundColor: "#0c0a08",
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
    // 🔥 PRIORITY 1: Use foundation.emailSequence (product-specific from research)
    const bizType = foundation?.path ?? run.mode ?? "";
    const playbook = getPlaybook(bizType);

    let welcomeEmails: {
      subject: string;
      purpose?: string;
      preview?: string;
      body?: string;
      timing?: string;
    }[] = [];

    if (foundation?.emailSequence && foundation.emailSequence.length > 0) {
      console.log(`[Deploy] Using ${foundation.emailSequence.length} product-specific emails from foundation`);
      welcomeEmails = foundation.emailSequence.map(e => ({
        subject: e.subject,
        purpose: e.purpose,
        preview: e.purpose,
        body: `<p><strong>${e.purpose}</strong></p><p>${e.timing}</p>`,
        timing: e.timing,
      }));
    } else {
      // PRIORITY 2: Fallback to generic assets
      const sequences = (assets.emailSequences ?? {}) as Record<string, unknown>;
      welcomeEmails = (sequences.welcome ?? []) as {
        subject: string;
        purpose?: string;
        preview?: string;
        body?: string;
        timing?: string;
      }[];

      // PRIORITY 3: If playbook has proven sequences and generated ones are weak, use playbook
      if (playbook && (welcomeEmails.length < 3 || !welcomeEmails[0]?.body)) {
        welcomeEmails = playbook.emailSequence[0]?.emails.map(e => ({
          subject: e.subject,
          purpose: e.purpose,
          body: e.body,
          timing: `Day ${e.day}`,
        })) ?? welcomeEmails;
      }
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

      // Use provided sequences or generate proven defaults
      const businessName = run.title ?? "us";
      const abandonedEmails = ((sequences.abandonedCart ?? []) as typeof welcomeEmails).length > 0
        ? (sequences.abandonedCart as typeof welcomeEmails)
        : [
            {
              subject: `Did something go wrong?`,
              purpose: "Cart recovery — gentle reminder",
              body: `Hey there,\n\nLooks like you started checking out but didn't finish. No worries — your cart is still saved.\n\nIf you had any questions or ran into an issue, just reply to this email and we'll help.\n\nOtherwise, you can pick up where you left off anytime.\n\n— The ${businessName} Team`,
              timing: "1 hour after cart abandoned",
            },
            {
              subject: `Your cart is about to expire`,
              purpose: "Urgency — create time pressure",
              body: `Hey,\n\nJust a heads up — we can only hold your cart for a limited time.\n\nWe don't want you to miss out. Hundreds of people have already made this same decision and seen real results.\n\nClick below to complete your order before it expires.\n\n— The ${businessName} Team`,
              timing: "24 hours after cart abandoned",
            },
            {
              subject: `Last chance — this is going away`,
              purpose: "Final push with social proof",
              body: `This is the last time we'll bug you about this.\n\nYour cart is about to be cleared. If now isn't the right time, no hard feelings.\n\nBut if the only thing stopping you was a question or concern — reply to this email. We answer every one.\n\nHundreds of people chose to move forward. The ones who did are already seeing results.\n\n— The ${businessName} Team`,
              timing: "48 hours after cart abandoned",
            },
          ];

      const postPurchaseEmails = ((sequences.postPurchase ?? []) as typeof welcomeEmails).length > 0
        ? (sequences.postPurchase as typeof welcomeEmails)
        : [
            {
              subject: `You're in! Here's what happens next`,
              purpose: "Order confirmation + set expectations",
              body: `Welcome! Your order is confirmed.\n\nHere's what happens next:\n1. Check your email for access details (arriving shortly)\n2. Get started with the quick-start guide\n3. Reach out if you need anything — we're here\n\nYou made a great decision. Let's make sure you get the most out of it.\n\n— The ${businessName} Team`,
              timing: "Immediately after purchase",
            },
            {
              subject: `Quick tip to get results faster`,
              purpose: "Engagement — prevent buyer's remorse",
              body: `Hey,\n\nMost people who get the best results do one thing in their first 48 hours: they actually start.\n\nSounds obvious, but the #1 reason people don't see results isn't the product — it's procrastination.\n\nOpen it up today. Spend 15 minutes. You'll be ahead of 90% of people who bought.\n\n— The ${businessName} Team`,
              timing: "2 days after purchase",
            },
            {
              subject: `How's it going? (Quick check-in)`,
              purpose: "Retention + upsell opportunity",
              body: `Hey,\n\nJust checking in — how's everything going?\n\nIf you've hit any snags, reply to this email and we'll sort it out.\n\nIf things are going well, we'd love a quick review. It helps us help more people like you.\n\nAnd if you're ready for the next level — we've got something coming that you'll want to see first.\n\n— The ${businessName} Team`,
              timing: "7 days after purchase",
            },
          ];

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
