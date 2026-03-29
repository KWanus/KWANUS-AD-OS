# Codebase Structure

**Analysis Date:** 2026-03-24

## Directory Layout

```text
KWANUS-AD-OS/
├── app/                    # App Router pages, layouts, public routes, and all HTTP route handlers
├── components/             # Reusable UI components and in-browser editors/renderers
├── engines/                # Small standalone scan engines
├── lib/                    # Shared infrastructure, auth, DB client, utilities, and skill executors
├── prisma/                 # Prisma schema and SQL migrations
├── src/data/               # Static catalog/template data used by pages and generators
├── src/logic/ad-os/        # Core analysis and asset-generation pipeline
├── public/                 # Static assets if added; not prominent in current architecture
└── .planning/codebase/     # Generated codebase mapping documents
```

## Directory Purposes

**`app/`:**
- Purpose: Hold all routes for the product UI, public site delivery, and JSON APIs.
- Contains: Feature pages like `app/agency/page.tsx`, nested layouts like `app/clients/layout.tsx`, dynamic workspace pages like `app/websites/[id]/editor/[pageId]/page.tsx`, and API handlers in `app/api/**/route.ts`.
- Key files: `app/layout.tsx`, `app/page.tsx`, `app/s/[slug]/page.tsx`, `app/api/analyze/route.ts`, `app/api/sites/route.ts`

**`components/`:**
- Purpose: Hold reusable visual building blocks and editor widgets.
- Contains: Navigation (`components/AppNav.tsx`), site builder components (`components/site-builder/*`), studio tooling (`components/studio/*`), email-flow nodes, and workflow UI.
- Key files: `components/AppNav.tsx`, `components/site-builder/BlockRenderer.tsx`, `components/site-builder/BlockPropsEditor.tsx`, `components/studio/CreativeStudio.tsx`

**`engines/`:**
- Purpose: Isolate simple scan engines from route handlers.
- Contains: URL/product scan implementations with plain TypeScript functions.
- Key files: `engines/businessScanEngine.ts`, `engines/productScanEngine.ts`

**`lib/`:**
- Purpose: Hold shared non-UI modules used across route handlers and pages.
- Contains: Prisma setup, Clerk sync, email/webhook helpers, scan orchestration, skill metadata/executors, and domain helpers.
- Key files: `lib/prisma.ts`, `lib/auth.ts`, `lib/scanOrchestrator.ts`, `lib/skills/executor.ts`, `lib/skills/registry.ts`

**`prisma/`:**
- Purpose: Define persistent models and track schema migrations.
- Contains: `schema.prisma` plus timestamped migration SQL directories.
- Key files: `prisma/schema.prisma`, `prisma/migrations/20260322003721_add_campaign_workspace/migration.sql`

**`src/data/`:**
- Purpose: Store static product and template datasets consumed by UIs or generators.
- Contains: Curated offers and email flow templates.
- Key files: `src/data/curatedOffers.ts`, `src/data/emailFlowTemplates.ts`

**`src/logic/ad-os/`:**
- Purpose: Hold the main reusable decisioning/generation pipeline.
- Contains: Sequential analysis steps and asset builders for scoring URLs and producing campaign assets.
- Key files: `src/logic/ad-os/normalizeInput.ts`, `src/logic/ad-os/fetchPage.ts`, `src/logic/ad-os/buildDecisionPacket.ts`, `src/logic/ad-os/buildAssetPackage.ts`

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root shell for fonts, Clerk, global CSS, and toasts.
- `app/page.tsx`: Main dashboard route.
- `app/s/[slug]/page.tsx`: Public published-site route.
- `app/api/analyze/route.ts`: Analysis pipeline API entry point.
- `app/api/skills/[slug]/run/route.ts`: Skills execution API entry point.

**Configuration:**
- `package.json`: Runtime scripts and dependency manifest.
- `tsconfig.json`: TypeScript config and the `@/*` alias.
- `prisma/schema.prisma`: Database schema.

**Core Logic:**
- `src/logic/ad-os/*.ts`: Analysis, scoring, and generation pipeline.
- `lib/auth.ts`: Clerk-to-Prisma user synchronization.
- `lib/skills/*.ts`: Skill registry and executors.
- `engines/*.ts`: Simple synchronous scan engines.

**Testing:**
- No dedicated test directories or `*.test.*` / `*.spec.*` files were detected in the explored tree.

## Naming Conventions

**Files:**
- Use route-convention filenames inside `app/`: `page.tsx`, `layout.tsx`, `route.ts`.
- Use camelCase for utility and logic modules outside `app/`, such as `lib/scanOrchestrator.ts` and `src/logic/ad-os/buildOpportunityPacket.ts`.
- Use PascalCase for reusable React component files, such as `components/AppNav.tsx` and `components/site-builder/BlockRenderer.tsx`.

