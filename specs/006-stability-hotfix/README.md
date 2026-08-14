# Spec-Kit 006: Stability Hotfix

## Goal
Stabilize the active qet-react-ui backend and requirement-intelligence flow by fixing blocking runtime errors, eliminating repo path ambiguity, and hardening provider/model execution behavior.

## Why This Kit
A post-implementation audit identified blockers that can break Antigravity execution and create drift:
- backend import failure in active project backend
- dual-backend source-of-truth ambiguity
- requirement categorizer bypassing resilient LLM model fallback path
- incomplete coverage endpoint validation depth

## Feature Set
1. F01 Backend Import/Runtime Hotfix
2. F02 Source-of-Truth Path Alignment
3. F03 Requirement Categorizer LLM Hardening
4. F04 Coverage Endpoint Contract Hardening
5. F05 Regression Verification and Exit Gates

## Artifacts
- gap-analysis.md
- feature-01-backend-import-runtime-hotfix.md
- feature-02-source-of-truth-alignment.md
- feature-03-requirement-categorizer-llm-hardening.md
- feature-04-coverage-endpoint-contract-hardening.md
- feature-05-regression-verification-exit-gates.md
- prompt.md
- antigravity-master-prompt.md

## Definition of Done
1. Active backend imports cleanly and tests collect.
2. Single authoritative backend path is documented and used.
3. Requirement categorizer uses robust provider/model selection behavior.
4. Coverage endpoint has non-empty path assertions with requirement-to-test mappings.
5. Focused backend tests pass and no regression in existing core flow.
