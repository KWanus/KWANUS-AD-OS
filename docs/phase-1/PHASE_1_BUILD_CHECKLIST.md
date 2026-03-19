# PHASE 1 BUILD CHECKLIST

## Setup confirmation
- [ ] Next.js app initialized
- [ ] TypeScript configured
- [ ] Tailwind configured
- [ ] Prisma installed
- [ ] Prisma client generated
- [ ] PostgreSQL target configured
- [ ] Required folders exist

## UI pages
- [ ] / renders premium dashboard
- [ ] scan products UI exists
- [ ] scan businesses UI exists
- [ ] projects UI exists or placeholder route exists

## Architecture
- [ ] /engines/productScanEngine.ts exists
- [ ] /engines/businessScanEngine.ts exists
- [ ] /rules/phaseOneRules.ts exists
- [ ] /lib/scanOrchestrator.ts exists
- [ ] no engine calls another engine directly

## API
- [ ] scan route exists
- [ ] request validation exists
- [ ] response shape is structured
- [ ] errors return safe fallback message

## Database
- [ ] prisma/schema.prisma exists
- [ ] schema includes scan persistence models
- [ ] db push or migration succeeds
- [ ] real write test succeeds

## Validation
- [ ] npm run lint passes
- [ ] npm run build passes
- [ ] scan business flow works
- [ ] scan products flow works
- [ ] save result works

## Final closeout
- [ ] mark Phase 1 complete only after all checks pass
