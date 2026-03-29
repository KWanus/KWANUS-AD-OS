# Architecture

**Analysis Date:** 2026-03-24

## Pattern Overview

**Overall:** App Router monolith with feature-sliced route folders, thin shared infrastructure in `lib/`, and domain-specific business logic split between `src/logic/ad-os/`, `lib/skills/`, and per-route handlers in `app/api/**`.

**Key Characteristics:**
- Put user-facing screens directly under `app/**/page.tsx`; most pages are `"use client"` screens that fetch JSON from matching `app/api/**/route.ts` handlers instead of receiving server-loaded props.
- Put persistent domain state in PostgreSQL through Prisma models defined in `prisma/schema.prisma` and accessed via the singleton client in `lib/prisma.ts`.
- Put the deepest reusable analysis/generation pipeline logic in `src/logic/ad-os/*.ts`; keep simpler CRUD and composition logic inside route handlers such as `app/api/sites/route.ts`, `app/api/campaigns/route.ts`, and `app/api/settings/route.ts`.

## Layers

**App Shell and Route Pages:**
- Purpose: Render the authenticated product UI, public site pages, and nested workspace screens.
- Location: `app/layout.tsx`, `app/page.tsx`, `app/clients/layout.tsx`, `app/**/page.tsx`
- Contains: Root providers, feature pages, per-section layouts, and public dynamic pages.
- Depends on: `@clerk/nextjs`, `next/navigation`, shared UI in `components/**`, and browser `fetch()` calls to `app/api/**`.
- Used by: End users via App Router routes.

**Route Handlers / API Surface:**
- Purpose: Own HTTP input validation, auth checks, Prisma reads/writes, and orchestration of downstream business logic.
- Location: `app/api/**/route.ts`
- Contains: CRUD handlers (`app/api/sites/[id]/route.ts`, `app/api/leads/route.ts`), orchestration handlers (`app/api/analyze/route.ts`, `app/api/skills/[slug]/run/route.ts`), and third-party webhook/payment endpoints (`app/api/stripe/**`, `app/api/webhooks/**`).
- Depends on: `lib/prisma.ts`, `lib/auth.ts`, `src/logic/ad-os/*.ts`, `lib/skills/*.ts`, `engines/*.ts`.
- Used by: Client pages in `app/**`, public callbacks, and external services.

**Shared Infrastructure:**
- Purpose: Centralize auth, DB access, outbound integrations, and reusable cross-domain helpers.
- Location: `lib/auth.ts`, `lib/prisma.ts`, `lib/email/send.ts`, `lib/webhooks.ts`, `lib/userId.ts`, `lib/clients/healthScore.ts`
- Contains: Clerk-to-User sync, Prisma singleton setup, email/webhook helpers, and utility logic shared across domains.
- Depends on: Prisma, Clerk, and external SDKs configured at runtime.
- Used by: Route handlers and some client pages.

**Analysis / Asset Pipeline:**
- Purpose: Turn a URL into classified signals, scoring, opportunity assessment, and generated marketing assets.
- Location: `src/logic/ad-os/*.ts`
- Contains: Small pure or mostly pure pipeline steps such as `normalizeInput.ts`, `fetchPage.ts`, `classifyLink.ts`, `extractSignals.ts`, `buildDecisionPacket.ts`, `buildOpportunityPacket.ts`, and `buildAssetPackage.ts`.
- Depends on: Internal types and previous pipeline stages.
- Used by: `app/api/analyze/route.ts`, `app/api/campaigns/[id]/generate/route.ts`, and pipeline-backed skills such as `lib/skills/websiteBuilderScout.ts`.

**Skill Execution Layer:**
- Purpose: Expose parameterized “skills” that either call LLM-backed prompt execution or reuse the internal analysis pipeline.
- Location: `lib/skills/registry.ts`, `lib/skills/executor.ts`, `lib/skills/websiteBuilderScout.ts`, `lib/skills/adCampaignSkill.ts`, `lib/skills/emailCampaignSkill.ts`
- Contains: Skill metadata, Anthropic-backed prompt execution, result post-processing, and pipeline skill orchestration.
- Depends on: Prisma, Anthropic SDK, and `src/logic/ad-os/*.ts`.
- Used by: `app/api/skills/[slug]/run/route.ts` and the `/skills` UI.

