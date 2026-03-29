# Testing Patterns

**Analysis Date:** 2026-03-24

## Test Framework

**Runner:**
- Not detected.
- Config: Not detected. No `jest.config.*`, `vitest.config.*`, `playwright.config.*`, or `cypress.config.*` was found at the project root.

**Assertion Library:**
- Not detected.

**Run Commands:**
```bash
npm run lint          # Only explicit quality script in `package.json`
npm run build         # Only production verification script in `package.json`
Not detected          # Watch mode test command
Not detected          # Coverage command
```

## Test File Organization

**Location:**
- No co-located or separate automated test files were detected. `rg --files -g '*.test.*' -g '*.spec.*' -g '__tests__/**' -g 'tests/**' .` returned no matches.

**Naming:**
- Not detected.

**Structure:**
```text
Not detected
```

## Test Structure

**Suite Organization:**
```typescript
// No `describe`, `it`, `test`, or `expect` suites were detected in app code.
// The current verification shape is manual runtime checking through pages,
// API routes, `npm run lint`, and `npm run build`.
```

**Patterns:**
- Setup pattern: Not detected.
- Teardown pattern: Not detected.
- Assertion pattern: Not detected.

## Mocking

**Framework:** Not detected

**Patterns:**
```typescript
// No mocking utilities or mock modules were detected.
```

**What to Mock:**
- No project convention is established. If automated tests are added, start by mocking external providers in `@clerk/nextjs`, `stripe`, `openai`, `@anthropic-ai/sdk`, `resend`, and Prisma access from `lib/prisma.ts`.

**What NOT to Mock:**
- Preserve pure deterministic logic under `src/logic/ad-os/` as real units where possible, for example `src/logic/ad-os/scoreOpportunity.ts`, `src/logic/ad-os/extractSignals.ts`, and `src/logic/ad-os/normalizeInput.ts`.

## Fixtures and Factories

**Test Data:**
```typescript
// Not detected. No fixture, factory, or seed helper directories were found for tests.
```

**Location:**
- Not detected.

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
Not detected
```

## Test Types

**Unit Tests:**
- Not used in the current repository state. No unit test runner, assertion library, or unit test files were detected.
- The best unit-test candidates are pure TypeScript modules under `src/logic/ad-os/` and small helpers in `lib/clients/healthScore.ts`.

**Integration Tests:**
- Not used in the current repository state.
- Existing code patterns would benefit most from route-level integration tests around `app/api/**/route.ts`, especially auth and Prisma-backed handlers such as `app/api/leads/route.ts`, `app/api/clients/route.ts`, `app/api/email-flows/[id]/route.ts`, and `app/api/sites/route.ts`.

**E2E Tests:**
- Not used. No Playwright or Cypress configuration was detected.
- The main E2E candidates are high-value flows with heavy client composition: dashboard load in `app/page.tsx`, onboarding in `app/onboarding/page.tsx`, email flow editing in `app/emails/flows/[id]/page.tsx`, campaign detail editing in `app/campaigns/[id]/page.tsx`, and site building in `app/websites/[id]/editor/[pageId]/page.tsx`.

## Common Patterns

**Async Testing:**
```typescript
// Not detected.
// The runtime code heavily uses async `fetch`, `Promise.allSettled`, and async route handlers:
// - `app/page.tsx`
// - `components/email-flow/FlowBuilder.tsx`
// - `app/api/leads/route.ts`
// - `app/api/email-flows/[id]/route.ts`
```

**Error Testing:**
```typescript
// Not detected.
// Error behavior currently depends on `try/catch` in route handlers and non-blocking client catches.
```

## Delivery Practices

**Automated gates:**
- `package.json` exposes `lint`, `build`, and runtime scripts only. There is no `test` script, no coverage script, and no CI workflow under `.github/`.
- The effective delivery gate is local static verification through `npm run lint` and `npm run build`.

**Current verification style:**
- Quality is enforced mostly through TypeScript strict mode in `tsconfig.json` and ESLint via `eslint.config.mjs`.
- Production behavior is validated manually through real pages and API routes rather than through repeatable automation.
- Large interactive frontend surfaces rely on runtime behavior only, including `components/studio/CreativeStudio.tsx`, `components/email-flow/FlowBuilder.tsx`, `components/site-builder/BlockRenderer.tsx`, and `app/campaigns/[id]/page.tsx`.

**Maintainability risks from missing tests:**
- Prisma-backed routes can regress silently because there is no route contract coverage for auth, JSON shape, or ownership checks in `app/api/leads/route.ts`, `app/api/clients/route.ts`, `app/api/email-flows/[id]/route.ts`, and similar handlers.
- Oversized client components have no behavior snapshots or interaction tests, especially `components/studio/CreativeStudio.tsx`, `components/site-builder/BlockRenderer.tsx`, `components/email-flow/FlowBuilder.tsx`, and `app/dropship/products/[id]/page.tsx`.
- Type escapes (`any`, `@ts-ignore`, eslint disables) concentrate in builder/editor paths and API integration code, but no tests backstop those weakly typed boundaries.

## Prescriptive Guidance

- Treat `npm run lint` and `npm run build` as mandatory pre-merge checks until a real test harness exists.
- Add the first unit tests around pure logic in `src/logic/ad-os/` and `lib/clients/healthScore.ts`; these modules have the lowest setup cost and the clearest expected outputs.
- Add the first integration tests around `app/api/leads/route.ts`, `app/api/clients/route.ts`, and `app/api/email-flows/[id]/route.ts` because they encode auth, ownership, and JSON response contracts that are easy to break.
- Add browser tests only after extracting smaller components from the largest pages. Current file sizes in `app/campaigns/[id]/page.tsx`, `app/dropship/products/[id]/page.tsx`, `components/site-builder/BlockRenderer.tsx`, and `components/studio/CreativeStudio.tsx` make UI testing harder than it needs to be.
- When adding fixtures, avoid reading `.env`; an `.env` file is present at the repo root and should remain out of committed test artifacts.

---

*Testing analysis: 2026-03-24*
