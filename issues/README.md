# Master Issues & Problem Remediation Spec-Kit Index

This directory contains the exhaustive, modular Spec-Kits for all identified issues, architectural remediations, and enhancements across the Autonomous Quality Engineering Platform (QET).

Each issue is formulated according to the **Enterprise Spec-Kit Standard**:
1. `constitution.md` — Invariants, governance, non-negotiable architectural constraints, and error boundaries.
2. `spec.md` — Problem statement, user stories, functional and non-functional requirements, and acceptance criteria.
3. `plan.md` — Technical architecture, interaction diagrams, state transition models, and edge-case mitigations.
4. `contracts.md` — Typed contracts across Python (Pydantic), TypeScript interfaces, and REST API schemas.
5. `tasks.md` — Actionable, granular implementation and verification checklist.
6. `README.md` — Executive summary and quick navigation.

---

## Issues & Remediation Matrix

| Issue ID | Focus Area & Title | Status | Scope & Remediation Summary |
| :--- | :--- | :--- | :--- |
| [`ISS-001`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/issues/ISS-001-sample-data-upload-structure/README.md) | **Sample Data Upload Structure & Endpoint Robustness** | **RESOLVED** | File intake validation, ZIP extraction safeguards, document categorization, and route alias alignment (`/understanding` vs `/start-understanding`). |
| [`ISS-002`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/issues/ISS-002-backend-log-streaming-and-download-resilience/README.md) | **Backend Log Streaming & Empty Download Resilience** | **RESOLVED** | Context-scoped logging in `temp/run_{run_id}.log`, streaming fallback headers, multi-run isolation, and 404 elimination. |
| [`ISS-003`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/issues/ISS-003-dual-upload-lanes-ui-optimization/README.md) | **Dual Upload Lanes UI Layout Optimization** | **RESOLVED** | Zero-vertical-clutter intake UI, distinct PRD/Design vs Codebase/Zip lanes, immediate status indicators, and responsive card views. |
| [`ISS-004`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/issues/ISS-004-realtime-console-logs-and-search-panel/README.md) | **Real-Time Console Logs Inspector & Live Search Panel** | **RESOLVED** | Dedicated 3rd column dock, split Frontend/Backend logs, `<mark>` search highlighting, level filter pills, and auto-scroll locking. |
| [`ISS-005`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/issues/ISS-005-five-stage-canonical-pipeline-navigation/README.md) | **5-Stage Canonical Pipeline Navigation & Left Rail Auto-Scroll** | **RESOLVED** | Consolidation of 11 fragmented steps into 5 canonical stages, single-button rule, stage dependency gating, and smooth viewport tracking. |
| [`ISS-006`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/issues/ISS-006-dynamic-ai-model-switcher-and-runtime-budget/README.md) | **Dynamic AI Model Switcher & Runtime Thinking Budget** | **RESOLVED** | Runtime model discovery (`GET /api/v1/ai/models`), header dropdown switcher, dynamic thinking budgets (Low/Medium/High), and key rotation. |
| [`ISS-007`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/issues/ISS-007-gemini-json-truncation-and-auto-repair/README.md) | **Gemini JSON Truncation & Schema Auto-Repair Resilience** | **RESOLVED** | Token budget expansion (8192), native JSON mode (`responseMimeType`), multi-pass unclosed JSON heuristics, and graceful degradation. |
| [`ISS-008`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/issues/ISS-008-script-viewer-and-selective-execution/README.md) | **Playwright Script Viewer, Test Data Modal & Selective Execution** | **RESOLVED** | Dedicated test script inspection modal with copy/download, dual synthetic test data modal, and individual/batch test execution checkboxes. |

---

## Directory Navigation Guide

```
issues/
├── README.md
├── ISS-001-sample-data-upload-structure/
├── ISS-002-backend-log-streaming-and-download-resilience/
├── ISS-003-dual-upload-lanes-ui-optimization/
├── ISS-004-realtime-console-logs-and-search-panel/
├── ISS-005-five-stage-canonical-pipeline-navigation/
├── ISS-006-dynamic-ai-model-switcher-and-runtime-budget/
├── ISS-007-gemini-json-truncation-and-auto-repair/
└── ISS-008-script-viewer-and-selective-execution/
```
