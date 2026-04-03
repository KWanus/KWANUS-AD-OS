import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { decide } from "@/lib/himalaya/decisionEngine";
import type { HimalayaProfileInput } from "@/lib/himalaya/profileTypes";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as HimalayaProfileInput;

    // Validate required fields
    if (!body.budget || !body.timeAvailable || !body.riskTolerance || !body.primaryGoal || !body.businessStage) {
      return NextResponse.json({ ok: false, error: "Missing required profile fields" }, { status: 400 });
    }

    // Run decision engine
    const result = decide(body);

    // Persist profile + decision
    const profile = await prisma.himalayaProfile.create({
      data: {
        userId: user.id,
        budget: body.budget,
        timeAvailable: body.timeAvailable,
        skills: JSON.parse(JSON.stringify(body.skills)),
        riskTolerance: body.riskTolerance,
        primaryGoal: body.primaryGoal,
        businessStage: body.businessStage,
        existingUrl: body.existingUrl ?? null,
        niche: body.niche ?? null,
        description: body.description ?? null,
        recommendedPath: result.primary.path,
        decisionResult: JSON.parse(JSON.stringify(result)),
      },
    });

    // Update memory with latest profile info
    try {
      await prisma.himalayaMemory.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          lastMode: result.primary.path === "improve_existing" ? "consultant" : "operator",
          lastInputUrl: body.existingUrl ?? null,
          lastNiche: body.niche ?? null,
        },
        update: {
          lastMode: result.primary.path === "improve_existing" ? "consultant" : "operator",
          lastInputUrl: body.existingUrl ?? null,
          lastNiche: body.niche ?? null,
        },
      });
    } catch {
      // memory update is non-blocking
    }

    return NextResponse.json({ ok: true, profileId: profile.id, result });
  } catch (err) {
    console.error("Decide error:", err);
    const message = err instanceof Error ? err.message : "Decision failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
