# KWANUS — Phase 1 Execution Plan

## Phase: Foundation & Repair Engine

## Objective
Deliver a working system where a user can onboard, upload a credit report, identify disputable items, generate educational dispute letters, and track dispute progress.

## Deliverables

### 1. User Onboarding
- Account creation (email/password)
- Profile setup (name, financial goals, current situation)
- Welcome flow that sets expectations
- Compliance disclaimers during onboarding

### 2. Credit Report Intake
- File upload (PDF and HTML support)
- Credit report parsing engine
- Credit item extraction and categorization
- Item display with bureau attribution
- Manual item entry fallback

### 3. Dispute Identification
- Automated flagging of potentially disputable items
- Dispute categories: inaccurate, outdated, duplicate, unverifiable
- Rationale display for each flag
- User review and selection flow
- Educational context for each dispute type

### 4. Dispute Letter Generation
- Educational letter templates by dispute type and bureau
- User customization interface
- Download/copy functionality
- Compliance disclaimers on every letter
- Letter history storage

### 5. Dispute Tracking
- Status lifecycle: identified → drafted → sent → pending → resolved/escalated
- Timeline visualization
- Next action recommendations based on status
- Resolution recording

### 6. Dashboard
- User status overview
- Active stage indicator (Repair)
- Next Action card
- Progress timeline
- Credit item summary
- Active dispute count

### 7. Database Schema
- `users` — account and profile data
- `credit_reports` — uploaded report metadata
- `credit_items` — individual line items
- `disputes` — dispute records with status
- `timeline_events` — all actions and milestones
- `dispute_letters` — generated letter records

## Validation Criteria

Phase 1 is complete when:
- [ ] A new user can create an account and set up their profile
- [ ] A user can upload a credit report and see extracted items
- [ ] The system flags potentially disputable items with rationale
- [ ] A user can generate an educational dispute letter
- [ ] A user can track dispute status through its lifecycle
- [ ] The dashboard shows accurate status and next actions
- [ ] All user-facing copy passes compliance guardrail checks
- [ ] Database schema supports all Phase 1 entities
- [ ] No Phase 2+ features are included

## Dependencies
- Authentication system
- File upload infrastructure
- Credit report parsing logic
- Database (Prisma + PostgreSQL/Supabase)
- PDF generation or text export for letters

## Risks
- Credit report format variability (mitigate with multiple parser strategies)
- Compliance language drift (mitigate with copy doctrine enforcement)
- Scope creep from Phase 2 features (mitigate with strict roadmap adherence)
