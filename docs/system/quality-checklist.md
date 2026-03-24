# Quality Checklist

## Code
- [ ] npm run lint passes with 0 errors
- [ ] npm run build passes clean
- [ ] no TypeScript errors
- [ ] no unused imports

---

## UX
- [ ] page is simple and readable
- [ ] maximum 2–4 clicks per action
- [ ] loading state exists
- [ ] error state exists
- [ ] success state exists
- [ ] there is always a clear next step

---

## Logic
- [ ] outputs make sense for the input given
- [ ] decisions are actionable (not vague)
- [ ] confidence level is shown where output is uncertain
- [ ] no output is ever empty without an explanation

---

## Flow
- [ ] no dead ends
- [ ] scan → report → next step works end to end
- [ ] DB write happens without blocking UI
- [ ] fallback exists if DB is down

---

## Data
- [ ] Prisma migration applied
- [ ] new tables exist in database
- [ ] at least one test record created manually
- [ ] payloadJson / JSON fields are valid and parseable
