# HIMALAYA — Agent Operating Instructions

## Identity Command

You are building Himalaya under a **locked product doctrine**.

Himalaya is a guided business operating system, not just a stack of tools. It serves both complete beginners and existing business owners. The system lets a user either start from zero or improve what they already have.

## Sacred Sequence

```
Entry → Diagnosis → Strategy → Generation → Optimization
```

Do not let any feature generate random assets without first understanding the user's stage, business type, and bottlenecks.

## Decision Filter

Before building any feature, ask:

> Does this reduce confusion, create structure, or give the user a faster path forward?

If **no** → defer it.
If **unclear** → ask before building.

## Build Rules

1. Read `docs/himalaya/START_HERE.md` before any session
2. Every build task must map to `PRODUCT_ROADMAP.md`
3. Follow the `BUILD_PROTOCOL.md` for every change
4. Match the experience feel defined in `UX_DOCTRINE.md`
5. Follow the page structure in `PAGE_ARCHITECTURE.md`
6. Do not add features not on the roadmap
7. Do not refactor working systems without explicit approval
8. Do not build Phase N+1 features during Phase N

## Generation Rules

1. Generation only fires after diagnosis and strategy
2. Every generated asset must include context from diagnosis
3. Every generated asset must include a "why this was built this way" explanation
4. Assets must feel custom, not template-filled
5. Assets must be editable, exportable, and (eventually) launchable

## UX Rules

1. The system does the thinking. The user sees only what they need.
2. Every screen has one clear purpose and one clear next action.
3. Minimal questions up front. Smart defaults everywhere.
4. Beginner mode guides. Operator mode lets them move fast.
5. Never make the user feel dumb.
6. No overwhelming dashboards. No giant forms.
7. Show the "why" behind every recommendation.

## Existing Codebase

Himalaya builds on an existing codebase with working systems:
- Scan engines (business + product) → feeds Diagnosis Engine
- Truth Engine (10-dimension scoring) → feeds Strategy Engine
- Skill system (16 AI generation skills) → feeds Generation Engine
- Site builder + templates → part of Generation output
- Email flows + templates → part of Generation output
- CRM + leads → part of Operations layer (Phase 2)
- Copilot → assistant layer across all engines

**Do not remove working systems.** Integrate them into the Himalaya engine architecture. Existing code should be wired into the new flows, not rebuilt from scratch unless fundamentally broken.

## Communication Rules

1. When uncertain, ask — do not assume
2. When a task is ambiguous, request clarification tied to the roadmap
3. When something conflicts with the doctrine, flag it before building
4. When proposing a feature, explain how it maps to the sacred sequence

## Forbidden Actions

- Generating assets without diagnosis context
- Adding features not on the roadmap without approval
- Skipping the Entry → Diagnosis → Strategy → Generation sequence
- Building Phase N+1 features during Phase N
- Creating overwhelming UI
- Treating beginners and operators identically
- Front-loading complexity
