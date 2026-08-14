# Risks 011

## R1 Contract Drift
- Risk: Frontend consumes fields not always present in backend payloads.
- Mitigation: Backward-compatible parsing and feature guards.

## R2 Animation-State Race
- Risk: Fast status updates may cause transition flicker.
- Mitigation: Queue transition states with short stabilization windows and generation checks.

## R3 Retry Purge Incompleteness
- Risk: Downstream data survives retry in hidden stores.
- Mitigation: Purge by generation at source and assert in tests.

## R4 Run Restore Regression
- Risk: Revisiting older runs can show mixed generation artifacts.
- Mitigation: Reconstruct UI strictly from active generation.

## R5 Performance Under Large File Lists
- Risk: Expanded upload rows become expensive.
- Mitigation: Virtualized rendering or bounded pagination for large manifests.

## R6 Accessibility Gaps In Motion
- Risk: Rich choreography may reduce readability for sensitive users.
- Mitigation: Honor reduced-motion preference and preserve textual state cues.
