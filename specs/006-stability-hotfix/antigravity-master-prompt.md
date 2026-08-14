# Antigravity Master Prompt (Spec-Kit 006)

You are Antigravity. Execute the full stability hotfix cycle for this project.

## Authoritative Paths
- Project root: C:/Users/AkshatSinha/Documents/avd/qet-react-ui
- Active backend root: C:/Users/AkshatSinha/Documents/avd/qet-react-ui/backend
- Spec-kit root: C:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/006-stability-hotfix

## Read In Order
1. C:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/006-stability-hotfix/gap-analysis.md
2. C:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/006-stability-hotfix/feature-01-backend-import-runtime-hotfix.md
3. C:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/006-stability-hotfix/feature-02-source-of-truth-alignment.md
4. C:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/006-stability-hotfix/feature-03-requirement-categorizer-llm-hardening.md
5. C:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/006-stability-hotfix/feature-04-coverage-endpoint-contract-hardening.md
6. C:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/006-stability-hotfix/feature-05-regression-verification-exit-gates.md

## Critical Rules
1. Patch only the active backend path in qet-react-ui/backend.
2. Do not modify legacy backend copy under other folders.
3. Resolve import/runtime blockers first before any refactor.
4. Preserve AI fail-fast and structured diagnostics.
5. Keep backward compatibility where feasible.

## Deliverables
1. FastAPI module import and test collection fixed.
2. Prompt/docs path consistency set to active backend path.
3. Requirement categorizer LLM reliability behavior hardened.
4. Coverage endpoint tests expanded for non-empty mapped scenarios.
5. Targeted backend tests passing.

## Verification Commands
1. cd C:/Users/AkshatSinha/Documents/avd/qet-react-ui/backend
2. python -m pytest -q tests/test_fastapi_app.py tests/test_requirement_categorization.py

## Final Report Format
1. Issue ID -> changed files mapping (G1..G4)
2. Commands executed and results
3. Remaining risk and mitigation

Execute now.
