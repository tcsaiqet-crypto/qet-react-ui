# Allure & Rich Quality Reporting Dashboard Specification

## 1. Executive Reporting Objectives

1. Generate standalone **Allure-compatible test execution artifacts** (`allure-results/`).
2. Provide an interactive in-browser dashboard with pass/fail metrics, step-by-step traces, execution duration, and screenshot attachments.
3. Export comprehensive HTML reports and ReportLab PDF documents for stakeholder distribution.

---

## 2. Allure Integration Architecture

```
Playwright Execution
       │
       ▼
pytest --alluredir=uploads/{run_id}/artifacts/allure-results
       │
       ├── {uuid}-result.json
       ├── {uuid}-container.json
       └── {uuid}-attachment.png (Screenshots on Pass & Fail)
       │
       ▼
Allure HTML Generation / Embedded React Dashboard
```

---

## 3. Dashboard UI Drilldown Features

```
┌─ Quality & Execution Report ──────────────────────────────────────────────┐
│  Pass Rate: 91.7%   |   Total: 12   |   Passed: 11   |   Failed: 1        │
│  [Download HTML Report]   [Download PDF Report]   [Open Allure Dashboard] │
├───────────────────────────────────────────────────────────────────────────┤
│  Test Case Results & Evidence Drilldown:                                  │
│                                                                           │
│  ▶ TC-POS-001  Login Authentication       [PASSED 2.1s]   [📸 Screenshot] │
│    ├── Step 1: Navigate to /login (0.4s)                                  │
│    ├── Step 2: Fill credentials (0.8s)                                    │
│    └── Step 3: Assert dashboard visible (0.9s)                            │
│                                                                           │
│  ▼ TC-ERR-005  Session Expiry Handling    [FAILED 4.2s]   [📸 Screenshot] │
│    ├── Step 1: Invalidate token (0.2s)                                    │
│    └── Step 2: Expected redirect failed (Timeout 4.0s)                   │
│        └── Error: Locator '#login-card' not found                         │
│        └── [View Failure Screenshot Modal]                                │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Report Artifact Endpoints

- `GET /api/v1/runs/{run_id}/artifacts/quality_report.html`: Download standalone HTML dashboard.
- `GET /api/v1/runs/{run_id}/artifacts/quality_report.pdf`: Download structured PDF executive summary.
- `GET /api/v1/runs/{run_id}/artifacts/screenshots/{filename}`: Serve individual test evidence screenshots.
