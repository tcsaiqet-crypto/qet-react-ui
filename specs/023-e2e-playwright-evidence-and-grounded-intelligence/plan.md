# Implementation Plan: Feature 023 — End-to-End Playwright Automation, Evidence Capture, and Grounded Intelligence

## 1. Architectural Strategy

Feature 023 establishes an end-to-end integration between requirement analysis, modular Playwright code synthesis, interactive execution with live evidence, and executive Allure reporting.

```
┌─────────────────────────┐
│ UnderstandingAgent      │ ──► Extracts Grounded Selectors & UI Flows
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ TestCaseAgent           │ ──► Generates Positive, Negative, Boundary Cases
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ TestDataAgent           │ ──► Mocks Realistic Synthetic Records per Case
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ PlaywrightAgent         │ ──► Builds Modular Python Scripts & Screenshot Hooks
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ LivePlaywrightRunner    │ ──► Checkbox Select, Sequential/Batch Run, Logs, Screenshots
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ ReportAgent             │ ──► Generates Allure Artifacts, HTML & PDF Dashboards
└─────────────────────────┘
```

---

## 2. File & Component Allocation

### Frontend Layer:
1. `src/components/UnderstandingPage.tsx`:
   - Testing Domain switcher tabs (UI Testing active, API/Performance/Accessibility Coming Soon).
   - Dismissible API Key Exhaustion recovery banner with inline retry.
   - Grounded selectors rendering and bottom "Run Test Generation Agent" CTA.
2. `src/components/execution/LivePlaywrightRunner.tsx`:
   - Checkbox selection: individual selection, Select All, Clear Selection.
   - Dynamic "Proceed & Run Selected ({N})" button.
   - One-by-one sequential execution or batch execution.
   - Inline screenshot badges and modal viewers.
3. `src/components/execution/PlaywrightScriptModal.tsx`:
   - Displays dedicated Python Playwright script per test case with copy and download actions.
4. `src/components/execution/TestDataModal.tsx`:
   - Displays per-test case synthetic data records with schema badges.
5. `src/components/ExecutionPage.tsx`:
   - Quality report download links (HTML and PDF).
   - Live execution status coordination and screenshot gallery.

### Backend Layer:
1. `backend/src/agents/understanding_agent.py`:
   - AST-based component discovery with selector extraction.
2. `backend/src/agents/test_case_agent.py`:
   - Categorization into Positive, Negative, Boundary, Validation, Error Handling.
3. `backend/src/agents/test_data_agent.py`:
   - Generation of distinct, non-generic synthetic records for every test case.
4. `backend/src/agents/playwright_agent.py`:
   - Synthesis of modular `tests/test_TC_xxx.py` files with automated screenshot capture on pass and fail.
5. `backend/src/agents/report_agent.py`:
   - Allure artifact compilation, HTML report generation, and PDF ReportLab creation.
6. `backend/src/api/fastapi_app.py`:
   - Endpoints for selective case execution, SSE live logs, and artifact downloads.

---

## 3. Phased Rollout Sequence

- **Phase 1 (Grounded Understanding)**: Wire AST selector extraction and UI Testing domain tabs.
- **Phase 2 (Synthesis & Data Binding)**: Generate modular Python scripts and synthetic data bindings per test case.
- **Phase 3 (Selective Runner & Screenshot Evidence)**: Implement checkbox controls, sequential runner, and screenshot capture on pass/fail.
- **Phase 4 (Reporting & Bottom CTAs)**: Deliver Allure reporting, HTML/PDF downloads, and standardized in-lane bottom progression cards.
