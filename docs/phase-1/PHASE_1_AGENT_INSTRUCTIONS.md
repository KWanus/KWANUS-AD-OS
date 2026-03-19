# PHASE 1 AGENT INSTRUCTIONS

You are building only Phase 1 of KWANUS AD OS.

## Non-negotiable rules
- Do not build Phase 2 features
- Do not skip validation
- Do not invent missing architecture
- Do not overengineer
- Keep frontend no-friction
- Keep all engine communication routed through orchestrator

## UX standard
The interface must feel:
- premium
- dark
- simple
- obvious
- smooth

The user should always know the next action.
Max 2 to 3 clicks per core action.

## Build order
1. Confirm current scaffold
2. Finalize Prisma schema for Phase 1
3. Build isolated Phase 1 engines
4. Build orchestrator
5. Build scan API route
6. Build dashboard and scan pages
7. Connect UI to API
8. Persist results
9. Validate database write
10. Run lint and build

## Required output
When reporting back, always include:
- what files were created or changed
- what passed
- what is blocked
- whether Phase 1 is complete or not complete
