# ISS-004 · Plan — Test Generation Output Viewer

## Phase 1: Fix Backend → Frontend Data Wiring (ISS-004-A, B, C)

### Step 1.1 — Verify AppState Type Mapping
File: `src/types.ts`

Confirm `AppState` has:
```typescript
playwright_scripts?: PlaywrightScript[];
synthetic_dataset?: SyntheticDataset;
test_suite?: TestSuite;
```

### Step 1.2 — Verify ExecutionPage Props
File: `src/components/ExecutionPage.tsx`

```typescript
// Must pass actual data:
<LivePlaywrightRunner
  testCases={appState?.test_suite?.test_cases || []}
  playwrightScripts={appState?.playwright_scripts || []}
  syntheticDataset={appState?.synthetic_dataset || null}
/>
```

### Step 1.3 — Verify PlaywrightScriptModal Content
File: `src/components/execution/PlaywrightScriptModal.tsx`

The modal `codeContent` prop must receive `script.script_body` not a fabricated string.

### Step 1.4 — Verify TestDataModal Records
File: `src/components/execution/TestDataModal.tsx`

Modal must receive:
```typescript
records={syntheticDataset?.test_case_id_mapping?.[testCase.case_id] || []}
```

---

## Phase 2: Execute Selected Cases Backend API (ISS-004-E)

### Step 2.1 — Add API Endpoint
File: `backend/src/api/fastapi_app.py`

```python
@router.post("/runs/{run_id}/execute-cases")
async def execute_selected_cases(run_id: str, body: ExecuteCasesRequest):
    """Execute a selective subset of test cases in headed Playwright."""
    ...
```

### Step 2.2 — Wire to LivePlaywrightRunner
File: `src/components/execution/LivePlaywrightRunner.tsx`

Replace placeholder `window.open()` with real API call:
```typescript
const response = await fetch(`/api/v1/runs/${runId}/execute-cases`, {
  method: 'POST',
  body: JSON.stringify({ case_ids: selectedCases })
});
```

---

## Phase 3: SSE Real-Time Execution Status

### Step 3.1 — Add SSE Event Stream
File: `backend/src/api/fastapi_app.py`

```python
@router.get("/runs/{run_id}/execution-stream")
async def execution_stream(run_id: str):
    """Server-Sent Events stream for live test execution results."""
    ...
```

### Step 3.2 — Subscribe in LivePlaywrightRunner
Use `EventSource` to stream results into the status column in real-time.
