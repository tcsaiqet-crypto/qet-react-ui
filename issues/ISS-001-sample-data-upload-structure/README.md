# ISS-001: Sample Data Upload Structure & Endpoint Robustness

## Overview
Resolves file intake formatting, ZIP extraction quarantine safeguards against directory traversal attacks (Zip Slip), and endpoint routing mismatches where `POST /api/v1/runs/{run_id}/understanding` returned 405 Method Not Allowed.

## Specification Documents
- [`constitution.md`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/issues/ISS-001-sample-data-upload-structure/constitution.md): Security invariants and routing policies.
- [`spec.md`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/issues/ISS-001-sample-data-upload-structure/spec.md): User stories and acceptance criteria.
- [`plan.md`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/issues/ISS-001-sample-data-upload-structure/plan.md): Architectural flows and endpoint mapping.
- [`contracts.md`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/issues/ISS-001-sample-data-upload-structure/contracts.md): Pydantic models & TypeScript interfaces.
- [`tasks.md`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/issues/ISS-001-sample-data-upload-structure/tasks.md): Verification and testing checklist.
