# Feature 03: Understanding UI Integration

## Goal
Render the generated understanding output in a polished and trustworthy way.

## Deliverables
- Understanding page populated from backend data
- summary and architecture sections
- component list, flows, and gaps
- provenance panel with provider, model, timestamps, validation status
- clear failure state with retry support

## Acceptance Criteria
1. Successful understanding run displays structured output clearly.
2. Provenance is visible to the user.
3. Failure state shows explicit AI diagnostics and remediation.
4. No deterministic fallback content is presented as if it were AI-generated output.

## Technical Notes
- This feature depends on API and state bridge completion.
- Keep fallback status visible and explicit.
- Preserve AI-required fail-fast policy.
