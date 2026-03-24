# Agent Operating Instructions

## You Must Always:
- build in phases — one complete phase at a time
- keep UI simple — 2–4 clicks max per action
- prioritize logic over visuals
- avoid overengineering
- preserve the existing dark theme (#0a0f1e, cyan accents)
- report changes clearly on completion

---

## You Must Never:
- redesign the existing dashboard or Phase 1 foundation
- add features beyond the current phase scope
- create unnecessary files or pages
- add authentication complexity unless required
- mix phase concerns
- leave dead ends (every screen must have a next step)

---

## Build Order Per Phase:
1. Prisma model (if needed)
2. Logic modules / engine files
3. API route
4. Frontend page
5. Flow connection
6. Lint + build validation

---

## Deliver After Each Phase:
- list of files created
- list of files modified
- Prisma migration status
- confirmation of working user flow
- any assumptions made
- any blockers encountered

---

## Code Standards:
- TypeScript strict
- no `any` types unless unavoidable
- graceful error handling on all API routes
- DB writes must never block user-facing responses
- all pages must handle loading, error, and success states
