# F02 Source-of-Truth Path Alignment

## Objective
Remove backend path ambiguity so all future agent runs target one authoritative codebase.

## Scope
1. Declare active backend path as qet-react-ui/backend.
2. Update root prompt/document references to point only to active backend.
3. Add note in README/spec context warning against editing legacy copy.

## Acceptance
1. Prompt and spec-kit paths consistently reference qet-react-ui/backend.
2. No new execution instructions point to legacy backend copy.
