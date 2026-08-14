# Prompt For Antigravity (Spec-Kit 006)

You are Antigravity. Execute Spec-Kit 006 as a stability hotfix implementation pass.

## Paths
- Project root: C:/Users/AkshatSinha/Documents/avd/qet-react-ui
- Active backend root: C:/Users/AkshatSinha/Documents/avd/qet-react-ui/backend
- Spec root: C:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/006-stability-hotfix

## Read First
1. gap-analysis.md
2. feature-01-backend-import-runtime-hotfix.md
3. feature-02-source-of-truth-alignment.md
4. feature-03-requirement-categorizer-llm-hardening.md
5. feature-04-coverage-endpoint-contract-hardening.md
6. feature-05-regression-verification-exit-gates.md

## Mission
Fix the active backend blockers and harden requirement intelligence stability so development can continue safely.

## Must Fix
1. Import/runtime blocker in active backend FastAPI module.
2. Path/source-of-truth ambiguity in prompts and docs.
3. Requirement categorizer model/provider resilience path.
4. Coverage endpoint test depth for non-empty mappings.

## Constraints
1. Keep Streamlit compatibility behavior intact.
2. Keep changes scoped to stability and correctness for this pass.
3. Preserve structured fail-fast diagnostics for AI failures.
4. Use active backend path only; do not patch legacy backend copy.

## Verification Required
1. Run: python -m pytest -q tests/test_fastapi_app.py tests/test_requirement_categorization.py
2. Report exact pass/fail output.

## Required Output
1. Files changed grouped by issue IDs G1 to G4.
2. Verification commands run and outcomes.
3. Remaining blockers (if any) and workaround.

Start now.
