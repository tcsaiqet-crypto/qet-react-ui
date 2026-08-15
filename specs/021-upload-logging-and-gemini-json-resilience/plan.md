# Architectural Plan: Spec-Kit 021

## 1. Component Execution Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as HomeUploadPage.tsx
    participant App as App.tsx (Log State)
    participant Console as RightLogsPanel.tsx
    participant Backend as FastAPI (fastapi_app.py)
    participant LLM as LLMService (Gemini 3.7 Flash)
    participant Disk as temp/run_{run_id}.log

    User->>UI: Selects 3 requirement docs & 1 codebase zip
    UI->>App: onLogEvent("[INFO] Ingesting 3 requirement documents...")
    App->>Console: Updates uiLogs state -> Renders in Live Console
    UI->>Backend: POST /runs/{run_id}/documents
    activate Backend
    Note over Backend,Disk: with log_run_context(run_id):
    Backend->>Disk: logger.info("Saved 3 document(s)...")
    Backend-->>UI: 200 OK Response
    deactivate Backend
    UI->>App: onLogEvent("[STATUS] 3 documents indexed successfully")
    UI->>App: onFetchLogsNow()
    App->>Backend: GET /runs/{run_id}/logs
    Backend-->>App: Returns updated backend logs
    App->>Console: Renders backend stream in Live Console

    User->>UI: Clicks "Start AI Understanding"
    UI->>Backend: POST /runs/{run_id}/understanding
    activate Backend
    Backend->>LLM: generate_text(prompt, maxOutputTokens=8192, responseMimeType="application/json")
    activate LLM
    LLM-->>Backend: Full structured JSON (8192 token headroom)
    deactivate LLM
    Backend->>Disk: logger.info("AI Understanding completed successfully")
    Backend-->>UI: 200 OK (understanding_ready)
    deactivate Backend
```

---

## 2. Detailed File Modifications

### File 1: `backend/src/services/llm_service.py`
- Increase `AGENT_MODEL_POLICIES["understanding"].max_output_tokens` to `8192`.
- Add `"responseMimeType": "application/json"` to `_call_gemini_model`.
- Implement `_repair_truncated_json` helper in `parse_json_payload_with_diagnostics`.

### File 2: `backend/src/api/fastapi_app.py`
- In `upload_documents`: Wrap inside `with log_run_context(run_id):` and emit `logger.info()`.
- In `upload_codebase`: Wrap inside `with log_run_context(run_id):` and emit `logger.info()`.

### File 3: `src/App.tsx`
- Pass `onLogEvent={logUiEvent}` and `onFetchLogsNow={fetchLogsImmediately}` into `HomeUploadPage`.

### File 4: `src/components/HomeUploadPage.tsx`
- Call `onLogEvent` on file select, drop, upload start, upload success, and failure.
- Call `onFetchLogsNow` upon successful upload.
