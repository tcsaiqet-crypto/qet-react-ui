# Master Implementation Plan

## Phase 0 - Baseline And Ownership

Inventory current routes, state models, agents, artifacts, tests, and provider behavior. Confirm the active backend path and capture baseline build/test results.

Exit gate: baseline commands run; gaps are recorded; no legacy backend is modified.

## Phase 1 - Shared Contracts

Define the canonical stage enum, agent IDs, lifecycle event shape, generation/reset behavior, readiness rules, provider provenance, error payloads, and output artifact ownership.

Exit gate: backend and frontend types agree; contract tests cover valid and invalid transitions.

## Phase 2 - Intake Orchestration

Complete run creation, document upload, ZIP upload, useful-file decisions, upload summaries, and readiness gating. Do not expose Understanding as runnable until intake is valid.

Exit gate: both upload paths persist state and the understanding-start endpoint rejects incomplete intake.

## Phase 3 - Understanding

Run the AI-required Understanding Agent using the selected provider only. Persist provenance, structured output, diagnostics, and subagent events.

Exit gate: Gemini/OpenAI selection is respected, failures are visible, and the stage cannot report success without validated output.

## Phase 4 - Requirement Intelligence

Run Requirement Categorizer after Understanding. Validate taxonomy, category counts, requirement mappings, and coverage inputs.

Exit gate: categorization is either explicitly enabled and successful or explicitly skipped; it is never represented as fake completion.

## Phase 5 - Test Generation

Run Test Case Agent and Test Data Agent in dependency order. Persist generated suites and synthetic datasets with provenance and validation.

Exit gate: test cases cannot run without understanding; test data cannot run without a valid suite.

## Phase 6 - Browser Automation

Run Playwright Agent to produce page objects/scripts and, where enabled, controlled execution evidence.

Exit gate: scripts are linked to test cases and execution failures retain actionable diagnostics.

## Phase 7 - Reporting

Run Report Agent after browser artifacts exist. Produce HTML/PDF/JSON outputs and a report provenance record.

Exit gate: report output is reproducible from the current generation and does not include invalidated artifacts.

## Phase 8 - Choreography And Recovery

Expose the complete lifecycle in the UI: active agent, upcoming agent, subagents, live messages, completed states, failures, retry, and downstream invalidation.

Exit gate: refresh and run-history restore the same generation-consistent state.

## Phase 9 - Verification And Closure

Run frontend, backend, contract, integration, and manual acceptance checks. Publish evidence and residual risks.

Exit gate: all required checks pass or each blocker has an exact reason and workaround.
