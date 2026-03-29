# Codebase Concerns

**Analysis Date:** 2026-03-24

## Tech Debt

**Monolithic route pages and mixed concerns:**
- Issue: Several product surfaces collapse orchestration, state management, rendering, and domain logic into single client pages larger than 900-2000 lines.
- Files: `app/campaigns/[id]/page.tsx`, `app/dropship/products/[id]/page.tsx`, `app/affiliate/offers/[id]/page.tsx`, `app/onboarding/page.tsx`, `app/agency/page.tsx`, `app/analyze/page.tsx`, `components/site-builder/BlockRenderer.tsx`, `components/studio/CreativeStudio.tsx`
- Impact: Small changes carry high regression risk, type failures are harder to isolate, and feature work will keep increasing component complexity.
- Fix approach: Split route pages into feature modules under route-local components/hooks, move data transforms to `lib/` or `src/logic/`, and keep page files as composition shells.

**Inconsistent ownership and auth model across APIs:**
- Issue: Most APIs use Clerk-backed ownership checks, but some routes bypass that pattern and trust request headers or no auth at all.
- Files: `app/api/campaigns/route.ts`, `app/api/email-flows/[id]/route.ts`, `app/api/email-flows/route.ts`, `lib/auth.ts`
- Impact: The codebase has no reliable API security convention. New routes can easily copy the unsafe pattern and expose tenant data.
- Fix approach: Standardize on `auth()` + `getOrCreateUser()` for every user-scoped route and reject requests that are not explicitly system-to-system.

**Duplicated and diverging project workspace implementations:**
- Issue: There are two different project detail routes, and one is a skeleton with placeholder phases.
- Files: `app/projects/[id]/page.tsx`, `app/projects/%5Bid%5D/page.tsx`
- Impact: Future edits can land in the wrong file, routing intent is unclear, and dead code will drift from the live implementation.
- Fix approach: Remove the encoded duplicate route, keep one canonical project workspace, and delete placeholder code once migrated.

## Known Bugs

**Production build currently fails type checking:**
- Symptoms: `npm run build` exits with code 1 during the Next.js type check step.
- Files: `app/affiliate/page.tsx`
- Trigger: Running `npm run build` on 2026-03-24 fails at `app/affiliate/page.tsx:738` with `Type 'unknown' is not assignable to type 'ReactNode'`.
- Workaround: None in the current repo; the build must be fixed before deployment.

**n8n processing workflow cannot complete against auth-protected endpoints:**
- Symptoms: The webhook hub calls lead analyze/generate/outreach routes without authentication context.
- Files: `app/api/webhooks/n8n/route.ts`, `app/api/leads/[id]/analyze/route.ts`, `app/api/leads/[id]/generate/route.ts`, `app/api/leads/[id]/outreach/route.ts`
- Trigger: `business-processing` and `outreach` fetch internal endpoints using only `baseUrl`, but the target routes require Clerk auth.
- Workaround: None implemented. This only works if auth is bypassed outside the repo, which the code does not show.

**Campaign listing can leak cross-user data:**
- Symptoms: Listing campaigns without `x-user-id` returns every campaign because the query falls back to an empty filter.
- Files: `app/api/campaigns/route.ts`
- Trigger: Call `GET /api/campaigns` without a trusted `x-user-id` header.
- Workaround: None enforced in code. The caller must supply a correct header, which is not a safe boundary.

## Security Considerations

**User-scoped email flow routes are unauthenticated:**
- Risk: Any caller who knows an `EmailFlow` id can read, update, or delete it.
- Files: `app/api/email-flows/[id]/route.ts`
- Current mitigation: None in the route.
- Recommendations: Require Clerk auth, resolve the current user, and scope all Prisma lookups by `userId`.

**Campaign routes trust spoofable request headers:**
- Risk: `x-user-id` is used as the only tenant boundary for campaign reads and writes.
- Files: `app/api/campaigns/route.ts`
- Current mitigation: None shown in the route.
- Recommendations: Remove header-based tenancy for browser-facing APIs. Use authenticated user lookup and, if system calls are required, isolate them behind a separate signed internal interface.

