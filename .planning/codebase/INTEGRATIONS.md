# External Integrations

**Analysis Date:** 2026-03-24

## APIs & External Services

**Authentication:**
- Clerk - end-user authentication, session access, and sign-in/sign-up UI
  - SDK/Client: `@clerk/nextjs`
  - Auth: Clerk-managed environment variables required by `app/layout.tsx`, `app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/[[...sign-up]]/page.tsx`, and `lib/auth.ts`

**AI - Text generation:**
- Anthropic - primary text-generation backend for business audits, proposals, research, campaign outputs, and copilot chat
  - SDK/Client: `@anthropic-ai/sdk`
  - Auth: `ANTHROPIC_API_KEY`
  - Key entry points: `app/api/copilot/route.ts`, `lib/skills/executor.ts`, `app/api/agency/*/generate/route.ts`, `app/api/consult/*/generate/route.ts`, `app/api/affiliate/*/route.ts`, `app/api/dropship/products/*/route.ts`, `app/api/local/*/route.ts`, `app/api/products/scan/route.ts`, `app/api/leads/[id]/generate/route.ts`

**AI - Image generation:**
- OpenAI Images - image generation for the creative studio
  - SDK/Client: `openai`
  - Auth: `OPENAI_API_KEY`
  - Implementation: `app/api/creative/generate-image/route.ts`

**AI - Video generation:**
- Runway - async image-to-video generation and job polling
  - SDK/Client: direct REST calls through `fetch`
  - Auth: `RUNWAY_API_KEY`
  - Implementation: `app/api/creative/generate-video/route.ts` and `app/api/creative/video-status/[jobId]/route.ts`

**Payments:**
- Stripe - credit purchases, storefront checkout sessions, and webhook-driven fulfillment
  - SDK/Client: `stripe`
  - Auth: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - Implementation: `app/api/stripe/checkout/route.ts`, `app/api/stripe/webhook/route.ts`, `app/api/checkout/route.ts`, `app/api/webhooks/stripe/route.ts`

**Email delivery:**
- Resend - transactional and broadcast email delivery
  - SDK/Client: `resend`
  - Auth: platform `RESEND_API_KEY` or per-user `User.resendApiKey`
  - Implementation: `lib/email/send.ts`, `app/api/email-broadcasts/[id]/send/route.ts`, `app/api/leads/[id]/outreach/route.ts`

**Lead discovery:**
- SerpAPI - Google Maps lead search for local-business prospecting
  - SDK/Client: direct REST calls through `fetch`
  - Auth: `SERPAPI_KEY`
  - Implementation: `app/api/leads/search/route.ts`

**Automation/webhook consumers:**
- n8n - inbound automation hub for lead intake, business processing, and outreach orchestration
  - SDK/Client: HTTP webhook endpoint
  - Auth: `WEBHOOK_SECRET`
  - Implementation: `app/api/webhooks/n8n/route.ts`

**User-configured outbound automation:**
- Custom webhook endpoints - post-send and lifecycle event delivery to each user's configured URL
  - SDK/Client: direct `fetch`
  - Auth: per-user `User.webhookUrl`
  - Implementation: `lib/webhooks.ts`, configuration surface in `app/api/settings/route.ts`

**Installed but not detected in runtime usage:**
- Supabase - `@supabase/supabase-js` exists in `package.json`, but inspected source did not import it from `app/`, `lib/`, `src/`, or `engines/`
- Stripe.js - `@stripe/stripe-js` exists in `package.json`, but inspected source did not import it from inspected runtime files

## Data Storage

**Databases:**
- PostgreSQL
  - Connection: `DATABASE_URL`
  - Client: Prisma via `@prisma/client` with `@prisma/adapter-pg` in `lib/prisma.ts`
  - Schema source: `prisma/schema.prisma`

**File Storage:**
- External-provider-hosted outputs only detected
  - OpenAI image URLs returned from `app/api/creative/generate-image/route.ts`
  - Runway video URLs returned from `app/api/creative/video-status/[jobId]/route.ts`
  - No dedicated S3, GCS, or Supabase Storage client detected in inspected runtime code

**Caching:**
- None detected in application code

## Authentication & Identity

**Auth Provider:**
- Clerk
  - Implementation: `ClerkProvider` wraps the app in `app/layout.tsx`; server routes use `auth()` from `@clerk/nextjs/server`; `lib/auth.ts` creates or fetches the local Prisma `User` row from the Clerk identity

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- Application logging uses `console.error`, `console.warn`, and occasional `console.log` in route handlers and shared libs such as `app/api/analyze/route.ts`, `app/api/webhooks/stripe/route.ts`, `app/api/stripe/webhook/route.ts`, and `lib/email/send.ts`

