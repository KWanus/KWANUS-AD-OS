# CRM Workspace Research — KWANUS AD OS
# Route: /clients

**Researched:** 2026-03-22
**Domain:** CRM / Client Relationship Management — competitive analysis vs GoHighLevel, HubSpot, Pipedrive, Close, Monday CRM
**Confidence:** HIGH (primary sources: user reviews, official docs, G2/Capterra/Trustpilot/BBB data, competitor feature pages)

---

## Executive Summary

GoHighLevel (GHL) is the dominant CRM for marketing agencies and freelancers — $97–$497/mo, built entirely around sub-accounts, pipelines, SMS/email conversations, and automation workflows. It has captured the "agency all-in-one" market by replacing 6–10 separate tools (ClickFunnels, Calendly, Mailchimp, Twilio, ActiveCampaign) under one roof.

But GHL's dominance is built on breadth, not quality. It has accumulated massive technical debt: a bloated, developer-designed UI that takes 6–8 weeks to master, broken automations, email deliverability problems, slow performance (5–20 second page loads), and inconsistent AI features. Users consistently describe it as "a work-in-progress rather than a polished product."

The opportunity is real: GHL has 60,000+ agencies locked in — not because they love it, but because switching costs are high and there is no worthy alternative with better UX + AI-native features. A CRM with a premium dark design, fast performance, and AI woven into every touchpoint would immediately differentiate.

**Primary recommendation:** Build a CRM workspace at `/clients` that beats GHL on UX clarity, AI-assisted follow-up, and pipeline speed — targeting digital agency owners and freelancers who manage 5–50 clients and run ad campaigns.

---

## Part 1: GoHighLevel Full Feature Matrix

### 1.1 What GHL Does (Full Feature Breakdown)

| Feature Area | What GHL Offers | Quality |
|---|---|---|
| **CRM / Contacts** | Full contact profiles, custom fields, tags, notes, smart lists (auto-updating segments), duplicate detection, company-level records | GOOD |
| **Pipelines** | Kanban + list view, multiple pipelines per account, opportunity value tracking, color-coded tags, pipeline permissions by user/role | GOOD |
| **Conversations Inbox** | Unified inbox: SMS, email, FB Messenger, WhatsApp, IG DMs, TikTok DMs, live chat — all in one view | DECENT |
| **Automations/Workflows** | Visual workflow builder, triggers from 50+ events, branching logic, time delays, webhook actions, drip campaigns | DECENT (buggy) |
| **Calendars** | Multi-calendar booking, round-robin, group scheduling, appointment reminders, Google/Outlook sync | GOOD |
| **Email Marketing** | Drag-and-drop email builder, broadcasts, sequences, Mailgun/SMTP integration | WEAK (deliverability issues) |
| **SMS/Phone** | Built-in Twilio-powered SMS, 2-way calls, call recording, call tracking numbers, voicemail drops | DECENT |
| **Funnels/Websites** | Drag-and-drop funnel and website builder, landing pages, A/B testing, forms, surveys | WEAK vs ClickFunnels |
| **Reputation Management** | Review request automation, Google/FB review monitoring, review widgets | GOOD |
| **Reporting** | Dashboard widgets, attribution source reporting, conversion tracking, call reporting, campaign performance | WEAK (no custom reports, no multi-touch attribution) |
| **Payments** | Stripe integration, invoicing, order forms, upsells/downsells, subscriptions | DECENT (Stripe-dependent) |
| **Memberships/Courses** | Membership site builder, course hosting, drip content, community forums | DECENT |
| **White-Label** | Custom domain, custom branding, white-label mobile app (extra $1,491/quarter), reseller SaaS mode | GOOD (expensive) |
| **Sub-Accounts** | Agency manages unlimited client sub-accounts (Unlimited/Pro plans), snapshots for fast setup | GOOD (complex to manage) |
| **AI Features** | Conversation AI (SMS/chat bot), Workflow AI assistant, AI copywriting, AI image generation, agent intent routing | HALF-BAKED (hallucinations reported) |
| **Social Planner** | Schedule and post to FB, IG, GMB, TikTok, LinkedIn, Twitter/X | DECENT |
| **Proposals/Contracts** | Proposal builder, e-signature, document management | BASIC |

