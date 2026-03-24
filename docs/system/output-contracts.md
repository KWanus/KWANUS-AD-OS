# Output Contracts

## Decision Output
```ts
{
  verdict: "strong" | "average" | "weak",
  confidence: "high" | "medium" | "low",
  risks: string[],
  recommendation: string
}
```

---

## Strategy Output
```ts
{
  audience: string,
  pain: string[],
  angle: string,
  positioning: string
}
```

---

## Asset Output
```ts
{
  headlines: string[],
  hooks: string[],
  scripts: string[],
  emails: {
    subject: string,
    body: string,
    type: "welcome" | "cart" | "nurture" | "push"
  }[]
}
```

---

## Workflow Output
```ts
{
  day1: string[],
  day2: string[],
  day3: string[],
  actions: { priority: number, task: string, reason: string }[]
}
```

---

## Rules
- Every output must include a `recommendation` field
- Every output must include a `nextStep` field
- Never return an empty confidence — default to "low" if uncertain
