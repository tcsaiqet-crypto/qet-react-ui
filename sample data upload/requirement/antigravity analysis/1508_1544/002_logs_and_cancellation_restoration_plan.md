# 002 Logs UI and Cancellation Engine Restoration Specification

**Date**: 2026-08-15  
**Timestamp**: 15:44  
**Target Scope**: Log Drawer UI, Search/Highlighting, Pipeline Cancellation & Stop Button  

---

## 1. Console Log Drawer Restoration

### A. Placement & Integration
The `<ConsoleLogDrawer>` component (`src/components/ConsoleLogDrawer.tsx`) must be rendered in `src/App.tsx` directly inside the main workspace flex column (`min-w-0 w-full flex-1`), positioned below active tab panels (`HomeUploadPage`, `UnderstandingPage`, `ExecutionPage`).

```tsx
<ConsoleLogDrawer
  isOpen={logDrawerOpen}
  onToggle={() => setLogDrawerOpen(!logDrawerOpen)}
  frontendLogs={uiLogs}
  backendLogs={backendLogs}
  onClearFrontend={clearFrontendLogs}
  onDownloadFrontend={downloadFrontendLogs}
  onDownloadBackend={downloadBackendLogs}
  activeProvider={aiSettings?.active_provider || 'Unknown'}
  activeModel={aiSettings?.runtime_state?.model || 'Auto'}
/>
```

### B. Capabilities Matrix
1. **Log Types**: Toggle between **Frontend Log Stream** and **Backend Uvicorn/Pytest Log Stream**.
2. **Filter Modes**:
   - **All Levels**: Displays all incoming messages.
   - **Info**: General operation information (`[INFO]`).
   - **Status**: Lifecycle state changes (`[SYSTEM]`, `Initiating`, `Completed`).
   - **Error**: Error tracebacks, exceptions, warnings (`[ERROR]`, `Traceback`, `Exception`).
3. **Interactive Search**: Real-time filtering with yellow highlight markers on matching terms.
4. **Auto-Scroll Behavior**: Automatically scrolls the viewport to the first matching search line when a query is entered.

---

## 2. Pipeline Cancellation & Stop Button Restoration

### A. Frontend Cancellation Flow
1. User clicks **"Stop Run"** button in `ActiveProcessBar` or `UnderstandingPage`.
2. `handleCancelRun` is triggered in `App.tsx`:
   ```typescript
   const handleCancelRun = async () => {
     if (!appState?.run_id) return;
     try {
       logUiEvent(`Sending cancel request for run ${appState.run_id}...`, 'info');
       await cancelRun(appState.run_id);
       await refreshStatus(appState.run_id);
     } catch (err) {
       logUiEvent(`Failed to stop process run: ${err}`, 'error');
     }
   };
   ```
3. API call sends `POST /api/v1/runs/{run_id}/cancel`.

### B. Backend Interruption Hooks
* `backend/src/api/fastapi_app.py`: Endpoint updates `RunState` status to `"stopped"` and resets `active_agent = None`.
* `backend/src/workflows/pipeline.py`: The stage loop inspects `load_run_state(run_id)` before and after each stage. If status is `"stopped"` or `"cancelled"`, execution halts immediately, preserving all completed stage data.

---

## 3. Verification & Validation Steps
1. Start FastAPI server (`restart_fastapi_app.bat` or `python -m uvicorn src.api.fastapi_app:app --port 8080`).
2. Start Vite dev server (`npm run dev`).
3. Upload requirement package and start pipeline execution.
4. Verify log drawer toggle and filtering work.
5. Click **Stop Run** during execution and verify run halts gracefully with status `"stopped"`.
