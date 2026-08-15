# Spec-Kit 020: QET Enterprise Architecture Constitution

**Standard**: RFC-QET-2026-020  
**Title**: QET Autonomous Quality Platform Constitution & Design System  
**Status**: CONSTITUTIONAL / IMMUTABLE  
**Scope**: Full-Stack Architecture, UI Layout, Agent Flow, Model Discovery & Diagnostic Telemetry  

---

## 1. Constitutional Principles

### Principle I: The 3-Pane Synchronized Architecture
The user interface MUST strictly render as a synchronized 3-pane layout across all operational phases:
1. **Left-Side Animated Rail (280px - 320px)**:
   - Houses the **5 Canonical Pipeline Agents** in strict linear execution order.
   - Completed stages auto-collapse into 48px summary cards displaying green check `✓` indicators.
   - Active stages automatically expand, displaying nested subagent task items and real-time execution states.
   - Strict **One Primary Action Button Rule** per agent card (`▶ Run Stage` when executable or `✓ View Results` when completed).
   - Smooth auto-scroll behavior centering the active card in the rail viewport upon state transitions.

2. **Center Main Workspace (Flex-1, Responsive)**:
   - Dynamic stage-aware workspace rendering the primary interaction surfaces:
     - **Intake Phase**: Dual drag-and-drop dropzones for Requirement Documents (`.md`, `.pdf`, `.docx`, `.txt`) and Codebase ZIP (`.zip`).
     - **Understanding Phase**: 15-Point Requirement Checklist, Discovered API Endpoints table, and Form/Flow AST tree.
     - **Test Generation Phase**: 5-Category Test Case suite (Functional, Boundary, Security, Edge, Accessibility), Synthetic Non-PII Data tables, and Playwright Test Scripts preview.
     - **Execution Phase**: Live Playwright execution stream, headless/headed browser runner telemetry, pass/fail status, and screenshot/video evidence viewer.
     - **Quality Report Phase**: Executive GO/NO-GO recommendation, Risk Matrix, Root-Cause Diagnostics, and downloadable PDF/HTML report packages.

3. **Right-Side Live Console Logs Inspector (360px - 400px)**:
   - Permanently docked on the right viewport margin.
   - Dual stream tabs: `[ Backend (Python) ]` and `[ Frontend (UI) ]` with live line-count badges.
   - Filter pills: `[ (All) ]`, `[ Info ]`, `[ Status ]`, `[ Error ]`.
   - Real-time search filter with yellow highlight rendering (`<mark className="bg-amber-300">`).
   - Sticky controls: Auto-Scroll toggle checkbox, Clear logs button, and formatted `.txt` log file export.

---

### Principle II: Persistent Top Header & Runtime Switcher
The top header MUST remain persistent and uncluttered with a unified 2-row layout:
- **Row 1 (Navigation & Global Brand)**:
  - Left: Logo + `⚡ QET Agent Accelerator`.
  - Center: Navigation Tabs (`[ Home ]`, `[ Execution ]`, `[ Quality Report ]`, `[ Run History ]`, `[ AI Tools & Keys ]`).
  - Right: Theme Switcher (`[ ☀️ Light / 🌙 Dark ]`) + Zoom Controls (`[-] 100% [+]`).
- **Row 2 (Active Run Sub-Bar)**:
  - `Active Run: [ 📋 RUN-YYYYMMDD-XXXXXX ]` with 1-click clipboard copy.
  - `Model: [ ✦ Gemini 3.7 Flash (Medium) ▾ ]` selector dropdown supporting:
    - `✦ Gemini 3.7 Flash (Medium)` (Default, 4096 thinking budget tokens)
    - `✦ Gemini 3.7 Flash (Low)` (1024 thinking budget tokens)
    - `✦ Gemini 3.7 Flash (High)` (8192 thinking budget tokens)
    - `✦ Gemini 3.1 Flash Lite` (Low latency)
    - `✦ OpenAI GPT-4o-mini` (Cross-provider fallback)
  - Red `[ ⏹ Stop Run ]` button wired to immediate pipeline cancellation.
  - `+ New Run` button to initialize fresh run state.

---

### Principle III: The 5 Canonical Agents & Nested Subagents
The platform workflow is partitioned into 5 non-overlapping canonical agents:

| Stage # | Canonical Agent | Core Subagents | Primary Deliverable |
| :--- | :--- | :--- | :--- |
| **1** | **Intake Agent** | `Manifest Parser`, `Codebase Unpacker` | `IntakeManifest` containing indexed docs and extracted AST source tree. |
| **2** | **Requirement Understanding Agent** | `Doc Parser`, `Context Analyzer`, `Requirement Categorizer` | `ApplicationUnderstanding` with 15-point checklist and discovered endpoints. |
| **3** | **Test Generation Agent** | `Test Case Synthesizer`, `Synthetic Data Generator`, `Playwright Code Generator` | 5-type test case suite, synthetic datasets, and typed Playwright test scripts. |
| **4** | **Execution Agent** | `Playwright Runner`, `API Runner`, `Evidence Collector` | Execution telemetry, step-by-step logs, and visual evidence (screenshots/traces). |
| **5** | **Quality Intelligence Agent** | `Diagnostic Engine`, `Self-Correction Agent` | Executive Quality Report, Root-Cause Analysis, and PDF export package. |

---

### Principle IV: Multi-Key Rotation & Zero-Crash Resilience
1. **Key Pool Management**:
   - The backend MUST load candidate API keys from `keys/ai_credentials.b64` and environment variables.
   - When encountering HTTP `429 (Rate Limit)` or `503 (Service Unavailable)`, the client service MUST automatically rotate to the next working key in the pool with zero downtime.
2. **Context-Scoped Run Logging**:
   - All background threads MUST execute inside `with log_run_context(run_id):` blocks ensuring logs are scoped to `temp/run_{run_id}.log`.
3. **Asynchronous Cancellation**:
   - Client cancellation requests (`POST /api/v1/runs/{run_id}/cancel`) MUST update disk state (`pipeline_control_state = "stopped"`), and all pipeline workers MUST poll disk state before starting downstream stages to abort cleanly.
