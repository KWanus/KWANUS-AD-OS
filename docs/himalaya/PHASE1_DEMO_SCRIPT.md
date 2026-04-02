# Himalaya Phase 1 — Demo Script

## Prerequisites

1. Run `npx prisma db push` to sync schema
2. Start dev server: `npm run dev -- -p 3005`
3. Log in via Clerk auth

---

## Demo A — Scratch Path (Start a Business)

**Goal:** Complete end-to-end: entry → form → progress → results → execution → outcome

1. **Navigate to** `localhost:3005/himalaya`
2. **See:** Two path cards (Scratch + Improve), "Let Himalaya decide" option, check-in banner if prior runs exist
3. **Click** "Start from Scratch"
4. **On** `/himalaya/scratch`:
   - Select business type: "Agency"
   - Enter niche: "dental practices in Texas"
   - Select goal: "Get first client"
   - Optional: add dream context
5. **Click** "Build My Foundation"
6. **Watch:** 4-stage inline progress (Diagnosis → Strategy → Generation → Save) with animated checkmarks
7. **Auto-redirect** to `/himalaya/run/[id]`
8. **Review results page:**
   - Header: score ring, "Agency / Service Business" badge, "Ready" status
   - Confidence badge: "High Confidence" with metric
   - Executive summary: 3 structured blocks
   - Strategy reasoning: "Why This Direction" with 3-4 bullets
   - Top 3 priorities with actions
   - Generated assets: Business Profile, Ideal Customer, Offer Direction, Website Blueprint, Marketing Angles, Email Sequence, Action Roadmap
   - Each asset card has: Edit, Regenerate, Save as Template buttons
9. **Test Deploy:** Click "Deploy Everything" → see campaign + site + email flow created with links
10. **Test Export:** Click "DOCX" → download opens. Click "Copy Summary" → paste to verify
11. **Test Execution:** Click "Start Execution" → see step-by-step tasks with progress bar → toggle a few steps → see progress update
12. **Navigate back** to results → see "Continue Execution" banner with progress
13. **Scroll to Outcome:** Click "Improved results" → see confirmation
14. **Save a template:** Click "Save as Template" on Marketing Angles → name it → confirm

---

## Demo B — Improve Path (Fix a Business)

**Goal:** URL scan → analysis → regenerate → edit → compare

1. **Navigate to** `localhost:3005/himalaya`
2. **Click** "Improve Existing Business"
3. **On** `/himalaya/improve`:
   - Enter URL: any live business website (e.g. a local business site)
   - Optional: select goal "Improve conversion"
4. **Click** "Analyze My Business"
5. **Watch:** 4-stage progress (longer intervals for scan)
6. **Auto-redirect** to `/himalaya/run/[id]`
7. **Review results:**
   - Header with scan score and "Improve Existing Business" badge
   - 10 dimension scores in trace details
   - Audit Summary, Strengths, Weaknesses, Recommended Path
   - Generated improvements: Homepage, Marketing Angles, Email, Roadmap
8. **Regenerate:** Click "Regenerate" on Marketing Angles → watch spinner → see "Updated"
9. **Edit:** Click "Edit" on an asset card → modify text → click "Save"
10. **Compare:** Go to `/himalaya/runs` → click "Compare" → select this run + the scratch run → view side-by-side dimension diff

---

## Demo C — Profiler Path (Let the System Decide)

**Goal:** Show the decision engine in action

1. **Navigate to** `localhost:3005/himalaya`
2. **Click** "Let Himalaya decide for me"
3. **Answer 7 questions:** stage, goal, budget, time, skills, risk, details (enter niche + URL if improve)
4. **Click** "Find My Path"
5. **See** `/himalaya/path/[id]`: Primary recommendation with confidence %, reasoning, next steps, alternatives
6. **Click** "Build My Foundation" on primary → pipeline progress screen → auto-redirect to results

---

## Demo D — Learning Loop (Returning User)

**Goal:** Show memory, adaptive insights, and check-in system

1. **Navigate to** `localhost:3005/himalaya` (after Demo A completed with outcome)
2. **See:** Check-in banner if any run has unreported outcome or active execution
3. **Navigate to** any results page → see "Based on Your History" adaptive insights
4. **Navigate to** `/himalaya/scratch` → verify niche/mode may be prefilled from memory
5. **Click** "Run Again" from a results page → lands on scratch/improve form with prior data prefilled, "Loaded from a previous run" indicator
6. **Navigate to** `/himalaya/templates` → see saved template from Demo A
7. **Navigate to** `/himalaya/runs` → see all runs with execution status badges (Executed, 3/8 steps, Pinned)

---

## Demo E — Operator Controls

1. On any results page:
   - Click "Pin Run" → verify amber highlight
   - Click "View Raw JSON" → see structured data
   - Click "Copy Run ID" → paste to verify
   - Click "Duplicate Input" → copies prefilled scan URL
2. Print/PDF: Click "Print / PDF" → browser print dialog with clean layout (non-essential sections hidden)

---

## Notes for Reviewer

- All demos require Clerk authentication. No anonymous access.
- All data is user-scoped. Switch accounts to verify no cross-user leakage.
- The improve path requires a publicly accessible URL for full scan. Internal/localhost URLs will fail.
- Foundation generators are deterministic (rule-based). Same inputs produce same outputs. This is intentional for Phase 1.
- The `outcome` field and `outcomePatterns` in memory require at least 2-3 reported outcomes before adaptive insights appear.
