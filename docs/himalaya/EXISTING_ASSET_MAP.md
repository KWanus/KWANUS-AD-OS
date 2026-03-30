# HIMALAYA — Existing Asset Map

## What Already Exists and How It Maps to Himalaya

This document maps existing codebase capabilities to Himalaya's engine architecture. Build on these — don't rebuild.

---

## Entry Engine

### Existing
- `/app/onboarding/page.tsx` — Onboarding flow exists
- `/app/start/page.tsx` — Start page exists
- `/app/setup/page.tsx` — Setup wizard exists
- `lib/archetypes/getBusinessContext.ts` — Business context collection exists

### Needs
- Restructure into two clear paths (scratch vs improve)
- Simplify to card-based selection
- Wire to diagnosis engine

---

## Diagnosis Engine

### Existing
- `/engines/businessScanEngine.ts` — Scores website URL quality (basic)
- `/engines/productScanEngine.ts` — Scores product viability (basic)
- `/lib/scanForCopilot.ts` — Deep scan: fetch → classify → extract → score → diagnose (POWERFUL)
- `/rules/truthEngine.ts` — 10-dimension weighted scoring with 4 profiles (CRITICAL)
- `/lib/scanOrchestrator.ts` — Routes to correct scan engine
- `/app/api/analyze/route.ts` — Analyze endpoint
- `/app/api/scan/route.ts` — Scan endpoint
- `/app/api/truth-engine/route.ts` — Truth Engine endpoint

### Needs
- Wire scan results into structured diagnosis output
- Add business-stage-aware diagnosis (not just marketing)
- Create visual diagnosis report page
- Connect diagnosis output to strategy engine input

---

## Strategy Engine

### Existing
- `/rules/truthEngine.ts` → produces verdict (Pursue/Consider/Reject) + prioritized action plan
- `/rules/phaseOneRules.ts` → basic scoring + verdict
- Truth Engine profiles (BALANCED, PAID_TRAFFIC, CONSULTANT, SEO) provide context-aware strategy

### Needs
- Expand beyond marketing verdicts to business-stage strategy
- Add "what to build first" logic based on user type
- Create prioritized action plan output (do first / do next / defer)
- Build strategy presentation page

---

## Generation Engine

### Existing
- `/lib/skills/registry.ts` — 16 generation skills registered
- `/lib/skills/executor.ts` — Executes skills via Claude API
- `/prompts/skillPrompts.ts` — 9 prompt templates (ads, scripts, pages, emails, audits, lead magnets, VSLs)
- `/templates/siteTemplates.ts` — 5 website templates
- `/templates/emailTemplates.ts` — 4 email sequence templates
- Site builder (components, copilot, block renderer)
- Email flow builder (visual node editor)

### Skills Available
| Skill | Himalaya Use |
|-------|-------------|
| Ad Copy Generator | Marketing angles |
| TikTok/Reels Script | Content direction |
| Google Ads Pack | Paid traffic strategy |
| Landing Page Builder | Website blueprint + copy |
| SEO Content Audit | Optimization input |
| Email Nurture Sequence | Follow-up system |
| Broadcast Email | Outreach generation |
| Lead Magnet Creator | Lead capture assets |
| Sales Script / VSL | Sales system |

### Needs
- Wire generation to run AFTER diagnosis + strategy (not standalone)
- Inject diagnosis context into all generation prompts
- Add business foundation generation (positioning, ICP, offer concept)
- Create progressive generation flow (not all at once)
- Add "why this was built this way" to every output

---

## Optimization Engine (Phase 2)

### Existing
- Truth Engine diagnostics already detect weaknesses
- Scan engine can re-scan after changes
- Copilot can suggest improvements

### Needs
- Structured before/after comparison
- Impact-ranked improvement suggestions
- Regeneration with optimization context
- Ongoing monitoring

---

## Infrastructure (Keep As-Is)

| System | Status | Notes |
|--------|--------|-------|
| Next.js app shell | Working | Keep |
| Prisma + PostgreSQL | Working | Extend schema as needed |
| Clerk authentication | Working | Keep |
| Stripe integration | Working | Keep for Phase 2 billing |
| Claude API integration | Working | Core of Generation Engine |
| Component library | Working | Extend for Himalaya flows |
| Email send system | Working | Keep for follow-up |

---

## Key Insight

Himalaya Phase 1 is mostly an **integration and flow problem**, not a rebuild. The pieces exist. They need:
1. A guided entry flow that routes users correctly
2. Diagnosis output that feeds into strategy
3. Strategy output that feeds into generation
4. A dashboard that ties it all together
5. UX that makes it feel guided, not scattered
