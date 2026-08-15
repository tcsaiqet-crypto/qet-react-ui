# Task Breakdown & Verification: ISS-001

## 1. Implementation Tasks
- [x] **T-1.1**: Implement `safe_extract_zip` in backend utility service with path normalization and sandbox root enforcement.
- [x] **T-1.2**: Implement `POST /api/v1/runs/upload` endpoint in `backend/src/api/fastapi_app.py` supporting multipart file lists.
- [x] **T-1.3**: Add route decorators for `/api/v1/runs/{run_id}/understanding` and `/api/v1/runs/{run_id}/start-understanding`.
- [x] **T-1.4**: Update `src/services/apiClient.ts` to call the unified upload and understanding routes with proper error handling.

## 2. Verification Milestones
- [x] **V-1.1**: Test ZIP upload with nested directory structure — confirm extraction into `workspace/{run_id}/codebase/`.
- [x] **V-1.2**: Test ZIP Slip malicious path traversal payload — confirm HTTP 400 rejection and 0 escaped files.
- [x] **V-1.3**: Execute curl against `/api/v1/runs/{run_id}/understanding` — confirm HTTP 200 and background task trigger.
- [x] **V-1.4**: Execute curl against `/api/v1/runs/{run_id}/start-understanding` — confirm parity response.
