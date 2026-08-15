# Task Checklist: Feature 022 — Test Case & Synthetic Data Intelligence, Script Visibility, and Selective Execution

- [x] **Task 1: Intake & Home Screen Simplification**
  - [x] Make document upload card auto-collapsible with compact status chip.
  - [x] Make codebase ZIP upload card auto-collapsible with compact status chip.
  - [x] Remove redundant Step 3 hero card and duplicate "Start AI Understanding" button.
  - [x] Implement smooth manual expand/collapse accordions.

- [x] **Task 2: Playwright Script Viewer Modal**
  - [x] Create `PlaywrightScriptModal.tsx` with syntax highlighting and line numbers.
  - [x] Add "Copy Code" button and script download capability.
  - [x] Add discovered DOM selectors and Page Objects inspector.
  - [x] Add direct "Run Live Script" trigger from inside modal.

- [ ] **Task 3: Per-Test-Case Synthetic Test Data Inspector**
  - [ ] Create `TestDataModal.tsx` displaying formatted mock records.
  - [ ] Support boundary values and negative payload indicators.
  - [ ] Add "Copy JSON" button and safety disclaimer.

- [ ] **Task 4: Selective Live Execution & Integration in LivePlaywrightRunner**
  - [ ] Add `[< /> Script]` and `[📊 Data]` action buttons to each test case row in `LivePlaywrightRunner.tsx`.
  - [ ] Wire modal states and callbacks in `LivePlaywrightRunner.tsx` and `ExecutionPage.tsx`.
  - [ ] Add category quick filters and multi-select checkboxes.
  - [ ] Connect "Run Selected" and "Run Single" to headed Playwright desktop execution.

- [ ] **Task 5: End-to-End Build & Verification**
  - [ ] Run `npm run build` to verify clean compilation.
  - [ ] Verify test case viewing, script inspection, and test data display.
  - [ ] Verify headed live execution and screenshot gallery.
