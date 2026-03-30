# HIMALAYA — User Flows

## Flow 1: Entry (All Users)

```
Landing / Dashboard
  → "What brings you here?"
  → Path selection:
     A) "I'm starting from scratch"
     B) "I have a business"
  → Route to appropriate flow
```

**Rules:**
- 1 click to start
- No account required to see the first screen
- The question must feel human, not clinical

---

## Flow 2: Start from Scratch

```
Step 1: Choose business model
  → Cards: Service, E-commerce, Coaching, Agency, Freelance, Affiliate, Info Product
  → Smart descriptions (what it is, who it's for, difficulty level)

Step 2: Choose niche
  → Suggested niches per business model
  → Or type your own
  → System validates / refines

Step 3: Define goal
  → "What's your first goal?"
  → Options: First client, First $1K, Replace income, Scale to $10K/mo

Step 4: Optional context
  → "Anything else? Describe your dream business."
  → Free text (optional, enhances generation quality)

Step 5: Diagnosis runs
  → Loading state: "Himalaya is analyzing your inputs..."
  → Quick viability + alignment check

Step 6: Strategy presented
  → "Here's your plan"
  → Prioritized action list
  → What to build first, what to defer

Step 7: Generation
  → System generates all Phase 1 assets
  → Progressive reveal (business profile → offer → site → marketing → roadmap)

Step 8: Review & Edit
  → User reviews each asset
  → Can edit, regenerate, or accept
  → Export or launch options

Step 9: Dashboard
  → User lands on dashboard with all assets accessible
  → Next action card: "Your first step is..."
```

---

## Flow 3: Improve Existing Business

```
Step 1: Tell us about your business
  → Enter website URL
  → OR describe your business (text)
  → Quick questions: niche, monthly revenue range, biggest challenge

Step 2: Scan runs
  → Loading state: "Himalaya is scanning your business..."
  → Website scan + offer analysis + trust assessment
  → Progress indicators per scan area

Step 3: Diagnosis presented
  → Business health score (visual)
  → Breakdown: trust, conversion, offer, follow-up, brand
  → Weak points ranked by impact
  → Fastest wins highlighted

Step 4: Strategy presented
  → "Here's what to fix first"
  → Prioritized rebuild plan
  → What's working (keep)
  → What to defer

Step 5: Generation
  → System generates fixes and rebuilds
  → New site blueprint, rewritten copy, ad angles, email suggestions

Step 6: Review & Edit
  → User reviews each asset
  → Side-by-side: "Current vs. Recommended"
  → Can edit, regenerate, or accept

Step 7: Dashboard
  → User lands on dashboard with optimization roadmap
  → Next action card: "Start with this fix..."
```

---

## Flow 4: Dashboard (Post-Onboarding)

```
Dashboard
  ├── Status card (stage, health score, progress)
  ├── Next Action card (most important thing to do now)
  ├── Assets section (all generated assets, organized)
  ├── Roadmap section (action plan with progress tracking)
  └── Quick actions (regenerate, scan, optimize)
```

**Rules:**
- Dashboard is not overwhelming
- One clear next action always visible
- Assets are grouped by category, not dumped
- Progress is visual and encouraging

---

## Flow 5: Asset Review & Edit

```
Any generated asset
  → Full preview
  → "Why Himalaya built this" explanation
  → Edit mode (inline editing)
  → Regenerate button (with option to adjust direction)
  → Export (copy, download, deploy)
  → Status: Draft → Reviewed → Launched
```

---

## Flow Design Rules

1. Every flow ends with a clear next action
2. No dead ends — every screen connects forward
3. Maximum 2-3 clicks to reach any primary action
4. Loading states explain what's happening, not just spin
5. The system tells the user what to do — the user doesn't figure it out
6. Beginner mode: more guidance, more explanation, fewer choices
7. Operator mode: less guidance, more control, faster movement
