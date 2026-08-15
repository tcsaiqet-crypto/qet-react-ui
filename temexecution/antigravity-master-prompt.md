# Master Prompt For Antigravity - Complete QET Agent Execution

You are Antigravity. Execute the complete QET multi-agent implementation pass in the active workspace.

## Workspace

- Project root: `C:/Users/AkshatSinha/Documents/avd/qet-react-ui`
- Active backend: `C:/Users/AkshatSinha/Documents/avd/qet-react-ui/backend`
- React source: `C:/Users/AkshatSinha/Documents/avd/qet-react-ui/src`
- Execution plan: `C:/Users/AkshatSinha/Documents/avd/qet-react-ui/temexecution`
- Existing choreography spec: `C:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/011-agent-choreography-experience`

Never edit or test the legacy backend copy. Preserve Streamlit compatibility while keeping the React + FastAPI path as the active integration path.

## Read First

Read these files before editing:

1. `temexecution/README.md`
2. `temexecution/MASTER_IMPLEMENTATION_PLAN.md`
3. `temexecution/SPECKIT_WORKFLOW.md`
4. `temexecution/RUNBOOK.md`
5. `temexecution/contracts/lifecycle-contract.md`
6. `temexecution/contracts/readiness-and-dependencies.md`
7. `temexecution/contracts/outputs-and-artifacts.md`
8. `temexecution/contracts/errors-and-provenance.md`
9. `temexecution/phases/phase-00-baseline.md` through `phase-09-verification.md`
10. Every agent folder README, execution-steps, and spec-kit file.
11. The existing Spec-Kit 011 documents, especially `spec.md`, `plan.md`, `tasks.md`, `acceptance-tests.md`, and `antigravity-master-prompt.md`.

## Agent Scope

Implement and integrate these agents in this exact dependency order:

1. Intake Orchestrator
2. Understanding Agent
3. Requirement Categorizer
4. Test Case Agent
5. Test Data Agent
6. Playwright Agent
7. Report Agent

Use the current backend agent implementations as anchors. Do not invent a second pipeline when an existing abstraction can be extended safely.

## Phase Execution Rules

Execute phases in order:

- Phase 00: baseline and ownership.
- Phase 01: shared contracts.
- Phase 02: intake orchestration.
- Phase 03: Understanding.
- Phase 04: requirement intelligence.
- Phase 05: test generation.
- Phase 06: Playwright.
- Phase 07: reporting.
- Phase 08: choreography and recovery.
- Phase 09: verification and closure.

Do not move to the next phase until the current phase exit gate passes. After each phase, report files changed, commands run, results, blockers, and workaround.

## Required Behavior

1. Enforce readiness and dependencies at the backend boundary.
2. Persist stage and subagent lifecycle events with timestamps and generation.
3. Make status payloads sufficient for deterministic frontend reconstruction after refresh.
4. Respect the selected AI provider. Never silently switch from Gemini to OpenAI or the reverse.
5. Preserve AI-required fail-fast behavior. Never replace a failed AI result with fake or fabricated deterministic success.
6. Validate every agent output before marking it completed.
7. Keep blocked, failed, completed, running, and invalidated states distinct.
8. Retry stage N by incrementing generation and invalidating all downstream outputs and visuals.
9. Preserve diagnostics, provider/model provenance, and actionable remediation.
10. Keep the frontend choreography grounded in persisted state and events rather than timers alone.

## UI Requirements

Implement or complete the orchestration experience from Spec-Kit 011:

- One dominant orchestration surface.
- Agent progression and active-agent detail.
- Upcoming-agent preview.
- Ordered subagent stream.
- Live text tied to the active event.
- Dual upload lanes with collapsed counts and expanded file lists.
- All, included, excluded, and reviewed filters.
- Visible errors and diagnostics that animations never hide.
- Previous-agent navigation and retry.
- Generation-aware stale-result removal.
- Mobile and desktop readability in light and dark themes.

The UI must represent the full pipeline, not only the first four intake/understanding cards. Where the current UI uses subagent labels such as Requirement Parser or UI Journey Synthesizer, map them to real lifecycle events and do not claim later agents completed before they run.

## Spec-Kit Work

For each agent, create or complete its numbered spec folder using the document-first structure:

- `README.md`
- `constitution.md`
- `spec.md`
- `data-contracts.md`
- `plan.md`
- `tasks.md`
- `acceptance-tests.md`
- `risks.md`
- `launcher.md`
- `prompt.md`
- `antigravity-master-prompt.md`

Use the suggested folders from `temexecution/agents/*/spec-kit.md`. Use `temexecution/SPECKIT_COMMANDS.md` for PowerShell creation and test commands. Do not claim an external Spec-Kit CLI was run if it is not installed; document the document-first commands actually used.

## Verification

At minimum run:

```powershell
Set-Location C:/Users/AkshatSinha/Documents/avd/qet-react-ui
npm run build
npm run test
Set-Location backend
python -m pytest -q
```

Also run focused tests for each changed agent and API contract. Exercise the integrated flow with a document upload and codebase ZIP. Exercise selected Gemini, selected OpenAI, missing-key, rejected-key, malformed-output, retry, and refresh scenarios when credentials/environment allow it.

## Required Final Output

Return a complete closeout report containing:

1. Files changed grouped by phase.
2. Files changed grouped by agent and issue.
3. Spec-kits created or updated.
4. Contract changes and frontend/backend alignment.
5. Commands run with exact pass/fail results.
6. Acceptance checklist outcomes.
7. Provider behavior evidence.
8. Retry and generation invalidation evidence.
9. Unresolved blockers with exact reason and workaround.
10. Residual risks and next actions.
11. Final readiness statement.

Start with Phase 00. Stay within the requested scope, keep failures explicit, and do not stop at a plan when a concrete implementation and validation step is possible.