## CI/CD & Deployment

**Hosting:**
- Vercel-style Next.js deployment is implied by `.vercel/` and the App Router structure in `app/`
- Public site links also assume hosted domains such as `himalaya.co/s/[slug]` in `app/api/copilot/route.ts` and `https://${site.slug}.kwanus.co` in `app/api/checkout/route.ts`

**CI Pipeline:**
- Not detected in inspected repository files

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connectivity for Prisma in `lib/prisma.ts`
- `ANTHROPIC_API_KEY` - Anthropic-backed generators and copilot
- `STRIPE_SECRET_KEY` - Stripe checkout and payment processing
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook verification
- `OPENAI_API_KEY` - creative image generation
- `RUNWAY_API_KEY` - creative video generation
- `RESEND_API_KEY` - platform-level email sending fallback
- `SERPAPI_KEY` - live local lead search
- `NEXT_PUBLIC_APP_URL` - internal callback base URL for n8n processing flows
- `WEBHOOK_SECRET` - inbound n8n webhook authentication
- `NODE_ENV` - Prisma logging mode

**Secrets location:**
- Root `.env` file is present
- Additional provider secrets may also be stored per user in the database through `User.resendApiKey` and `User.webhookUrl` in `prisma/schema.prisma` and `app/api/settings/route.ts`

## Webhooks & Callbacks

**Incoming:**
- `app/api/stripe/webhook/route.ts` - Stripe credit-purchase webhook
- `app/api/webhooks/stripe/route.ts` - Stripe storefront order webhook
- `app/api/webhooks/n8n/route.ts` - n8n workflow ingress for `lead-intake`, `business-processing`, and `outreach`
- `app/api/creative/video-status/[jobId]/route.ts` - polling endpoint for external Runway job state, though it is app-initiated polling rather than a provider callback

**Outgoing:**
- `lib/webhooks.ts` - pushes app events like `broadcast_sent`, `new_contact`, `order_placed`, `campaign_launched`, and `site_published` to each user's configured webhook URL
- `app/api/webhooks/n8n/route.ts` - calls internal app endpoints using `NEXT_PUBLIC_APP_URL` to continue multi-step workflows
- `app/api/leads/search/route.ts` - queries SerpAPI over HTTPS
- `app/api/creative/generate-video/route.ts` and `app/api/creative/video-status/[jobId]/route.ts` - call Runway REST endpoints

## Major Internal Service Boundaries

**Identity and account sync:**
- `app/layout.tsx`
- `lib/auth.ts`
- `app/api/settings/route.ts`
- Boundary: Clerk identity is normalized into a local `User` model, and user-specific provider settings are persisted in PostgreSQL

**Persistence and domain data:**
- `lib/prisma.ts`
- `prisma/schema.prisma`
- Boundary: all business domains share one Prisma/PostgreSQL backend, including campaigns, leads, sites, contacts, products, audits, broadcasts, and credit balances

**Analysis and recommendation pipeline:**
- `app/api/analyze/route.ts`
- `lib/scanForCopilot.ts`
- `src/logic/ad-os/*`
- Boundary: deterministic page fetch, signal extraction, scoring, and asset packaging feed both direct analysis routes and copilot context injection

**Skills execution layer:**
- `app/api/skills/[slug]/run/route.ts`
- `lib/skills/registry.ts`
- `lib/skills/executor.ts`
- `lib/skills/websiteBuilderScout.ts`
- `lib/skills/adCampaignSkill.ts`
- `lib/skills/emailCampaignSkill.ts`
- Boundary: one endpoint gates credits, validates skill input, and dispatches either Anthropic prompt execution or multi-step internal pipeline skills

**Creative media layer:**
- `components/studio/CreativeStudio.tsx`
- `components/studio/KonvaCanvas.tsx`
- `app/api/creative/generate-image/route.ts`
- `app/api/creative/generate-video/route.ts`
- Boundary: UI-driven creative composition is separated from media-generation providers and credit consumption

**Email and automation layer:**
- `lib/email/send.ts`
- `app/api/email-broadcasts/[id]/send/route.ts`
- `lib/webhooks.ts`
- Boundary: broadcast/contact workflows stay internal until final delivery, where Resend and user-defined webhooks are invoked

**Commerce and storefront fulfillment:**
- `app/api/checkout/route.ts`
- `app/api/stripe/checkout/route.ts`
- `app/api/webhooks/stripe/route.ts`
- `app/api/stripe/webhook/route.ts`
- Boundary: the codebase maintains separate Stripe paths for platform credit purchases and storefront sales, each with its own webhook completion logic

---

*Integration audit: 2026-03-24*
