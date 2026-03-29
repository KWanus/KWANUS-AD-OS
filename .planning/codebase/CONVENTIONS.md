# Coding Conventions

**Analysis Date:** 2026-03-24

## Naming Patterns

**Files:**
- Route handlers use Next App Router names: `page.tsx`, `layout.tsx`, and `route.ts` under `app/`, such as `app/page.tsx`, `app/layout.tsx`, and `app/api/leads/route.ts`.
- Shared React components use PascalCase filenames under `components/`, such as `components/AppNav.tsx`, `components/studio/CreativeStudio.tsx`, and `components/email-flow/FlowBuilder.tsx`.
- Library and logic modules use camelCase filenames under `lib/` and `src/logic/`, such as `lib/scanOrchestrator.ts`, `lib/scanForCopilot.ts`, and `src/logic/ad-os/buildDecisionPacket.ts`.

**Functions:**
- Exported React components use PascalCase function names, such as `RootLayout` in `app/layout.tsx`, `Dashboard` in `app/page.tsx`, and `FlowBuilder` in `components/email-flow/FlowBuilder.tsx`.
- Internal helpers use camelCase and stay near usage, such as `getGreeting`, `getScoreColor`, and `timeAgo` in `app/page.tsx`, plus `autoLayout` in `components/email-flow/FlowBuilder.tsx`.
- Route handlers use uppercase HTTP verb exports with `NextRequest` and `NextResponse`, such as `GET`, `PATCH`, and `DELETE` in `app/api/email-flows/[id]/route.ts`.

**Variables:**
- Mutable React state uses `[value, setValue]` naming, such as `const [leads, setLeads] = useState<Lead[]>([])` in `app/page.tsx` and `const [selectedNode, setSelectedNode] = useState<Node<AnyRecord> | null>(null)` in `components/email-flow/FlowBuilder.tsx`.
- Constants are uppercase snake case when reused broadly inside a file, such as `PIPELINE_STAGES` in `app/page.tsx`, `AD_FORMATS` in `components/studio/CreativeStudio.tsx`, and `STATUS_CONFIG` in `components/email-flow/FlowBuilder.tsx`.

**Types:**
- Domain and prop types use PascalCase `interface` or `type` aliases, such as `Lead`, `Campaign`, `Site` in `app/page.tsx`, `StudioBrief` in `components/studio/CreativeStudio.tsx`, and `EmailNodeData` in `components/email-flow/nodes/EmailNode.tsx`.
- Prefer inline request body typing at the point of `req.json()` in API routes, as in `app/api/email-flows/[id]/route.ts` and `app/api/clients/route.ts`.
- `Record<string, unknown>` appears in some places, but `Record<string, any>` and raw `any` are still used in weakly-typed editors and block systems, notably `components/email-flow/FlowBuilder.tsx`, `components/site-builder/BlockRenderer.tsx`, `lib/skills/executor.ts`, and `app/api/sites/route.ts`.

## Code Style

**Formatting:**
- Formatting is ESLint-driven rather than Prettier-driven. No `.prettierrc` or `biome.json` was detected at the project root.
- Use double quotes, semicolons, trailing commas, and multi-line object/array formatting consistent with `app/layout.tsx`, `lib/prisma.ts`, and `app/api/leads/route.ts`.
- Files commonly use section-divider comments to break large modules into blocks, especially `app/page.tsx`, `components/studio/CreativeStudio.tsx`, `components/email-flow/FlowBuilder.tsx`, and `components/site-builder/BlockRenderer.tsx`.

