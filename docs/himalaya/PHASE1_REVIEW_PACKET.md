# Himalaya Phase 1 — Review Packet

## What Phase 1 Is

Himalaya Phase 1 is a guided business operating system that takes a user from "I don't know what to build" to "I have a business foundation with assets deployed" — or from "My business isn't working" to "I know what's broken and have rebuilt assets ready to go." It profiles the user, decides their best path, builds their foundation, guides execution, tracks outcomes, and learns from results to improve future recommendations.

## What Phase 1 Does

**Entry (3 paths)**
- **Scratch:** Simple form (business type, niche, goal) → builds complete foundation
- **Improve:** URL scan or description → analyzes weaknesses → generates improvements
- **Profiler:** 7-step assessment → decision engine scores 10 business paths → recommends best fit

**Pipeline (single canonical function: `runHimalaya()`)**
- Stage 1: Diagnose — profile analysis or URL scan
- Stage 2: Strategize — determine priorities and generation targets
- Stage 3: Generate — create structured business assets
- Stage 4: Handoff — prepare contracts for site/email systems
- Stage 5: Persist — save to database with trace logging
- Every stage has fallback behavior. Pipeline never crashes — it degrades gracefully.

**Results**
- Score, confidence badge, executive summary, strategy reasoning
- Top 3 priorities with actions
- Generated assets: Business Profile, ICP, Offer Direction, Website Blueprint, Marketing Angles, Email Sequence, Action Roadmap (scratch) or Audit Summary, Fixes, Improvements (improve)
- Each asset: editable, regenerable, saveable as template
- Deploy to campaign + site + email systems in one click

**Execution**
- Step-by-step task list generated from priorities and assets
- Each step links to relevant platform tool (site builder, email builder, ad campaign)
- Progress tracking with persistence across visits
- Completion celebration with "Start New Path" loop

**Outcome & Learning**
- After execution: report whether results improved, no change, got worse, or not done
- Outcome patterns stored in memory
- Adaptive insights surface on future runs ("72% of your past improvements led to better results")
- Check-in banners bring users back to incomplete executions or unreported outcomes

## Architecture

```
User Input
  ↓
runHimalaya(input, userId)  ← single canonical entry point
  ↓
  ├── SCRATCH: profile → foundationGenerator → normalize → strategy → extract → handoff → persist
  └── IMPROVE: scanAdapter → normalize → strategy → extract → handoff → persist
  ↓
AnalysisRun + AssetPackage saved to DB
  ↓
formatResults() → HimalayaResultsViewModel → UI components
  ↓
ExecutionSteps → OutcomePrompt → Memory → AdaptiveInsights
```

**Contracts (`lib/himalaya/contracts.ts`):**
- `HimalayaUserInput` → `HimalayaPayload` → `StrategyDecision` → `GenerationOutput` → `SiteHandoff` / `EmailHandoff`
- `PipelineTrace` with per-stage status, timing, warnings
- `HimalayaPipelineResult` returned from `runHimalaya()`

**Key principle:** UI pages do not invent logic. All business decisions flow through the orchestrator. UI is a guided shell.

## Capabilities

| Capability | Status |
|-----------|--------|
| 3 entry paths (scratch, improve, profiler) | Working |
| Decision engine (10 business path scoring) | Working |
| Foundation generator (6 specialized + 4 generic paths) | Working |
| URL scan + analysis pipeline | Working |
| 4-stage progress visualization | Working |
| Structured results with 7-9 asset groups | Working |
| Strategy reasoning ("Why This Direction") | Working |
| Confidence badges with metric surfacing | Working |
| Edit individual asset sections | Working |
| Regenerate individual assets | Working |
| Save assets as reusable templates | Working |
| Output presets (tone, density, style) | Working |
| Run history with filters | Working |
| Side-by-side run comparison with dimension diff | Working |
| Export: Copy, Markdown, DOCX, JSON, Print/PDF | Working |
| Deploy to campaign + site + email in one click | Working |
| Step-by-step execution with tool links | Working |
| Execution progress tracking + persistence | Working |
| Outcome reporting (improved/no_change/worse/not_done) | Working |
| Adaptive insights from outcome patterns | Working |
| Check-in banners for returning users | Working |
| Operational memory (last inputs, regen counts, outcomes) | Working |
| Pin/unpin runs | Working |
| Operator tools (raw JSON, copy ID, duplicate) | Working |
| Rerun with prior data prefilled | Working |
| Pipeline trace logging | Working |
| All endpoints ownership-scoped | Working |

## What Was Intentionally Not Built

- No LLM/AI calls in generation (deterministic rule-based for Phase 1 reliability)
- No multi-team collaboration or shared workspaces
- No advanced analytics dashboards
- No notification/reminder system (check-in is passive, not push)
- No autonomous actions (system never acts without user initiation)
- No preset connection to generators (infrastructure ready, wiring is Phase 2)
- No custom execution step editing (auto-generated only)
- No A/B testing or variant comparison

## System Size

| Layer | Count |
|-------|-------|
| Pages | 10 |
| API routes | 21 (9 himalaya + 12 analyses) |
| Components | 33 |
| Lib modules | 11 |
| Prisma models | 6 (HimalayaProfile, HimalayaTemplate, HimalayaPreset, HimalayaMemory, HimalayaPipelineLog + AnalysisRun extensions) |
| Total lines | ~8,700 |
| Test suite | 37/37 passing (`npx tsx scripts/test-himalaya.ts`) |

## Setup

```bash
npm install
npx prisma db push
npm run dev -- -p 3005
# Open localhost:3005/himalaya
```

**Dependencies added:** `docx`, `file-saver`, `@types/file-saver`

## Routes

| Route | Type | Purpose |
|-------|------|---------|
| `/himalaya` | Static | Entry — path selection + profiler |
| `/himalaya/scratch` | Static | Scratch form + inline pipeline |
| `/himalaya/improve` | Static | Improve form + inline pipeline |
| `/himalaya/path/[id]` | Dynamic | Decision engine recommendation |
| `/himalaya/building/[id]` | Dynamic | Pipeline progress (profiler path) |
| `/himalaya/run/[id]` | Dynamic | Full results page |
| `/himalaya/run/[id]/execute` | Dynamic | Execution steps |
| `/himalaya/runs` | Static | Run history |
| `/himalaya/runs/compare` | Static | Side-by-side comparison |
| `/himalaya/templates` | Static | Template browser |
