# HIMALAYA — Core Engines

## Architecture Rule

All engines follow the sacred sequence:
```
Entry → Diagnosis → Strategy → Generation → Optimization
```

No engine may be skipped. Generation never fires without diagnosis and strategy.

---

## Engine 1: Entry Engine

**Purpose:** Get the user into the system with the least friction possible. Determine their stage before anything else.

### User Paths
| Path | Meaning | Next Step |
|------|---------|-----------|
| "I have no business yet" | Complete beginner | Business model selection → niche → goal |
| "I already have a business" | Existing operator | Asset scan → diagnosis |
| "I need help choosing" | Uncertain | Guided discovery flow |
| "I want to improve my marketing" | Has business, weak marketing | Marketing scan → diagnosis |
| "I want a better website/funnel" | Has business, weak site | Site scan → diagnosis |
| "I want automations and systems" | Has business, weak backend | Operations diagnosis |

### Output
- User stage classification
- Entry context object (what they have, what they need)
- Routing decision (which diagnosis path)

### Rules
- Minimal questions up front
- Smart defaults everywhere
- No giant forms
- No strategy language the user doesn't understand
- System adapts based on answers, not dumps everything

---

## Engine 2: Business Diagnosis Engine

**Purpose:** Deeply understand the user's situation before generating anything.

### For New Users (Starting from Scratch)
Understand:
- Chosen business model
- Chosen niche
- Revenue goal
- Available resources (time, budget, skills)
- Preferred traffic source
- Risk tolerance

### For Existing Businesses
Understand:
- What they do and who they serve
- What they sell
- Current stage (starting, growing, scaling)
- Current bottlenecks
- Revenue and growth targets

### Asset Scanning (Existing Businesses)
If they have assets, scan:
- Website (structure, copy, trust, CTA, conversion flow)
- Offer page (clarity, value stack, objection handling)
- Ads (hook quality, alignment with landing page)
- Email copy (sequence structure, engagement, conversion)
- Onboarding flow (friction, clarity, time to value)
- Brand clarity (positioning, differentiation, messaging)
- Sales process (pipeline, follow-up, close rate indicators)

### Output
- Business profile
- Score (overall health)
- Bottleneck map (what's broken, ranked by impact)
- Missed opportunities
- Fastest wins (highest ROI fixes)
- Strategic rebuild recommendations

### Rules
- Diagnosis is not optional — it always runs
- Diagnosis output is the input to Strategy Engine
- Never show raw scan data — always interpreted

---

## Engine 3: Strategy Engine

**Purpose:** Decide what should happen next. What to build first. What not to build yet. What matters most.

### Decision Logic

| User Situation | Strategy Output |
|---|---|
| Beginner, no business | Business model path + starter system blueprint |
| Local service business | Lead gen site + booking + reviews + SMS/email follow-up |
| E-commerce brand | Product pages + retention email + ad angles + upsells |
| Coach/consultant | Authority funnel + content system + booking + nurture |
| Existing business, weak site | Rebuild site around conversion psychology |
| Existing business, weak backend | CRM + automations + follow-up + SOPs |

### Output
- Prioritized action plan (do first / do next / do later / don't do yet)
- Reasoning for each recommendation
- Expected impact per action
- Generation queue (what assets to create, in order)

### Rules
- Strategy must feel like it knows the shortest path
- Never give everything at once
- Always explain why something is prioritized
- Connect every recommendation to a user outcome (not a feature)
- Output must be understandable by a beginner

---

## Engine 4: Generation Engine

**Purpose:** Create the actual assets and systems once strategy is clear.

### What It Generates

**Business Foundation:**
- Business positioning summary
- Ideal customer profile
- Offer concept and direction
- Brand direction
- Pricing suggestions

**Website & Funnels:**
- Website blueprint (structure)
- Homepage copy
- Landing page copy
- Funnel architecture
- Page structure

**Marketing:**
- Ad copy and angles
- Email sequences
- SMS follow-up
- Lead magnets
- Content direction

**Operations:**
- CRM pipeline structure
- Workflow automations
- Onboarding flows
- SOPs
- Task systems

### Rules
- Generation only fires after diagnosis + strategy
- Every generated asset includes a "why this matters" explanation
- Assets are editable, exportable, and launchable
- Generation quality must feel custom, not template
- Context from diagnosis must be injected into every generation

---

## Engine 5: Optimization Engine

**Purpose:** Improve what's built over time. This is where real value compounds.

### What It Detects
- Weak headlines
- Buried CTAs
- Vague offers
- Missing trust signals
- Email sequences that lack urgency
- Funnels that leak after opt-in
- Lead forms with too much friction
- Ads misaligned with landing page promises
- Slow backend follow-up
- Confusing onboarding

### What It Does
1. Identifies the weakness
2. Explains why it matters
3. Suggests the improvement
4. Regenerates a better version
5. Ranks changes by impact

### Rules
- Optimization is ongoing, not one-time
- Changes must be explained, not just applied
- Impact ranking matters — highest impact first
- Never optimize what hasn't been diagnosed

---

## Engine Communication

Engines do not call each other directly. All data flows through the orchestrator:

```
User → Entry Engine → Orchestrator
Orchestrator → Diagnosis Engine → Orchestrator
Orchestrator → Strategy Engine → Orchestrator
Orchestrator → Generation Engine → Orchestrator
Orchestrator → Optimization Engine → Orchestrator → User
```
