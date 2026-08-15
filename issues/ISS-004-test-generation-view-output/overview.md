# ISS-004 · Test Generation — Output Viewer & Per-Case Data Display

**Priority**: 🔴 High  
**Status**: Open  
**Feature Area**: Execution Page → Test Case Table → Script & Data Modals

---

## Problem Statement

After the Test Generation Agent runs, the user needs to:
1. **See the full list of generated test cases** in a structured table with categories
2. **View the generated Playwright script** for each test case inline
3. **Inspect the synthetic test data** for each test case
4. **Manually select which test cases to run** with checkboxes
5. **Execute selected test cases** and see real-time results

---

## Sub-Issues

### ISS-004-A: Test Case Table — Missing "View Script" Confirmation
**Status**: Implemented  
`LivePlaywrightRunner.tsx` has `[< /> View Script]` and `[📊 View Data]` buttons per row.

**Remaining Issue**: The `playwrightScripts` and `syntheticDataset` in `ExecutionPage.tsx` are currently pulling from `appState` — verify the API response populates these correctly.

**Check**:
```typescript
// In ExecutionPage.tsx - confirm these map correctly:
const playwrightScripts = appState?.playwright_scripts || [];
const syntheticDataset = appState?.synthetic_dataset || null;
```

---

### ISS-004-B: Script Viewer Modal — Real Script Content
**Status**: Implemented (PlaywrightScriptModal.tsx)

**Remaining Issue**: The script content shown must be the **actual generated Python code** from the backend, not placeholder text.

**Backend produces** (via `PlaywrightAgent`):
- `playwright_scripts[].script_body` — full Python Playwright code
- `playwright_scripts[].page_objects` — list of Page Object class names
- `playwright_scripts[].discovered_selectors` — dict of selector names to locator strings

**Frontend must render**: `script.script_body` in the code viewer (not fabricated sample code)

---

### ISS-004-C: Synthetic Data Modal — Real Data Records
**Status**: Implemented (TestDataModal.tsx)

**Remaining Issue**: Modal must display `syntheticDataset.test_case_id_mapping[testCase.case_id]` — the records mapped to that specific test case.

---

### ISS-004-D: Category Filter Pills — All 5 Types Must Work
**Status**: Implemented  

**Verify**: `case_type` field on test cases must be one of:
- `Positive` | `Negative` | `Boundary` | `Validation` | `Error-Handling`

Backend normalizes this in `TestCaseAgent._normalize_case_type()`. Confirm front-end filter pills match exactly.

---

### ISS-004-E: Run Selected — Headed Browser Launch
**Status**: Partially Implemented

**Issue**: The "Run {N} Selected" button opens a new browser window. Currently opens a blank placeholder. Must call:
```
POST /api/v1/runs/{run_id}/execute-cases
{ "case_ids": ["TC-001", "TC-005", ...] }
```
and stream real-time output via SSE to the execution status column.

---

## Acceptance Criteria

- [ ] Script modal shows actual Python code from `script_body`
- [ ] Data modal shows actual mapped records from `test_case_id_mapping`
- [ ] All 5 category pills filter the correct test cases
- [ ] Run Selected posts correct `case_ids` to backend
- [ ] Execution status column updates in real-time during run
