# Task Checklist: Spec-Kit 021

- [ ] **Task 1: Backend LLM Service Hardening**
  - [ ] Increase `max_output_tokens` to 8192 in `AGENT_MODEL_POLICIES["understanding"]`.
  - [ ] Enable `responseMimeType: "application/json"` in `_call_gemini_model`.
  - [ ] Implement `_repair_truncated_json` parser fallback for unclosed quotes/brackets.

- [ ] **Task 2: Backend Upload Endpoints Logging**
  - [ ] Wrap `upload_documents` in `with log_run_context(run_id):` and log filenames/counts.
  - [ ] Wrap `upload_codebase` in `with log_run_context(run_id):` and log archive name, size, and extracted file metrics.

- [ ] **Task 3: Frontend Upload Logging Integration**
  - [ ] Update `HomeUploadPageProps` to include `onLogEvent` and `onFetchLogsNow`.
  - [ ] Emit `[INFO]` and `[STATUS]` log events in `performDocUpload` and `performZipUpload`.
  - [ ] Wire `App.tsx` to pass `logUiEvent` and instant log refresh to `HomeUploadPage`.

- [ ] **Task 4: Verification & E2E Validation**
  - [ ] Run `npm run build` to verify clean compilation.
  - [ ] Perform live file upload and verify logs stream in real-time in the Right Console Panel.
  - [ ] Execute Understanding stage on sample data and verify zero `invalid_model_json` errors.
  - [ ] Commit and push to `feature/logs-and-cancellation`.
