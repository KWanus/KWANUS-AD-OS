import type { DecisionPacket } from "./buildDecisionPacket";
import type { OpportunityPacket } from "./buildOpportunityPacket";
import type { AnalysisMode } from "./normalizeInput";
import { generateAdHooks, type AdHook } from "./generateAdHooks";
import { generateAdScripts, type AdScript } from "./generateAdScripts";
import { generateAdBriefs, type AdBrief } from "./generateAdBriefs";
import { generateLandingPage, type LandingPageStructure } from "./generateLandingPage";
import { generateEmailSequences, type EmailSequences } from "./generateEmailSequences";
import { generateExecutionChecklist, type ExecutionChecklist } from "./generateExecutionChecklist";

export type AssetPackage = {
  mode: AnalysisMode;
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
  mode: AnalysisMode
): AssetPackage {
  return {
    mode,
    adHooks: generateAdHooks(packet, mode),
    adScripts: generateAdScripts(packet, mode),
    adBriefs: generateAdBriefs(packet, mode),
    landingPage: generateLandingPage(packet, opportunity, mode),
    emailSequences: generateEmailSequences(packet, mode),
    executionChecklist: generateExecutionChecklist(opportunity, mode),
  };
}
