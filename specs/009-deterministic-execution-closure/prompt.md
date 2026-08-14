# Prompt For Antigravity (Spec-Kit 009)

You are Antigravity. Execute Spec-Kit 009 as a deterministic closure pass for the remaining unresolved execution gaps in this repository.

## Paths
- Project root: C:/Users/AkshatSinha/Documents/avd/qet-react-ui
- Backend root: C:/Users/AkshatSinha/Documents/avd/qet-react-ui/backend
- Spec root: C:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/009-deterministic-execution-closure

## Read First
1. gap-analysis.md
2. phase-00-baseline-and-gate-checks.md
3. phase-01-serving-strategy-and-backend-alignment.md
4. phase-02-left-rail-agent-experience.md
5. phase-03-understanding-lifecycle-contract.md
6. phase-04-tests-and-regressions.md
7. phase-05-verification-and-closeout.md

## Scope
Only work on the remaining gaps listed in `gap-analysis.md`.

## Must Fix
1. G1: backend root serving ownership ambiguity.
2. G2: left-rail staged agent experience and transition behavior.
3. G3: understanding lifecycle contract determinism.
4. G4: behavior test coverage for staged transitions and run restore.
5. G5: verification reproducibility and evidence capture.

## Required UI Contract
The left side must stage the agent names in this order:
1. Requirement Understanding Agent
2. Document Intake Agent
3. Application Understanding Agent

Required motion behavior:
1. The current active agent appears as a large hero label.
2. Once complete, the agent shrinks and moves upward into a compact completed state.
3. The next agent animates from bottom to center-left and becomes the new hero.
4. AI-stage left panel shows live activity text while processing.

## Constraints
1. Keep Streamlit compatibility intact.
2. Do not fake success states.
3. Preserve transparent AI failure diagnostics.
4. Keep changes scoped to the remaining gaps only.
5. If an item is already fixed, validate it with evidence instead of reworking it.

## Execution Method
1. Complete phases in order.
2. At the end of each phase, report:
   1. files changed
   2. commands run
   3. pass/fail status
   4. blockers/workarounds
3. Do not skip phase reporting.

## Required Output
1. Gap closure matrix for G1 through G5.
2. Files changed grouped by gap ID.
3. Full command log with outcomes.
4. Remaining blockers with exact workaround.
5. Final readiness statement for merge.

## Verification Commands
Frontend:
1. npm install
2. npm run build
3. npm run test

Backend:
1. python -m pytest -q

Start now.
