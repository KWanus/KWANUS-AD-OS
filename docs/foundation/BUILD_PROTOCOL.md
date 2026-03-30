# KWANUS — Build Protocol

## Before Every Build Session

1. Read `docs/foundation/START_HERE.md`
2. Check `SYSTEM_STATE.md` for current phase and status
3. Confirm the task maps to `PRODUCT_ROADMAP.md`
4. Review `COMPLIANCE_GUARDRAILS.md` if the task involves user-facing copy

## Build Process

### Step 1: Validate
- Does this task exist on the roadmap?
- Does it belong to the current phase?
- Does it serve the core loop? (Repair -> Build -> Optimize -> Prepare -> Fund)

If NO to any → stop and flag.

### Step 2: Plan
- Identify affected files
- Identify dependencies
- Identify compliance implications
- Write a brief plan before coding

### Step 3: Build
- Follow existing code conventions
- Match UI doctrine for frontend changes
- Match copy doctrine for any user-facing text
- Keep changes modular and isolated

### Step 4: Verify
- Does the feature work as intended?
- Does the copy pass compliance checks?
- Does the UI match the doctrine?
- Are there any side effects on existing features?

### Step 5: Document
- Update `SYSTEM_STATE.md` if phase status changes
- Update `PHASE_HISTORY.md` if a milestone is reached
- Add any new routes to `ROUTE_MAP.md`

## Code Standards

### File Organization
- Engines in `/engines`
- Shared logic in `/lib`
- UI components in `/components`
- Pages/routes in `/app`
- Database in `/prisma`
- Documentation in `/docs`

### Naming Conventions
- Files: camelCase for logic, PascalCase for components
- Functions: camelCase, descriptive verbs
- Database tables: snake_case
- Environment variables: UPPER_SNAKE_CASE

### Quality Gates
- No feature ships without compliance check
- No copy ships without doctrine alignment
- No engine ships without isolation verification
- No phase completes without validation protocol

## Emergency Protocol

If a build introduces:
- Compliance violation → revert immediately
- Data loss risk → revert immediately
- Broken core flow → fix before any other work
- Performance regression → investigate before shipping

## Change Control

- Features not on the roadmap require explicit approval
- Architectural changes require doctrine review
- Compliance-sensitive changes require guardrail review
- Phase transitions require validation and sign-off
