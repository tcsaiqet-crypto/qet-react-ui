# Issue Constitution: ISS-001 — Sample Data Upload Structure & Endpoint Robustness

## 1. Fundamental Invariants

### 1.1 Non-Negotiable Ingestion Rules
1. **Zip Slip Immunity**: Any uploaded archive (codebase or sample bundle) must strictly validate target extraction paths against the sandbox root before any file write. Paths containing `..` or absolute path traversal must throw `400 Bad Request` and abort extraction immediately.
2. **Deterministic File Categorization**: Uploaded files must be partitioned deterministically into:
   - `documents`: PRDs, specifications, markdown, Word documents, text notes.
   - `codebase`: Application source files, zip packages, HTML/JS/CSS assets.
   - `sample_data`: Pre-configured JSON, CSV, or YAML fixtures.
3. **Endpoint Alias Parity**: The backend MUST expose consistent endpoint aliases for initiating requirement understanding:
   - `POST /api/v1/runs/{run_id}/understanding` (canonical)
   - `POST /api/v1/runs/{run_id}/start-understanding` (backward-compatibility alias)
   - `POST /api/v1/runs/{run_id}/understand` (legacy alias)
4. **Idempotency & State Safety**: Uploading supplementary files to an existing `run_id` in `CREATED` or `READY` state must append or safely overwrite existing artifacts without corrupting the run manifest.

## 2. Error Boundaries & Fallbacks
- Missing files in multipart form: Return HTTP 422 with explicit parameter names (`documents` / `codebase`).
- Unsupported file extension: Log warning and store as generic binary/text rather than crashing the pipeline.
- Empty directory upload: Return explicit status `NO_FILES_DETECTED` with actionable remediation guidance.
