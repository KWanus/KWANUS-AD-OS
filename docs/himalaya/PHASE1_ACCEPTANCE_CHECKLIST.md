# Himalaya Phase 1 — Acceptance Checklist

> Updated after Block 08 completion. 10 pages, 21 API endpoints, 33 components, 11 lib modules, 6 Prisma models, ~8,700 lines.

## Entry & Path Selection

| # | Criteria | Route | Status | Notes |
|---|----------|-------|--------|-------|
| 1 | Entry page shows two clear paths | `/himalaya` | PASS | Scratch + Improve cards, profiler as third option |
| 2 | "Start from Scratch" routes to scratch form | `/himalaya/scratch` | PASS | Business type, niche, goal, optional context |
| 3 | "Improve Existing Business" routes to improve form | `/himalaya/improve` | PASS | URL and/or description, optional problem/goal |
| 4 | "Let Himalaya decide" opens 7-step profiler | `/himalaya` | PASS | Budget, time, skills, risk, goal, stage, details |
| 5 | Decision engine recommends correct path | `/himalaya/path/[id]` | PASS | Tested: affiliate, agency, improve all route correctly |
| 6 | Check-in banner shows for returning users | `/himalaya` | PASS | Active execution or unreported outcome |
| 7 | Himalaya appears in main AppNav | All pages | PASS | Mountain icon, second position |
| 8 | HimalayaNav sub-navigation on all Himalaya pages | All `/himalaya/*` | PASS | New, History, Templates, Compare |

## Scratch Flow

| # | Criteria | Route/API | Status | Notes |
|---|----------|----------|--------|-------|
| 9 | Form validates required fields | `/himalaya/scratch` | PASS | businessType + niche + goal required |
| 10 | Submit shows 4-stage inline progress | `/himalaya/scratch` | PASS | Diagnosis → Strategy → Generation → Save |
| 11 | Pipeline runs through `runHimalaya()` | `POST /api/himalaya/run` | PASS | Single canonical function |
| 12 | Foundation generates all 7 sections | `foundationGenerator.ts` | PASS | Tested 6 paths, all produce complete output |
| 13 | Redirects to results on success | `/himalaya/run/[id]` | PASS | Auto-redirect after pipeline completion |
| 14 | `fromRun` prefill works | `/himalaya/scratch?fromRun=X` | PASS | Loads prior run data, shows indicator |

## Improve Flow

| # | Criteria | Route/API | Status | Notes |
|---|----------|----------|--------|-------|
| 15 | URL scan runs through orchestrator | `POST /api/himalaya/run` | PASS | `scanAdapter.ts` wraps full scan pipeline |
| 16 | Description-only creates profile and runs scratch path | `/himalaya/improve` | PASS | Falls back to foundation generator |
| 17 | 4-stage progress with longer intervals | `/himalaya/improve` | PASS | 1200ms intervals for scan timing |
| 18 | `fromRun` prefill works | `/himalaya/improve?fromRun=X` | PASS | Loads URL, description, weaknesses |

## Results Page

| # | Criteria | Component | Status | Notes |
|---|----------|----------|--------|-------|
| 19 | Header with score ring, mode badge, status | `ResultsHeader` | PASS | Share + Download buttons in header |
| 20 | Confidence badge with metric insight | `ConfidenceBadge` | PASS | High/Moderate/Limited with dimension data |
| 21 | Adaptive insights from outcome history | `AdaptiveInsights` | PASS | Only shows when outcome patterns exist |
| 22 | Executive summary (3 blocks) | `ResultsSummary` | PASS | Adapts scratch vs improve |
| 23 | Strategy reasoning (3-4 bullets) | `StrategyReasoning` | PASS | Uses saved orchestration data when available |
| 24 | Top 3 priorities | `ResultsPriorities` | PASS | Label + reason + nextStep |
| 25 | Generated assets with edit/regenerate/template | `ResultsAssets` + `EditableAssetCard` | PASS | 7 groups for scratch, 9 for improve, no duplicates |
| 26 | Deploy to campaign/site/email | `DeployActions` | PASS | "Deploy Everything" or individual targets |
| 27 | Warnings section (only when present) | `ResultsWarnings` | PASS | Hidden when empty |
| 28 | Execution banner (start/continue/complete) | `ExecutionBanner` | PASS | Three states based on execution progress |
| 29 | Outcome prompt (report results) | `OutcomePrompt` | PASS | 4 options + optional note |
| 30 | Next actions with "Run Again" | `ResultsNextActions` | PASS | Routes to `/himalaya/scratch` or `/himalaya/improve` with fromRun |
| 31 | Export menu (Copy, MD, DOCX, JSON, Print) | `ExportMenu` | PASS | All formats working |
| 32 | Operator tools (pin, raw JSON, copy ID, duplicate) | `ResultOperatorTools` | PASS | Secondary, non-cluttering |
| 33 | Trace details (collapsed) | `ResultsTraceDetails` | PASS | Dimensions, meta, notes count |

