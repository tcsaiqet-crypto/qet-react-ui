# QET Agent Execution Workspace

This folder is the implementation map for the complete QET multi-agent workflow. It expands Spec-Kit 011 from the intake and choreography surface to the full agent pipeline.

## Pipeline

```text
Run Creation
  -> Intake Orchestrator
  -> Understanding Agent
  -> Requirement Categorizer
  -> Test Case Agent
  -> Test Data Agent
  -> Playwright Agent
  -> Report Agent
```

## Folder Map

- `phases/`: ordered implementation phases and exit gates.
- `agents/`: one folder per agent; each contains ownership, execution steps, and a spec-kit brief.
- `contracts/`: shared state, lifecycle event, provider, error, and output contracts.
- `verification/`: test matrix, acceptance checklist, and evidence template.
- `SPECKIT_WORKFLOW.md`: how to create, execute, validate, and close a spec-kit.
- `RUNBOOK.md`: Windows commands for frontend, backend, API, and full-flow validation.
- `antigravity-master-prompt.md`: the complete prompt for an Antigravity implementation run.

## Source Of Truth

All code changes belong in the active backend at `backend/` and the React app at `src/`. The legacy backend copy described in `backend/README.md` is out of scope.

## Rules

1. Agents execute only after their upstream contract is satisfied.
2. A selected AI provider is never silently replaced by another provider.
3. Failed AI stages remain failed and expose diagnostics; no fabricated success is allowed.
4. Retry increments the generation and invalidates every downstream result.
5. UI progress is reconstructed from persisted backend state and lifecycle events.
6. Every phase has a validation command and an explicit exit gate.
