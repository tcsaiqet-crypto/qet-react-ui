# Feature 06: Dashboard Agent — Allure Reports, Results, Screenshots & Runtime JSON

## 1. Overview

The Dashboard Agent is the **sixth and final stage** in the QET pipeline. It aggregates all execution results, generates an Allure-compatible test report, and presents an interactive quality dashboard with:
- Pass/Fail summary metrics
- Per-test-case drilldown with scripts, screenshots, runtime JSON, and console logs
- Downloadable HTML, PDF, and Allure ZIP reports
- Screenshot gallery per test case (positive + negative evidence)
- Runtime JSON viewer showing data recorded during script execution

---

## 2. Dashboard Sections

| Section | Description |
| :--- | :--- |
| **Executive Summary** | Pass rate, total cases, passed, failed, errors, total duration |
| **Results Table** | Per-case drilldown with all artifacts |
| **Screenshot Gallery** | Grid of all captured screenshots with pass/fail labels |
| **Report Downloads** | HTML report, PDF report, Allure ZIP |
| **Allure Report Embed** | Inline rendered Allure HTML in an iframe |

---

## 3. User Stories

- **US-1**: As a QA lead, I see an executive summary with pass rate percentage, total test count, passed count, failed count, and overall execution duration.
- **US-2**: As a QA engineer, I see a per-test-case results table with status badge, duration, and action buttons for each artifact.
- **US-3**: As a QA engineer, I click `[📸 Screenshots]` on a test case row to open a modal showing both the PASSED and FAILED screenshots side-by-side (where available).
- **US-4**: As a QA engineer, I click `[🐍 View Script]` on any result row to open the Python Playwright script that executed for that case.
- **US-5**: As a QA engineer, I click `[📊 View Data]` on any result row to see the synthetic data record that was used during execution.
- **US-6**: As a QA engineer, I click `[📋 View Logs]` on any result row to see the full console output from Playwright for that specific test case.
- **US-7**: As a QA engineer, I click `[{ } Runtime JSON]` on any result row to see the JSON data values that were injected and recorded during script execution.
- **US-8**: As a QA lead, I can download a standalone HTML quality report, a PDF executive summary, and a full Allure results ZIP.
- **US-9**: As a QA lead, I can view the Allure report rendered inline inside the application in an iframe.

---

## 4. Dashboard UI Design

