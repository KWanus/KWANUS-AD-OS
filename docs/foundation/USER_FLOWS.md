# KWANUS — User Flows

## Flow 1: Onboarding

```
Landing Page
  → Create Account
  → Profile Setup (name, goals, situation)
  → Upload Credit Report (or skip to manual entry)
  → Dashboard (first view)
```

**Exit state**: User lands on Dashboard with status "Getting Started" and first Next Action card.

---

## Flow 2: Credit Report Upload & Parse

```
Dashboard → "Upload Credit Report"
  → File upload (PDF/HTML)
  → System parses report
  → Extracted items displayed for review
  → User confirms accuracy
  → Items saved to profile
  → Dashboard updates with item count and initial flags
```

**Exit state**: Credit items are stored. Repair Engine has data to analyze.

---

## Flow 3: Dispute Identification

```
Repair Center → Credit Items List
  → System flags disputable items (with rationale)
  → User reviews each flagged item
  → User selects items to challenge
  → Educational context shown for each dispute type
  → Selected items queued for letter generation
```

**Exit state**: User has a clear list of items to challenge with understanding of why.

---

## Flow 4: Dispute Letter Generation

```
Repair Center → Queued Disputes
  → Select dispute
  → System generates educational dispute letter draft
  → User reviews and customizes
  → User downloads or copies letter
  → User marks as "sent" after mailing
  → Dispute tracker updated
```

**Exit state**: Letter generated. User educated on process. Tracking active.

---

## Flow 5: Dispute Tracking

```
Repair Center → Dispute Tracker
  → View all active disputes by status
  → Update status (sent → pending response → resolved/escalated)
  → System suggests next actions based on status
  → Resolved items update credit profile
```

**Exit state**: User has clear visibility into all dispute progress.

---

## Flow 6: Profile Strength Review (Phase 2)

```
Dashboard → Profile Builder
  → View profile strength score
  → See account mix breakdown
  → See utilization status
  → Receive build recommendations
  → Access educational content
```

**Exit state**: User understands their profile strength and what to improve.

---

## Flow 7: Optimization Review (Phase 3)

```
Dashboard → Optimizer
  → View score factor breakdown
  → See timing recommendations
  → Review inquiry strategy
  → Get balance optimization targets
```

**Exit state**: User knows exactly which factors to improve and when.

---

## Flow 8: Funding Readiness Check (Phase 4)

```
Dashboard → Funding Prep
  → Run readiness assessment
  → View readiness score
  → See gap analysis
  → Complete documentation checklist
  → Review preparation recommendations
```

**Exit state**: User knows if they're ready or what's left before applying.

---

## Flow 9: Funding Guidance (Phase 5)

```
Dashboard → Funding Guide
  → View educational funding content
  → Review application strategy
  → See timing recommendations
  → Understand post-funding protection
```

**Exit state**: User has a clear, educated plan for pursuing funding.

---

## Flow Design Rules

1. Every flow ends with a clear next action.
2. No dead ends — every screen connects forward.
3. Maximum 2-3 clicks to reach any primary action.
4. Educational context is embedded, not hidden behind links.
5. The system tells the user what to do next — the user doesn't have to figure it out.
