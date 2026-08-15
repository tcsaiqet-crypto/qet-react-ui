# Spec: Backend Logging and Cancellation Engine

## 1. Objectives
- Capture 100% of agent and LLM logging events into run-scoped log files without data leakage between runs.
- Support instant, non-destructive pipeline execution cancellation across stage boundaries.
- Provide reliable log polling and log downloading endpoints for the frontend UI.

## 2. Requirements & Acceptance Criteria
- [x] `backend/schemas/contracts.py` supports `ExecutionStatusResponse` with typed forward annotations.
- [ ] Pipeline background workers set `log_run_context(run_id)` so `temp/run_{run_id}.log` contains real-time agent output.
- [ ] `GET /api/v1/runs/{run_id}/logs` returns live logs when queried.
- [ ] `POST /api/v1/runs/{run_id}/cancel` halts pipeline execution before the next stage.
