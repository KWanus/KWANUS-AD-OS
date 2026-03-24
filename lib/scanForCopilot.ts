/**
 * Runs the analyze pipeline for a URL and returns a compact summary
 * string that gets injected into the Copilot system prompt as context.
 */
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
import { recommendOpportunityPath } from "@/src/logic/ad-os/recommendOpportunityPath";
import { buildOpportunityPacket } from "@/src/logic/ad-os/buildOpportunityPacket";
import { buildAssetPackage } from "@/src/logic/ad-os/buildAssetPackage";

export function extractUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s)>\]"']+/);
  return match ? match[0] : null;
}

export interface CopilotScanResult {
  url: string;
  title: string;
  score: number;
  verdict: string;
  confidence: string;
  summary: string;
  audience: string;
  painDesire: string;
  angle: string;
  strengths: string[];
  weaknesses: string[];
  topGaps: string[];
  topStrengths: string[];
  recommendedPath: string;
  hooks: string[];
  ctaIdea: string;
}

export async function scanUrlForCopilot(rawUrl: string): Promise<CopilotScanResult | null> {
  try {
    const input = normalizeInput(rawUrl, "operator");
    if (!input.valid) return null;

    const page = await fetchPage(input.url);
    if (!page.ok) {
      return {
        url: input.url,
        title: input.url,
        score: 0,
        verdict: "Unreadable",
        confidence: "Low",
        summary: `Could not fetch the page — it may be behind a login or use JS rendering. I'll work from what the URL signals instead.`,
        audience: "Unknown",
        painDesire: "Unknown",
        angle: "Unknown",
        strengths: [],
        weaknesses: ["Page could not be fetched"],
        topGaps: [],
        topStrengths: [],
        recommendedPath: "Start with a landing page and opt-in form",
        hooks: [],
        ctaIdea: "",
      };
    }

    const linkType = classifyLink(input.url, page);
    const signals = extractSignals(page);
    const diagnosis = diagnoseLink(signals, linkType);
    const scoreResult = scoreOpportunity(signals, diagnosis, page);
    const packet = buildDecisionPacket(signals, diagnosis, scoreResult, linkType, input.mode);

    const dimensions = scoreOpportunityDimensions(signals, page);
    const classified = classifyOpportunity(dimensions);
    const gaps = detectOpportunityGaps(dimensions, signals);
    const recommendation = recommendOpportunityPath(classified.status, dimensions, input.mode);
    const opportunityPacket = buildOpportunityPacket(classified, dimensions, gaps, recommendation);

    const isReject = scoreResult.verdict === "Reject" || opportunityPacket.status === "Reject";
    const assets = isReject ? null : buildAssetPackage(packet, opportunityPacket, input.mode);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hooks: string[] = (assets?.adHooks as any[])?.slice(0, 3).map((h: any) => h.hook ?? String(h)) ?? [];

    return {
      url: input.url,
      title: page.title || signals.productName || input.url,
      score: scoreResult.total,
      verdict: scoreResult.verdict,
      confidence: scoreResult.confidence,
      summary: packet.summary,
      audience: packet.audience,
      painDesire: packet.painDesire,
      angle: packet.angle,
      strengths: packet.strengths ?? [],
      weaknesses: packet.weaknesses ?? [],
      topGaps: opportunityPacket.topGaps ?? [],
      topStrengths: opportunityPacket.topStrengths ?? [],
      recommendedPath: opportunityPacket.recommendedPath ?? "",
      hooks,
      ctaIdea: (assets?.landingPage as { headline?: string })?.headline ?? "",
    };
  } catch {
    return null;
  }
}

export function formatScanForPrompt(scan: CopilotScanResult): string {
  return `
## 🔍 LIVE SITE SCAN — ${scan.url}
**Title:** ${scan.title}
**Score:** ${scan.score}/100 — ${scan.verdict} (${scan.confidence} confidence)
**Summary:** ${scan.summary}

**Target Audience:** ${scan.audience}
**Core Pain/Desire:** ${scan.painDesire}
**Best Angle:** ${scan.angle}

**Strengths:** ${scan.strengths.slice(0, 3).join(", ") || "None detected"}
**Weaknesses:** ${scan.weaknesses.slice(0, 3).join(", ") || "None detected"}
**Top Opportunity Gaps:** ${scan.topGaps.slice(0, 3).join(", ") || "None"}
**Recommended Path:** ${scan.recommendedPath}
${scan.hooks.length > 0 ? `**Sample Ad Hooks:**\n${scan.hooks.map((h, i) => `${i + 1}. ${h}`).join("\n")}` : ""}
`.trim();
}
