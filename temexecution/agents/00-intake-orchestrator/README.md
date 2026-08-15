# Intake Orchestrator

## Responsibility
Create the run boundary and make requirements/codebase inputs available to downstream agents.

## Inputs
- New or restored run.
- Requirement documents.
- Codebase ZIP.

## Outputs
- Intake manifest.
- Useful-file decisions.
- Upload lane summaries.
- Readiness status.

## Code Anchors
- `backend/src/api/fastapi_app.py`
- `backend/src/services/zip_service.py`
- `backend/src/services/run_state_service.py`
- `src/components/HomeUploadPage.tsx`