### 1.2 GHL Pricing Tiers

| Plan | Price/mo | Sub-Accounts | White-Label | Key Limit |
|---|---|---|---|---|
| Starter | $97 | 3 | No | Limited contacts |
| Unlimited | $297 | Unlimited | Desktop only | No SaaS resell |
| Agency Pro (SaaS) | $497 | Unlimited | Full (mobile costs extra) | +$1,491/quarter for mobile app |
| Priority Support | +$300/mo | — | — | Required for responsive support |

**Hidden costs:** SMS/email per-message fees (Twilio/Mailgun charges), AI usage credits, phone number rental, white-label mobile app quarterly fee. True cost for an active agency can be $500–$1,000+/mo.

---

## Part 2: Top 10 User Complaints About GoHighLevel

These are verified complaints from Trustpilot, BBB, G2, Capterra, Reddit, and in-depth reviews (millo.co, worqstrap.com, supplygem.com):

### Complaint 1: The UI Is Developer-Designed, Not User-Designed
**Evidence:** Multiple reviews state: "UX/UI Design really needs a TON of improvement. Not just the look — these rounded corners, overlapping pieces, lack of color — but also the functionality. It looks like a developer designed it." Settings are scattered across Agency-level and Sub-account-level views, forcing constant context-switching. Users report needing 6–8 weeks just to become proficient.

**Impact:** High churn from confused new users, long onboarding, requires paid training ($300–$1,000+) to get started.

### Complaint 2: Slow, Bloated Performance
**Evidence:** GHL's own idea board has posts titled "The platform is extremely slow — urgent need for performance improvements" (October 2025). Users report 5–10 second load times for basic pages like contacts, pipelines, and automations. Mobile pages take 3–5 seconds to load. One user: "switching between tabs, opening contacts, pipelines, and automations takes significantly longer than expected."

**Impact:** Daily frustration, productivity loss, clients complain about their white-labeled portal speed.

### Complaint 3: Automation Failures and Unreliable Workflows
**Evidence:** One documented case: "171 completely irrelevant emails sent to users who should NOT have received them across three consecutive days." GoHighLevel's response blamed "server issues" with no resolution. Other users report automations not firing, Conversation AI "hallucinating," and AI bots "not sending the questions set on the workflow — instead just sending system messages to leads."

**Impact:** Trust-destroying. Agencies have sent wrong emails to thousands of their clients' customers.

### Complaint 4: Email Deliverability Collapse After Migration
**Evidence:** One documented case: open rates dropped from 35–40% to 9% immediately after migrating to GHL. The platform requires a separate Mailgun account setup, SMTP configuration, DNS records — a 10-step technical process just to send basic emails. Many non-technical users never set this up correctly and use GHL's shared IP pool, which results in poor deliverability.

**Impact:** Revenue-destroying for email-dependent businesses. Very difficult to diagnose.

### Complaint 5: Reporting is Shallow — No Real Analytics
**Evidence:** GHL's own idea board shows requests for: custom reports across objects, multi-touch attribution, call disposition filtering, funnel stage analysis in attribution. Users report: "GoHighLevel does not have HubSpot's reporting capabilities — only standard dashboards covering CRM pipeline, campaign performance, and attribution." There is no way to create custom reports combining standard and custom objects.

**Impact:** Agency owners cannot prove ROI to clients, cannot make data-driven decisions at scale.

### Complaint 6: Steep Onboarding / Migration Cost
**Evidence:** Without snapshots, onboarding a new client takes 10–20 hours. With snapshots, 15 minutes — but building and maintaining snapshots is its own skill. One user documented spending 30–40 hours manually migrating 20,000+ subscriber records. Outdated snapshot templates create more problems than they solve.

