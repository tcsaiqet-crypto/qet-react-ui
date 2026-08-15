# Specification: ISS-008 — Playwright Script Viewer, Test Data Modal & Selective Execution

## 1. Problem Statement
Users previously lacked the ability to preview generated Playwright automation scripts or review synthetic test data before triggering execution. Additionally, they could only run all tests as an all-or-nothing batch rather than picking specific test cases.

## 2. User Stories
- **US-1**: As an automation tester, I want to click "View Script" on any test case card to review the generated Playwright code in a syntax-highlighted modal.
- **US-2**: As a data engineer, I want to click "View Test Data" to inspect generated synthetic fixtures in tabular or JSON format.
- **US-3**: As a QA lead, I want checkboxes next to test cases so I can execute a targeted smoke subset rather than the full suite.

## 3. Functional Requirements
1. **Playwright Script Modal (`PlaywrightScriptModal.tsx`)**:
   - Monospace code viewer with syntax highlighting tokens.
   - Action buttons: "Copy Code", "Download .spec.ts", "Close".
2. **Test Data Modal (`TestDataModal.tsx`)**:
   - Displays JSON payloads and CSV data tables.
3. **Selective Execution Controls**:
   - "Select All" / "Deselect All" master checkbox.
   - Individual case checkboxes updating `selectedTestIds` state.
   - Dynamic CTA: "Execute 3 Selected Tests".

## 4. Acceptance Criteria
- [x] Clicking "View Script" opens the modal displaying the complete Playwright script.
- [x] Clicking "Download .spec.ts" initiates browser file download.
- [x] Selecting a subset of test cases triggers backend execution strictly for the chosen IDs.
