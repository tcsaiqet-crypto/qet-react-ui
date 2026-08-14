# F01 Backend Import/Runtime Hotfix

## Objective
Restore backend importability and immediate runtime stability.

## Scope
1. Correct syntax/indentation defects in fastapi_app models and route declarations.
2. Ensure module import succeeds under pytest collection.
3. Ensure root mount/fallback logic does not break API route registration.

## Acceptance
1. `python -m pytest -q tests/test_fastapi_app.py` collects and runs.
2. FastAPI app starts without syntax or import errors.