**Impact:** High barrier to adoption, requires dedicated GHL specialist (~$30–$50/hr freelancer), not self-service.

### Complaint 7: Hidden Costs and Misleading Pricing
**Evidence:** The $97 advertised price excludes SMS/email per-message fees, Mailgun subscription, phone number rental, AI usage credits, and priority support. True cost for an active 10-client agency is $400–$800+/mo. One reviewer: "low advertised price masked expensive add-ons." BBB complaints include multiple reports of being "charged twice" and difficulty canceling (trial cancellation requires emailing support, no self-serve option).

**Impact:** Budget shock after signup, distrust of the platform.

### Complaint 8: Payment Gateway Over-Reliance on Stripe
**Evidence:** GoHighLevel has built its entire payment ecosystem around Stripe. Users in regions where Stripe is unavailable or restricted (many parts of Africa, Southeast Asia, parts of South America) cannot use invoicing or payment collection at all. Square integration announced but "not available for SaaS and rebilling."

**Impact:** Blocks non-US/EU agencies entirely from monetization features.

### Complaint 9: Customer Support Is Inadequate Unless You Pay $300+/mo Extra
**Evidence:** Standard support is described as "slow response times" and "often failed to resolve ongoing issues effectively." Live chat and SMS support gave inaccurate information. One reviewer: "avoid chat and SMS support entirely." Priority support (actually responsive) costs $300/mo extra on top of the base plan — making effective support cost $397–$797+/mo total.

**Impact:** Users are stuck with broken features for weeks while paying full price.

### Complaint 10: Conversation AI Is Not Production-Ready
**Evidence:** GHL's own idea board shows "Conversation AI Behavior Issues" as an active complaint. Users report: "Conversation AI still cannot be reliably used as of April 2025." Bot hallucinations, incorrect intent matching, duplicated messages via WhatsApp coexistence, bot behavior changing after model updates. One user described it as "feeling like an old flowchart bot" despite being marketed as AI-powered.

**Impact:** Agencies are selling AI services to clients that don't work, creating refund/churn situations.

---

## Part 3: Competitive Landscape

### 3.1 Competitor Weaknesses Summary

| Platform | Core Strength | Key Weakness | Price |
|---|---|---|---|
| **GoHighLevel** | Agency multi-client, all-in-one | Terrible UX, slow, unreliable automations, hidden costs | $97–$497+/mo |
| **HubSpot** | Best reporting, best UX, brand trust | Brutal pricing at scale ($890/mo for Marketing Pro), per-contact pricing punishes growth | Free–$3,600+/mo |
| **Salesforce** | Infinite customization, enterprise-grade | Requires dedicated admin, 6-month implementation, $150–$300/seat/mo | $25–$300+/seat/mo |
| **Pipedrive** | Clean pipeline UX, easy to learn | No built-in marketing, no automation branching (if/else), basic reporting | $14–$99/seat/mo |
| **Close.io** | Best for high-volume calling/outreach | Limited pipeline visualization, weak reporting customization | $49–$139/seat/mo |
| **Monday CRM** | Flexible views, non-CRM teams love it | Private boards require upgrade, limited CRM-specific features, per-seat pricing | $12–$20+/seat/mo |
| **Notion as CRM** | Free, flexible, fast to set up | Not a real CRM — no automation, no email integration, no pipeline logic, breaks at scale | Free–$16/seat/mo |
| **Attio** | AI-native architecture, beautiful UX, API-first | Early stage, limited automation depth, no built-in communication channels | $0–$119/seat/mo |

### 3.2 The Market Gap

No platform in 2026 offers all of:
- Premium dark design that feels as polished as Linear or Vercel
- AI-native (not AI-bolted-on) features that actually work
- Fast performance (sub-second navigation)
- Transparent pricing without per-message fees
- Agency-grade multi-client management
- Built-in ad campaign tracking (linking CRM to ad spend)

---

## Part 4: The 10 "10x Better" Ideas

These are the specific features that would make agency owners and freelancers switch from GHL immediately:

