# Specification: Feature 022 — Test Case & Synthetic Data Intelligence, Script Visibility, and Selective Execution

## 1. Problem Statement
1. **Hidden Playwright Automation Code**: While the Playwright Agent generates dedicated Python test scripts (`tests/test_tc_*.py`), users could not view or inspect the code directly from the UI without navigating away.
2. **Missing Per-Test Synthetic Data Visibility**: Test datasets were generated in bulk, but lacked a dedicated inline inspector to see the exact mock data mapped to each individual test case.
3. **UI Complexity & Clutter**: Redundant Step 3 hero buttons and oversized static panels created visual friction once document and codebase uploads were completed.
4. **Need for Granular Selective Execution**: Engineers required flexible test case filtering (Positive, Negative, Boundary, Validation) and manual checkbox selection to run targeted scenarios in live headed browser mode with screenshot capture.

---

## 2. User Stories
- **US-1 (Script Visibility)**: As a QA engineer, I want to click `[< /> View Script]` on any test case row to view the full Python Playwright script with syntax highlighting and copy it to my clipboard.
- **US-2 (Test Data Inspection)**: As a test engineer, I want to click `[📊 View Data]` on any test case row to inspect the synthetic input parameters, boundary values, and mock records mapped to that test.
- **US-3 (Selective Live Execution)**: As an automation tester, I want to select specific test cases using checkboxes or category filters and execute only the chosen subset in a headed desktop browser window.
- **US-4 (Collapsible Workspace)**: As a platform user, I want completed upload and understanding panels to collapse into clean summary strips with manual expand/collapse toggles so the screen remains uncluttered.

---

## 3. Functional Requirements

### FR-1: Collapsible Intake & Streamlined Home View
- Auto-collapse document dropzone into a compact summary card upon successful upload.
- Auto-collapse ZIP dropzone into a compact summary card upon successful extraction.
- Remove redundant Step 3 hero card and duplicate "Start AI Understanding" button.
- Provide manual expand/collapse accordions for all file lists.

### FR-2: Playwright Script Viewer Modal
- Add a dedicated `<PlaywrightScriptModal />` component.
- Display complete Python script code with line numbers and syntax formatting.
- Include a "Copy Code" button, download action, and list of discovered DOM selectors.
- Include a direct "Run Live Script" trigger from inside the modal.

### FR-3: Synthetic Test Data Inspector Modal
- Add a dedicated `<TestDataModal />` component.
- Display structured mock data records mapped to the test case (username, password, SSN, income, document file, terms).
- Highlight boundary values and negative test indicators.
- Provide a "Copy JSON" button.

### FR-4: Granular Selective Execution & Monitoring
- Add checkbox multi-selection to `LivePlaywrightRunner.tsx`.
- Provide category filter pills: `ALL`, `Positive`, `Negative`, `Boundary`, `Validation`, `Error-Handling`.
- Provide a primary `[▶ Run {N} Selected (New Window)]` execution button.
- Display real-time status badges (`PASSED`, `FAILED`, `RUNNING`, `NOT_RUN`) and inline screenshot thumbnails.

---

## 4. Acceptance Criteria
- [x] Requirement and codebase upload panels collapse cleanly after ingestion.
- [x] Step 3 duplicate hero button is removed.
- [x] Every test case row has working `[< /> View Script]` and `[📊 Data]` action buttons.
- [x] Script viewer modal displays complete Python Playwright code with copy action.
- [x] Test data modal displays the mapped synthetic records and schema.
- [x] Test cases can be individually checked/unchecked and executed selectively.
