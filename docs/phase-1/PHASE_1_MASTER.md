# PHASE 1 — CORE FOUNDATION

## Objective
Build the first working version of KWANUS AD OS foundation.

Phase 1 must deliver:
- a premium dark dashboard shell
- a working Scan Products page
- a working Scan Businesses page
- a Projects area
- isolated Phase 1 engines
- an orchestrator layer
- API route for scans
- Prisma schema and client setup
- persistence-ready database integration
- no-friction UI flow

## Definition of Done
Phase 1 is only complete when all of the following are true:

1. App compiles and runs locally
2. Dashboard UI renders cleanly
3. Scan Business accepts a URL and returns structured output
4. Scan Products returns structured sample or source-backed results
5. Results flow through orchestrator, not direct engine-to-engine calls
6. Prisma client is configured and usable
7. Database schema is applied successfully
8. At least one real save-to-database test passes
9. Lint passes
10. Production build passes

## Scope
### In scope
- dashboard shell
- product scan page
- business scan page
- projects page placeholder
- scan API endpoint
- business scan engine
- product scan engine
- phase one rules
- scan orchestrator
- Prisma schema
- basic persistence for scan results

### Out of scope
- Truth Engine full implementation
- advanced scoring
- ad generation
- website generation
- outreach generation
- automation jobs
- auth
- billing

## Core rule
Do not move to Phase 2 until database validation succeeds.