### Idea 1: AI Follow-Up Drafting That Actually Works
**What GHL does:** "Conversation AI" that hallucinates and misfires. No AI for email drafting inside the CRM.
**What to build:** When a contact moves to "Proposal Sent" or replies to an email, an AI button appears that drafts the next follow-up based on: contact history, their business niche, the campaign being run, and the tone of previous messages. One click to approve and send.
**Why it wins:** This is the #1 time sink for agency owners — knowing what to say and when.

### Idea 2: Client Health Score (Visible at a Glance)
**What GHL does:** Nothing. You manually check each client's pipeline stage.
**What to build:** Automatically computed health score per client (0–100) based on: days since last contact, campaign performance vs target, open invoices, response rate. Color-coded (green/yellow/red) in the client list view. AI generates a one-line "at risk" alert when a client drops below threshold.
**Why it wins:** Agency owners lose clients because they forget to check in. This makes invisible problems visible.

### Idea 3: Campaign-to-CRM Revenue Attribution
**What GHL does:** Shallow attribution that only shows source clicks. No connection between ad spend and CRM pipeline revenue.
**What to build:** Connect ad campaigns (Facebook/Google) to contacts automatically. When a contact closes (pipeline "Won"), show: which campaign sourced them, total ad spend on that campaign, implied ROAS. Per-client attribution dashboard showing true revenue from ads.
**Why it wins:** Agencies can finally prove their value to clients with real revenue attribution, not vanity metrics. This is the biggest reporting gap in every CRM.

### Idea 4: Instant Workspace Setup (Zero to Client in Under 2 Minutes)
**What GHL does:** 10–20 hours to set up a new client without snapshots; 15 minutes with snapshots. Snapshots require expertise to build and maintain.
**What to build:** Answer 5 questions (niche, service type, typical deal size, follow-up cadence, team size) and the system auto-creates: a pipeline with correct stages, starter automation sequence, email templates, and a client health dashboard. Uses AI to generate everything from the 5 answers.
**Why it wins:** GHL's biggest adoption blocker is setup complexity. Removing it creates a massive "wow moment."

### Idea 5: Real-Time Pipeline Kanban That Doesn't Lag
**What GHL does:** Kanban that takes 5–20 seconds to load and refresh. Drag-and-drop that freezes.
**What to build:** Optimistic UI updates — when you drag a card, it moves instantly (client-side). Server sync happens in background. Perceived performance is instant. Use TanStack Query with optimistic mutations + React 19 transitions.
**Why it wins:** Pure UX differentiation. The first time someone drags a card in KWANUS and it moves instantly, vs GHL where they wait, they feel the difference viscerally.

### Idea 6: Smart Contact Timeline (Full Story in One Scroll)
**What GHL does:** Fragmented data — emails in one tab, SMS in another, notes somewhere else, pipeline history in another section.
**What to build:** Single vertical timeline per contact showing: every email, SMS, call (with transcript), note, pipeline stage change, invoice sent, ad campaign interaction — all in chronological order. AI summary at top: "This contact has been active for 47 days, responded 3 times, best response rate is Tuesday 10am."
**Why it wins:** Agencies lose context between client touchpoints constantly. A unified timeline is the single most-requested CRM improvement across G2/Capterra reviews.

### Idea 7: AI-Powered Lead Scoring That Explains Itself
**What GHL does:** No lead scoring. You manually prioritize.
**What to build:** Score every contact 0–100 based on: engagement (emails opened, links clicked), response patterns, pipeline velocity, business match (niche, company size if known). Crucially — show WHY: "Score: 78. High because: replied within 2 hours, opened 4 of 5 emails, in $1K–$5K/mo budget range." Planner can sort contacts by score.
**Why it wins:** Sales teams spend 80% of time on low-probability leads. Explained lead scoring changes behavior.

