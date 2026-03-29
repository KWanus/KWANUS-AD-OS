# Technology Stack

**Analysis Date:** 2026-03-24

## Languages

**Primary:**
- TypeScript 5.x - App Router pages, API routes, shared libraries, engines, and domain logic across `app/**/*.ts*`, `lib/**/*.ts`, `engines/**/*.ts`, and `src/**/*.ts`

**Secondary:**
- CSS - Global styling in `app/globals.css`
- SQL migrations via Prisma - schema and migrations in `prisma/schema.prisma` and `prisma/migrations/`

## Runtime

**Environment:**
- Node.js - Server runtime for Next.js 16 route handlers and Prisma code in `app/api/**` and `lib/prisma.ts`
- Browser runtime - React 19 client components in `app/**/*.tsx` and `components/**/*.tsx`

**Package Manager:**
- npm - inferred from `package-lock.json`
- Lockfile: present in `package-lock.json`

## Frameworks

**Core:**
- Next.js 16.2.0 - full-stack React framework using the App Router in `app/`
- React 19.2.4 - UI and client-side state across `app/**/*.tsx` and `components/**/*.tsx`
- Prisma 7.5.0 - ORM and schema management in `prisma/schema.prisma` and `lib/prisma.ts`
- Clerk 7.0.6 - authentication and user session layer in `app/layout.tsx`, `lib/auth.ts`, and protected `app/api/**` routes
- Tailwind CSS 4.x - utility-first styling, configured by dependency usage and global styles in `app/globals.css`

**Testing:**
- Not detected - no Jest, Vitest, Playwright, or test command is defined in `package.json`

**Build/Dev:**
- TypeScript 5.x - static typing via `tsconfig.json`
- ESLint 9 - linting configured in `eslint.config.mjs`
- `eslint-config-next` 16.2.0 - Next.js and TypeScript lint rules in `eslint.config.mjs`
- `@tailwindcss/postcss` 4.x - Tailwind build integration, declared in `package.json`
- Prisma generate - postinstall client generation via `package.json`

## Key Dependencies

**Critical:**
- `next` 16.2.0 - application shell, routing, and server execution
- `react` 19.2.4 and `react-dom` 19.2.4 - UI rendering and hydration
- `@clerk/nextjs` 7.0.6 - auth provider for UI and server routes
- `@prisma/client` 7.5.0 and `prisma` 7.5.0 - typed database access and schema lifecycle
- `pg` 8.20.0 and `@prisma/adapter-pg` 7.5.0 - PostgreSQL driver path used by `lib/prisma.ts`
- `@anthropic-ai/sdk` 0.80.0 - primary LLM integration for generation endpoints and skills in `app/api/**/generate/route.ts`, `app/api/copilot/route.ts`, and `lib/skills/executor.ts`

**Infrastructure:**
- `openai` 6.32.0 - image generation client in `app/api/creative/generate-image/route.ts`
- `stripe` 20.4.1 - payments and webhooks in `app/api/checkout/route.ts`, `app/api/stripe/*`, and `app/api/webhooks/stripe/route.ts`
- `resend` 6.9.4 - outbound email in `lib/email/send.ts` and `app/api/leads/[id]/outreach/route.ts`
- `sonner` 2.0.7 - toast notifications in `app/layout.tsx`
- `lucide-react` 0.577.0 - icon set across UI pages and components
- `@xyflow/react` 12.10.1 and `reactflow` 11.11.4 - visual flow editors in `components/email-flow/*`
- `konva` 10.2.3 and `react-konva` 19.2.3 - canvas-based creative tooling in `components/studio/*`
- `@dnd-kit/*` - drag-and-drop interactions for builder UIs
- `papaparse` 5.5.3 - CSV parsing support
- `date-fns` 4.1.0 - date utilities
- `@supabase/supabase-js` 2.99.2 - installed in `package.json`; runtime usage not detected in `app/`, `lib/`, `src/`, or `engines/`
- `@stripe/stripe-js` 8.11.0 - installed in `package.json`; runtime usage not detected in inspected source files

## Configuration

**Environment:**
- Environment variables are consumed directly with `process.env.*` inside route handlers and shared libs
- `.env` is present at repo root and should be treated as secret configuration only
- Active env keys detected in code: `ANTHROPIC_API_KEY`, `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `NODE_ENV`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `RUNWAY_API_KEY`, `SERPAPI_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `WEBHOOK_SECRET`
- Clerk environment keys are required operationally because `@clerk/nextjs` is mounted in `app/layout.tsx`, but the key names are not referenced directly in inspected source

**Build:**
- `next.config.ts` - Next.js config shell
- `tsconfig.json` - TypeScript compiler configuration with `@/*` path alias
- `eslint.config.mjs` - lint configuration
- `prisma/schema.prisma` - data model and datasource definition
- `package.json` - scripts, dependencies, and postinstall hooks

## Platform Requirements

**Development:**
- Node.js with npm
- PostgreSQL reachable through `DATABASE_URL`, with a localhost fallback in `lib/prisma.ts`
- Clerk app configuration for authenticated flows in `app/layout.tsx` and `lib/auth.ts`
- Provider API keys for optional AI, payments, email, and lead-search features

**Production:**
- Next.js server deployment capable of running App Router route handlers
- PostgreSQL backing store via Prisma
- External provider configuration for Clerk, Anthropic, Stripe, Resend, OpenAI, Runway, and SerpAPI depending on enabled features

## Major Internal Service Boundaries

**Auth and user bootstrap:**
- `lib/auth.ts`
- Responsibility: maps Clerk identities to local Prisma `User` records and enforces credit checks

**Persistence layer:**
- `lib/prisma.ts`
- `prisma/schema.prisma`
- Responsibility: central PostgreSQL access and typed models for all product areas

**Analysis engine:**
- `src/logic/ad-os/*`
- `app/api/analyze/route.ts`
- `lib/scanForCopilot.ts`
- Responsibility: URL normalization, page fetch, signal extraction, scoring, recommendation, and asset-package derivation

**Skills platform:**
- `lib/skills/registry.ts`
- `lib/skills/executor.ts`
- `app/api/skills/[slug]/run/route.ts`
- Responsibility: declarative skill catalog, credit enforcement, Anthropic-backed prompt execution, and pipeline-skill orchestration

**Scanning engines:**
- `engines/businessScanEngine.ts`
- `engines/productScanEngine.ts`
- `lib/scanOrchestrator.ts`
- Responsibility: lightweight business/product scan entry points used outside the full ad-os analysis pipeline

**Creative generation:**
- `components/studio/*`
- `app/api/creative/generate-image/route.ts`
- `app/api/creative/generate-video/route.ts`
- Responsibility: image generation, Runway video jobs, and creative state persistence

**Email and automation:**
- `lib/email/send.ts`
- `app/api/email-broadcasts/[id]/send/route.ts`
- `lib/webhooks.ts`
- Responsibility: outbound email delivery, segmentation-based broadcast sending, and fire-and-forget customer webhooks

**Commerce and site storefronts:**
- `app/api/checkout/route.ts`
- `app/api/stripe/checkout/route.ts`
- `app/api/webhooks/stripe/route.ts`
- `app/api/sites/**`
- Responsibility: hosted storefront checkout, credit purchases, order capture, and site/page CRUD

---

*Stack analysis: 2026-03-24*
