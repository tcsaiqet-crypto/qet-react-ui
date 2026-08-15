# Specification: Upload Observability & Gemini JSON Resilience Engine

## 1. Problem Statement
1. **Silent File Uploads**: Users uploading specification documents or ZIP archives received no feedback in the right-side Live Console Logs panel because:
   - `HomeUploadPage.tsx` did not invoke `logUiEvent`.
   - FastAPI endpoints (`/runs/{run_id}/documents` and `/runs/{run_id}/codebase`) did not use `with log_run_context(run_id):` or call `logger.info()`.
2. **Token Limit Truncation (`invalid_model_json`)**:
   - `UnderstandingAgent` requests comprehensive component inventories, flow mappings, and 15-point checklist validations.
   - When Gemini 3.7 Flash ran with thinking enabled, the `4000` token limit was exhausted mid-generation, causing a JSON syntax decode failure at line 134.

---

## 2. User Stories
- **US-1 (Live Upload Feedback)**: As an engineer uploading a 5MB codebase ZIP and 4 requirement documents, I want to see immediate timestamped logs in the right panel showing upload progress, extracted file counts, and AST indexing.
- **US-2 (Resilient AI Understanding)**: As a test engineer running understanding analysis on large codebases, I want Gemini 3.7 Flash to have sufficient token budget and automated JSON repair so understanding completes without syntax truncation errors.
- **US-3 (Honest Error Diagnostics)**: If a real model failure occurs, I want clear, unadorned error diagnostics without boilerplate fallback claims.

---

## 3. Functional Requirements

### FR-1: Frontend Upload Event Telemetry
- `HomeUploadPage` must accept an `onLogEvent?: (message: string, type?: 'info' | 'warn' | 'error') => void` prop.
- On file drop/select: Emit `[INFO] Selected {count} document(s) for ingestion...`
- On upload completion: Emit `[STATUS] Successfully indexed {count} requirement document(s).`
- On ZIP drop/select: Emit `[INFO] Uploading codebase archive '{filename}' ({size_kb} KB)...`
- On ZIP extraction: Emit `[STATUS] Archive unpacked: {count} source files indexed into workspace.`
- On failure: Emit `[ERROR] Ingestion failed: {error_message}`.

### FR-2: Backend Run-Scoped Logging for Ingestion Endpoints
- `upload_documents` in `fastapi_app.py` must wrap file handling with `with log_run_context(run_id):` and log:
  - Document filenames and sizes.
  - Total requirement documents indexed.
- `upload_codebase` in `fastapi_app.py` must wrap ZIP extraction with `with log_run_context(run_id):` and log:
  - ZIP archive filename and received byte length.
  - Safe extraction path and total extracted files.
  - Intake manifest metadata update.

### FR-3: Immediate Log Polling Trigger
- When file uploads complete in `HomeUploadPage.tsx`, invoke a fast-sync trigger to fetch the latest backend logs immediately rather than waiting for the 3000ms polling interval.

### FR-4: Token Budget Expansion for Thinking Tiers
- In `llm_service.py`, increase `AGENT_MODEL_POLICIES["understanding"].max_output_tokens` from `4000` to `8192`.
- In `AGENT_MODEL_POLICIES["test_cases"]`, maintain `8192` tokens.

### FR-5: Native JSON Mode (`responseMimeType`)
- In `_call_gemini_model`, configure `generationConfig` with `"responseMimeType": "application/json"` when requesting structured outputs.

### FR-6: Truncated JSON Auto-Repair Parser
- In `parse_json_payload_with_diagnostics`, if `json.loads` encounters a syntax error due to an unclosed string or unclosed brace (`{` / `[`), apply automated quote/bracket balancing to rescue the parsed dictionary.
