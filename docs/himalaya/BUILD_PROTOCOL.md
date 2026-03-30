# HIMALAYA — Build Protocol

## Before Every Build Session

1. Read `docs/himalaya/START_HERE.md`
2. Check which phase is active
3. Confirm the task maps to `PRODUCT_ROADMAP.md`
4. Review `UX_DOCTRINE.md` if the task involves UI

## Build Process

### Step 1: Validate
- Does this task exist on the roadmap?
- Does it belong to the current phase?
- Does it serve the sacred sequence? (Entry → Diagnosis → Strategy → Generation → Optimization)

If NO to any → stop and flag.

### Step 2: Plan
- Identify affected files
- Identify which engine this touches
- Identify dependencies on existing code
- Write a brief plan before coding

### Step 3: Build
- Follow existing code conventions
- Match UX doctrine for frontend changes
- Keep changes modular and isolated
- Integrate with existing systems (don't rebuild what works)

### Step 4: Verify
- Does the feature work as intended?
- Does the UI match the doctrine? (calm, premium, guided)
- Is the flow beginner-friendly?
- Does it connect to a clear next action?
- Are there any side effects on existing features?

### Step 5: Document
- Update relevant docs if architecture changes
- Note any new pages in `PAGE_ARCHITECTURE.md`

## Code Standards

### File Organization
- Engines in `/engines`
- Shared logic in `/lib`
- UI components in `/components`
- Pages/routes in `/app`
- Database in `/prisma`
- Templates in `/templates`
- Prompts in `/prompts`
- Rules/scoring in `/rules`
- Documentation in `/docs`

### Integration Priority
Before building new code, check if existing code already handles it:
1. Check `/engines` for scan/scoring logic
2. Check `/rules/truthEngine.ts` for assessment logic
3. Check `/lib/skills` for generation capabilities
4. Check `/templates` for existing asset structures
5. Check `/components` for existing UI patterns

### Quality Gates
- No feature ships without UX doctrine check
- No generation ships without diagnosis context
- No page ships without clear next action
- No phase completes without validation criteria met

## Change Control

- Features not on the roadmap require explicit approval
- Architectural changes require doctrine review
- Phase transitions require validation and sign-off
- Existing working features must not be broken
