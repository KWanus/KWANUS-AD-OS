import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { runDeploymentQA } from "@/lib/himalaya/deploymentQA";
import { getUserAccess, incrementUsage } from "@/lib/himalaya/access";
import { generateImages, buildAdImagePrompts } from "@/lib/integrations/imageGeneration";
import { generateVideo, adBriefToVideoInput } from "@/lib/integrations/videoGeneration";
import { createPaymentLink, parsePriceToCents } from "@/lib/integrations/stripePayments";
import { buildTrackingScript, buildFormTrackingScript, type TrackingConfig } from "@/lib/integrations/trackingPixels";
import { enrollContact } from "@/lib/integrations/emailFlowEngine";

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
    const generatedAssets: Record<string, unknown> = {};

    // ── Load user's tracking pixel config ──────────────────────────────
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { metaPixelId: true, googleAnalyticsId: true, tiktokPixelId: true, sendingFromEmail: true, sendingFromName: true, sendingDomain: true },
    });
    const trackingConfig: TrackingConfig = {
      metaPixelId: dbUser?.metaPixelId,
      googleAnalyticsId: dbUser?.googleAnalyticsId,
      tiktokPixelId: dbUser?.tiktokPixelId,
    };

    // ══════════════════════════════════════════════════════════════════
    // PHASE 1: GENERATE AI ASSETS (images, videos — run in parallel)
    // ══════════════════════════════════════════════════════════════════

    const aiGenerationPromises: Promise<void>[] = [];

    // Generate ad creative images
    if (shouldDeploy("campaign") && assets) {
      aiGenerationPromises.push(
        (async () => {
          try {
            const imagePrompts = buildAdImagePrompts({
              productName: run.title ?? "Product",
              audience: (packet?.audience as string) ?? "customers",
              painPoint: ((packet?.painDesire as string) ?? "").split("→")[0]?.trim() ?? "problems",
              outcome: ((packet?.painDesire as string) ?? "").split("→")[1]?.trim() ?? "results",
              angle: (packet?.angle as string) ?? "unique approach",
              mode: run.mode === "consultant" ? "consultant" : "operator",
            });
            const imageResult = await generateImages(imagePrompts);
            if (imageResult.ok) {
              generatedAssets.adImages = imageResult.images;
            }
          } catch {
            // Image gen is non-blocking
          }
        })()
      );
    }

    // Generate ad videos from briefs
    if (shouldDeploy("campaign") && assets?.adBriefs) {
      aiGenerationPromises.push(
        (async () => {
          try {
            const briefs = (assets.adBriefs ?? []) as { title: string; platform: string; scenes: { timestamp: string; textOverlay: string; audio: string }[]; productionKit: { colorGrade: string } }[];
            // Generate video for the first brief only (others are too expensive to generate all at once)
            if (briefs.length > 0) {
              const videoInput = adBriefToVideoInput(briefs[0]);
              const videoResult = await generateVideo(videoInput);
              if (videoResult.ok && videoResult.video) {
                generatedAssets.adVideo = videoResult.video;
              }
            }
          } catch {
            // Video gen is non-blocking
          }
        })()
      );
    }

    // Create Stripe payment link if pricing is available
    if (shouldDeploy("site")) {
      aiGenerationPromises.push(
        (async () => {
          try {
            const foundation = (run.rawSignals as Record<string, unknown> | null)?.foundation as Record<string, unknown> | undefined;
            const offer = foundation?.offerDirection as Record<string, string> | undefined;
            const pricing = offer?.pricing;
            if (pricing) {
              const cents = parsePriceToCents(pricing);
              if (cents && cents > 0) {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";
                const linkResult = await createPaymentLink({
                  productName: run.title ?? "Product",
                  description: offer?.coreOffer,
                  priceInCents: cents,
                  successUrl: `${appUrl}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
                  metadata: { runId: run.id, userId: user.id },
                });
                if (linkResult.ok) {
                  generatedAssets.paymentLink = linkResult.url;
                  generatedAssets.paymentLinkId = linkResult.paymentLinkId;
                }
              }
            }
          } catch {
            // Payment link creation is non-blocking
          }
        })()
      );
    }

    // Wait for all AI generation to complete
    await Promise.allSettled(aiGenerationPromises);

    // ══════════════════════════════════════════════════════════════════
    // PHASE 2: DEPLOY CAMPAIGN (with real images + videos)
    // ══════════════════════════════════════════════════════════════════

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
      const adImages = (generatedAssets.adImages ?? []) as { base64: string; prompt: string; model: string }[];

      for (let i = 0; i < hooks.length; i++) {
        await prisma.adVariation.create({
          data: {
            campaignId: campaign.id,
            name: `Hook ${i + 1}: ${hooks[i].format}`,
            type: "hook",
            content: {
              format: hooks[i].format,
              hook: hooks[i].hook,
              // Attach generated image if available
              ...(adImages[i] && { imageBase64: adImages[i].base64, imageModel: adImages[i].model }),
            } as object,
            platform: hooks[i].format,
            sortOrder: i,
          },
        });
      }

      // Create ad variations from scripts
      const scripts = (assets.adScripts ?? []) as { title: string; duration: string; sections: unknown[] }[];
      const adVideo = generatedAssets.adVideo as { url?: string; format: string; model: string } | undefined;

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
              // Attach generated video to first script
              ...(i === 0 && adVideo?.url && { videoUrl: adVideo.url, videoModel: adVideo.model }),
            } as object,
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

    // ══════════════════════════════════════════════════════════════════
    // PHASE 3: DEPLOY SITE (with payment link + tracking pixels + smart form)
    // ══════════════════════════════════════════════════════════════════

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
            // Inject tracking pixels into theme config
            trackingScript: buildTrackingScript(trackingConfig),
            formTrackingScript: buildFormTrackingScript(trackingConfig),
            hasTracking: !!(trackingConfig.metaPixelId || trackingConfig.googleAnalyticsId),
          },
          published: false,
        },
      });

      // Build page blocks with enriched content
      const lp = (assets?.landingPage ?? {}) as Record<string, unknown>;
      const foundation = (run.rawSignals as Record<string, unknown> | null)?.foundation as Record<string, unknown> | undefined;
      const headline = (lp.headline ?? run.title ?? "") as string;
      const subheadline = (lp.subheadline ?? run.summary ?? "") as string;
      const offer = foundation?.offerDirection as Record<string, string> | undefined;
      const icp = foundation?.idealCustomer as Record<string, string> | undefined;
      const paymentUrl = (generatedAssets.paymentLink as string) ?? "#contact";
      const ctaText = (lp.ctaCopy ?? lp.ctaText ?? lp.heroCtaText ?? "Get Started") as string;

      const blocks: object[] = [
        // Hero with payment link
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

      // Trust bar
      if (Array.isArray(lp.trustElements) && (lp.trustElements as string[]).length > 0) {
        blocks.push({ type: "trust", data: { items: lp.trustElements } });
      } else if (Array.isArray(lp.trustBar) && (lp.trustBar as string[]).length > 0) {
        blocks.push({ type: "trust", data: { items: lp.trustBar } });
      }

      // Who this is for
      if (icp?.who || icp?.buyingTrigger) {
        blocks.push({
          type: "text",
          data: {
            headline: "Who This Is For",
            body: [icp.who, icp.psychographics, icp.buyingTrigger].filter(Boolean).join(". "),
          },
        });
      }

      // What you get (offer section with pricing)
      if (offer?.coreOffer) {
        blocks.push({
          type: "text",
          data: {
            headline: "What You Get",
            body: [
              offer.coreOffer,
              offer.deliverable ? `**Deliverable:** ${offer.deliverable}` : null,
              offer.transformation ? `**Result:** ${offer.transformation}` : null,
              offer.pricing ? `**Investment:** ${offer.pricing}` : null,
            ].filter(Boolean).join("\n\n"),
          },
        });
      }

      // Features/benefits
      if (Array.isArray(lp.benefitBullets) && (lp.benefitBullets as string[]).length > 0) {
        blocks.push({
          type: "features",
          data: { items: (lp.benefitBullets as string[]).map((s: string) => ({ title: s, description: "" })) },
        });
      } else if (Array.isArray(lp.sections) && (lp.sections as string[]).length > 0) {
        blocks.push({
          type: "features",
          data: { items: (lp.sections as string[]).map((s: string) => ({ title: s, description: "" })) },
        });
      }

      // Social proof guidance
      if (lp.socialProofGuidance) {
        blocks.push({
          type: "text",
          data: {
            headline: "What Others Are Saying",
            body: lp.socialProofGuidance as string,
          },
        });
      }

      // FAQ
      if (Array.isArray(lp.faqItems) && (lp.faqItems as { question: string; answer: string }[]).length > 0) {
        blocks.push({
          type: "faq",
          data: { items: lp.faqItems },
        });
      }

      // Guarantee
      if (offer?.guarantee || lp.guaranteeText) {
        blocks.push({
          type: "text",
          data: { headline: "Our Guarantee", body: (offer?.guarantee ?? lp.guaranteeText) as string },
        });
      }

      // Urgency + CTA with payment link
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

      // Payment block (if Stripe link exists)
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

      // Contact form (always present as fallback / lead capture)
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

      results.site = { id: site.id, url: `/websites/${site.id}` };
    }

    // ══════════════════════════════════════════════════════════════════
    // PHASE 4: DEPLOY EMAIL FLOW (full copy, ready to send via Resend)
    // ══════════════════════════════════════════════════════════════════

    if (shouldDeploy("emails") && assets) {
      const es = (assets.emailSequences ?? {}) as Record<string, unknown>;
      const welcomeEmails = (es.welcome ?? []) as { subject: string; purpose?: string; preview?: string; body?: string; timing?: string }[];

      if (welcomeEmails.length > 0) {
        const nodes: object[] = [
          { id: "trigger_0", type: "trigger", data: { label: "New Signup / Form Submission" }, position: { x: 250, y: 0 } },
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

          // Add email node with FULL body copy (not just purpose)
          nodes.push({
            id: emailId, type: "email",
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

        // Also add abandoned cart and post-purchase flows as separate sections
        const abandonedEmails = (es.abandonedCart ?? []) as typeof welcomeEmails;
        const postPurchaseEmails = (es.postPurchase ?? []) as typeof welcomeEmails;

        // Create main welcome flow
        const flow = await prisma.emailFlow.create({
          data: {
            userId: user.id,
            name: `${run.title ?? "Himalaya"} Welcome Sequence`,
            trigger: "signup",
            triggerConfig: { source: "himalaya", runId: run.id },
            status: "active", // Active by default — ready to send immediately
            nodes: nodes as unknown as object,
            edges: edges as unknown as object,
          },
        });

        results.emails = { id: flow.id, url: `/emails/flows/${flow.id}` };

        // Create abandoned cart flow if available
        if (abandonedEmails.length > 0) {
          const cartNodes: object[] = [
            { id: "trigger_0", type: "trigger", data: { label: "Cart Abandoned" }, position: { x: 250, y: 0 } },
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
                id: delayId, type: "delay",
                data: { delayValue: delayHours, delayUnit: "hours", label: `Wait ${delayHours}h` },
                position: { x: 250, y: cartYPos },
              });
              cartEdges.push({ id: `e_${cartPrevId}_${delayId}`, source: cartPrevId, target: delayId });
              cartPrevId = delayId;
              cartYPos += 100;
            }

            cartNodes.push({
              id: emailId, type: "email",
              data: { subject: email.subject, previewText: email.preview ?? "", body: email.body ?? "", label: email.subject },
              position: { x: 250, y: cartYPos },
            });
            cartEdges.push({ id: `e_${cartPrevId}_${emailId}`, source: cartPrevId, target: emailId });
            cartPrevId = emailId;
            cartYPos += 150;
          }

          await prisma.emailFlow.create({
            data: {
              userId: user.id,
              name: `${run.title ?? "Himalaya"} Abandoned Cart`,
              trigger: "cart_abandoned",
              triggerConfig: { source: "himalaya", runId: run.id },
              status: "active",
              nodes: cartNodes as unknown as object,
              edges: cartEdges as unknown as object,
            },
          });
        }

        // Create post-purchase flow if available
        if (postPurchaseEmails.length > 0) {
          const ppNodes: object[] = [
            { id: "trigger_0", type: "trigger", data: { label: "Purchase Completed" }, position: { x: 250, y: 0 } },
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
              const delayDays = dayMatch ? parseInt(dayMatch[1]) : (i + 1) * 3;
              ppNodes.push({
                id: delayId, type: "delay",
                data: { delayValue: delayDays, delayUnit: "days", label: `Wait ${delayDays} days` },
                position: { x: 250, y: ppYPos },
              });
              ppEdges.push({ id: `e_${ppPrevId}_${delayId}`, source: ppPrevId, target: delayId });
              ppPrevId = delayId;
              ppYPos += 100;
            }

            ppNodes.push({
              id: emailId, type: "email",
              data: { subject: email.subject, previewText: email.preview ?? "", body: email.body ?? "", label: email.subject },
              position: { x: 250, y: ppYPos },
            });
            ppEdges.push({ id: `e_${ppPrevId}_${emailId}`, source: ppPrevId, target: emailId });
            ppPrevId = emailId;
            ppYPos += 150;
          }

          await prisma.emailFlow.create({
            data: {
              userId: user.id,
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

    // ══════════════════════════════════════════════════════════════════
    // PHASE 5: QA + DEPLOYMENT RECORD + USAGE TRACKING
    // ══════════════════════════════════════════════════════════════════

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

    // Save deployment record
    try {
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
          sections: {
            blocks: "saved",
            generatedAssets: {
              hasImages: !!generatedAssets.adImages,
              imageCount: ((generatedAssets.adImages as unknown[]) ?? []).length,
              hasVideo: !!generatedAssets.adVideo,
              hasPaymentLink: !!generatedAssets.paymentLink,
              hasTracking: !!(trackingConfig.metaPixelId || trackingConfig.googleAnalyticsId),
            },
          },
        },
      });
    } catch {
      // deployment record is non-blocking
    }

    // Track usage
    await incrementUsage(user.id, "deploysUsed").catch(() => {});

    return NextResponse.json({
      ok: true,
      deployed: results,
      qa: qaReport,
      generated: {
        adImages: ((generatedAssets.adImages as unknown[]) ?? []).length,
        adVideo: !!generatedAssets.adVideo,
        paymentLink: generatedAssets.paymentLink ?? null,
        trackingEnabled: !!(trackingConfig.metaPixelId || trackingConfig.googleAnalyticsId),
        emailFlowsCreated: shouldDeploy("emails") ? 3 : 0, // welcome + abandoned cart + post-purchase
      },
    });
  } catch (err) {
    console.error("Deploy error:", err);
    return NextResponse.json({ ok: false, error: "Deploy failed" }, { status: 500 });
  }
}
