# Feature 04: Tests and Verification

## Goal
Verify the new integration work with real behavior and keep the repo stable.

## Deliverables
- backend tests for new API contracts and state transitions
- frontend tests for Home + Understanding flow
- manual validation checklist for the end-to-end journey
- proof that failed AI responses show real diagnostics

## Acceptance Criteria
1. Backend tests pass for all contract changes.
2. Frontend tests cover upload flow and tab gating.
3. Manual validation proves a full run from create-run to understanding output works.
4. Failed AI cases are surfaced as explicit failures rather than fabricated success.

## Verification Steps
1. Run backend tests.
2. Run frontend tests.
3. Perform a local end-to-end flow with sample docs and ZIP.
4. Validate state logs and understanding output.