```
┌─ Dashboard Agent ────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌─ Executive Summary ────────────────────────────────────────────────┐  │
│  │  Pass Rate: 91.7%       Total: 12    Passed: 11    Failed: 1       │  │
│  │  Duration:  34.2s       Run ID: RUN-20260816-024201-XXXX           │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  [⬇ HTML Report]  [⬇ PDF Report]  [⬇ Allure ZIP]  [🔗 View Allure]    │
│                                                                          │
│  ── Test Case Results ──────────────────────────────────────────────── │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ TC-POS-001 ✅ PASSED  2.1s                                       │  │
│  │  [📸 Screenshots] [🐍 Script] [📊 Data] [📋 Logs] [{ } JSON]    │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ TC-NEG-002 ✅ PASSED  1.8s                                       │  │
│  │  [📸 Screenshots] [🐍 Script] [📊 Data] [📋 Logs] [{ } JSON]    │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ TC-ERR-005 ❌ FAILED  4.2s                                       │  │
│  │  Error: Locator '[data-testid=redirect-btn]' not found (timeout) │  │
│  │  [📸 Screenshots] [🐍 Script] [📊 Data] [📋 Logs] [{ } JSON]    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ── Screenshot Gallery ─────────────────────────────────────────────── │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                    │
│  │ TC-POS-001   │ │ TC-NEG-002   │ │ TC-ERR-005   │                    │
│  │ ✅ PASSED    │ │ ✅ PASSED    │ │ ❌ FAILED    │                    │
│  │ [thumbnail]  │ │ [thumbnail]  │ │ [thumbnail]  │                    │
│  └──────────────┘ └──────────────┘ └──────────────┘                    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Functional Requirements

### FR-1: Executive Summary
- Calculated from `execution_results.json`.
- Pass rate = `(passed / total) × 100`, rounded to 1 decimal.
- Duration = sum of all case `duration_ms` values.
- Color coded: ≥90% green, 70–89% amber, <70% red.

### FR-2: Per-Case Results Table
- One row per executed test case.
- Columns: case ID, title, category badge, status badge, duration, artifact action buttons.
- Expandable row: shows full error message (if FAILED), stack trace excerpt.

### FR-3: Screenshot Modal (Per Test Case)
- `[📸 Screenshots]` opens a modal for that specific case.
- Shows two panels side-by-side:
  - **Left**: "PASSED State Screenshot" (or "Not captured" if test failed immediately)
  - **Right**: "FAILED State Screenshot" (or "Not applicable" if test passed)
- Full-size zoom on click.
- `[Download]` button for each individual screenshot.

### FR-4: Runtime JSON Viewer
- `[{ } Runtime JSON]` opens a modal showing the JSON data payload that was injected during execution.
- Formatted with syntax highlighting (field names, values, types).
- Shows only the data actually used by that test case's script.
- `[Copy JSON]` and `[Download JSON]` buttons.

### FR-5: Script Viewer (from Results)
- Same modal as in Agent 4, but read-only (no regenerate option from results view).

### FR-6: Logs Viewer
- `[📋 View Logs]` opens a modal showing the raw Playwright console output for that case.
- Filtered to only that case's subprocess output.
- Searchable text (Ctrl+F or search box).
- Download as `.txt`.

### FR-7: Allure Report Generation
- Generate `allure-results/` directory with:
  - `{uuid}-result.json` per test case
  - `{uuid}-container.json` per test case suite
  - `{uuid}-attachment.png` for each screenshot
- `allure-results/` zipped to `quality_report_allure.zip`
- Generate standalone `quality_report.html` (self-contained, no server needed).
- Generate `quality_report.pdf` via ReportLab with executive summary table, pass/fail charts, and per-case details.

### FR-8: Inline Allure Report
- `[🔗 View Allure]` opens a modal with an `<iframe>` rendering `quality_report.html`.
- The iframe has fixed height with scrolling enabled.
- Fallback: if iframe fails, show a direct download link.

---

## 6. Artifacts Produced

| Artifact | Format | Path |
| :--- | :--- | :--- |
| Allure results | Directory | `uploads/{run_id}/artifacts/allure-results/` |
| Allure ZIP | ZIP | `uploads/{run_id}/artifacts/quality_report_allure.zip` |
| HTML Report | HTML | `uploads/{run_id}/artifacts/quality_report.html` |
| PDF Report | PDF | `uploads/{run_id}/artifacts/quality_report.pdf` |
| Screenshots | PNG | `uploads/{run_id}/artifacts/screenshots/*.png` |
| Execution JSON | JSON | `uploads/{run_id}/artifacts/execution_results.json` |
| Runtime data per case | JSON | `uploads/{run_id}/artifacts/runtime_data/{case_id}.json` |

---

## 7. Backend API Contracts

```
POST /api/v1/runs/{run_id}/generate-report
  Response: SSE stream → { event: "progress" | "completed" }

GET /api/v1/runs/{run_id}/artifacts/quality_report.html
GET /api/v1/runs/{run_id}/artifacts/quality_report.pdf
GET /api/v1/runs/{run_id}/artifacts/quality_report_allure.zip
GET /api/v1/runs/{run_id}/artifacts/screenshots/{filename}
GET /api/v1/runs/{run_id}/artifacts/runtime_data/{case_id}
  Response: { runtime_json: object }
```

---

## 8. Acceptance Criteria
- [ ] Executive summary shows correct pass rate, total, passed, failed, duration.
- [ ] Per-case results table renders all executed cases with status and duration.
- [ ] Screenshot modal shows PASSED and FAILED screenshots side-by-side per case.
- [ ] Runtime JSON viewer shows data with syntax highlighting and copy/download.
- [ ] Logs viewer shows only that case's console output with search.
- [ ] Allure HTML report generated and rendered in iframe.
- [ ] HTML and PDF reports downloadable.
- [ ] Allure ZIP downloadable.
- [ ] Screenshot gallery grid renders all captured screenshots.
