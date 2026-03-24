# Phase 4 — Asset Generator

## Goal
Turn an approved opportunity (from Phase 3) into a full execution package.
This is where KWANUS stops being a scanner and starts being a builder.

## Scope
Included:
- Ad hooks + scripts (3–5 hooks, 2 full scripts)
- Landing page structure (headline, sections, copy blocks)
- Email sequences (welcome, abandoned cart, post-purchase)
- Execution checklist (day-by-day action plan)

Excluded:
- Actual page building (no code generation or deployment)
- SEO content at scale
- Discovery feed / product finding
- Payment/fulfillment setup

---

## Mode-Specific Output

### Operator Mode (Affiliate / Dropshipping)
**Asset package includes:**

**Ad Hooks (5 variations)**
Based on research-backed formats:
- Problem agitation: "I was [pain state] until I found this..."
- Skeptic-to-believer: "I thought this was a scam until..."
- Social proof open: "[X] people can't be wrong about..."
- Demonstration cold open: [product doing the thing — describe visually]
- Pattern interrupt: [unexpected angle specific to the product]

**Ad Scripts (2 full 30-second scripts)**
Structure per script:
- 0–3s: Hook
- 3–8s: Problem identification
- 8–18s: Product demonstration
- 18–25s: Social proof + outcome
- 25–30s: CTA + urgency

**Landing Page Structure**
- Headline: problem-focused (not product-focused)
- Trust bar: units sold, shipping, guarantee
- Benefit bullets: 3–5, outcome-focused
- Social proof block: review format guidance
- Guarantee section: risk reversal framing
- FAQ: 5 top objections answered
- CTA copy: action verb + specific outcome

**Email Sequences**
Welcome (6 emails, days 1–7):
- Email 1 (immediate): Deliver lead magnet, set expectations, no pitch
- Email 2 (Day 1): Story — rapport building only
- Email 3 (Day 2): Education — the real problem mechanism
- Email 4 (Day 3): Case study + soft CTA
- Email 5 (Day 5): Objection handling + direct pitch
- Email 6 (Day 7): Urgency/scarcity close

Abandoned Cart (3 emails):
- Email 1 (30 min): Soft reminder, no discount, hero image
- Email 2 (24 hr): Social proof, 3 reviews, no discount
- Email 3 (48 hr): 10% off, real deadline

Post-Purchase (4 emails):
- Immediate: Confirmation + specific shipping estimate
- Day 3: How to use + soft cross-sell
- Day 7–10 (near delivery): Anticipation + complementary offer
- Day 14: Review request + referral ask

**Execution Checklist**
- Day 1: actions
- Day 2: actions
- Day 3: actions
- Scaling trigger: when to increase budget
- Kill criteria: when to stop

---

### Consultant Mode
**Asset package includes:**

**Audit Report (client-ready)**
Structure:
- Executive Summary (plain English, 1 paragraph)
- What We Found (3–4 key findings with impact)
- Cost of Inaction (each finding quantified in $ where possible)
- Recommended Strategy (phased roadmap)
- Expected Outcomes
- Investment and Timeline
- Next Steps (clear action items for both sides)

**Website Fix Plan**
- Headline rewrite (current → suggested)
- Trust signal additions
- CTA improvements
- Conversion architecture notes

**Ad Strategy Recommendation**
- Recommended platform(s) and why
- Audience direction
- Creative angle recommendation
- Budget structure suggestion

**Email/Retention Plan**
- Which sequences are missing
- Priority order to build them
- Expected revenue impact

**Outreach Message**
- Personalized cold outreach based on findings
- Loom script outline (what to walk through in the video audit)

---

### SaaS Mode
**Asset package includes (simplified):**
- 3 ad hooks (plain language)
- Simple landing page structure (section by section)
- Basic email checklist (what to set up first)
- Step-by-step action plan (no jargon)

---

## Required New Logic Modules

Create in `/src/logic/ad-os/`:

### `generateAdHooks.ts`
Input: decisionPacket (angle, audience, painDesire, verdict)
Output: 5 hooks in the 5 top-performing formats
Logic: deterministic templates populated with extracted signals

### `generateAdScripts.ts`
Input: decisionPacket + mode
Output: 2 full 30-second scripts in the proven structure
Logic: fill script template with product/problem/angle data

### `generateLandingPageStructure.ts`
Input: decisionPacket + opportunityPacket + mode
Output: section-by-section page structure with copy guidance
Logic: headline formula + section templates populated with signals

### `generateEmailSequences.ts`
Input: decisionPacket + mode
Output: welcome sequence + cart abandonment + post-purchase
Logic: email templates + subject lines populated with product/angle data

### `generateExecutionChecklist.ts`
Input: opportunityPacket (recommended path + priority actions) + mode
Output: day-by-day action plan with scaling triggers and kill criteria
Logic: map recommended path to the appropriate action template per mode

### `buildAssetPackage.ts`
Input: all above generators
Output: complete AssetPackage object

---

## Data Model

```prisma
model AssetPackage {
  id                String   @id @default(cuid())
  analysisRunId     String
  mode              String
  adHooks           Json
  adScripts         Json
  landingPageStructure Json
  emailSequences    Json
  executionChecklist Json
  createdAt         DateTime @default(now())

  analysisRun AnalysisRun @relation(fields: [analysisRunId], references: [id], onDelete: Cascade)
}
```

Also add back-relation to AnalysisRun:
```prisma
assetPackages AssetPackage[]
```

---

## API Change

Upgrade `/app/api/analyze/route.ts`:
- After opportunity assessment, run asset generation
- Add `assetPackage` to response

```json
{
  "ok": true,
  "analysis": { ... },
  "opportunityAssessment": { ... },
  "assetPackage": {
    "adHooks": ["hook1", "hook2", "hook3", "hook4", "hook5"],
    "adScripts": [{ "script": "...", "duration": "30s" }, { ... }],
    "landingPageStructure": {
      "headline": "...",
      "trustBar": ["..."],
      "benefitBullets": ["..."],
      "socialProofGuidance": "...",
      "guarantee": "...",
      "faqItems": ["..."],
      "ctaCopy": "..."
    },
    "emailSequences": {
      "welcome": [{ "subject": "...", "preview": "...", "body": "..." }],
      "abandonedCart": [...],
      "postPurchase": [...]
    },
    "executionChecklist": {
      "day1": ["..."],
      "day2": ["..."],
      "day3": ["..."],
      "scalingTrigger": "...",
      "killCriteria": "..."
    }
  }
}
```

---

## UI Changes

Add to `/app/analyze/page.tsx` — new section below Opportunity Assessment:

**Asset Package section**
Shown only when status is NOT "Reject"

Display in tabs or collapsible sections:
1. Ad Hooks (5 hooks, copyable)
2. Ad Scripts (2 scripts, copyable)
3. Landing Page (section by section)
4. Email Sequences (tabbed: welcome / cart / post-purchase)
5. Execution Checklist (day by day)

Each section has a copy button.
No giant walls of text — structured, scannable, actionable.

---

## Done Condition

Phase 4 is complete when:
- Asset package generates on every non-Reject analysis
- Ad hooks, scripts, landing page, emails, and checklist all populate
- Assets are mode-specific (Operator vs. Consultant vs. SaaS tone/depth)
- Assets save to database
- UI displays assets clearly in the analyze page
- Lint passes, build passes

---

## Success Criteria

A user should be able to paste one link and walk away with:
- Hooks they can use in ads today
- A script they can record today
- A page structure they can build today
- An email sequence they can set up today
- A day-by-day plan they can follow starting now
