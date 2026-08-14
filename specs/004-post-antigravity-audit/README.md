# Spec-Kit 004: Post-Antigravity Audit

## Goal
Close the remaining delivery gaps after the previous Antigravity run and stabilize a truly runnable React-first Home + Understanding flow.

## Why This Kit Exists
The codebase has meaningful progress, but audit checks found concrete correctness and integration issues that block reliable execution.

## Artifacts
- gap-analysis.md
- feature-01-frontend-correctness-fixes.md
- feature-02-runtime-integration-and-api-alignment.md
- feature-03-test-strategy-and-toolchain.md
- prompt.md
- antigravity-master-prompt.md

## Exit Criteria
1. Frontend TypeScript compiles without syntax/type errors.
2. Home and Understanding run against FastAPI with environment-driven API base URL.
3. Backend root serving strategy is explicit and non-conflicting.
4. Understanding state/result contract is deterministic and unambiguous.
5. Frontend and backend test strategy is runnable and documented.
