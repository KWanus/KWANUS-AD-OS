# KWANUS — Build Priorities

## Current Priority: Phase 1 — Foundation & Repair Engine

### P0 (Must Ship)
1. User onboarding flow (name, email, profile basics)
2. Credit report upload and parsing
3. Credit item extraction and categorization
4. Dispute identification (inaccurate, outdated, duplicate, unverifiable)
5. Dispute letter generation (educational templates)
6. User dashboard (status overview, next actions)
7. Database: users, credit_items, disputes, timeline_events

### P1 (Ship With Phase 1)
1. Dispute tracking (sent, pending, resolved, escalated)
2. Progress timeline visualization
3. Educational tooltips on every action
4. Notification system (next steps, reminders)

### P2 (Can Wait for Phase 2)
1. Profile strength scoring
2. Account mix analysis
3. Tradeline education
4. Utilization tracking

### Deferred (No Phase Assigned)
- Anything not tied to Repair -> Build -> Optimize -> Prepare -> Fund
- Marketing features
- Social features
- Gamification beyond progress milestones
- Third-party integrations not required by the core loop

---

## Priority Rules

1. P0 ships before P1. P1 ships before P2.
2. Nothing from P2 gets pulled into Phase 1 unless a P0 dependency requires it.
3. Deferred items require explicit roadmap approval before any work begins.
4. If unsure whether something is P0 or deferred, it's deferred.