### Idea 8: One-Click Ad Creative Linking
**What GHL does:** Nothing. Ad creatives and CRM are completely separate.
**What to build:** KWANUS already has ad creative analysis. Link: run an analysis on a product URL → it automatically creates a CRM contact (or attaches to existing one) → tracks which ad hooks were generated → when a campaign is marked "live" in the pipeline, it logs which ad variation is running. Close the loop between ad creation and client result tracking.
**Why it wins:** This is a native advantage GHL can never have. The creative-to-client pipeline is KWANUS's moat.

### Idea 9: Transparency-First Pricing with No Hidden Costs
**What GHL does:** $97 base price, then surprise fees for every message, call, AI usage, phone number, premium support.
**What to build:** Flat pricing. Email sending included up to X/month. No per-message SMS in MVP (use external providers the user already has). Clearly document what's included and what is external.
**Why it wins:** GHL's hidden cost problem is documented in dozens of negative reviews. Transparent pricing builds trust immediately.

### Idea 10: Dark-First, Speed-First Design That Feels Premium
**What GHL does:** Light-dominant UI with "clunky rounded corners, overlapping pieces, lack of color." Developer-designed aesthetic. 5–20 second page loads.
**What to build:** The existing KWANUS design system (`#050a14`, cyan `#06b6d4`, purple `#8b5cf6`) applied to CRM. No page reloads for navigation. Skeleton loaders (never blank screens). Micro-animations on state changes. The CRM should feel like opening Linear or Notion — fast, quiet, premium.
**Why it wins:** Agency owners who care about their brand will not white-label something that looks cheap. Premium design IS a product feature.

---

## Part 5: Recommended MVP Feature Set for /clients

This is what to build NOW for the first version that demonstrates immediate value over GHL.

### MVP Scope: "The 5 Screens That Matter"

**Screen 1: Client List (`/clients`)**
- Grid/list toggle view of all clients
- Health score badge on each client card (green/yellow/red)
- Last contact date, pipeline stage, active campaign count
- Quick actions: Add contact, Import CSV, New client wizard
- Sort by: health score, last activity, revenue, date added
- Filter by: stage, tag, health status

**Screen 2: Pipeline Board (`/clients/pipeline`)**
- Kanban view with drag-and-drop (optimistic UI)
- Configurable stages per workspace (default: Lead, Qualified, Proposal, Active, Won, Churned)
- Card shows: contact name, company, value, days in stage, health indicator
- Click card opens right-side drawer (not new page) with quick edit
- Pipeline velocity indicator: average days per stage
- Summary bar: total pipeline value, deals per stage

**Screen 3: Contact Profile (`/clients/[id]`)**
- Left column: contact info, custom fields, tags, company info
- Center column: unified activity timeline (all touchpoints in one feed)
- Right column: AI assistant panel (draft follow-up, score explanation, suggested next action)
- Quick log: add note, log call, send email — all from one input bar
- Campaign section: linked campaigns, ad variations associated with this contact

**Screen 4: Add Client Wizard (`/clients/new`)**
- 5-question onboarding flow
- AI auto-generates: pipeline stages, email templates, follow-up sequence
- Import from CSV option with field mapping
- Manual entry with autocomplete

**Screen 5: Dashboard (`/clients/dashboard`)**
- At-a-glance: total clients, clients at risk (health < 50), pipeline value, closed this month
- Revenue attribution: which campaigns generated which clients
- Activity summary: contacts added, deals moved, follow-ups due today
- AI insight panel: "3 clients haven't been contacted in 14 days" with quick action to follow up

### MVP Data Model (Prisma additions)

```prisma
model Client {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])

  // Identity
  name          String
  email         String?
  phone         String?
  company       String?
  website       String?
  tags          String[] @default([])
  customFields  Json?    // { key: value }

  // Pipeline
  pipelineStage String   @default("lead") // lead | qualified | proposal | active | won | churned
  dealValue     Float?

  // Health (computed + stored)
  healthScore   Int      @default(50)     // 0-100
  healthStatus  String   @default("yellow") // green | yellow | red
  lastContactAt DateTime?

  // Attribution
  sourceCampaignId String?

  // Relations
  activities    ClientActivity[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId, pipelineStage])
  @@index([userId, healthScore])
}

model ClientActivity {
  id        String   @id @default(cuid())
  clientId  String
  client    Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  type      String   // email | call | note | stage_change | sms | meeting
  content   String?  @db.Text
  metadata  Json?    // { from?, to? stage_change, subject?, duration? }
  createdAt DateTime @default(now())
  createdBy String?  // userId
}
```

