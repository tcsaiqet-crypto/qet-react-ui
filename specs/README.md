# Master Spec-Kit Index: Autonomous Quality Engineering Platform (QET)

This directory houses the comprehensive Spec-Kit documentation (specifications, data contracts, architectural implementation plans, and tasks) covering the complete evolution of the QET autonomous testing platform from foundational ingestion to live headed Playwright execution and AI test intelligence.

---

## Complete Spec-Kit Sitemap (001 – 013)

| Spec ID | Title & Focus Area | Key Deliverables & Purpose |
|---|---|---|
| [`001`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/001-core-autonomous-testing-platform/README.md) | **Core Autonomous Testing Platform** | Foundational architecture, ZIP extraction safeguards (Zip Slip defense), AI provider runtime (Gemini/GPT), and durable run state storage. |
| [`002`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/002-feature-driven-spec-kit/README.md) | **Feature-Driven Spec-Kit Foundation** | React SPA setup, Understanding fail-fast disciplines, FastAPI backend runtime layer, and run state persistence. |
| [`003`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/003-next-implementation/README.md) | **Next Implementation & Bridge** | Frontend-to-backend API bridge, understanding UI integration, and testing/verification strategy. |
| [`004`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/004-post-antigravity-audit/README.md) | **Post-Antigravity Audit & Alignment** | Frontend correctness fixes, runtime integration, API contract alignment, and toolchain hardening. |
| [`005`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/005-requirement-intelligence-testgen/README.md) | **Requirement Intelligence & Categorization** | 10 requirement categories (Functional, Business Rules, Compliance, etc.) and category-driven test generation. |
| [`006`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/006-stability-hotfix/README.md) | **Stability & Contract Hardening** | Backend import fixes, single-source-of-truth contract alignment, LLM hardening, and regression exit gates. |
| [`007`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/007-multi-agent-orchestration-and-pipeline/README.md) | **Multi-Agent Orchestration & Sequential Pipeline** | 5-stage pipeline flow, stage dependency validation, downstream output reset on retry, and lifecycle telemetry. |
| [`008`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/008-left-rail-agent-experience/README.md) | **Left Rail Agent Experience** | Left-rail navigation, stage-gated step progression, understanding lifecycle alignment, and behavioral tests. |
| [`009`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/009-deterministic-execution-closure/README.md) | **Deterministic Execution Closure** | Deterministic test harnesses, backend serving strategy, and verification closeout. |
| [`010`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/010-quality-reporting-and-evidence-matrix/README.md) | **Executive Quality Reporting & Evidence Matrix** | Executive sign-off recommendation (GO/NO_GO), ReportLab PDF generation, responsive HTML reports, and package export. |
| [`011`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/011-agent-choreography-experience/README.md) | **Agent Choreography & Sub-Agent Orchestration** | 2-level hierarchical Left Rail, live subagent pulse telemetry, 2-lane drag-and-drop file categorization launcher, and recovery replay. |
| [`012`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/012-progressive-agent-pipeline/README.md) | **Progressive Agent Pipeline (5 Phases)** | End-to-end 5-phase agent architecture: Phase 1 Understanding, Phase 2 Test Cases (5 types), Phase 3 Dual Synthetic Data, Phase 4 Playwright Package, Phase 5 Execution & Reporting. |
| [`013`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/013-live-playwright-execution-and-ai-intelligence/spec.md) | **Live Playwright Execution, Controls & AI Intelligence** | Pause/Resume/Stop controls, dedicated test scripts per case, headed desktop runner, positive & negative screenshot capture, 3-tier multi-level JSON diagnostics, and AI test intelligence & script auto-healing. |
| [`014`](file:///d:/TcsQET/qet-react-ui/specs/014-left-rail-interactive-drawer-and-staged-understanding/README.md) | **Left Rail Interactive Navigation, Right Drawer & Staged Understanding UX** | Interactive Left-Rail agent selection, right-side collapsible inspector window/drawer (Inputs, Logs, Artifacts, Actions), 3-agent staged understanding progression, and deep-linked AST/checklist exploration. |
| [`015`](file:///d:/TcsQET/qet-react-ui/specs/015-main-branch-and-log-gap-analysis/README.md) | **Main Branch & Log Gap Analysis / Cancellation Engine** | Comprehensive retrospective gap analysis, context-scoped logging in `temp/run_{run_id}.log`, asynchronous pipeline cancellation checks, and REST log streaming. |
| [`016`](file:///d:/TcsQET/qet-react-ui/specs/016-subagent-animation-rail-and-task-drawer/README.md) | **Subagent Animation Rail & Task Inspector Drawer** | Nested subagent progression, smooth auto-scroll & auto-collapse upon stage completion, one-button design rules, and right-side subagent task breakdown. |
| [`017`](file:///d:/TcsQET/qet-react-ui/specs/017-gemini-model-discovery-and-runtime-switcher/README.md) | **Gemini Model Discovery & Runtime Model Switcher** | Dynamic Gemini model discovery (`gemini-2.5-pro`, `gemini-2.5-flash`), header switcher, and multi-key rotation fallback. |
| [`020`](file:///d:/TcsQET/qet-react-ui/specs/020-end-to-end-testing-and-audit/SPEC_020.md) | **End-to-End Testing, UI Alignment & Issues Audit Log** | Comprehensive verification of 3-Pane UI layout, 5-stage progressive rail, Gemini 3.7 Flash thinking switcher, real-time right logs drawer, and API endpoint alias audit. |

---

## Standard Spec-Kit Folder Structure

Each Spec-Kit folder contains:
1. `spec.md`: Functional requirements, user stories, objectives, and acceptance criteria.
2. `contracts.md`: Pydantic models (Python), TypeScript interfaces, and API REST/WebSocket contracts.
3. `plan.md`: Architectural design, flow diagrams, algorithms, and integration blueprints.
4. `tasks.md`: Structured work breakdown checklist with verification deliverables.
