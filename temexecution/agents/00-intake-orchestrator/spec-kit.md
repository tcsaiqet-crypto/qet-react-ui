# Intake Spec-Kit Brief

## Goal
Deliver a secure, observable, dual-lane intake stage.

## Must Cover
- Requirement upload.
- ZIP validation and extraction.
- Useful-file filtering.
- Readiness contract.
- Upload summaries and diagnostics.
- Retry and reset of downstream state.

## Acceptance
No Understanding start is accepted without a valid document or source manifest. Counts and file decisions survive refresh. Invalid input returns structured errors.

## Suggested Spec Folder
`specs/012-intake-orchestration`