### What to Defer (NOT in MVP)

- SMS sending (requires Twilio setup — too much config for MVP)
- Email sending within CRM (use external — just log emails)
- Automation workflows (Phase 2)
- White-label / sub-accounts (Phase 3)
- Reputation management / review requests (Phase 3)
- Calendar booking integration (Phase 2)
- Invoice/payments (Phase 3)
- Mobile app (Phase 4)

---

## Part 6: UI/UX Patterns That Differentiate From GHL

### Pattern 1: No Full Page Reloads for CRM Navigation
GHL reloads the entire app between sections. KWANUS should use Next.js App Router with parallel routes or a persistent layout — the sidebar stays mounted, only the content area changes. Sub-200ms perceived navigation.

**Implementation:** `/app/clients/layout.tsx` with a persistent left sidebar. All sub-routes render inside the content area without unmounting the sidebar.

### Pattern 2: Right-Side Drawers Instead of Navigation
When clicking a contact card in the pipeline, open a slide-in drawer (right side, 480px wide) instead of navigating to a new page. This keeps the pipeline board visible. GHL navigates to a new page — users lose context.

**Implementation:** URL-driven drawer state (`?contact=id`) so it's shareable/linkable. Use Radix Sheet or a custom portal component.

### Pattern 3: Skeleton Loading States — Never Blank
GHL shows blank screens while loading. KWANUS should show skeleton cards that match the exact shape of the content. Users perceive skeleton-loading as "fast" even when load time is identical.

**Implementation:** Every data-fetching component has a `Skeleton` variant that renders identically in layout but with animated shimmer (`animate-pulse`).

### Pattern 4: Optimistic UI for All Mutations
Drag a card in the pipeline — it moves instantly. Edit a note — it saves instantly. Stage changes reflect immediately. Errors roll back silently with a toast notification.

**Implementation:** TanStack Query `useMutation` with `onMutate` optimistic update + `onError` rollback.

### Pattern 5: AI Copilot as a Persistent Side Panel, Not a Modal
GHL's AI is buried in workflows. KWANUS should have a persistent AI panel on the contact profile that is always visible: "Draft a follow-up for this contact," "Summarize this contact's history," "What should I do next with this deal?"

**Implementation:** Server-streamed AI responses via `/api/ai/client-assist` using `streamText` from the Vercel AI SDK. The panel is part of the layout, not a modal.

### Pattern 6: Color System That Communicates Status Immediately
GHL uses color poorly — everything is the same blue/gray. KWANUS should use:
- Cyan `#06b6d4` = active, healthy, positive
- Purple `#8b5cf6` = AI-generated, automated
- Amber `#f59e0b` = needs attention, at risk
- Red `#ef4444` = churned, overdue, critical
- Green `#10b981` = won, closed, completed
- White/gray = neutral information

Status indicators should be immediately parseable — no need to read text to understand the state of a pipeline.

### Pattern 7: Keyboard-First Navigation
GHL has no keyboard shortcuts. KWANUS should implement:
- `C` = new contact
- `P` = switch to pipeline view
- `D` = switch to dashboard
- `/` = universal search
- `Esc` = close drawer
- `Enter` on contact card = open contact

**Implementation:** `useHotkeys` from `react-hotkeys-hook` with a `?` help modal showing all shortcuts.

### Pattern 8: Data-Dense But Not Cluttered
GHL is either too sparse (wasted whitespace) or too dense (settings everywhere). KWANUS should follow Linear's approach: 14px body text, tight 8px spacing within groups, 24px spacing between groups. Every pixel should carry information or breathing room — nothing decorative that doesn't serve communication.

