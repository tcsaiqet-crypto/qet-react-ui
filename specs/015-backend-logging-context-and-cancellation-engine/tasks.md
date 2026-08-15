# Tasks: Spec-Kit 015 Implementation Checklist

- [x] Fix forward reference `NameError` in `backend/schemas/contracts.py`.
- [x] Re-add `@app.post("/api/v1/runs/{run_id}/cancel")` alias in `fastapi_app.py`.
- [x] Add `@app.get("/api/v1/runs/{run_id}/logs")` and `@app.get("/api/v1/runs/{run_id}/logs/download")` in `fastapi_app.py`.
- [x] Export `getRunLogs`, `getBackendLogsDownloadUrl`, and `cancelRun` in `src/services/apiClient.ts`.
- [ ] Add `with log_run_context(run_id):` wrappers to pipeline executions in `fastapi_app.py` and `pipeline.py`.
- [ ] Add `load_run_state(state.run_id)` disk status check in `pipeline.py` stage loop.
- [x] Verify backend tests pass with `pytest backend/tests/test_fastapi_app.py`.
