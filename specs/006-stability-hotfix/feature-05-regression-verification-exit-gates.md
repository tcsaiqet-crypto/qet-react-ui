# F05 Regression Verification and Exit Gates

## Objective
Ship hotfixes with measurable stability gates.

## Verification Commands
1. Backend targeted:
   - python -m pytest -q tests/test_fastapi_app.py tests/test_requirement_categorization.py
2. Optional broader:
   - python -m pytest -q

## Exit Gates
1. No import/syntax errors in active backend.
2. FastAPI tests for key contracts pass.
3. Requirement categorization and coverage tests pass.
4. Prompt/docs path consistency confirmed.

## Deliverable Report
1. Files changed grouped by G1..G4.
2. Tests executed with outputs.
3. Remaining known risks and mitigation.
