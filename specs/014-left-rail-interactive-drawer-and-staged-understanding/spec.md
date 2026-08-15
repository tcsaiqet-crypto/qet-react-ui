# Functional Specification (Spec-Kit 014)

## 1. Objectives & User Stories

### User Story 1: Interactive Left-Rail Agent Navigation
> **As an operator/tester**, I want to click any agent in the left vertical rail to select it, so that I can immediately see that agent's input configuration, subagent progress, and output artifacts without losing context of where I am.

### User Story 2: Right-Side Collapsible Detail Drawer
> **As an operator/tester**, I want a right-side collapsible inspector window that can expand/collapse smoothly or dock beside the main workspace, displaying detailed logs, parsed AST tokens, requirement gap matrices, and live subagent execution.

### User Story 3: Staged 3-Agent Understanding Flow
> **As an operator/tester**, when I start a new run session, I want to be guided through the 3 progressive understanding agents:
> 1. **Requirement Understanding Agent**: Upload specs and parse requirements.
> 2. **Document Intake Agent**: Upload codebase ZIP and extract component AST.
> 3. **Application Understanding Agent**: Deep AI synthesis, checklist validation, and gap analysis.
> Only after these 3 understanding agents complete should downstream pipeline stages (Test Cases, Synthetic Data, Playwright, Execution, Reporting) be highlighted.

---

## 2. Functional Requirements

### FR-01: Left-Rail Selection & State Sync
- Each agent card in `AgentPipelineRail` MUST be clickable and support keyboard focus (`Enter` / `Space`).
- Selecting an agent MUST update `selectedAgentId` in the shared UI state.
- The currently selected agent card MUST display a highlighted accent border, an active indicator badge, and a distinct elevation shadow.
- The Left Rail MUST support a toggle or phase-gated view:
  - **Understanding Phase View**: Focused on the 3 primary understanding agents.
  - **Full Pipeline View**: Displays all 11 stages with stage completion counts (`X of 11 complete`).

### FR-02: Right-Side Collapsible Inspector Drawer (`AgentDetailDrawer`)
- The right drawer MUST support 3 display modes:
  1. **Expanded / Docked**: Takes up 380px–460px on desktop screens ($\ge 1280\text{px}$).
  2. **Collapsed / Minimized**: Collapses into a thin vertical trigger bar or toggle button with agent badge.
  3. **Overlay Modal / Sheet**: Responsive slide-over on tablets and mobile screens.
- The drawer MUST contain 4 functional tabs:
  - **Tab 1: Overview & Inputs**: Raw inputs, file names, file sizes, parameter configs.
  - **Tab 2: Subagents & Live Activity**: Real-time subagent task checklist, logs, elapsed execution time.
  - **Tab 3: Outputs & Artifacts**: JSON inspector, rendered markdown, AST component tags, gap matrices.
  - **Tab 4: Actions**: Re-run/Retry agent, clear stage cache, download output artifacts, copy JSON payload.

### FR-03: Staged 3-Agent Understanding Progression
- On `HomeUploadPage`, the main workspace MUST follow the orchestrated sequence:
  - **Step 1 (Hero 1)**: `1. Requirement Understanding Agent` is the prominent large hero card.
  - **Step 2 (Hero 2)**: Upon document upload, Step 1 shrinks into a compact summary card with quick re-upload, and `2. Document Intake Agent` animates to center as the new prominent hero.
  - **Step 3 (Hero 3)**: Once codebase ZIP is indexed, `3. Application Understanding Agent` takes center focus for AI synthesis, DOM discovery, and 15-point checklist evaluation.

### FR-04: Deep Linking & Bidirectional Selection
- Clicking a subagent or artifact chip in the main workspace MUST automatically open the Right Drawer and select that subagent/artifact tab.
- Selecting an agent in the left rail MUST automatically load that agent's context in both the main view and the right drawer.

---

## 3. Acceptance Criteria

1. Clicking any agent card in `AgentPipelineRail` highlights the card and opens/updates the Right-Side Inspector Drawer.
2. The Right-Side Inspector Drawer can be smoothly expanded, collapsed, and resized without layout breaking.
3. During initial intake, the 3 Understanding Agents are prominently featured and orchestrated before downstream stages.
4. All existing unit tests and production builds pass without regressions.
