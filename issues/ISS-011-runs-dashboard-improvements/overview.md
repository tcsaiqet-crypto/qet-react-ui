# ISS-011 · Runs Dashboard — Delete, Filter & Run Detail View

**Priority**: 🟡 Medium  
**Status**: Open  
**Feature Area**: Runs Dashboard (RunsDashboard.tsx)

---

## Problem Statement

The current `RunsDashboard` shows previous runs as cards with an "Open" button. It is missing:

1. **Delete Run** — No ability to remove old runs
2. **Status Filter** — Cannot filter runs by `completed`, `failed`, `running`
3. **Run Detail Page** — Clicking a run only loads it into the workspace; no dedicated read-only summary view
4. **Search** — Cannot search by run ID or date
5. **Sort** — No sort by date, status, or number of test cases

---

## Functional Requirements

### FR-011-A: Delete Run Button
- Each run card gets a `[Delete]` button (trash icon)
- Confirmation dialog: "Delete run RUN-xxx? This removes all generated files."
- API: `DELETE /api/v1/runs/{run_id}`
- On success: remove from list without full reload

### FR-011-B: Status Filter Pills
```
[All (12)] [Completed (8)] [Failed (2)] [Running (1)] [Draft (1)]
```
- Filters based on `run.status` field returned by `listRuns()`
- Filter pills persist in state (not URL)

### FR-011-C: Search Box
- Searches across `run_id`, `created_at` date string
- Debounced 300ms
- Clear button (×)

### FR-011-D: Sort Controls
- Sort by: `Date Created (Newest)`, `Date Created (Oldest)`, `Status`, `Test Case Count`
- Default: newest first

### FR-011-E: Run Summary Side Panel
- When clicking run card → expand an inline accordion below showing:
  - Run ID, Status, Created At, File count, Test case count, Pass rate
  - Links to generated report artifacts (HTML, PDF) if available
  - "Open in Workspace" button

---

## Files to Modify

| File | Change |
| --- | --- |
| `src/components/RunsDashboard.tsx` | Add filter pills, search, sort, delete button, inline summary |
| `src/services/apiClient.ts` | Add `deleteRun(runId)` |
| `backend/src/api/fastapi_app.py` | Add `DELETE /api/v1/runs/{run_id}` endpoint |
