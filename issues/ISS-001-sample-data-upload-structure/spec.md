# Specification: ISS-001 — Sample Data Upload Structure & Endpoint Robustness

## 1. Problem Statement
Users encountered `405 Method Not Allowed` when calling `POST /api/v1/runs/{run_id}/understanding` due to subtle route registration mismatches between the frontend client and backend FastAPI routers. Furthermore, unstructured sample data uploads suffered from inconsistent file grouping, causing downstream agents to fail during intake parsing.

## 2. User Stories
- **US-1**: As a QA Engineer, I want to upload PRD documents and web app ZIP archives through dual intake lanes so that they are automatically parsed and structured on disk.
- **US-2**: As an API client or Frontend component, I want all endpoint aliases for pipeline stages (e.g. `/understanding`, `/start-understanding`) to function identically without 404/405 errors.
- **US-3**: As a system administrator, I want ZIP extractions protected against path-traversal attacks so that malicious archives cannot escape the sandbox.

## 3. Functional Requirements
1. **Multi-Part Upload Endpoint**:
   - `POST /api/v1/runs/upload`: Accepts `documents` (List[UploadFile]), `codebase` (UploadFile/List[UploadFile]), and optional `run_id`.
   - Returns `{ "run_id": str, "documents": List[str], "codebase_files": List[str], "status": "READY" }`.
2. **Endpoint Alias Decorators**:
   - FastApi route handlers must register both standard and legacy path routes.
3. **Directory Quarantine & Validation**:
   - Files are stored in isolated workspace: `workspace/{run_id}/documents/` and `workspace/{run_id}/codebase/`.
   - Sanitized filenames prevent overwriting system files.

## 4. Acceptance Criteria
- [x] Uploading a `.zip` archive extracts all files strictly under `workspace/{run_id}/codebase/`.
- [x] Calling `POST /api/v1/runs/{run_id}/understanding` returns HTTP 200 with understanding task initiation.
- [x] Calling `POST /api/v1/runs/{run_id}/start-understanding` returns identical HTTP 200 payload.
- [x] Real-time file upload events are logged in frontend state and backend run log.
