# Task Breakdown & Verification: ISS-008

## 1. Implementation Tasks
- [x] **T-8.1**: Create `src/components/execution/PlaywrightScriptModal.tsx` with copy and download actions.
- [x] **T-8.2**: Create `src/components/execution/TestDataModal.tsx` for viewing synthetic data.
- [x] **T-8.3**: Add selective execution checkbox state management in `src/components/execution/LivePlaywrightRunner.tsx`.
- [x] **T-8.4**: Update backend execution handler in `backend/src/api/fastapi_app.py` to filter test cases by `test_case_ids`.

## 2. Verification Milestones
- [x] **V-8.1**: Open script modal on generated test case — verify code syntax highlighting and working copy button.
- [x] **V-8.2**: Click download button — verify `.spec.ts` file downloads to local filesystem.
- [x] **V-8.3**: Select 2 out of 5 tests and click execute — verify backend executes only the 2 chosen cases.
