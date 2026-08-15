# Console Logs UI and Pipeline Control Integration Guide

This document guides developers through the features, design changes, and backend changes introduced to support custom log levels, search-highlight auto-scrolling, inline window placement, and pipeline execution controls (Stop buttons).

---

## 1. Feature Overview

1. **Stop Execution Capability**:
   - Allows users to abort active runs at any stage.
   - Preserves all data from completed stages, keeping them fully visible in the UI.
2. **Unified Logs Interface**:
   - Integrates the console log drawer directly into the main container flow (next to the left-hand agent rail and below page contents).
   - Removed screen-overlapping `fixed` overlays.
   - Aligns with the application's color theme palette (`light` and `dark` modes).
3. **Log Level Filtering**:
   - Filter dropdown options: **All Levels**, **Info**, **Status** (system lifecycle steps), and **Error**.
4. **Search and Auto-Scroll**:
   - An input field to search messages. Matches are highlighted dynamically in yellow.
   - The UI automatically scrolls to the first match as the user types.

---

## 2. Codebase Reference & Changes

### A. Backend

#### API Cancellation Endpoint
* **File**: `backend/src/api/fastapi_app.py`
* **Changes**: Added a POST endpoint to transition the run status to `"stopped"`:
  ```python
  @app.post("/api/v1/runs/{run_id}/cancel")
  def cancel_run(run_id: str):
      state = load_run_state(run_id)
      if not state:
          raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
      state.status = "stopped"
      state.active_agent = None
      save_run_state(state)
      return {"status": "stopped", "run_id": run_id}
  ```

#### Pipeline Interruption Check
* **File**: `backend/src/workflows/pipeline.py`
* **Changes**: In the `run_from` loop, we now query `load_run_state` before and after each stage. If status transitions to `"stopped"` or `"cancelled"`, we break the loop and return the state, saving completed stages:
  ```python
  for stage in self.STAGES[self.STAGES.index(start_stage):]:
      from src.services.run_state_service import load_run_state
      latest_state = load_run_state(state.run_id)
      if latest_state and latest_state.status in ("stopped", "cancelled"):
          state.status = "stopped"
          state.active_agent = None
          return state
      
      state = self._execute_stage(stage, state)
      # ... repeat check after execution
  ```

---

### B. Frontend

#### API Client Connection
* **File**: `src/services/apiClient.ts`
* **Changes**: Added `cancelRun` to communicate with the cancel endpoint:
  ```typescript
  export async function cancelRun(runId: string): Promise<{ status: string; run_id: string }> {
    const res = await fetch(`${API_BASE_URL}/runs/${runId}/cancel`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to stop/cancel run: ${res.statusText}`);
    return res.json();
  }
  ```

#### Layout Integration
* **File**: `src/App.tsx`
* **Changes**: Moved `<ConsoleLogDrawer>` inside the main flex content column (just below the active tab content panels and next to `AgentPipelineRail`), and wired up `handleCancelRun` to pass to child components:
  ```tsx
  <ActiveProcessBar appState={appState} onCancelRun={handleCancelRun} />
  <UnderstandingPage appState={appState} onRefreshStatus={refreshStatus} onCancelRun={handleCancelRun} />
  <ConsoleLogDrawer ... />
  ```

#### UI Panel Customization (ConsoleLogDrawer)
* **File**: `src/components/ConsoleLogDrawer.tsx`
* **Changes**: 
  - Restyled container using `w-full mt-6 border shadow-sm rounded-xl` to lay inline statically rather than float.
  - Added filter dropdowns and a search bar in the header block.
  - Implemented auto-scroll logic inside a `useEffect` looking up elements matching `id={`log-line-${idx}`}`:
    ```typescript
    useEffect(() => {
      if (searchTerm.trim() !== '') {
        const firstMatchIdx = filteredLogs.findIndex(log => ...);
        if (firstMatchIdx !== -1) {
          document.getElementById(`log-line-${firstMatchIdx}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }, [searchTerm, filter, logType, filteredLogs.length]);
    ```

---

## 3. Merging & Testing Guide

1. Ensure the backend is started using `.\restart_fastapi_app.bat` (this runs Uvicorn with `--reload-exclude "uploads"` to prevent file-writing restarts).
2. Start the Vite dev server (`npm run dev`).
3. Upload a codebase ZIP file and start analysis.
4. Click **Stop Run** on either the header progress strip or **Stop Execution** in the AI Understanding card. Verify that the UI registers a `"stopped"` status and leaves previous stages visible.
5. In the logs section, filter by **Error** or type search text (e.g. `Loaded`) to confirm automatic highlighting and scrolling.
