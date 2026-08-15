# ISS-012 · Report Agent — Download HTML & PDF in UI

**Priority**: 🔴 High  
**Status**: Open  
**Feature Area**: Execution Page → Report Download

---

## Problem Statement

The `ReportAgent` (Phase 6) generates:
- `uploads/{run_id}/artifacts/quality_report.html` — Standalone HTML with inline CSS
- `uploads/{run_id}/artifacts/quality_report.pdf` — PDF via ReportLab

But the **UI has no button to download these**. Users have no way to access the generated reports from inside the application.

---

## Current State

| What | State |
| --- | --- |
| `ReportAgent.run()` | ✅ Generates HTML & PDF |
| File saved to disk | ✅ `uploads/{run_id}/artifacts/` |
| API endpoint to serve files | ❌ Not implemented |
| UI download button | ❌ Not implemented |
| Run history links to artifacts | ❌ Not implemented |

---

## Functional Requirements

### FR-012-A: Report Download API Endpoints
```
GET /api/v1/runs/{run_id}/artifacts/quality_report.html
GET /api/v1/runs/{run_id}/artifacts/quality_report.pdf
```
- Serve file as `FileResponse` with correct content-type
- Return 404 with message `"Report not yet generated — run pipeline first"` if file missing

### FR-012-B: Download Buttons in Execution Page

In `ExecutionPage.tsx`, after pipeline completes, show:
```
┌─ Generated Reports ───────────────────────────────────────┐
│  [⬇ Download HTML Report]  [⬇ Download PDF Report]       │
│  [🔗 Open HTML in New Tab]                               │
└───────────────────────────────────────────────────────────┘
```

### FR-012-C: Run History — Report Links

In `RunsDashboard.tsx`, each completed run card shows:
```
📄 Quality Report Available  [Download HTML] [Download PDF]
```
Only show if `artifacts` folder contains the files.

### FR-012-D: Report Preview in Execution Page

Add `reports` tab in `ExecutionPage.tsx` tabs bar:
```
[Runner] [Screenshots] [Multi-Level] [AI Analysis] [📄 Reports]
```
When `Reports` tab active: embed HTML report in an `<iframe>` inside the tab panel.

---

## Files to Modify

| File | Change |
| --- | --- |
| `backend/src/api/fastapi_app.py` | Add report artifact serve endpoints |
| `src/components/ExecutionPage.tsx` | Add Reports tab + download buttons |
| `src/components/RunsDashboard.tsx` | Add report links in run cards |
| `src/services/apiClient.ts` | Add `getReportUrl(runId, type)` helpers |
