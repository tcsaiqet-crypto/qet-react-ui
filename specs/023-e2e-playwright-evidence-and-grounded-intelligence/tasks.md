# Tasks: Feature 023 — End-to-End Playwright Automation, Evidence Capture, and Grounded Intelligence

## Task Matrix

| Task ID | Component | Description | Status |
| :--- | :--- | :--- | :--- |
| **TASK-01** | `UnderstandingPage.tsx` | Implement UI/API/Perf/A11y testing tabs with "Coming Soon" badges | ✅ Complete |
| **TASK-02** | `UnderstandingPage.tsx` | Add dismissible `[X]` toggle on inline API key exhaustion banner | ✅ Complete |
| **TASK-03** | `UnderstandingPage.tsx` | Add bottom "Next Step: Run Test Generation Agent" progression CTA | ✅ Complete |
| **TASK-04** | `PlaywrightAgent.py` | Generate modular standalone Python script per test case | ✅ Complete |
| **TASK-05** | `PlaywrightAgent.py` | Inject automatic full-page screenshot capture on both PASS and FAIL | ✅ Complete |
| **TASK-06** | `TestDataAgent.py` | Implement dynamic synthetic data matrix for positive & negative flows | ✅ Complete |
| **TASK-07** | `LivePlaywrightRunner.tsx` | Implement multi-select checkboxes, Select All, and Clear Selection | ✅ Complete |
| **TASK-08** | `LivePlaywrightRunner.tsx` | Implement dynamic `[🚀 Proceed & Run Selected]` button | ✅ Complete |
| **TASK-09** | `LivePlaywrightRunner.tsx` | Support sequential (one-by-one) execution with live log streaming | ✅ Complete |
| **TASK-10** | `ReportAgent.py` | Generate Allure artifacts (`allure-results/`), HTML and PDF reports | ✅ Complete |
| **TASK-11** | `ExecutionPage.tsx` | Connect screenshot modal viewer and quality report artifact downloads | ✅ Complete |
| **TASK-12** | `HomeUploadPage.tsx` | Remove redundant banners and enforce collapsible in-lane flow | ✅ Complete |

---

## Verification & Validation Commands

```bash
# 1. Frontend TypeScript Compilation
npm run build

# 2. Frontend Vitest Unit & Integration Suite
npx vitest run

# 3. Backend Pytest Verification
pytest backend/tests/ -v
```
