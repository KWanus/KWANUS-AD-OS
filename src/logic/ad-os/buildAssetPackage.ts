import type { DecisionPacket } from "./buildDecisionPacket";
import type { OpportunityPacket } from "./buildOpportunityPacket";
import type { AnalysisMode } from "./normalizeInput";
import { generateAdHooks, type AdHook } from "./generateAdHooks";
import { generateAdScripts, type AdScript } from "./generateAdScripts";
import { generateAdBriefs, type AdBrief } from "./generateAdBriefs";
import { generateLandingPage, type LandingPageStructure } from "./generateLandingPage";
import { generateEmailSequences, type EmailSequences } from "./generateEmailSequences";
import { generateExecutionChecklist, type ExecutionChecklist } from "./generateExecutionChecklist";
import type { ExecutionTier } from "@/lib/sites/conversionEngine";

export type AssetPackage = {
  mode: AnalysisMode;
  executionTier: ExecutionTier;
  adHooks: AdHook[];
  adScripts: AdScript[];
  adBriefs: AdBrief[];
  landingPage: LandingPageStructure;
  emailSequences: EmailSequences;
  executionChecklist: ExecutionChecklist;
};

export function buildAssetPackage(
  packet: DecisionPacket,
  opportunity: OpportunityPacket,
  mode: AnalysisMode,
  executionTier: ExecutionTier = "core"
): AssetPackage {
  const adHooks = generateAdHooks(packet, mode);
  const adScripts = generateAdScripts(packet, mode);
  const adBriefs = generateAdBriefs(packet, mode);
  const landingPage = generateLandingPage(packet, opportunity, mode);
  const emailSequences = generateEmailSequences(packet, mode);
  const executionChecklist = generateExecutionChecklist(opportunity, mode);

  if (executionTier === "elite") {
    adHooks.push({
      format: "Elite Angle (Specific Operator Insight)",
      hook:
        mode === "consultant"
          ? `The highest-performing ${packet.audience.split(",")[0]} businesses fix this one revenue leak before they buy more traffic. Most never even see it.`
          : `Most people think the win is the product. The real win is what happens after you remove ${packet.painDesire.split("→")[0]?.trim() || "the friction"} from the buying decision.`,
    });

    adScripts.push({
      title: "Script 4 — Elite Objection Crusher (20–30 sec)",
      duration: "20–30 seconds",
      sections: [
        {
          timestamp: "0–4s",
          direction: "Open by naming the exact objection smart buyers are already holding.",
          copy:
            mode === "consultant"
              ? `"You're probably thinking this is just another agency pitch. That's exactly why this works differently."`
              : `"You're probably thinking you've seen products like this before. That's fair — most of them miss the actual reason people buy."`,
        },
        {
          timestamp: "4–14s",
          direction: "Show why the common alternative fails and how this approach removes that friction.",
          copy:
            mode === "consultant"
              ? `"Most offers promise more leads. The better move is fixing the leak that makes those leads not convert in the first place."`
              : `"Most products talk features. The better move is showing how this changes the result you care about faster, with less guesswork."`,
        },
        {
          timestamp: "14–24s",
          direction: "Close with proof + decisive CTA.",
          copy:
            mode === "consultant"
              ? `"If you want to see the exact gaps in your business, book the audit below."`
              : `"If you want the version that actually removes the friction, grab it below."`,
        },
      ],
    });

    landingPage.trustBar = Array.from(new Set([
      ...landingPage.trustBar,
      "Operator-grade execution",
      "Built to reduce friction fast",
    ])).slice(0, 6);
    landingPage.benefitBullets = Array.from(new Set([
      ...landingPage.benefitBullets,
      "✓ Premium conversion framing — because better positioning lifts every traffic source",
    ])).slice(0, 6);
    landingPage.faqItems = Array.from(landingPage.faqItems).slice(0, 6);
    landingPage.faqItems.push({
      question: "Why is this the higher-performance version?",
      answer: "Because it adds sharper angles, stronger proof framing, and tighter objection handling before the call to action.",
    });
    emailSequences.welcome = emailSequences.welcome.slice(0, 4);
    emailSequences.welcome.push({
      subject: "The objection that usually stalls this decision",
      preview: "A quick note on the hesitation point that keeps most people from moving.",
      body: "Most buyers hesitate for one of three reasons: trust, timing, or uncertainty about the next step. This sequence is built to remove those frictions directly so the decision feels easier and safer.",
      timing: "Day 5",
    });
    executionChecklist.week2 = [
      ...executionChecklist.week2,
      "Elite optimization: review top-performing hooks and spin two sharper variants built around the winning objection or desire pattern.",
    ];
  }

  return {
    mode,
    executionTier,
    adHooks,
    adScripts,
    adBriefs,
    landingPage,
    emailSequences,
    executionChecklist,
  };
}