---

## Part 7: Integration Points with Existing KWANUS Features

The CRM must integrate with KWANUS's existing systems:

| KWANUS Feature | CRM Integration |
|---|---|
| `AnalysisRun` | When a URL is analyzed, auto-create a Client record (or prompt to attach to existing) |
| `Campaign` | Each Campaign linked to a Client. Pipeline stage updates as campaign phases progress |
| `AdVariation` | Ad variations linked to Client → track which hooks/scripts were used per client |
| `EmailFlow` | Email flows can be associated with a Client for automated follow-up sequences |
| `EmailContact` | EmailContacts can be promoted to full Client records when they convert |
| `AssetPackage` | Generated assets (landing pages, email sequences) attach to Client profile |

The CRM is not a standalone module — it's the relationship layer that makes every other KWANUS engine's output trackable and client-attributable.

---

## Part 8: Technical Stack for CRM Workspace

All choices aligned with existing KWANUS stack (Next.js 16.2.0, React 19, TypeScript 5, Tailwind 4, Prisma 7.5.0, Clerk auth, `#050a14` design system):

| Need | Library | Rationale |
|---|---|---|
| Server state / data fetching | TanStack Query v5 | Already likely in project or easy to add; optimistic mutations, background sync |
| Drag and drop (pipeline) | `@dnd-kit/core` + `@dnd-kit/sortable` | More maintainable than React DnD; works with React 19; no deprecated APIs |
| AI streaming | Vercel AI SDK (`ai` package) | Works natively with Next.js App Router; `streamText` for real-time AI responses |
| Right-side drawer | Radix `Dialog` or `Sheet` | Accessible, animatable, URL-state driven |
| Virtualized lists | TanStack Virtual v3 | Required if contact list grows beyond ~200 contacts without pagination |
| Date/time handling | `date-fns` | Lightweight, tree-shakable; no Moment.js |
| CSV import | `papaparse` | Battle-tested CSV parsing in browser |
| Toast notifications | `sonner` | Modern, beautiful toasts; works with dark themes |
| Keyboard shortcuts | `react-hotkeys-hook` | Lightweight, scope-aware hotkey management |

### File Structure for `/clients`

```
app/
  clients/
    layout.tsx              ← persistent sidebar + shared CRM layout
    page.tsx                ← /clients → client list (default view)
    pipeline/
      page.tsx              ← /clients/pipeline → kanban board
    dashboard/
      page.tsx              ← /clients/dashboard → analytics overview
    new/
      page.tsx              ← /clients/new → add client wizard
    [id]/
      page.tsx              ← /clients/[id] → contact profile

app/api/
  clients/
    route.ts                ← GET (list), POST (create)
    [id]/
      route.ts              ← GET, PATCH, DELETE
      activities/
        route.ts            ← GET timeline, POST new activity
      health/
        route.ts            ← POST recalculate health score
  ai/
    client-assist/
      route.ts              ← POST: streaming AI responses for contact context

components/
  clients/
    ClientCard.tsx
    ClientList.tsx
    PipelineBoard.tsx
    PipelineCard.tsx
    ContactTimeline.tsx
    HealthBadge.tsx
    AIAssistPanel.tsx
    AddClientWizard.tsx
    ClientDrawer.tsx
    ClientDashboard.tsx

lib/
  clients/
    healthScore.ts          ← health score computation logic
    clientQueries.ts        ← Prisma query helpers
```

---

## Part 9: Open Questions / Decisions Needed Before Building

1. **Authentication scope:** Are clients tied to `userId` (personal workspace) or to a future `Workspace` model (team access)? Recommend: start with `userId` for MVP, plan `workspaceId` migration for Phase 3.

2. **Email sending in CRM:** Should the CRM be able to send emails directly (requires SMTP/Resend integration), or just log that emails were sent externally? Recommend: **log only in MVP**, add sending in Phase 2. This avoids the #1 GHL failure mode (email deliverability).

