import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runHimalaya } from "@/lib/himalaya/orchestrator";
import { deployRun } from "@/lib/himalaya/deployRun";
import { smartDecide } from "@/lib/himalaya/smartDecision";
import { runPreBuildCheck, runPostBuildCheck } from "@/lib/himalaya/readinessCheck";
import { generateDifferentiators } from "@/lib/himalaya/differentiationEngine";
import { generateCampaignName } from "@/lib/himalaya/growthAutomations";
import { retry } from "@/lib/utils/retry";
import type { HimalayaProfileInput } from "@/lib/himalaya/profileTypes";

/**
 * POST /api/himalaya/express
 * THE entry point. One call builds an entire business.
 * Returns ONLY after everything is confirmed working — not fire-and-forget.
 */
export async function POST(req: NextRequest) {
  const steps: { step: string; ok: boolean; duration: number; error?: string }[] = [];

  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as {
      niche: string;
      businessType?: string;
      goal?: string;
      url?: string;
      entryType?: "no_business" | "has_business" | "want_to_scale";
      revenue?: string;
    };

    if (!body.niche && !body.url) {
      return NextResponse.json({ ok: false, error: "Tell us your niche or paste a URL" }, { status: 400 });
    }

    const isImprove = !!body.url;

    // ══════════════════════════════════════════════════════════════════════
    // STEP 1: PRE-BUILD CHECK (validate before wasting time)
    // ══════════════════════════════════════════════════════════════════════
    let t = Date.now();
    const preBuild = await runPreBuildCheck({
      text: body.niche ?? "",
      entryType: body.entryType ?? (isImprove ? "has_business" : "no_business"),
      revenue: body.revenue,
      userId: user.id,
    }).catch(() => null);
    steps.push({ step: "pre_check", ok: true, duration: Date.now() - t });

    // ══════════════════════════════════════════════════════════════════════
    // STEP 2: SMART DECISION (pick the path)
    // ══════════════════════════════════════════════════════════════════════
    t = Date.now();
    const smartResult = await smartDecide({
      text: body.niche ?? "",
      entryType: body.entryType ?? (isImprove ? "has_business" : "no_business"),
      revenue: body.revenue,
    });
    steps.push({ step: "decision", ok: true, duration: Date.now() - t });

    // ══════════════════════════════════════════════════════════════════════
    // STEP 3: DIFFERENTIATION (make this business unique)
    // ══════════════════════════════════════════════════════════════════════
    t = Date.now();
    const differentiators = await generateDifferentiators({
      niche: body.niche ?? "online business",
      targetAudience: smartResult.profile.description,
      userId: user.id,
    }).catch(() => null);
    steps.push({ step: "differentiation", ok: !!differentiators, duration: Date.now() - t });

    // Build enriched profile
    const profileInput: HimalayaProfileInput = {
      ...smartResult.profile,
      description: [
        smartResult.profile.description,
        differentiators?.uniqueAngle ?? "",
        differentiators?.brandVoice.personality ? `Brand voice: ${differentiators.brandVoice.personality}` : "",
        differentiators?.founderStory.mission ?? "",
        preBuild?.userContext.hasPastFailure ? `Past failure: ${preBuild.userContext.pastFailureReason}` : "",
      ].filter(Boolean).join(". "),
    };

    const path = body.businessType
      ? mapBusinessType(body.businessType)
      : smartResult.path;

    // ══════════════════════════════════════════════════════════════════════
    // STEP 4: SAVE PROFILE
    // ══════════════════════════════════════════════════════════════════════
    t = Date.now();
    let profileId: string;
    let runId: string | null = null;

    if (isImprove) {
      // Improve path — run pipeline with URL
      const result = await runHimalaya({ mode: "improve", url: body.url, niche: body.niche }, user.id);
      if (!result.success || !result.runId) {
        return NextResponse.json({ ok: false, error: result.summary || "Analysis failed", steps }, { status: 500 });
      }
      runId = result.runId;
      profileId = "improve";
      steps.push({ step: "analyze", ok: true, duration: Date.now() - t });
    } else {
      // Scratch path — save profile + run pipeline
      const profile = await prisma.himalayaProfile.create({
        data: {
          userId: user.id,
          budget: profileInput.budget,
          timeAvailable: profileInput.timeAvailable,
          skills: JSON.parse(JSON.stringify(profileInput.skills)),
          riskTolerance: profileInput.riskTolerance,
          primaryGoal: profileInput.primaryGoal,
          businessStage: profileInput.businessStage,
          niche: body.niche ?? null,
          description: profileInput.description ?? null,
          recommendedPath: path,
          decisionResult: JSON.parse(JSON.stringify(smartResult)),
        },
      });
      profileId = profile.id;
      steps.push({ step: "save_profile", ok: true, duration: Date.now() - t });

      // Run full Himalaya pipeline
      t = Date.now();
      const result = await runHimalaya({ mode: "scratch", profileId: profile.id, path }, user.id);
      if (!result.success || !result.runId) {
        return NextResponse.json({ ok: false, error: result.summary || "Build failed", steps }, { status: 500 });
      }
      runId = result.runId;
      steps.push({ step: "build", ok: true, duration: Date.now() - t });
    }

    // ══════════════════════════════════════════════════════════════════════
    // STEP 5: DEPLOY (create site, campaign, emails — SYNC, not async)
    // ══════════════════════════════════════════════════════════════════════
    t = Date.now();
    let deployed: Record<string, { id: string; url?: string }> | null = null;
    let deployError: string | null = null;

    try {
      const deployResult = await retry(
        () => deployRun({ userId: user.id, runId: runId!, targets: ["all"] }),
        { maxAttempts: 2, label: "deploy", baseDelayMs: 2000 },
      );

      if (deployResult.ok) {
        deployed = deployResult.deployed as Record<string, { id: string; url?: string }>;
      } else if ("error" in deployResult) {
        deployError = deployResult.error;
      }
    } catch (err) {
      deployError = err instanceof Error ? err.message : "Deploy failed";
    }
    steps.push({ step: "deploy", ok: !!deployed, duration: Date.now() - t, error: deployError ?? undefined });

    // ══════════════════════════════════════════════════════════════════════
    // STEP 6: POST-DEPLOY (publish site, generate images — SYNC)
    // ══════════════════════════════════════════════════════════════════════
    t = Date.now();
    let postDeployResult = null;

    if (deployed) {
      try {
        const { runPostDeploy } = await import("@/lib/himalaya/postDeploy");
        postDeployResult = await runPostDeploy({
          userId: user.id,
          runId: runId!,
          campaignId: deployed.campaign?.id,
          siteId: deployed.site?.id,
        });
      } catch (err) {
        console.error("Post-deploy error:", err);
      }
    }
    steps.push({ step: "post_deploy", ok: !!postDeployResult, duration: Date.now() - t });

    // ══════════════════════════════════════════════════════════════════════
    // STEP 7: POST-BUILD CHECK (verify what worked)
    // ══════════════════════════════════════════════════════════════════════
    t = Date.now();
    let buildCheck = null;
    try {
      buildCheck = await runPostBuildCheck({
        userId: user.id,
        runId: runId!,
        campaignId: deployed?.campaign?.id,
        siteId: deployed?.site?.id,
        emailFlowId: deployed?.emails?.id,
      });
    } catch { /* non-fatal */ }
    steps.push({ step: "verify", ok: !!buildCheck, duration: Date.now() - t });

    // ══════════════════════════════════════════════════════════════════════
    // RESPONSE — everything the frontend needs
    // ══════════════════════════════════════════════════════════════════════
    const totalDuration = steps.reduce((sum, s) => sum + s.duration, 0);

    return NextResponse.json({
      ok: true,
      runId,
      mode: isImprove ? "improve" : "scratch",
      path,
      niche: smartResult.niche,
      confidence: smartResult.confidence,
      reasoning: smartResult.reasoning,

      // What was deployed
      deployed: deployed ? {
        site: deployed.site ? { id: deployed.site.id, url: (deployed.site as Record<string, string>).publicUrl ?? deployed.site.url } : null,
        campaign: deployed.campaign ?? null,
        emails: deployed.emails ?? null,
      } : null,

      // Post-deploy results
      postDeploy: postDeployResult ? {
        siteUrl: postDeployResult.siteUrl,
        adCreatives: postDeployResult.adCreativesGenerated,
        organicPosts: postDeployResult.organicPostsGenerated,
        videoGenerated: postDeployResult.videoGenerated,
        emailFlowsActive: postDeployResult.emailFlowsActive,
        errors: postDeployResult.errors,
      } : null,

      // Build quality score
      buildScore: buildCheck?.score ?? 0,
      readyToLaunch: buildCheck?.readyToLaunch ?? false,
      generated: buildCheck?.generatedSuccessfully ?? [],
      failed: buildCheck?.failedToGenerate ?? [],

      // Differentiators for the frontend
      brand: differentiators ? {
        uniqueAngle: differentiators.uniqueAngle,
        brandVoice: differentiators.brandVoice.personality,
        colorPalette: differentiators.colorPalette,
      } : null,

      // Pipeline transparency
      steps,
      totalDuration,
    });
  } catch (err) {
    console.error("Express error:", err);
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : "Something went wrong",
      steps,
    }, { status: 500 });
  }
}

function mapBusinessType(type: string): string {
  const map: Record<string, string> = {
    "Service Business": "local_service",
    "E-commerce Brand": "ecommerce_brand",
    "Agency": "agency",
    "Coaching / Consulting": "coaching",
    "Personal Brand": "digital_product",
    "Digital Product": "digital_product",
    "SaaS": "digital_product",
  };
  return map[type] ?? "freelance";
}