**Directories:**
- Use domain-first directories under `app/` and `app/api/`: `app/affiliate`, `app/agency`, `app/api/local`, `app/api/email-flows`.
- Use Next dynamic segment folders for entity IDs and slugs: `app/websites/[id]`, `app/s/[slug]`, `app/api/clients/[id]`.
- Keep feature sub-areas nested beneath their domain route, for example `app/clients/dashboard`, `app/clients/pipeline`, and `app/websites/[id]/editor/[pageId]`.

## Where to Add New Code

**New Feature Route:**
- Primary page code: Add a new `page.tsx` under the matching `app/<domain>/` folder.
- Matching API: Add route handlers under `app/api/<domain>/`.
- Shared UI for that feature: Put reusable pieces in `components/` if used across pages; keep single-use route UI close to the page file if it is not reused elsewhere.

**New Business Logic:**
- Analysis/scoring/generation steps that should be reusable across routes belong in `src/logic/ad-os/`.
- Auth, database, integration, or cross-domain utilities belong in `lib/`.
- Small standalone engines that do not need Prisma or route context belong in `engines/`.
- Avoid putting heavy reusable logic directly in `app/api/**/route.ts` when the same flow will be reused by skills or multiple APIs.

**New CRUD Module:**
- Implementation: Add `route.ts` files under `app/api/<resource>/` and `app/api/<resource>/[id]/`.
- Persistence model: Extend `prisma/schema.prisma` first, then wire the handler to `lib/prisma.ts`.
- Authorization: Follow the `getOrCreateUser()` + scoped query pattern used in `app/api/sites/route.ts` and `app/api/sites/[id]/route.ts`.

**New Component/Module:**
- Shared components: `components/`
- Site-builder specific render/edit components: `components/site-builder/`
- Creative/editor canvas components: `components/studio/`
- Email-flow visual editor parts: `components/email-flow/`

**Utilities:**
- Shared helpers: `lib/`
- Static datasets/constants: `src/data/`

## Route Layout Guidance

**Top-Level Product Routes:**
- Put major product surfaces directly under `app/`, following existing domains such as `app/agency`, `app/affiliate`, `app/campaigns`, `app/clients`, `app/consult`, `app/dropship`, `app/emails`, `app/leads`, `app/local`, `app/products`, `app/projects`, `app/settings`, `app/skills`, `app/websites`, and `app/winners`.
- Mirror each major route domain under `app/api/` when it has server actions or persistence needs, as seen with `app/api/agency`, `app/api/affiliate`, `app/api/campaigns`, `app/api/clients`, `app/api/local`, `app/api/sites`, and `app/api/skills`.

**Nested Workspace Layouts:**
- Add a nested `layout.tsx` only when a section needs shared navigation or chrome across subpages, following `app/clients/layout.tsx`.
- Prefer dynamic nested folders for entity workspaces, such as `app/websites/[id]/`, `app/campaigns/[id]/`, `app/clients/[id]/`, and `app/forms/[id]/`.

**Public and External-Facing Routes:**
- Put public generated-site delivery under `app/s/[slug]/`.
- Put external callbacks and payment/webhook routes under `app/api/stripe/**` and `app/api/webhooks/**`.

## Folder Organization Rules

**Business Logic Placement:**
- Put URL analysis and asset generation in `src/logic/ad-os/`, not in UI files.
- Put metadata-driven skill definitions in `lib/skills/registry.ts`.
- Put skill orchestration and persistence in `lib/skills/*.ts` or `lib/skills/executor.ts`.
- Keep route handlers focused on request parsing, auth, orchestration, and serialization.

**Data Model Ownership:**
- `prisma/schema.prisma` is the single source of truth for persisted entities.
- JSON-heavy models such as `Campaign.workflowState`, `AnalysisRun.decisionPacket`, `OpportunityAssessment.opportunityPacket`, `Site.theme`, and `SitePage.blocks` define much of the app’s flexible state model.

**Auth Boundary:**
- Treat `lib/auth.ts` as the standard boundary for obtaining the local `User` row from Clerk.
- Prefer Clerk-backed auth over ad hoc header-based identity. Existing `x-user-id` usage in `app/api/campaigns/route.ts` is an exception, not the pattern to extend.

## Special Directories

**`app/api/`:**
- Purpose: JSON API layer for the App Router app.
- Generated: No
- Committed: Yes

**`prisma/migrations/`:**
- Purpose: SQL history for schema changes.
- Generated: Yes
- Committed: Yes

**`.planning/codebase/`:**
- Purpose: Generated architecture/reference docs consumed by other GSD commands.
- Generated: Yes
- Committed: Yes

**`app/projects/%5Bid%5D/`:**
- Purpose: Encoded-bracket duplicate of a dynamic route directory.
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-03-24*