3. **Import source:** CSV import only, or also import from GHL? A "Import from GoHighLevel" feature (via GHL's API) would be a powerful acquisition tool. Defer to Phase 2 but design schema to support it.

4. **Mobile responsiveness:** The `/clients` workspace will be used on desktop primarily. Design for desktop-first (min 1280px) with responsive fallback, not mobile-first. GHL's mobile problems are a known pain point — even basic desktop optimization is a win.

5. **AI provider for client assist:** OpenAI GPT-4o or Anthropic Claude? Given KWANUS's existing Claude usage, recommend Claude 3.5 Sonnet via Anthropic API for the AI Copilot panel. Consistent with existing stack.

---

## Sources

### Primary (HIGH confidence)
- [GoHighLevel Pricing](https://www.gohighlevel.com/pricing) — Tier pricing, feature availability confirmed
- [GoHighLevel LevelUp 2025 Features](https://www.gohighlevel.com/post/levelup-2025) — Official 2025 feature announcements
- [GHL Ideas Board — Performance](https://ideas.gohighlevel.com/opportunities/p/the-platform-is-extremely-slow-urgent-need-for-performance-improvements) — Verified user complaints on official feedback board
- [GHL Ideas Board — Reporting](https://ideas.gohighlevel.com/reporting) — Reporting gaps verified on official board
- [GHL Ideas Board — Conversation AI Issues](https://ideas.gohighlevel.com/conversation-ai/p/conversation-ai-behavior-issues) — AI behavior complaints on official board
- [HighLevel Inc. BBB Complaints](https://www.bbb.org/us/tx/dallas/profile/marketing-software/highlevel-inc-0875-91307159/complaints) — Billing and support complaints
- [GoHighLevel Trustpilot Reviews](https://www.trustpilot.com/review/www.gohighlevel.com) — Aggregated user sentiment

### Secondary (MEDIUM confidence)
- [GoHighLevel Was a Nightmare — millo.co](https://millo.co/gohighlevel-review) — In-depth negative review with specific data points (automation failure, deliverability drop)
- [GoHighLevel Cautionary Tale — worqstrap.com](https://worqstrap.com/blog/gohighlevel-a-cautionary-tale-my-honest-2025-review) — Migration failure documentation
- [GoHighLevel Honest Review — supplygem.com](https://supplygem.com/reviews/gohighlevel/) — Expert review with specific technical limitations
- [GHL vs HubSpot vs Salesforce Comparison](https://ghl-services-playbooks-automation-crm-marketing.ghost.io/gohighlevel-vs-hubspot-vs-salesforce-real-price-comparison-2025/) — Cross-platform comparison
- [Attio AI CRM Architecture](https://www.breakcold.com/blog/attio-review) — Next-generation CRM patterns
- [SaaS CRM Design Trends 2025](https://eseospace.com/blog/saas-crm-design-trends-for-2025/) — Current design patterns for premium CRM

### Tertiary (LOW — general market context, flag for validation)
- [Agency CRM Best Practices — productive.io](https://productive.io/blog/crm-for-agencies/) — What agencies need (general)
- [AI-Native CRM Patterns — monday.com](https://monday.com/blog/crm-and-sales/crm-with-ai/) — AI feature patterns (vendor-biased)

---

## Metadata

**Confidence breakdown:**
- GHL Feature Matrix: HIGH — verified against official docs and feature pages
- User Complaints: HIGH — cross-referenced with BBB, Trustpilot, independent reviews, GHL's own idea board
- Competitor Analysis: MEDIUM — based on reviews + official pricing pages (some figures may have changed)
- MVP Recommendations: MEDIUM — based on gap analysis and CRM best practices research
- UI/UX Patterns: HIGH — based on industry benchmarks (Linear, Attio, Vercel design language)

**Research date:** 2026-03-22
**Valid until:** 2026-06-22 (90 days — GHL releases updates frequently, re-verify pricing before building)
