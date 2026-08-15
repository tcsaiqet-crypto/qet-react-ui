# Tasks 015: Observability & Logging System Verification Breakdown

## Package 1: Forensic Log Audit & Gap Identification
- [x] **Task 15.1.1**: Audit commit `c6a1aa4` (`LOG_FEATURE_CHANGES.md`), `de88119`, and `4449cec` to identify all logging endpoints, models, and UI components.
- [x] **Task 15.1.2**: Document granular gap assessment in [`detailed-logs-gap-analysis.md`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/015-main-branch-and-log-gap-analysis/detailed-logs-gap-analysis.md).
- [x] **Task 15.1.3**: Document 18-point platform capability matrix in [`gap-analysis.md`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/015-main-branch-and-log-gap-analysis/gap-analysis.md).

## Package 2: Backend Logging Architecture Alignment
- [x] **Task 15.2.1**: Define REST contract for `GET /api/v1/runs/{run_id}/logs` and `GET /api/v1/runs/{run_id}/logs/download` in `contracts.md`.
- [x] **Task 15.2.2**: Ensure `log_run_context(run_id)` contextvar routing pattern is defined in `contracts.md` and `plan.md`.
- [x] **Task 15.2.3**: Verify secret redaction invariants in `constitution.md` ensuring no API keys leak to disk or client streams.

## Package 3: Frontend Console Log UI & Search Ergonomics
- [x] **Task 15.3.1**: Verify `ConsoleLogDrawer.tsx` support for dual log views (`frontend` vs `backend`).
- [x] **Task 15.3.2**: Verify real-time search with `<mark>` keyword highlighting and `scrollIntoView` auto-scrolling.
- [x] **Task 15.3.3**: Verify log level dropdown filters (`All Levels`, `Info`, `Status`, `Error`).
- [x] **Task 15.3.4**: Verify 1-click `.log` export and clear console actions.

## Package 4: Master Governance & Cross-Spec Consistency
- [x] **Task 15.4.1**: Update master [`specs/README.md`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/README.md) indexing all Spec-Kits 001 through 015.
- [x] **Task 15.4.2**: Update master [`specs/constitution.md`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/constitution.md) incorporating Article VII (Observability & Logging Parity).
- [x] **Task 15.4.3**: Update [`implementation_plan.md`](file:///C:/Users/AkshatSinha/.gemini/antigravity-ide/brain/d33ad1c1-3b5f-4968-b027-295bcb1f1e0f/implementation_plan.md) with complete verification metrics.
