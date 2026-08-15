# Master Issues & Problem Remediation Spec-Kit Index

This directory contains the exhaustive, modular Spec-Kits for all identified issues, architectural remediations, and enhancements across the Autonomous Quality Engineering Platform (QET).

Each issue is formulated according to the **Enterprise Spec-Kit Standard**:
1. `constitution.md` / `overview.md` — Invariants, governance, non-negotiable architectural constraints, and error boundaries.
2. `spec.md` — Problem statement, user stories, functional and non-functional requirements, and acceptance criteria.
3. `plan.md` — Technical architecture, interaction diagrams, state transition models, and edge-case mitigations.
4. `contracts.md` — Typed contracts across Python (Pydantic), TypeScript interfaces, and REST API schemas.
5. `tasks.md` — Actionable, granular implementation and verification checklist.
6. `README.md` — Executive summary and quick navigation.

---

## Issues & Remediation Matrix

| ID | Title & Scope | Priority | Status |
| :--- | :--- | :---: | :---: |
| [**ISS-001**](./ISS-001-sample-data-upload-structure/) | **Sample Data Upload Structure & Endpoint Robustness** | 🔴 High | Open |
| [**ISS-002**](./ISS-002-backend-log-streaming-and-download-resilience/) | **Backend Log Streaming & Download Resilience** | 🔴 High | Open |
| [**ISS-003**](./ISS-003-dual-upload-lanes-ui-optimization/) | **Dual Upload Lanes UI & Log Panel Persistence** | 🟡 Medium | Open |
| [**ISS-004**](./ISS-004-realtime-console-logs-and-search-panel/) | **Real-Time Console Logs Inspector & Test Gen Output** | 🔴 High | Open |
| [**ISS-005**](./ISS-005-five-stage-canonical-pipeline-navigation/) | **5-Stage Canonical Pipeline Navigation & API Testing** | 🟢 Low | Backlog |
| [**ISS-006**](./ISS-006-dynamic-ai-model-switcher-and-runtime-budget/) | **Dynamic AI Model Switcher & Performance Testing** | 🟢 Low | Backlog |
| [**ISS-007**](./ISS-007-gemini-json-truncation-and-auto-repair/) | **Gemini JSON Truncation & Accessibility Testing** | 🟢 Low | Backlog |
| [**ISS-008**](./ISS-008-script-viewer-and-selective-execution/) | **Playwright Script Viewer & Requirement Upload File Viewer** | 🟡 Medium | Open |
| [**ISS-009**](./ISS-009-understanding-run-pipeline-ux/) | **Understanding → Pipeline UX Flow Improvements** | 🟡 Medium | Open |
| [**ISS-010**](./ISS-010-execution-selective-run/) | **Execution — Selective Test Case Run & Result Viewer** | 🔴 High | In Progress |
| [**ISS-011**](./ISS-011-runs-dashboard-improvements/) | **Runs Dashboard — Delete, Filter, Search & Run Detail** | 🟡 Medium | Open |
| [**ISS-012**](./ISS-012-report-download-ui/) | **Report Agent — Download HTML & PDF in UI** | 🔴 High | Open |
| [**ISS-013**](./ISS-013-ai-script-autofix-wiring/) | **AI Script Auto-Fix — Backend Wiring & Apply Flow** | 🔴 High | Open |
| [**ISS-014**](./ISS-014-agent-drawer-real-data/) | **Agent Detail Drawer — Real Agent Logs & Output Display** | 🟡 Medium | Open |
| [**ISS-015**](./ISS-015-ai-model-discovery-dynamic/) | **AI Settings — Dynamic Model Discovery & Provider Health** | 🟡 Medium | Open |
| [**ISS-016**](./ISS-016-sample-data-qetcfa-folder/) | **Sample Data — QET CFA Folder Structure on Disk** | 🔴 High | Open |

---

## Priority Summary

### 🔴 High Priority (Must Do)
- **ISS-001**: Sample Data Upload Structure
- **ISS-002**: Backend Log Streaming & Understanding Output
- **ISS-004**: Test Generation Output Viewer & Logs Inspector
- **ISS-010**: Execution Selective Run & Result Viewer
- **ISS-012**: Report Agent HTML & PDF Download in UI
- **ISS-013**: AI Script Auto-Fix Backend Wiring & Apply Flow
- **ISS-016**: QET CFA Folder Structure on Disk

### 🟡 Medium Priority
- **ISS-003**: Log Panel Width & Persistence
- **ISS-008**: Requirement Upload File Viewer & Script Viewer
- **ISS-009**: Understanding Pipeline UX Flow
- **ISS-011**: Runs Dashboard Improvements
- **ISS-014**: Agent Drawer Real Data
- **ISS-015**: AI Model Discovery Dynamic

### 🟢 Backlog (Future Phases)
- **ISS-005**: API Testing Phase
- **ISS-006**: Performance Testing Phase
- **ISS-007**: Accessibility Testing Phase & JSON Truncation Resilience

---

## Implemented Platform Highlights
- ✅ Resizable Log Panel with drag handle
- ✅ Testing Type Tabs (UI / API / Performance / Accessibility)
- ✅ Run Test Generation Agent CTA on Understanding page
- ✅ Cleaned and optimized Dual Upload lanes on HomeUploadPage
