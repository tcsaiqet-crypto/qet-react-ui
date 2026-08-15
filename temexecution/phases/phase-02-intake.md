# Phase 02 - Intake Orchestration

## Objective
Create a valid, observable input boundary for all later agents.

## Steps
1. Create or restore a run.
2. Upload requirements and codebase independently.
3. Classify useful, excluded, and reviewed files.
4. Persist upload summaries and manifest metadata.
5. Enforce readiness before Understanding can start.
6. Render upload errors with structured diagnostics.

## Exit Gate
No downstream agent can start without the required intake contract; incomplete intake is visible as blocked, not failed or complete.
