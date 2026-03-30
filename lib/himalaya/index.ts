/**
 * Himalaya — Guided Business Operating System
 *
 * Public API surface. Import from "@/lib/himalaya" to access contracts and orchestrator.
 */

export { runHimalaya } from "./orchestrator";
export type {
  // Input
  HimalayaInput,
  ScratchInput,
  ImproveInput,

  // Diagnosis
  DiagnosisPayload,
  ScratchDiagnosis,
  ImproveDiagnosis,
  ArchetypeSnapshot,
  DimensionScore,
  Diagnostic,
  DecisionPacket,

  // Strategy
  StrategyPayload,
  StrategyAction,

  // Generation
  GenerationPayload,
  ScratchGeneration,
  ImproveGeneration,
  BusinessProfile,
  IdealCustomer,
  HomepagePayload,
  HomepageSection,
  MarketingAngle,
  EmailSequencePayload,
  EmailPayload,
  RoadmapPayload,
  AuditPayload,
  Fix,

  // Results
  ResultsPayload,
  CreatedResources,

  // Handoffs
  SiteHandoff,
  SiteBlock,
  EmailFlowHandoff,
} from "./contracts";