**Webhook authentication fails open in misconfigured environments:**
- Risk: The n8n webhook hub accepts any request when `WEBHOOK_SECRET` is missing or left as `REPLACE_ME`.
- Files: `app/api/webhooks/n8n/route.ts`
- Current mitigation: Commented “dev mode” behavior only.
- Recommendations: Fail closed outside explicit local development, validate environment at boot, and log rejected attempts.

**Stored integration secrets are written directly to the user record:**
- Risk: The settings API stores `resendApiKey` as submitted, and the schema comment explicitly notes plaintext in development.
- Files: `app/api/settings/route.ts`, `prisma/schema.prisma`
- Current mitigation: The GET route returns only `hasResendKey`, not the secret itself.
- Recommendations: Encrypt at rest before persistence, separate secret storage from profile data, and add rotation/audit support.

**Outbound webhooks have no delivery verification or destination controls:**
- Risk: Arbitrary user-provided URLs receive POSTs, failures are swallowed, and the caller gets no delivery status.
- Files: `lib/webhooks.ts`, `app/api/settings/route.ts`
- Current mitigation: Timeout plus best-effort fire-and-forget.
- Recommendations: Validate webhook URLs, record attempts/results, sign payloads, and expose retry/health status in the UI.

## Performance Bottlenecks

**Large client bundles concentrated in single routes:**
- Problem: Several major pages are very large client components and likely expensive to hydrate.
- Files: `app/campaigns/[id]/page.tsx`, `app/dropship/products/[id]/page.tsx`, `app/affiliate/offers/[id]/page.tsx`, `app/page.tsx`, `app/leads/[id]/page.tsx`
- Cause: Extensive client-side rendering, inline helper functions, and broad route-level state.
- Improvement path: Move read-heavy sections to server components where possible, code-split feature tabs, and extract local hooks/components.

**Public site rendering pulls full site payloads on every ISR render:**
- Problem: Public pages fetch site, home page, products, and pixel settings together, then render arbitrary block JSON.
- Files: `app/s/[slug]/page.tsx`, `components/site-builder/BlockRenderer.tsx`
- Cause: One broad query plus a large renderer component for all block types.
- Improvement path: Trim selected fields, split block renderers by type, and add stronger guarantees around block payload shape.

## Fragile Areas

**Site builder block system depends on loosely typed JSON contracts:**
- Files: `components/site-builder/BlockRenderer.tsx`, `components/site-builder/BlockPropsEditor.tsx`, `app/api/sites/route.ts`, `app/api/leads/[id]/deploy-site/route.ts`
- Why fragile: Blocks are assembled and mutated as generic objects with multiple `any`/loose casts, so renderer/editor drift is easy.
- Safe modification: Introduce a typed block schema per block type and validate before saving or rendering.
- Test coverage: No automated tests detected for block creation, editing, or public rendering.

**Email automation data can be modified outside tenant boundaries:**
- Files: `app/api/email-flows/[id]/route.ts`, `app/api/email-broadcasts/[id]/send/route.ts`, `app/api/opt-in-forms/[id]/submit/route.ts`, `lib/email/send.ts`
- Why fragile: Some email routes are scoped correctly while others are globally addressable, so the subsystem has inconsistent safety guarantees.
- Safe modification: Normalize all email endpoints around `userId` ownership and add integration tests for flow/broadcast/form lifecycles.
- Test coverage: No automated tests detected for email automation APIs.

**Lead automation pipeline spans multiple partially connected subsystems:**
- Files: `app/api/leads/search/route.ts`, `app/api/webhooks/n8n/route.ts`, `app/api/leads/[id]/analyze/route.ts`, `app/api/leads/[id]/generate/route.ts`, `app/api/leads/[id]/deploy-site/route.ts`
- Why fragile: Search, AI generation, deployment, and external automation all depend on environment keys and route-to-route calls with little shared contract enforcement.
- Safe modification: Replace ad hoc HTTP chaining with internal service functions or background jobs and define a single lead state machine.
- Test coverage: No automated tests detected for end-to-end lead processing.

## Scaling Limits

**Synchronous fan-out for broadcast sends:**
- Current capacity: Sends in batches of 10 inside a single request lifecycle.
- Limit: Large lists risk timeouts, partial sends, and inconsistent status if the process dies mid-run.
- Scaling path: Move broadcast sending to a queue/worker model with per-recipient delivery records and resumable jobs.
- Files: `app/api/email-broadcasts/[id]/send/route.ts`, `lib/email/send.ts`

