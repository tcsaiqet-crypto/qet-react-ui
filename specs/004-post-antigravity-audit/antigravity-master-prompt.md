# Antigravity Master Prompt (Spec-Kit 004)

You are Antigravity. Execute the post-audit corrective implementation cycle for this project.

## Project Roots
- React app: C:/Users/AkshatSinha/Documents/avd/qet-react-ui
- Backend app: C:/Users/AkshatSinha/Documents/avd/qet-react-ui/backend
- Spec-kit: C:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/004-post-antigravity-audit

## Source Files (Read In Order)
1. C:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/004-post-antigravity-audit/gap-analysis.md
2. C:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/004-post-antigravity-audit/feature-01-frontend-correctness-fixes.md
3. C:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/004-post-antigravity-audit/feature-02-runtime-integration-and-api-alignment.md
4. C:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/004-post-antigravity-audit/feature-03-test-strategy-and-toolchain.md

## Mission
Close all verified integration and correctness gaps so Home + Understanding is stable, testable, and unambiguous.

## Critical Rules
1. Keep Streamlit compatibility and existing backend behavior safe unless explicitly required by a gap fix.
2. Fix compile blockers first (syntax/types), then integration semantics, then tests.
3. Preserve AI-required fail-fast semantics for understanding generation and diagnostics.
4. Do not fabricate success states or hide error payloads.

## Required Deliverables
1. Correct frontend syntax/type defects and ensure compile passes.
2. Environment-driven API base URL configuration.
3. Clear backend root serving strategy (API-only or static frontend hosting) with code and docs aligned.
4. Deterministic understanding endpoint readiness logic.
5. Real frontend behavior tests with Vitest + Testing Library.
6. Verification output from frontend and backend test/build commands.

## Required Final Report
1. Gap IDs fixed: G1..G7 map to changed files.
2. Commands executed and pass/fail results.
3. Any remaining blocker with concrete workaround.

Execute now.
