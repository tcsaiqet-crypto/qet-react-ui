# Execution Runbook

## Frontend

```powershell
Set-Location C:/Users/AkshatSinha/Documents/avd/qet-react-ui
npm install
npm run build
npm run test
npm run dev
```

## Backend

```powershell
Set-Location C:/Users/AkshatSinha/Documents/avd/qet-react-ui/backend
pip install -r requirements.txt
python -m pytest -q
uvicorn src.api.fastapi_app:app --reload --host 127.0.0.1 --port 8000
```

## Focused Validation

```powershell
python -m pytest tests/test_fastapi_app.py -q
python -m pytest tests/test_schemas.py tests/test_pipeline.py -q
Set-Location ..
npm run test -- --reporter=verbose
```

## Manual Full Flow

1. Start the backend and frontend.
2. Create a run.
3. Upload at least one requirements document.
4. Upload a valid codebase ZIP when source analysis is required.
5. Confirm the UI remains blocked until the readiness contract is satisfied.
6. Select Gemini or OpenAI explicitly and verify the runtime badge.
7. Start Understanding and observe provider, model, events, and diagnostics.
8. Continue through categorization, test cases, test data, Playwright, and report when enabled.
9. Retry an earlier stage and verify downstream outputs disappear and generation increments.
10. Reload the run and verify state reconstruction.

## Evidence Capture

For every phase record the command, date, exit code, relevant output, and pass/fail result in `verification/evidence.md`.
