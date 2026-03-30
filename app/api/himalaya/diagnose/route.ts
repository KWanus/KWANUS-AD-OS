import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { normalizeInput } from "@/src/logic/ad-os/normalizeInput";
import { fetchPage } from "@/src/logic/ad-os/fetchPage";
import { classifyLink } from "@/src/logic/ad-os/classifyLink";
import { extractSignals } from "@/src/logic/ad-os/extractSignals";
import { diagnoseLink } from "@/src/logic/ad-os/diagnoseLink";
import { scoreOpportunity } from "@/src/logic/ad-os/scoreOpportunity";
import { buildDecisionPacket } from "@/src/logic/ad-os/buildDecisionPacket";
import { scoreOpportunityDimensions } from "@/src/logic/ad-os/scoreOpportunityDimensions";
import { classifyOpportunity } from "@/src/logic/ad-os/classifyOpportunity";
import { detectOpportunityGaps } from "@/src/logic/ad-os/detectOpportunityGaps";
import { runTruthEngine, getProfileForMode } from "@/rules/truthEngine";
import { getArchetype, type BusinessType } from "@/lib/archetypes";

/**
 * Himalaya Diagnosis API — the glue layer.
 *
 * Two modes:
 * 1. "scratch" — user starting from zero. Diagnosis = viability + archetype intelligence.
 * 2. "improve" — user has a URL. Diagnosis = full scan + truth engine + gap detection.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      mode: "scratch" | "improve";
      // scratch fields
      businessType?: string;
      niche?: string;
      goal?: string;
      description?: string;
      // improve fields
      url?: string;
      businessDescription?: string;
      challenge?: string;
    };

    let userId: string | null = null;
    try {
      const { userId: clerkId } = await auth();
      if (clerkId) {
        const user = await getOrCreateUser();
        userId = user?.id ?? null;
      }
    } catch { /* auth optional */ }

    // ── Scratch path ──────────────────────────────────────────────────────────
    if (body.mode === "scratch") {
      const archetype = getArchetype(body.businessType as BusinessType);
      const niche = body.niche || "general";
      const goal = body.goal || "first_client";

      return NextResponse.json({
        ok: true,
        mode: "scratch",
        diagnosis: {
          businessType: body.businessType,
          niche,
          goal,
          archetype: archetype ? {
            label: archetype.label,
            acquisitionModel: archetype.acquisitionModel,
            salesProcess: archetype.salesProcess,
            funnelType: archetype.funnelType,
            conversionTriggers: archetype.conversionTriggers,
            topObjections: archetype.topObjections,
            winningAngles: archetype.winningAngles,
            systems: archetype.systems,
          } : null,
          description: body.description || null,
        },
        userId,
      });
    }

    // ── Improve path ──────────────────────────────────────────────────────────
    if (body.mode === "improve") {
      if (!body.url && !body.businessDescription) {
        return NextResponse.json(
          { ok: false, error: "Provide a URL or business description." },
          { status: 400 }
        );
      }

      // If they gave a URL, run the full scan pipeline
      if (body.url) {
        const input = normalizeInput(body.url, "consultant");
        if (!input.valid) {
          return NextResponse.json({ ok: false, error: input.error }, { status: 400 });
        }

        const page = await fetchPage(input.url);
        if (!page.ok) {
          return NextResponse.json({
            ok: true,
            mode: "improve",
            diagnosis: {
              url: input.url,
              scanFailed: true,
              error: `Could not fetch page. ${page.error || ""}`.trim(),
              challenge: body.challenge || null,
              businessDescription: body.businessDescription || null,
            },
            userId,
          });
        }

        const linkType = classifyLink(input.url, page);
        const signals = extractSignals(page);
        const linkDiagnosis = diagnoseLink(signals, linkType);
        const scoreResult = scoreOpportunity(signals, linkDiagnosis, page);
        const packet = buildDecisionPacket(signals, linkDiagnosis, scoreResult, linkType, "consultant");

        const dimensions = scoreOpportunityDimensions(signals, page);
        const classified = classifyOpportunity(dimensions);
        const gaps = detectOpportunityGaps(dimensions, signals);

        const truthProfile = getProfileForMode("consultant");
        const truthResult = runTruthEngine(dimensions, truthProfile);

        return NextResponse.json({
          ok: true,
          mode: "improve",
          diagnosis: {
            url: input.url,
            title: page.title || signals.productName || input.url,
            score: truthResult.totalScore,
            verdict: truthResult.verdict,
            confidence: truthResult.confidence,
            summary: packet.summary,
            strengths: truthResult.strengthSummary,
            weaknesses: truthResult.weaknessSummary,
            breakdown: truthResult.breakdown,
            diagnostics: truthResult.diagnostics,
            gaps: gaps,
            classified: classified.status,
            decisionPacket: {
              audience: packet.audience,
              painDesire: packet.painDesire,
              strengths: packet.strengths,
              weaknesses: packet.weaknesses,
              nextActions: packet.nextActions,
            },
            challenge: body.challenge || null,
            businessDescription: body.businessDescription || null,
          },
          userId,
        });
      }

      // No URL — description only path
      return NextResponse.json({
        ok: true,
        mode: "improve",
        diagnosis: {
          url: null,
          descriptionOnly: true,
          businessDescription: body.businessDescription,
          challenge: body.challenge || null,
        },
        userId,
      });
    }

    return NextResponse.json({ ok: false, error: "Invalid mode." }, { status: 400 });
  } catch (err) {
    console.error("Himalaya diagnose error:", err);
    return NextResponse.json({ ok: false, error: "Diagnosis failed." }, { status: 500 });
  }
}
