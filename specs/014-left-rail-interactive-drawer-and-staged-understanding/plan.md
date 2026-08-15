# Implementation Plan (Spec-Kit 014)

## 1. Architectural Architecture & Component Layout

```
+---------------------------------------------------------------------------------------------------------+
|                                        Top Navigation Header Bar                                         |
| [Sparkles] QET Automated Agents  |  [Home] [Execution] [Runs] [Tools]  |  [AI Provider] [Theme] [Zoom]  |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|  +---------------------+  +------------------------------------------+  +----------------------------+  |
|  |  LEFT VERTICAL RAIL |  |             MAIN WORKSPACE               |  |   RIGHT-SIDE COLLAPSIBLE   |  |
|  | (AgentPipelineRail) |  |        (Staged Hero Canvas)              |  |      INSPECTOR DRAWER      |  |
|  |                     |  |                                          |  |     (AgentDetailDrawer)    |  |
|  | [1. Req Understand] |  |  +------------------------------------+  |  |                            |  |
|  |   - Req Parser      |  |  | Active Hero Card (1 / 2 / 3)       |  |  | Tabs:                      |  |
|  | [2. Doc Intake]     |  |  | Dropzone / Extractor / AI Runner   |  |  | [Overview] [Logs]          |  |
|  |   - AST Extractor   |  |  +------------------------------------+  |  | [Artifacts] [Actions]      |  |
|  | [3. App Understand] |  |                                          |  |                            |  |
|  |   - Journey Synth   |  |  +------------------------------------+  |  | - Inputs & File Manifest   |  |
|  |   - Gap Analyzer    |  |  | Compact Completed Summary Cards    |  |  | - Live Subagent Activity   |  |
|  | ------------------- |  |  | Rich Metrics & Quick Actions       |  |  | - JSON & AST Tree Viewer   |  |
|  | [4. Req Categorize] |  |  +------------------------------------+  |  | - 15-Point Gap Checklist   |  |
|  | [5. Accessibility]  |  |                                          |  | - Retry / Export Triggers  |  |
|  | [6. Test Cases]     |  |                                          |  |                            |  |
|  | [7. Test Data]      |  |                                          |  | [Collapse / Expand Toggle] |  |
|  | [8. Script Writer]  |  |                                          |  |                            |  |
|  | [9. Execution]      |  |                                          |  |                            |  |
|  | [10. Reporting]     |  |                                          |  |                            |  |
|  | [11. Dashboard]     |  |                                          |  |                            |  |
|  +---------------------+  +------------------------------------------+  +----------------------------+  |
|                                                                                                         |
+---------------------------------------------------------------------------------------------------------+
|                                              Footer Bar                                                 |
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. Component Blueprint

### A. Left Vertical Rail (`src/components/AgentPipelineRail.tsx`)
- Props:
  - `appState: AppState | null`
  - `selectedAgentId: string | null`
  - `onSelectAgent: (agentId: string) => void`
  - `viewMode: 'understanding_focus' | 'full_pipeline'`
  - `onToggleViewMode?: () => void`
- Key Features:
  - Interactive selection highlight with accent ring and elevation.
  - Phase filter tabs (`Understanding (3)` vs `Full Pipeline (11)`).
  - Subagent status indicators with live animated pulse when running.

### B. Right-Side Collapsible Drawer (`src/components/AgentDetailDrawer.tsx` / `InspectorPanel.tsx`)
- Props:
  - `isOpen: boolean`
  - `onToggle: () => void`
  - `selectedAgentId: string | null`
  - `appState: AppState | null`
  - `onRetryAgent: (agentId: string) => Promise<void>`
- Sub-components:
  - `DrawerHeader`: Selected agent title, phase badge, close/collapse button, status chip.
  - `DrawerInputsTab`: Files uploaded, manifest details, input tokens, config parameters.
  - `DrawerSubagentsTab`: Real-time subagents list, step-by-step progress, duration, log terminal.
  - `DrawerArtifactsTab`: JSON tree viewer, parsed AST components, 15-point checklist matrix.
  - `DrawerActionsTab`: Targeted retry step, clear downstream artifacts, copy payload JSON, export report.

### C. Staged 3-Agent Orchestrator (`src/components/HomeUploadPage.tsx`)
- State:
  - `activeHeroStep: 'requirement_understanding' | 'document_intake' | 'application_understanding'`
- Motion & Layout:
  - Hero card dynamically shifts between Step 1, Step 2, and Step 3 based on intake completion status.
  - Completed steps shrink into compact summary strips above the active hero card with a 1-click `Re-upload` / `Inspect` trigger.

---

## 3. Implementation Phasing

1. **Phase 1: Contracts & Data Models (`contracts.md`)**:
   Define `SelectedAgentContext`, `AgentArtifactDetail`, and drawer view state types in `src/types.ts`.
2. **Phase 2: Interactive Left Rail (`phase-01-interactive-left-rail.md`)**:
   Refactor `AgentPipelineRail.tsx` to support interactive selection and understanding-focused view.
3. **Phase 3: Right Collapsible Drawer (`phase-02-right-side-collapsible-drawer.md`)**:
   Create `src/components/AgentDetailDrawer.tsx` with 4 tabs and responsive docked/overlay modes.
4. **Phase 4: Staged 3-Agent Understanding Flow (`phase-03-three-understanding-agents-progression.md`)**:
   Update `HomeUploadPage.tsx` and `App.tsx` layout to synchronize left rail, staged hero cards, and right drawer.
5. **Phase 5: Artifact Deep-Linking & Telemetry (`phase-04-artifact-deep-linking-and-controls.md`)**:
   Wire up AST component inspector, 15-point checklist matrix, and stage-specific retry triggers.
6. **Phase 6: Verification & Test Coverage (`phase-05-verification-and-test-plan.md`)**:
   Add Vitest test suites verifying selection, drawer expansion, and staged hero progression.
