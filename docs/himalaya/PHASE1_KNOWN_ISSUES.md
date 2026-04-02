# Himalaya Phase 1 — Known Issues & Follow-Up Log

## Database Migration

**Severity:** Required before first use

Schema changes must be pushed before testing. Run `npx prisma db push`. Models added: HimalayaProfile, HimalayaTemplate, HimalayaPreset, HimalayaMemory, HimalayaPipelineLog. Fields added to AnalysisRun: pinned, executionState, outcome.

## Foundation Generators Are Deterministic

**Severity:** Intentional limitation

Asset generators in `foundationGenerator.ts` are rule-based, not LLM-powered. Same inputs always produce the same outputs. Clicking "Regenerate" produces identical content unless the underlying decision packet changed. True variability requires AI-powered generation, which is a Phase 2 feature.

The benefit: zero API cost, instant generation, no hallucination risk, predictable outputs.

## Improve Path Requires Public URL

**Severity:** Expected behavior

The improve path's URL scan (`scanAdapter.ts`) does a real HTTP fetch of the target page. Internal URLs, localhost, login-protected pages, and sites behind Cloudflare challenges will fail. The fallback is to use description-only mode, which routes through the foundation generator instead of the scan pipeline.

## Preset Connection to Generators

**Severity:** Known gap (Phase 2)

Presets can be created and selected via PresetPicker, but they do not yet influence the actual output of the foundation or asset generators. The infrastructure is in place (model, API, UI), but the generator functions don't consume preset configuration. This is the planned Phase 2 connection point.

## Route Naming Split

**Severity:** Low (cosmetic)

The system uses two API families:
- `/api/himalaya/*` — Himalaya-specific (decide, launch, run, deploy, memory, presets, templates, profile)
- `/api/analyses/*` — Shared with legacy scan system (regenerate, asset, pin, execute, outcome, compare, export)

Both work correctly. The split exists because Himalaya reuses the AnalysisRun model and its existing endpoints rather than duplicating them. A future consolidation could unify under `/api/himalaya/*` if needed.

## Legacy Scan Page Still Exists

**Severity:** Informational

The original `/scan` page still works independently of Himalaya. It creates AnalysisRun records that appear in Himalaya's run history. This is by design — the scan page is used by other parts of the platform. Both entry points (Himalaya and Scan) produce compatible data.

## Adaptive Insights Need Volume

**Severity:** Expected behavior

The AdaptiveInsights component requires multiple reported outcomes before it generates useful suggestions. With only 1-2 outcomes, it shows nothing. After 3+ outcomes with varied results, insights start appearing. This is intentional — the system doesn't guess from insufficient data.

## DOCX Export Limitations

**Severity:** Low (edge case)

DOCX export handles text, list, key-value, and script asset types well. Very large or deeply nested structures may not render perfectly. The JSON export is always available as a complete fallback. DOCX is generated client-side via the `docx` package with dynamic import.

## Print/PDF Browser-Dependent

**Severity:** Low (expected)

Print/PDF uses `window.print()` with browser-native rendering. Chrome produces clean output. Safari and Firefox may vary slightly. Non-essential sections (nav, export, operator tools, trace) are hidden via `print:hidden` classes.

## Template Content Is Snapshot-Based

**Severity:** Informational

Saving a template captures the asset content at that moment. If the user later edits the asset, the template is not updated. Templates are intentional snapshots, not live references.

## Execution Steps Auto-Generated Only

**Severity:** Known gap (Phase 2)

Users cannot add custom execution steps, reorder them, or edit step text. Steps are generated from priorities and asset groups by `buildExecutionSteps()`. The only user action is toggling completion status.

## Memory Prefill Timing

**Severity:** Low (UX edge case)

When the scratch/improve pages load with `fromRun` param, they fetch prior run data via the API. If the fetch is slow, the form may appear empty briefly before prefilling. There is no loading indicator for this fetch — it's designed to be non-blocking.

## Outcome Data Structure

**Severity:** Informational

Outcome patterns are stored inside `HimalayaMemory.regenCounts.outcomePatterns` as a nested JSON object. This works but is semantically odd — a future migration could give outcome patterns their own field. No functional impact.

---

## Phase 2 Follow-Up Items

1. Connect presets to foundation/asset generators (influence tone, density, style)
2. Add LLM-powered generation for variability (replace deterministic generators)
3. Add custom execution step editing
4. Add template application during intake (pre-fill from template)
5. Consolidate API routes under `/api/himalaya/*`
6. Add team sharing for templates and runs
7. Add monetization layer (pricing, offers, funnels)
8. Build notification/reminder system for incomplete executions
9. Add A/B variant generation and comparison
10. Separate outcome patterns into their own memory field
