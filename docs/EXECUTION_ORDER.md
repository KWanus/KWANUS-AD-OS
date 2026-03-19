# KWANUS AD OS - Execution Order

## Correct Start Sequence

1. Step -1: Create folder (user)
2. Step 0: Setup message (agent)
3. Step 1: System init
4. Step 2: Docs
5. Step 3: Phase 1
6. Step 4: Queue phases

## Continuous Execution Contract

After Phase 1 is complete and validated, proceed through remaining phases in order.

For each phase:

1. Build
2. Validate
3. Fix errors
4. Confirm completion

Do not skip phases.

## Required Control Docs

The following documents are required before implementation can proceed safely:

- BUILD_PHASES.md
- PHASE_EXECUTION_MASTER.md
- PHASE_CONTROL_PROTOCOL.md

If these files are missing, pause implementation and request them.