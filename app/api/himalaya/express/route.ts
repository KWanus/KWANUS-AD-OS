import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decide } from "@/lib/himalaya/decisionEngine";
import { runHimalaya } from "@/lib/himalaya/orchestrator";
import type { HimalayaProfileInput } from "@/lib/himalaya/profileTypes";

/**
 * Express endpoint: one call does everything.
 * Input: niche + businessType + goal
 * Output: runId with assets deployed
 */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as {
      niche: string;
      businessType?: string;
      goal?: string;
      url?: string; // for improve mode
    };

    if (!body.niche && !body.url) {
      return NextResponse.json({ ok: false, error: "Tell us your niche or paste a URL" }, { status: 400 });
    }

    const isImprove = !!body.url;

    if (isImprove) {
      // Improve: run pipeline with URL
      const result = await runHimalaya({ mode: "improve", url: body.url, niche: body.niche }, user.id);

      if (!result.success || !result.runId) {
        return NextResponse.json({ ok: false, error: result.summary || "Run failed" }, { status: 500 });
      }

      return NextResponse.json({ ok: true, runId: result.runId, mode: "improve" });
    }

    // Scratch: decide + run in one shot
    const profileInput: HimalayaProfileInput = {
      businessStage: "no_business",
      primaryGoal: (body.goal as HimalayaProfileInput["primaryGoal"]) || "full_business",
      budget: "micro",
      timeAvailable: "parttime",
      skills: ["communication"],
      riskTolerance: "medium",
      niche: body.niche,
      description: [body.businessType, body.goal].filter(Boolean).join(". "),
    };

    // Decide best path
    const decision = decide(profileInput);
    const path = body.businessType
      ? mapBusinessType(body.businessType)
      : decision.primary.path;

    // Save profile
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
        decisionResult: JSON.parse(JSON.stringify(decision)),
      },
    });

    // Run full pipeline
    const result = await runHimalaya({ mode: "scratch", profileId: profile.id, path }, user.id);

    if (!result.success || !result.runId) {
      return NextResponse.json({ ok: false, error: result.summary || "Run failed" }, { status: 500 });
    }

    // Auto-deploy everything
    let deployed = null;
    try {
      const deployRes = await fetch(new URL("/api/himalaya/deploy", req.url).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: req.headers.get("cookie") ?? "",
        },
        body: JSON.stringify({ runId: result.runId, targets: ["all"] }),
      });
      const deployData = (await deployRes.json()) as { ok: boolean; deployed?: unknown };
      if (deployData.ok) deployed = deployData.deployed;
    } catch {
      // deploy is optional
    }

    return NextResponse.json({
      ok: true,
      runId: result.runId,
      mode: "scratch",
      path,
      deployed,
    });
  } catch (err) {
    console.error("Express error:", err);
    return NextResponse.json({ ok: false, error: "Something went wrong" }, { status: 500 });
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