## Execution

| # | Criteria | Route/Component | Status | Notes |
|---|----------|----------------|--------|-------|
| 34 | Execution page with step-by-step tasks | `/himalaya/run/[id]/execute` | PASS | Linear flow, generated from priorities + assets |
| 35 | Steps toggle: not_started → in_progress → done | `ExecutionStepCard` | PASS | Circle → spinner → checkmark |
| 36 | Steps link to platform tools | `ExecutionStepCard` | PASS | Site Builder, Email Builder, Ad Campaign |
| 37 | Progress bar tracks completion | `ExecutionSteps` | PASS | Percentage + animated bar |
| 38 | Execution state persists across visits | `/api/analyses/[id]/execute` | PASS | JSON on AnalysisRun |
| 39 | Completion shows "Start New Path" + tool links | `ExecutionSteps` | PASS | Trophy + 4 action buttons |

## Reuse & System

| # | Criteria | Route/API | Status | Notes |
|---|----------|----------|--------|-------|
| 40 | Run history with filters | `/himalaya/runs` | PASS | All/Scratch/Improve, execution status badges |
| 41 | Compare two runs side by side | `/himalaya/runs/compare` | PASS | Summary, priorities, assets, dimension diff |
| 42 | Save asset as template | `SaveTemplateButton` → `/api/himalaya/templates` | PASS | Inline naming, stores type + mode + content |
| 43 | Browse templates by type and mode | `/himalaya/templates` | PASS | Filterable list with copy + delete |
| 44 | Create/select output presets | `PresetPicker` → `/api/himalaya/presets` | PASS | Tone, density, style, business type fields |
| 45 | Regenerate individual asset sections | `RegenerateButton` → `/api/analyses/[id]/regenerate` | PASS | Doesn't mutate diagnosis/strategy |
| 46 | Edit and save individual asset sections | `EditableAssetCard` → `/api/analyses/[id]/asset` | PASS | Section-level save |
| 47 | Memory tracks last mode/URL/niche/regen counts | `/api/himalaya/memory` | PASS | Upsert per user |
| 48 | Outcome patterns feed into memory | `/api/analyses/[id]/outcome` | PASS | outcomePatterns in regenCounts |
| 49 | Pipeline logs saved per run | `HimalayaPipelineLog` | PASS | Stages, timing, status, warnings |

## Ownership & Security

| # | Criteria | Status | Notes |
|---|----------|--------|-------|
| 50 | All 21 API endpoints require auth | PASS | Clerk auth on every route |
| 51 | All reads/writes filtered by userId | PASS | Verified all 21 endpoints |
| 52 | No cross-user data access possible | PASS | Every query includes userId |
| 53 | Templates/presets/memory user-scoped | PASS | userId on all models |

## Home Page Integration

| # | Criteria | Status | Notes |
|---|----------|--------|-------|
| 54 | Himalaya CTA banner on home dashboard | PASS | "Launch Himalaya" gradient button |
| 55 | Main AppNav includes Himalaya link | PASS | Mountain icon |

---

**Total: 55 criteria. All passing.**
