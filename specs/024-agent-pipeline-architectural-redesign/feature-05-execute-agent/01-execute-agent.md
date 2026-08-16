# Feature 05: Execute Agent — Selective Execution, Live Logs & Screenshot Evidence

## 1. Overview

The Execute Agent is the **fifth stage** in the QET pipeline. It runs the generated Playwright test scripts against the target application, captures full-page screenshots on both pass and fail, and streams live console logs back to the UI in real-time.

The user has full control over which test cases to run, in what sequence, and can watch execution unfold one-by-one or run all selected cases in batch.

---

## 2. Execution Modes

| Mode | Description |
| :--- | :--- |
| **Sequential (One-by-One)** | Runs scripts in order, pausing to show each script's logs and screenshot before moving to next |
| **Batch** | Runs all selected scripts back-to-back, streaming all logs simultaneously |

---

## 3. User Stories

- **US-1**: As a QA engineer, I see a test case selection table with checkboxes, category filters, and bulk Select All / Clear controls.
- **US-2**: As a QA engineer, I enter the target application URL before running (with a visible URL input field).
- **US-3**: As a QA engineer, I click `[▶ Run Selected (N) — Sequential]` to run cases one by one.
- **US-4**: As a QA engineer, during sequential execution I see the currently running test case highlighted with a "RUNNING" badge and live console logs streaming below it.
- **US-5**: As a QA engineer, after each test case finishes I see its result badge (PASSED/FAILED), execution duration, and a screenshot thumbnail.
- **US-6**: As a QA engineer, I click a screenshot thumbnail to open a full-screen zoom modal with pass/fail status.
- **US-7**: As a QA engineer, I can pause or stop execution at any time.
- **US-8**: As a QA engineer, after all selected cases finish, the `[View Dashboard →]` CTA appears.

---

## 4. Workspace UI Design

```
┌─ Execute Agent ─────────────────────────────────────────────────────────┐
│                                                                         │
│  🌐 Target URL: [https://app.cfa.com/          ]  [Validate URL]        │
│                                                                         │
│  [☑ Select All (12)]  [☐ Clear]  [Pos] [Neg] [Bnd] [Val] [Err]         │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ ☑ TC-POS-001 ✅ PASSED    2.1s   [📸 Screenshot] [Logs ▼]        │  │
│  │ ☑ TC-NEG-002 ✅ PASSED    1.8s   [📸 Screenshot] [Logs ▼]        │  │
│  │ ☑ TC-BND-003 ⏳ RUNNING  ...     [Live logs streaming →]         │  │
│  │   └─ INFO: Navigating to /application                            │  │
│  │   └─ INFO: Filling income field with 0.01                        │  │
│  │   └─ INFO: Asserting error message...                            │  │
│  │ ☐ TC-VAL-004   NOT RUN                                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  [▶ Run Selected (12) — Sequential]  [⏸ Pause]  [⏹ Stop]              │
│                                                                         │
│  ┌─ Bottom CTA (appears after all selected complete) ──────────────┐   │
│  │  ✅ 11/12 PASSED  1 FAILED  [View Dashboard →]                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Functional Requirements

### FR-1: Target URL Configuration
- URL input field shown above the test case table.
- `[Validate URL]` button sends a HEAD request to verify reachability.
- URL is saved to `uploads/{run_id}/execution_config.json`.
- Default: auto-populated from codebase analysis (if start URL discovered).

### FR-2: Test Case Selection for Execution
- Same checkbox + filter controls as Agent 2 (synced selection).
- Pre-selected: cases selected in Agent 2 (can be modified here).
- Deselecting cases marks them as `NOT_RUN` in results.

### FR-3: Sequential Execution with Live Logs
- Each script is launched as a subprocess via `pytest {script_file} --headed`.
- Live stdout/stderr streamed to UI via SSE: `GET /api/v1/runs/{run_id}/execution-stream`.
- Currently running case is highlighted.
- After each case completes, result badge and screenshot thumbnail appear immediately.

### FR-4: Automated Screenshot Evidence
- `conftest.py` fixture captures `{case_id}_PASSED.png` or `{case_id}_FAILED.png`.
- Both screenshots saved to `uploads/{run_id}/artifacts/screenshots/`.
- Screenshot dimensions: full-page width × full page height.
- Screenshots shown as thumbnail in the test row immediately after execution.

### FR-5: Screenshot Zoom Modal
- Click thumbnail opens modal.
- Modal shows: case ID, case title, result status, timestamp, full-size screenshot.
- `[Download Screenshot]` and `[Close]` buttons.
- Modal is keyboard-dismissible (Escape key).

### FR-6: Pause & Stop Controls
- `[⏸ Pause]`: Stops launching next script after current one finishes.
- `[⏹ Stop]`: Kills the currently running subprocess and marks it STOPPED.
- Paused state can be resumed with `[▶ Resume]`.

### FR-7: Execution Result Recording
- All results saved to `uploads/{run_id}/artifacts/execution_results.json`.
- Each record: `{ case_id, status, duration_ms, screenshot_path, error_message, logs }`.

### FR-8: Bottom Dashboard CTA
- Appears only when all selected cases have a final status (PASSED / FAILED / STOPPED / ERROR).
- Shows summary: `N/M PASSED, X FAILED`.
- `[View Dashboard →]` advances left-rail focus to Agent 6.

---

## 6. Execution Status States

| Status | Badge Color | Meaning |
| :--- | :--- | :--- |
| `NOT_RUN` | Gray | Not selected or not yet executed |
| `QUEUED` | Blue | Selected but waiting for its turn |
| `RUNNING` | Amber (pulsing) | Currently executing |
| `PASSED` | Green | All assertions passed |
| `FAILED` | Red | At least one assertion failed |
| `ERROR` | Red (outline) | Script crashed unexpectedly |
| `STOPPED` | Gray (outline) | User manually stopped |

---

## 7. Backend API Contracts

```
POST /api/v1/runs/{run_id}/execute
  Body: { case_ids: string[], mode: "sequential" | "batch", target_url: string }
  Response: SSE stream → { event: "case_started" | "case_log" | "case_completed", data: {...} }

GET /api/v1/runs/{run_id}/execution-stream
  Response: SSE stream of live logs and status updates

POST /api/v1/runs/{run_id}/execute/pause
POST /api/v1/runs/{run_id}/execute/stop
POST /api/v1/runs/{run_id}/execute/resume

GET /api/v1/runs/{run_id}/artifacts/screenshots/{filename}
  Response: Binary image file

GET /api/v1/runs/{run_id}/execution-results
  Response: { results: ExecutionResult[] }
```

---

## 8. Acceptance Criteria
- [ ] URL input field shown, validate button works.
- [ ] Checkbox selection synced from Agent 2 selection.
- [ ] Sequential execution runs one case at a time with live log streaming.
- [ ] Screenshot thumbnails appear immediately after each case completes.
- [ ] Both PASSED and FAILED screenshots saved and viewable.
- [ ] Screenshot zoom modal opens with full-size image and download option.
- [ ] Pause and Stop controls work correctly.
- [ ] Execution results JSON saved with complete metadata per case.
- [ ] Dashboard CTA appears only after all selected cases complete.
