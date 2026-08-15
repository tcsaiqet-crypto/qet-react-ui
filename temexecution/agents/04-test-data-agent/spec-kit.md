# Test Data Spec-Kit Brief

## Goal
Generate safe, valid, traceable synthetic data for automated testing.

## Must Cover
- Input constraints.
- Boundary and negative data.
- No secrets or real personal data.
- Schema validation.
- Reproducibility and provenance.
- Dataset-to-test mapping.

## Acceptance
Test Data cannot start without a valid suite. Invalid records block downstream automation and expose the exact validation reason.

## Suggested Spec Folder
`specs/016-test-data-agent`