**Simple Engines:**
- Purpose: Hold lightweight standalone scan logic separate from route files.
- Location: `engines/businessScanEngine.ts`, `engines/productScanEngine.ts`
- Contains: Synchronous scan implementations returning normalized results.
- Depends on: Standard library only.
- Used by: `lib/scanOrchestrator.ts`, then `app/api/scan/route.ts`.

**UI Component Layer:**
- Purpose: Keep complex editors/renderers reusable across multiple routes.
- Location: `components/**`
- Contains: Navigation (`components/AppNav.tsx`), site-builder primitives (`components/site-builder/*`), studio/editor components (`components/studio/*`), workflow editors, and email flow nodes.
- Depends on: React plus domain APIs and route-provided data.
- Used by: Pages in `app/**`.

## Data Flow

**Authenticated Workspace CRUD Flow:**

1. A client page under `app/**/page.tsx` mounts and calls `fetch("/api/...")`, as shown in `app/page.tsx` and `app/websites/[id]/editor/[pageId]/page.tsx`.
2. The target route handler checks identity through Clerk directly (`auth()` in `app/api/settings/route.ts`) or through `getOrCreateUser()` in `lib/auth.ts`.
3. The handler reads or writes Prisma models through `lib/prisma.ts`, often scoping by the synced internal `User.id`, as in `app/api/sites/route.ts` and `app/api/sites/[id]/route.ts`.
4. The handler returns JSON; the client page stores it in local component state and re-renders. There is no shared global state store detected.

**Analysis-to-Assets Flow:**

1. A client route such as `app/analyze/page.tsx` posts a URL to `app/api/analyze/route.ts`.
2. `app/api/analyze/route.ts` runs the sequential analysis pipeline in `src/logic/ad-os/*.ts`: normalize input, fetch page, classify, extract signals, diagnose, score, build decision packet, score dimensions, classify opportunity, detect gaps, recommend path, then build an asset package.
3. The handler persists `AnalysisRun`, `OpportunityAssessment`, and `AssetPackage` records through Prisma when possible, but treats DB failure as non-fatal.
4. Downstream routes such as `app/api/campaigns/[id]/generate/route.ts` reopen stored analysis payloads and regenerate ad/email/checklist artifacts into campaign tables.

**Skill Execution Flow:**

1. The UI posts to `app/api/skills/[slug]/run/route.ts` with a skill slug and form inputs.
2. The route loads metadata from `lib/skills/registry.ts`, validates required fields, decrements credits in `User`, and routes execution.
3. Pipeline skills call local orchestrators like `lib/skills/websiteBuilderScout.ts`; other skills call `runSkill()` in `lib/skills/executor.ts`, which builds prompts and may persist derived entities.
4. Failed executions trigger a credit refund before the JSON response is returned.

**Website Builder Flow:**

1. Pages under `app/websites/**` call site CRUD APIs such as `app/api/sites/route.ts`, `app/api/sites/[id]/route.ts`, and `app/api/sites/[id]/pages/[pageId]/route.ts`.
2. Site/page records store flexible `theme` and `blocks` JSON in Prisma models `Site` and `SitePage` from `prisma/schema.prisma`.
3. The editor in `app/websites/[id]/editor/[pageId]/page.tsx` mutates block arrays client-side and autosaves via debounced `PATCH` requests.
4. The public route `app/s/[slug]/page.tsx` server-renders published site/page data, injects tracking scripts from the owning `User`, increments view counts asynchronously, and renders block JSON through `components/site-builder/BlockRenderer.tsx`.

**State Management:**
- Use local React component state inside route pages for UI state and fetched entities, as seen in `app/page.tsx` and `app/websites/[id]/editor/[pageId]/page.tsx`.
- Use database persistence, not client state libraries, for cross-page state.
- Use Prisma JSON columns (`workflowState`, `blocks`, `theme`, `decisionPacket`, `opportunityPacket`) as the main flexible state carrier for generated artifacts and editor data.

## Key Abstractions

**Internal User Record:**
- Purpose: Bridge Clerk identity to product data and credits.
- Examples: `lib/auth.ts`, `prisma/schema.prisma` (`model User`)
- Pattern: Resolve Clerk `userId` to a local `User` row before domain reads/writes.

