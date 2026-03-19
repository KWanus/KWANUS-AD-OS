# PHASE 1 FILE MAP

## Required files
app/page.tsx
app/api/scan/route.ts
app/scan-products/page.tsx
app/scan-businesses/page.tsx
app/projects/page.tsx

components/
  dashboard/
  scan/
  ui/

engines/productScanEngine.ts
engines/businessScanEngine.ts

lib/scanOrchestrator.ts
lib/prisma.ts

rules/phaseOneRules.ts

prisma/schema.prisma

## Notes
- If route names differ slightly, keep them consistent and simple.
- Use clear import boundaries.
- No dead placeholder files unless explicitly marked.
