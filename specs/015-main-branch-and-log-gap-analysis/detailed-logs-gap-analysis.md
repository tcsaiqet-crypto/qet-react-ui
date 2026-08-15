# Detailed Gap Analysis: Logging System & Observability Infrastructure

## 1. Overview

This document provides a deep, granular gap analysis of the logging and observability capabilities across the Quantum Engineering Toolkit (QET). It traces the evolution of logging features from initial commits (`c6a1aa4`, `LOG_FEATURE_CHANGES.md`, `de88119`) against the current state of both frontend and backend architectures.

---

## 2. Granular Log Architecture Gap Matrix

| Subsystem / Layer | Component / Artifact | Expected Behavior from Git Logs (`c6a1aa4`) | Current Codebase State | Gap Severity | Root Cause & Resolution Blueprint |
|---|---|---|---|---|---|
| **1. UI Console Log Drawer** | `src/components/ConsoleLogDrawer.tsx` | Dedicated collapsible bottom drawer displaying frontend and backend logs with search, auto-scroll, log level filtering (`All`, `Info`, `Status`, `Error`), and export buttons. | Component exists (354 lines) but is **unmounted / commented out** in `src/App.tsx`. | **HIGH** | `ConsoleLogDrawer` was removed from the render tree when `AgentDetailDrawer` was added in `de88119`. Needs to be mounted below the active tab workspace in `App.tsx`. |
| **2. Frontend Event Tracking** | `src/App.tsx` (`uiLogs`, `logUiEvent`) | Captures user interactions, navigation transitions, file uploads, and stage triggers into an in-memory `LogEntry[]` ring buffer. | `uiLogs` state and `logUiEvent()` helper were **omitted** from `src/App.tsx`. | **MEDIUM** | Restore `uiLogs` state, `logUiEvent` helper, and wire it to dispatch events on uploads, stage transitions, and execution triggers. |
| **3. Backend Log Endpoints** | `backend/src/api/fastapi_app.py` | `GET /api/v1/runs/{run_id}/logs`<br>`GET /api/v1/runs/{run_id}/logs/download` | Endpoints are **missing** from `fastapi_app.py`. | **HIGH** | Endpoints were dropped during merge in `de88119`. Re-add endpoints reading `temp/run_{run_id}.log` and streaming as text/downloadable attachment. |
| **4. Frontend API Client** | `src/services/apiClient.ts` | `getRunLogs(runId)` and `getBackendLogsDownloadUrl(runId)` helper functions. | Methods are **missing** from `apiClient.ts`. | **MEDIUM** | Re-export `getRunLogs(runId)` and `getBackendLogsDownloadUrl(runId)` in `src/services/apiClient.ts`. |
| **5. Run Log Context Scope** | `backend/src/utils/logger.py` (`log_run_context`) | Context manager setting `current_run_id` contextvar so `RunFileHandler` writes logs to `temp/run_{run_id}.log`. | `log_run_context` exists in `logger.py` but is **never invoked** in `pipeline.py` or API routers. | **HIGH** | Wrap `SequentialQETPipeline.run_from(state, ...)` and individual stage executions with `with log_run_context(state.run_id):`. |
| **6. Agent Inspector Logs Tab** | `src/components/AgentDetailDrawer.tsx` ("Subagents & Logs") | Displays live execution telemetry for the specific selected agent stage. | Displays hardcoded static strings generated in `resolveSelectedAgentContext` instead of live stage logs. | **LOW** | Connect agent-specific log slices from `appState.agent_timeline` or filter `backendLogs` by agent tag (e.g., `[Requirement Parser]`, `[AST Extractor]`). |
| **7. Live Playwright Execution Terminal** | `LivePlaywrightRunner.tsx` & `MultiLevelJsonViewer.tsx` | Captures pytest stdout, step-by-step traces, passed/failed logs, and displays them in headed runner. | **Fully Functional**: Script logs are captured in `MultiLevelExecutionReport` and rendered with colored step badges. | **NONE (Pass)** | No gaps identified. Execution logs and step details stream properly. |
| **8. Multi-Level JSON Execution Logs** | `backend/src/services/execution_engine.py` | Per-script logs stored in `ScriptExecutionDetail.execution_logs` with explicit `why_passed` / `why_failed` explanations. | **Fully Functional**: Structured 3-tier report persists to `uploads/{run_id}/artifacts/multi_level_execution_results.json`. | **NONE (Pass)** | No gaps identified. Multi-level hierarchy verified by test suite. |

---

## 3. Deep Dive on Identified Gaps & Mechanics

### Gap 1: Disconnected `ConsoleLogDrawer` in `src/App.tsx`
- **What was there**: Commit `c6a1aa4` introduced a bottom-anchored, inline log drawer that sat below active pages and beside the Left Rail.
- **What happened**: Commit `de88119` introduced the right-side `AgentDetailDrawer.tsx` and unintentionally removed `<ConsoleLogDrawer>` from `src/App.tsx` along with its polling loop:
  ```typescript
  // Missing polling loop from c6a1aa4:
  useEffect(() => {
    const runId = appState?.run_id;
    if (!runId || !logDrawerOpen) return;
    const fetchLogs = async () => {
      try {
        const res = await getRunLogs(runId);
        setBackendLogs(res.backend_logs);
      } catch (err) {
        console.error('Failed to fetch backend logs:', err);
      }
    };
    void fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [appState?.run_id, logDrawerOpen]);
  ```

### Gap 2: Missing Backend Endpoints in `fastapi_app.py`
- **What was there**:
  - `GET /api/v1/runs/{run_id}/logs` returning `{"run_id": run_id, "backend_logs": content}`.
  - `GET /api/v1/runs/{run_id}/logs/download` returning `FileResponse` for text log download.
- **Current state**: Neither endpoint is present in `fastapi_app.py`, causing `getRunLogs` calls to 404 if triggered.

### Gap 3: Unconnected `log_run_context` in `pipeline.py`
- **What was there**: `backend/src/utils/logger.py` defines:
  ```python
  current_run_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("current_run_id", default=None)
  
  @contextmanager
  def log_run_context(run_id: str):
      token = current_run_id.set(run_id)
      try:
          yield
      finally:
          current_run_id.reset(token)
  ```
- **Current state**: `log_run_context` is never used inside `SequentialQETPipeline`, meaning `current_run_id.get()` is always `None`, and `RunFileHandler` never writes log records to `temp/run_{run_id}.log`.

---

## 4. Complete Action Plan for 100% Log Parity

1. **Backend Integration**:
   - In `backend/src/workflows/pipeline.py`: Wrap `run_from` in `with log_run_context(state.run_id):`.
   - In `backend/src/api/fastapi_app.py`: Re-add `/api/v1/runs/{run_id}/logs` and `/api/v1/runs/{run_id}/logs/download`.
2. **Frontend API Client**:
   - In `src/services/apiClient.ts`: Re-export `getRunLogs` and `getBackendLogsDownloadUrl`.
3. **Frontend UI Wiring**:
   - In `src/App.tsx`:
     - Re-import `ConsoleLogDrawer` and `LogEntry`.
     - Re-add `uiLogs`, `backendLogs`, `logDrawerOpen` state variables.
     - Re-add `logUiEvent`, `clearFrontendLogs`, `downloadFrontendLogs`, `downloadBackendLogs`.
     - Mount `<ConsoleLogDrawer>` inside the main content area (below active tab panels).
4. **Agent Inspector Alignment**:
   - Ensure the "Subagents & Logs" tab in `AgentDetailDrawer` supplements the global `ConsoleLogDrawer` with agent-specific telemetry.
