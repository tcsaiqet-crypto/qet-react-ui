# Issue Constitution: ISS-008 — Playwright Script Viewer, Test Data Modal & Selective Execution

## 1. Fundamental Invariants

### 1.1 Script & Execution Inspection Governance
1. **Full Transparency Before Execution**: Every generated Playwright test script (`.ts` / `.py`) and synthetic dataset (`JSON` / `CSV`) MUST be fully inspectable in a dedicated modal before execution commences.
2. **Selective Execution Granularity**: Users must be able to select individual test cases or subsets of test cases via checkboxes (`selectedCaseIds`). The runner MUST execute ONLY the selected tests.
3. **Download & Copy Integrity**: The Script Viewer Modal must provide:
   - 1-click clipboard copy with visual feedback ("Copied!").
   - Direct file download with filename `{test_case_id}.spec.ts`.
4. **Execution Diagnostics**: Each executed test case must log its live Playwright action steps (navigation, click, type, assertion) with pass/fail/error badges.

## 2. Modal Accessibility Boundaries
- Modals must support `Escape` key close, background backdrop dismissal, and focus trapping.
