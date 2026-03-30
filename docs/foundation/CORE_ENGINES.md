# KWANUS — Core Engines

## Engine Architecture

All engines are isolated modules. No engine communicates directly with another. All data flows through the orchestrator.

```
User Input -> Orchestrator -> Engine -> Orchestrator -> Output
```

---

## Engine 1: Intake Engine
**Stage: All**

Purpose: Receive and normalize user data.

Inputs:
- User profile information
- Credit report file (PDF, HTML, or structured data)
- Manual credit item entry

Outputs:
- Normalized user profile
- Parsed credit report data
- Extracted credit items with metadata

---

## Engine 2: Repair Engine
**Stage: Repair**

Purpose: Identify disputable items and generate educational dispute materials.

Inputs:
- Parsed credit items
- Bureau-specific rules
- Dispute category (inaccurate, outdated, duplicate, unverifiable)

Outputs:
- Flagged items with dispute rationale
- Educational dispute letter drafts
- Dispute tracking records
- Status lifecycle (identified → drafted → sent → pending → resolved/escalated)

---

## Engine 3: Profile Build Engine
**Stage: Build**

Purpose: Analyze and strengthen the credit profile.

Inputs:
- Current credit items and accounts
- Account types, ages, limits, balances
- User financial goals

Outputs:
- Profile strength score
- Account mix analysis
- Utilization recommendations
- Tradeline education content
- Build action plan

---

## Engine 4: Optimization Engine
**Stage: Optimize**

Purpose: Maximize scoring factors and readiness signals.

Inputs:
- Profile strength data
- Score factor weights
- Inquiry history
- Balance and utilization data

Outputs:
- Factor-by-factor improvement plan
- Timing recommendations
- Balance optimization targets
- Inquiry management strategy

---

## Engine 5: Readiness Engine
**Stage: Prepare**

Purpose: Assess whether the user is ready to pursue funding.

Inputs:
- Profile score
- Optimization status
- Documentation completeness
- Financial goals

Outputs:
- Readiness score (not ready / getting close / ready)
- Gap analysis
- Documentation checklist
- Recommended preparation actions

---

## Engine 6: Guidance Engine
**Stage: Fund**

Purpose: Educate users on funding opportunities and timing.

Inputs:
- Readiness assessment
- User goals and preferences
- Profile characteristics

Outputs:
- Educational funding awareness content
- Application strategy guidance
- Timing recommendations
- Post-funding profile protection plan

---

## Engine 7: Memory Engine
**Stage: All**

Purpose: Track patterns, outcomes, and user progress.

Inputs:
- All engine outputs
- User actions and decisions
- Timeline events

Outputs:
- Progress history
- Pattern insights
- Personalized action priorities
- Milestone tracking

---

## Engine Rules

1. Engines do not call each other directly.
2. All engine communication goes through the orchestrator.
3. Each engine has defined inputs and outputs — no side effects.
4. Engines must be testable in isolation.
5. Engine outputs must be compliance-checked before reaching the UI.
