# PHASE 1 VALIDATION PROTOCOL

## Required commands
- npm run lint
- npm run build
- npx prisma generate
- database schema apply command

## Required functional tests
1. Business scan request returns valid structure
2. Product scan request returns valid structure
3. Database save succeeds
4. UI loads without runtime crash

## Completion statement rule
Agent may only say "Phase 1 complete" if:
- code compiles
- lint passes
- build passes
- DB writes succeed
- functional tests pass

Otherwise say:
- "Phase 1 structurally built but not complete"
- and state blocker clearly