**Analysis Pipeline Packet Types:**
- Purpose: Carry progressively richer assessment data between pipeline stages.
- Examples: `src/logic/ad-os/buildDecisionPacket.ts`, `src/logic/ad-os/buildOpportunityPacket.ts`, `src/logic/ad-os/buildAssetPackage.ts`
- Pattern: Compose many narrow functions instead of one large analyzer.

**Campaign Workspace:**
- Purpose: Persist generated ad, landing, email, checklist, and creative artifacts as editable workspace state.
- Examples: `prisma/schema.prisma` (`Campaign`, `AdVariation`, `LandingDraft`, `EmailDraft`, `ChecklistItem`), `app/api/campaigns/route.ts`, `app/api/campaigns/[id]/generate/route.ts`
- Pattern: Create or regenerate denormalized child records from stored analysis outputs.

**Site Builder Block Tree:**
- Purpose: Model public site content as JSON-configured blocks editable in-app and renderable on the public route.
- Examples: `components/site-builder/BlockRenderer.tsx`, `components/site-builder/BlockPropsEditor.tsx`, `app/api/sites/route.ts`, `app/s/[slug]/page.tsx`
- Pattern: Store typed-ish block arrays in Prisma JSON and render by block `type`.

**Skill Registry:**
- Purpose: Treat skill capabilities as metadata-driven products with common execution plumbing.
- Examples: `lib/skills/registry.ts`, `app/api/skills/[slug]/run/route.ts`
- Pattern: Register inputs/credits/output expectations in one place, then dispatch to either AI or pipeline executors.

## Entry Points

**Root Application Shell:**
- Location: `app/layout.tsx`
- Triggers: Every route render.
- Responsibilities: Install `ClerkProvider`, fonts, global CSS, and `Toaster`.

**Authenticated Dashboard:**
- Location: `app/page.tsx`
- Triggers: Requests to `/`.
- Responsibilities: Redirect unauthenticated users, check onboarding status through `/api/settings`, and aggregate dashboard data from `/api/leads`, `/api/campaigns`, and `/api/sites`.

**Analysis API:**
- Location: `app/api/analyze/route.ts`
- Triggers: Product/business URL analysis requests.
- Responsibilities: Run the end-to-end analysis and asset-generation pipeline and persist results.

**Skills API:**
- Location: `app/api/skills/[slug]/run/route.ts`
- Triggers: Skill form submissions.
- Responsibilities: Validate inputs, manage credits, dispatch execution, and refund on failure.

**Public Site Renderer:**
- Location: `app/s/[slug]/page.tsx`
- Triggers: Requests to published site URLs.
- Responsibilities: Load site/page/product/user tracking data, generate metadata, render blocks, and increment analytics counters.

## Error Handling

**Strategy:** Return JSON error payloads from route handlers, log to stderr with `console.error`, and treat several persistence failures as graceful/non-fatal when generation can still complete.

**Patterns:**
- Return early on auth or validation failures with `NextResponse.json(..., { status })`, as in `app/api/settings/route.ts` and `app/api/sites/[id]/pages/[pageId]/route.ts`.
- Wrap handler bodies in `try/catch` and log a domain-specific prefix such as `"Campaign generate error:"` or `"Analysis error:"`.
- Allow partial success for background persistence in `app/api/analyze/route.ts`, `app/api/scan/route.ts`, and `app/api/report/route.ts`.

## Cross-Cutting Concerns

**Logging:** Use direct `console.error` logging inside route handlers and helpers. No centralized logger is detected.

**Validation:** Keep validation inline in handlers and helper functions. Examples: `normalizeInput()` in `src/logic/ad-os/normalizeInput.ts`, request-body field checks in `app/api/sites/route.ts`, and skill input checks in `app/api/skills/[slug]/run/route.ts`.

**Authentication:** Use Clerk as the identity provider via `auth()` and `currentUser()` from `@clerk/nextjs/server`, then sync to a local Prisma `User` via `lib/auth.ts`.

**Authorization:** Most secured routes scope queries by local `user.id`, but some campaign endpoints still rely on an `x-user-id` header instead of Clerk auth, notably `app/api/campaigns/route.ts`.

---

*Architecture analysis: 2026-03-24*
