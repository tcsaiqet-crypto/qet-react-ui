# ISS-013 · AI Script Auto-Fix — Backend Wiring & Apply Flow

**Priority**: 🔴 High  
**Status**: Open  
**Feature Area**: Execution → AIScriptModifierModal → Backend AI Fix Service

---

## Problem Statement

`AIScriptModifierModal.tsx` renders a code editor where users can request AI-powered modifications to failing Playwright scripts. The modal calls `onRequestModification(instruction)` and `onApplyFix(modifiedCode)` — but these are currently **either stubbed out or fail silently** because the backend endpoints need validation.

---

## Current State

| Component | Status |
| --- | --- |
| `AIScriptModifierModal.tsx` | ✅ UI fully built |
| `ExecutionPage.tsx` → `requestAIScriptModification()` | ⚠️ API client function exists |
| `POST /api/v1/runs/{run_id}/ai-script-fix` | ❓ Needs verification in fastapi_app.py |
| `applyAIScriptFix()` — writes to disk | ❓ Needs verification |
| Error handling in modal | ❌ Shows generic error on failure |

---

## Functional Requirements

### FR-013-A: Verify Backend Fix Endpoint
File: `backend/src/api/fastapi_app.py`

```
POST /api/v1/runs/{run_id}/ai-script-fix
Body: { test_case_id, script_filename, instruction, failure_log }
Response: { modified_code, explanation, confidence_score }
```

The `ai_test_analysis_service.py` should route this to the LLM service.

### FR-013-B: Apply Fix — Write Back to Disk
```
POST /api/v1/runs/{run_id}/ai-script-apply
Body: { test_case_id, script_filename, modified_code }
```
- Overwrites the script file at `uploads/{run_id}/playwright_scripts/{script_filename}`
- Triggers an immediate re-run of that test case

### FR-013-C: Modal UX Improvements
Current: Modal shows `instruction` input + generate button + code diff view

Add:
- **Confidence Score** chip: `🟢 92% confidence` 
- **Explanation** panel: collapsible explanation of what the AI changed
- **Diff View**: side-by-side before/after with highlighted changes
- **Re-run after apply**: checkbox `"Re-run this test case after applying fix"`

### FR-013-D: Failure Log Auto-Population
When opening the modal from a failed test case:
- Auto-populate `failureLog` with the test case's `error_message` + console output
- This gives the AI context to generate a targeted fix

---

## Files to Modify

| File | Change |
| --- | --- |
| `backend/src/api/fastapi_app.py` | Verify/add AI fix and apply endpoints |
| `backend/src/services/ai_test_analysis_service.py` | Enhance script fix logic |
| `src/components/execution/AIScriptModifierModal.tsx` | Add confidence, explanation, diff view |
| `src/components/execution/LivePlaywrightRunner.tsx` | Pass failure log to modifier modal |
| `src/services/apiClient.ts` | Verify `requestAIScriptModification`, `applyAIScriptFix` |
