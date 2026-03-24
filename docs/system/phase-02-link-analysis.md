# Phase 2 — Link Analysis Engine

## Input
- single link (product / website / ad)

---

## Process

1. Extract data from link
2. Analyze:
   - pain being targeted
   - audience profile
   - offer strength
3. Score opportunity (0–100)
4. Generate decision

---

## Output

### Verdict
- Strong / Average / Weak

### Audience
- most likely buyer profile

### Pain Points
- key emotional triggers identified

### Angle
- best selling direction

### Recommendation
- Test immediately / Improve first / Reject

---

## API Route
POST /api/analyze
Body: { url: string, mode: "operator" | "consultant" | "saas" }

---

## UI Route
/analyze

---

## Rules
- DO NOT require login for basic analysis (Phase 2)
- Output must always end with a clear next action
- Confidence level must be shown on every verdict
