# Specification: Spec-Kit 023 — Multi-Modal Testing Expansion & Executive Quality Reporting

## 1. Problem Statement
Users required:
1. Seamless navigation across 4 testing phases (UI, API, Performance, Accessibility).
2. Direct inspection of generated Playwright code and dual synthetic datasets without leaving the view.
3. Selective checkbox execution for individual test cases.
4. Exportable PDF and responsive HTML Executive Quality Reports with automated GO / NO-GO recommendations.

## 2. User Stories
- **US-1**: As a QA tester, I want to switch between UI, API, Performance, and Accessibility testing tabs so I can manage all quality dimensions in one place.
- **US-2**: As an automation engineer, I want to view, copy, and download generated Playwright scripts directly from modal viewers.
- **US-3**: As a test lead, I want to select specific test cases using checkboxes and run only that targeted smoke subset in a headed browser window.
- **US-4**: As an executive stakeholder, I want to download a PDF/HTML Executive Quality Scorecard with pass/fail metrics and release recommendations.

## 3. Functional Requirements
1. **Testing Type Tabs**:
   - UI Testing (Active Playwright execution).
   - API Testing (Endpoint assertion test builder).
   - Performance Testing (Latency benchmarks and thinking token metrics).
   - Accessibility Testing (WCAG 2.1 compliance audits).
2. **Interactive Modals**:
   - `PlaywrightScriptModal.tsx`: Monospace code viewer with Copy & Download actions.
   - `TestDataModal.tsx`: Synthetic JSON and CSV data viewer.
3. **Executive Report Generation**:
   - `GET /api/v1/runs/{run_id}/report/pdf`: Generates formatted ReportLab PDF.
   - `GET /api/v1/runs/{run_id}/report/html`: Generates responsive standalone HTML report.

## 4. Acceptance Criteria
- [x] All 4 testing tabs render in the navigation header with proper status badges.
- [x] Test case rows open script and data modals upon button click.
- [x] Selective execution checkboxes filter test runs accurately.
- [x] PDF and HTML reports download directly in the browser.