**Linting:**
- ESLint is configured through `eslint.config.mjs` using `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.
- The project inherits Next.js and TypeScript lint defaults and ignores only `.next/**`, `out/**`, `build/**`, and `next-env.d.ts` in `eslint.config.mjs`.
- TypeScript strict mode is enabled in `tsconfig.json`, but the codebase selectively suppresses linting or typing in complex UI/editor paths with `eslint-disable-next-line`, `@ts-ignore`, and `any`, especially in `components/email-flow/FlowBuilder.tsx`, `components/site-builder/BlockPropsEditor.tsx`, `components/site-builder/BlockRenderer.tsx`, `app/api/checkout/route.ts`, and `app/api/webhooks/stripe/route.ts`.

## Import Organization

**Order:**
1. Framework imports first: `react`, `next/*`, and package CSS imports, as in `app/page.tsx`, `components/email-flow/FlowBuilder.tsx`, and `app/layout.tsx`.
2. Third-party packages second: `@clerk/nextjs`, `@xyflow/react`, `lucide-react`, `sonner`, and similar.
3. App-local modules last through the `@/` alias, such as `@/components/AppNav`, `@/lib/prisma`, and `@/components/email-flow/nodes/TriggerNode`.

**Path Aliases:**
- Use the `@/*` alias from `tsconfig.json` for cross-project imports. Examples appear in `app/page.tsx`, `app/api/leads/route.ts`, and `app/emails/flows/[id]/FlowPageClient.tsx`.
- Relative imports are still used for adjacent files, such as `./FlowPageClient` in `app/emails/flows/[id]/page.tsx` and `./KonvaCanvas` in `components/studio/CreativeStudio.tsx`.

## Error Handling

**Patterns:**
- API routes wrap handlers in `try/catch`, return structured JSON with `{ ok: false, error: ... }`, and map failures to HTTP status codes. Follow the pattern in `app/api/leads/route.ts`, `app/api/email-flows/[id]/route.ts`, and `app/api/clients/route.ts`.
- Client pages and components often tolerate partial failures and continue rendering, for example `Promise.allSettled` in `app/page.tsx`, silent onboarding fetch failure in `app/page.tsx`, and `.catch(console.error)` in `components/email-flow/FlowBuilder.tsx` and `app/clients/[id]/page.tsx`.
- Prefer explicit early authorization and ownership checks in routes that touch user data, as shown in `app/api/leads/route.ts` and `app/api/clients/route.ts`.
- Validation is mostly ad hoc through inline narrowing and `trim()` checks rather than shared schemas. There was no Zod or equivalent schema layer detected in the TypeScript entry points inspected.

## Logging

**Framework:** `console`

**Patterns:**
- Server-side logging relies on `console.error`, `console.warn`, and occasional `console.log`, such as `lib/email/send.ts`, `app/api/stats/route.ts`, `app/api/stripe/webhook/route.ts`, and `app/api/report/route.ts`.
- Client-side logging is lightweight and mostly used for non-blocking fetch failures, such as `app/websites/page.tsx`, `app/websites/[id]/store/page.tsx`, and `app/clients/[id]/page.tsx`.
- No structured logger, trace IDs, or central logging utility was detected in `app/`, `components/`, `lib/`, or `src/`.

## Comments

**When to Comment:**
- Comments are used mainly as section headers in large files, not as line-by-line explanations. Examples: `app/page.tsx`, `components/studio/CreativeStudio.tsx`, `components/email-flow/FlowBuilder.tsx`, and `components/site-builder/BlockRenderer.tsx`.
- Use comments to label major UI or logic regions when a file is large; do not rely on comments to compensate for missing decomposition.

**JSDoc/TSDoc:**
- Not detected in the sampled TypeScript source. The codebase relies on inline types and descriptive naming instead of JSDoc blocks.

## Function Design

**Size:**
- Small helper functions are common inside large page/component files, such as the dashboard helpers in `app/page.tsx` and layout helpers in `components/site-builder/BlockRenderer.tsx`.
- Maintainability drops sharply in several oversized files. Current hotspots include `app/campaigns/[id]/page.tsx` (2005 lines), `app/dropship/products/[id]/page.tsx` (1275 lines), `components/site-builder/BlockRenderer.tsx` (1248 lines), `app/onboarding/page.tsx` (1090 lines), and `components/studio/CreativeStudio.tsx` (1051 lines). Add new behavior by extracting subcomponents or domain helpers instead of extending these files further.

**Parameters:**
- Component props are usually typed inline or through nearby interfaces, such as `FlowPageClient` in `app/emails/flows/[id]/FlowPageClient.tsx` and `CreativeStudioProps` in `components/studio/CreativeStudio.tsx`.
- Route context parameters follow Next 16’s async `params` shape, for example `params: Promise<{ id: string }>` in `app/emails/flows/[id]/page.tsx` and `app/api/email-flows/[id]/route.ts`.
- When callback props are passed into nodes or editors, the pattern is optional function props on typed data objects, as in `EmailNodeData` inside `components/email-flow/nodes/EmailNode.tsx`.

**Return Values:**
- API routes return `NextResponse.json(...)` consistently. Keep the `ok` boolean in payloads so client fetchers can branch without exception-based flow control.
- Client components frequently return `null` for gated states, such as `if (!isLoaded || !isSignedIn) return null;` in `app/page.tsx` and `if (!isOpen) return null;` in `components/studio/CreativeStudio.tsx`.

## Module Design

**Exports:**
- Modules typically default-export their main React component, such as `app/page.tsx`, `components/AppNav.tsx`, `components/studio/CreativeStudio.tsx`, and `components/email-flow/nodes/EmailNode.tsx`.
- Utility and service modules prefer named exports, such as `prisma` in `lib/prisma.ts`.
- Route files export only handler functions per verb and avoid extra helpers unless they are file-local, as in `app/api/leads/route.ts` and `app/api/email-flows/[id]/route.ts`.

**Barrel Files:**
- Not detected in the inspected paths. Imports point directly to concrete files, such as `@/components/email-flow/nodes/TriggerNode` and `@/lib/prisma`.

## Frontend Composition Quality

**Composition pattern:**
- The app mixes server entry points with client-heavy feature islands. Use thin server wrappers like `app/emails/flows/[id]/page.tsx` to pass route params into a client implementation such as `app/emails/flows/[id]/FlowPageClient.tsx`.
- Browser-only tools are isolated behind `next/dynamic` with `ssr: false`, as in `app/emails/flows/[id]/FlowPageClient.tsx` and `components/studio/CreativeStudio.tsx`. Follow this for libraries that require `window`, canvas, or complex editor state.
- UI state is managed locally with hooks and direct `fetch` calls rather than a shared client data layer. This is visible in `app/page.tsx`, `components/email-flow/FlowBuilder.tsx`, and many `app/**/page.tsx` files.

**Maintainability signals:**
- Strong signals: strict TypeScript in `tsconfig.json`, consistent `@/` alias usage, predictable route handler shape, and some decomposition into leaf node components such as `components/email-flow/nodes/EmailNode.tsx`.
- Weak signals: very large page/component files, duplicate inline fetch logic, repeated status/color mapping, extensive Tailwind string literals, and type escapes in the editor/builder areas. The highest-risk maintainability areas are `components/site-builder/BlockRenderer.tsx`, `components/studio/CreativeStudio.tsx`, `components/email-flow/FlowBuilder.tsx`, `app/campaigns/[id]/page.tsx`, and `app/onboarding/page.tsx`.
- `app/globals.css` still defines `Arial, Helvetica, sans-serif` and `--font-geist-*` theme variables that do not match the active `Inter` and `Outfit` font setup in `app/layout.tsx`, so global style conventions are not fully aligned.

## Prescriptive Guidance

- Place new data access and auth logic in `app/api/**/route.ts` or `lib/**` rather than embedding it directly into already-large client pages.
- Use the `@/` alias for non-adjacent imports, and keep import groups ordered framework → third-party → app-local.
- Keep new route handlers in the existing `try/catch` + `NextResponse.json({ ok, ... })` pattern.
- Prefer typed interfaces or `Record<string, unknown>` over introducing new `any`; avoid adding more type escapes to `components/site-builder/**`, `components/studio/**`, or `app/api/**`.
- For new frontend work, extract view sections into small components once a page starts combining data fetching, derived state, and more than one major visual region. Do not add more monolithic logic to `app/campaigns/[id]/page.tsx`, `app/dropship/products/[id]/page.tsx`, or `app/onboarding/page.tsx`.

---

*Convention analysis: 2026-03-24*
