# Specification: Feature 023 — End-to-End Playwright Automation, Evidence Capture, and Grounded Intelligence

## 1. Problem Statement
1. **Uncertain Selector Grounding**: Requirements analysis must strictly derive UI elements and workflows from genuine codebase ASTs and uploaded reference specifications rather than generic guesses.
2. **Dedicated Script Isolation**: QA teams require each test case (Positive, Negative, Boundary, Validation, Error Handling) to possess its own distinct, standalone Python Playwright script that can be independently inspected and executed.
3. **Automated Visual Evidence**: Test executions must automatically capture full-page screenshot evidence on both success (`PASSED`) and failure (`FAILED`) conditions.
4. **Interactive Execution Control**: Testers require multi-case selection (Select All, Clear, select 1 or 2), sequential (one-by-one) or batch runs, and real-time streaming console logs.
5. **Quality & Allure Reporting**: Stakeholders need rich, executive dashboards featuring Allure artifacts, HTML reports, and ReportLab PDF summaries.
6. **In-Lane Progression & Dismissible Key UX**: The UI must clearly present bottom action CTAs after each agent phase to proceed to the next step, with an optional dismissible key prompt on exhaustion.

---

## 2. User Stories
- **US-1 (Grounded UI Analysis)**: As a QA lead, I want the Requirement Understanding Agent to parse exact selectors and interaction flows from my codebase and display them under a dedicated **UI Testing** tab, while marking API, Performance, and Accessibility as "Coming Soon".
- **US-2 (Modular Scripts)**: As an automation engineer, I want every generated test case to have its own modular Python Playwright script with Page Object Models and synthetic data bindings.
- **US-3 (Automated Screenshots)**: As a tester, I want Playwright to capture full-page screenshots on both passed and failed test executions and link them directly to the test case row.
- **US-4 (Selective & Sequential Execution)**: As a tester, I want to select specific test cases using checkboxes, view a dynamic "Proceed & Run Selected ({N})" CTA, and watch tests execute one-by-one with live terminal logs.
- **US-5 (Allure & Quality Dashboard)**: As an executive stakeholder, I want to view pass/fail statistics, inspect step traces, and download Allure, HTML, and PDF quality reports.
- **US-6 (In-Lane Progression)**: As a platform user, I want clear "Next Step" bottom buttons after each agent completes to smoothly proceed through the lifecycle.

---

## 3. Functional Requirements

### FR-1: Grounded UI Requirement Analysis & Multi-Domain Tabs
- Analyze codebase AST and requirement docs to extract precise components, IDs, `data-testid`, and ARIA roles.
- Surface active `UI Testing` workspace with `Coming Soon` badges for `API Testing`, `Performance Testing`, and `Accessibility Testing`.
- Group requirement gaps by actionable UI testability risks.

### FR-2: Modular Playwright Test Script Synthesis
- Synthesize separate test script files: `tests/test_TC_xxx.py` for each test case.
- Implement robust Page Object Models (`pages/cfa_pages.py`) and fixtures (`fixtures/conftest.py`).
- Implement try/finally screenshot hooks capturing:
  - `{case_id}_PASSED.png` on successful assertion.
  - `{case_id}_FAILED.png` on error or timeout.

### FR-3: AI-Grounded Synthetic Data Generation
- Generate context-specific mock datasets for:
  - **Positive Cases**: Valid inputs, compliant formats, realistic entities.
  - **Negative Cases**: Malformed inputs, invalid credentials, rejection triggers.
  - **Boundary Cases**: Edge limits ($0.01, $1,000,000, 50-char lengths).
  - **Validation Cases**: Empty strings, null values, unsupported file types.

### FR-4: Selective & Sequential Playwright Runner
- UI Checkbox controls: Select individual items, `Select All`, `Clear Selection`.
- Category filtering: `Positive`, `Negative`, `Boundary`, `Validation`, `Error-Handling`.
- Dynamic CTA: `[🚀 Proceed & Run Selected ({N})]`.
- Execution Options: Sequential (one-by-one live step monitoring) or Batch suite execution.
- Real-time SSE streaming for live status updates (`RUNNING`, `PASSED`, `FAILED`).

### FR-5: Allure & Rich Quality Reporting
- Generate `allure-results/` directory with test containers, JSON results, and screenshot attachments.
- Standalone HTML quality report with embedded inline styling.
- Executive ReportLab PDF export downloadable from the UI.
- Interactive screenshot modal with full-screen zoom and download.

### FR-6: Stage Progression CTAs & Dismissible Key Prompt
- Render standardized bottom "Next Step: Proceed to [Next Stage]" banners after stage completion.
- Allow users to dismiss/hide the inline key exhaustion prompt via an `[X]` button.

---

## 4. Acceptance Criteria
- [x] All 5 test case types generate individual Python Playwright scripts.
- [x] Full-page screenshots are saved on both Pass and Fail states.
- [x] Selection controls support Select All, Clear, and selective subset runs.
- [x] Domain testing switcher marks UI Testing active and others as Coming Soon.
- [x] Allure results and standalone HTML/PDF reports are generated.
- [x] Inline API key exhaustion prompt has a functional dismiss toggle.
- [x] Bottom action banners guide the user to the next stage after each agent run.
