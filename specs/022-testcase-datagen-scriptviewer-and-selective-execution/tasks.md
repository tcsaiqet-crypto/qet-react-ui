# Task Checklist: Feature 022 — Test Case & Synthetic Data Intelligence, Script Visibility, and Selective Execution

- [x] **Task 1: Intake & Home Screen Simplification**
  - [x] Make document upload card auto-collapsible with compact status chip.
  - [x] Make codebase ZIP upload card auto-collapsible with compact status chip.
  - [x] Remove redundant Step 3 hero card and duplicate "Start AI Understanding" button.
  - [x] Implement smooth manual expand/collapse accordions with file detail counts.

- [x] **Task 2: Playwright Script Viewer Modal**
  - [x] Create `PlaywrightScriptModal.tsx` with syntax highlighting and line numbers.
  - [x] Add "Copy Code" button and script download capability.
  - [x] Add discovered DOM selectors and Page Objects inspector.
  - [x] Add direct "Run Live Script" trigger from inside modal.

- [x] **Task 3: Per-Test-Case Synthetic Test Data Inspector**
  - [x] Create `TestDataModal.tsx` displaying formatted mock records.
  - [x] Support boundary values and negative payload indicators.
  - [x] Add "Copy JSON" button and safety non-PII disclaimer.
  - [x] Support Table View and Raw JSON view modes.

- [x] **Task 4: Selective Live Execution & Integration in LivePlaywrightRunner**
  - [x] Add `[< /> Script]` and `[📊 Data]` action buttons to each test case row in `LivePlaywrightRunner.tsx`.
  - [x] Wire modal states and callbacks in `LivePlaywrightRunner.tsx` and `ExecutionPage.tsx`.
  - [x] Add category quick filters (`ALL`, `Positive`, `Negative`, `Boundary`, `Validation`, `Error-Handling`) and multi-select checkboxes.
  - [x] Connect "Run Selected" and "Run Single" to headed Playwright desktop execution.

- [x] **Task 5: End-to-End Build & Test Verification**
  - [x] Run `npm run build` to verify clean compilation (0 errors).
  - [x] Run `npx vitest run` (14/14 tests passing).
  - [x] Run `pytest backend/tests` (133/133 tests passing).
  - [x] Verify live desktop execution and screenshot gallery.
