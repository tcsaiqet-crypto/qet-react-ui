# Playwright Spec-Kit Brief

## Goal
Generate and optionally execute reliable browser automation from validated QET outputs.

## Must Cover
- Selector strategy.
- Page object/script generation.
- Feature flags and environment safety.
- Logs, screenshots, traces, and failure payloads.
- Test/data traceability.

## Acceptance
No browser execution starts with missing dependencies. Every failure remains explicit and every script is linked to its source test case.

## Suggested Spec Folder
`specs/017-playwright-agent`
