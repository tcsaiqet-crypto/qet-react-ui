# ISS-010 · Execution — Selective Test Case Run & Real-Time Result Viewer

**Priority**: 🔴 High  
**Status**: In Progress  
**Feature Area**: Execution Page → LivePlaywrightRunner → Result Viewer

---

## Problem Statement

The current execution flow:
1. ✅ Test cases show in table with category pills
2. ✅ Multi-select checkboxes added
3. ✅ "Run {N} Selected" button added
4. ❌ Clicking "Run Selected" opens a blank new window — not wired to backend
5. ❌ Execution status (PASSED/FAILED/RUNNING) not updating in real-time
6. ❌ No screenshot gallery after execution
7. ❌ No console output per test case

---

## Sub-Features Required

### ISS-010-A: Backend Execute API
**File**: `backend/src/api/fastapi_app.py`

```python
@router.post("/runs/{run_id}/execute-cases")
async def execute_selected_cases(
    run_id: str, 
    body: ExecuteCasesRequest
) -> ExecuteCasesResponse:
    """
    Execute a specific subset of generated test cases in headed Playwright.
    Launches playwright in headed mode for each selected case sequentially.
    Returns status immediately; results streamed via SSE.
    """
```

**Schema** (`schemas/contracts.py`):
```python
class ExecuteCasesRequest(BaseModel):
    case_ids: List[str]  # e.g. ["TC-POS-001", "TC-NEG-005"]
    headed: bool = True  # Open browser window
    timeout_seconds: int = 30

class ExecuteCasesResult(BaseModel):
    case_id: str
    status: Literal["PASSED", "FAILED", "ERROR", "SKIPPED"]
    duration_ms: int
    screenshot_path: Optional[str]
    console_output: List[str]
    error_message: Optional[str]
```

### ISS-010-B: SSE Real-Time Stream
**File**: `backend/src/api/fastapi_app.py`

```python
@router.get("/runs/{run_id}/execution-stream")
async def execution_stream(run_id: str):
    """Server-Sent Events for live execution results."""
    async def event_generator():
        while not execution_complete:
            result = get_latest_result()
            if result:
                yield f"data: {result.json()}\n\n"
            await asyncio.sleep(0.5)
    return EventSourceResponse(event_generator())
```

### ISS-010-C: Frontend SSE Consumer
**File**: `src/components/execution/LivePlaywrightRunner.tsx`

```typescript
const startExecution = async (caseIds: string[]) => {
  // 1. POST to trigger execution
  await fetch(`/api/v1/runs/${runId}/execute-cases`, {
    method: 'POST',
    body: JSON.stringify({ case_ids: caseIds })
  });
  
  // 2. Open SSE stream for results
  const eventSource = new EventSource(
    `/api/v1/runs/${runId}/execution-stream`
  );
  
  eventSource.onmessage = (event) => {
    const result = JSON.parse(event.data);
    updateTestCaseStatus(result.case_id, result.status);
  };
};
```

### ISS-010-D: Screenshot Gallery
After execution, show thumbnails of screenshots below each test case row.
- Click thumbnail → full-screen preview modal
- Download screenshot button

### ISS-010-E: Per-Test Console Output Accordion
Each completed test row expands to show:
- Step-by-step console log from Playwright
- Timing breakdown per step
- Error stacktrace if failed

---

## Acceptance Criteria

- [ ] Clicking "Run {N} Selected" calls `POST /execute-cases` API
- [ ] Status badges update in real-time via SSE
- [ ] Screenshots appear below each row after completion
- [ ] Console output accordion works
- [ ] PASSED/FAILED count shown in summary bar
- [ ] Export results as JSON + HTML report button