**Webhook-driven lead processing is sequential and request-bound:**
- Current capacity: `business-processing` loops through IDs serially and performs network calls per lead.
- Limit: Throughput degrades linearly and failures are only counted, not recoverable.
- Scaling path: Enqueue per-lead jobs, parallelize safely, and persist processing state/results.
- Files: `app/api/webhooks/n8n/route.ts`

## Dependencies at Risk

**Direct LLM/API calls are embedded in route handlers without abstraction:**
- Risk: Anthropic and OpenAI integrations are spread across many routes and use provider-specific prompting/response parsing inline.
- Impact: Provider changes or model migration will require many repetitive edits and can introduce inconsistent behavior.
- Migration plan: Centralize model clients, prompt contracts, fallback behavior, and error handling in shared service modules.
- Files: `lib/skills/executor.ts`, `app/api/ai/generate-email/route.ts`, `app/api/creative/generate-image/route.ts`, `app/api/agency/*`, `app/api/affiliate/*`, `app/api/dropship/*`, `app/api/local/*`, `app/api/consult/*`

## Missing Critical Features

**Storefront product experience is visibly unfinished:**
- Problem: The store dashboard exposes search and “Add Product” actions with no wired behavior, and the public products block renders a placeholder instead of catalog data.
- Blocks: Real store management and real storefront merchandising.
- Files: `app/websites/[id]/store/page.tsx`, `components/site-builder/BlockRenderer.tsx`, `app/api/products/route.ts`, `app/s/[slug]/page.tsx`

**Project workflow shell is only partially implemented in one route copy:**
- Problem: The duplicate encoded project route contains placeholder phase screens such as “Audit Phase Implementation...”.
- Blocks: Confidence in the project workflow architecture and safe maintenance of the project workspace.
- Files: `app/projects/%5Bid%5D/page.tsx`

**Several AI-assisted flows degrade to demo or placeholder output instead of hard failure:**
- Problem: Missing provider keys can still return demo leads or placeholder email content, which makes the product appear functional while producing fake data.
- Blocks: Reliable operator workflows and trustworthy QA.
- Files: `app/api/leads/search/route.ts`, `app/api/ai/generate-email/route.ts`, `lib/email/send.ts`

**There is no automated test suite in the repository:**
- Problem: No test files or test runner configuration were detected during exploration.
- Blocks: Safe refactoring of auth, billing, lead automation, and site builder flows.
- Files: `package.json`, repository-wide

## Test Coverage Gaps

**Access control and tenant isolation are untested:**
- What's not tested: Unauthorized access to `campaigns`, `email-flows`, and other user-scoped APIs.
- Files: `app/api/campaigns/route.ts`, `app/api/email-flows/[id]/route.ts`, `app/api/sites/[id]/route.ts`
- Risk: Cross-tenant data exposure can ship unnoticed.
- Priority: High

**Build and type safety for large client pages are untested:**
- What's not tested: Route-level rendering and type soundness across large pages such as affiliate, campaigns, leads, and sites.
- Files: `app/affiliate/page.tsx`, `app/campaigns/[id]/page.tsx`, `app/leads/[id]/page.tsx`, `app/websites/[id]/store/page.tsx`
- Risk: The repo can compile in dev but fail during production build.
- Priority: High

**Operational integrations are untested:**
- What's not tested: Stripe webhook handling, n8n webhook flows, email broadcast execution, and opt-in submissions.
- Files: `app/api/stripe/webhook/route.ts`, `app/api/webhooks/stripe/route.ts`, `app/api/webhooks/n8n/route.ts`, `app/api/email-broadcasts/[id]/send/route.ts`, `app/api/opt-in-forms/[id]/submit/route.ts`
- Risk: Payment, automation, and messaging failures will surface only in production.
- Priority: High

**Site builder publishing path is untested:**
- What's not tested: Starter block generation, lead-to-site deployment, and public rendering of saved block JSON.
- Files: `app/api/sites/route.ts`, `app/api/leads/[id]/deploy-site/route.ts`, `components/site-builder/BlockRenderer.tsx`, `app/s/[slug]/page.tsx`
- Risk: Published sites can render incomplete or invalid content with no warning.
- Priority: High

---

*Concerns audit: 2026-03-24*
