# Implementation Tasks (Spec-Kit 014)

## Task Breakdown & Progress Tracking

- [ ] **Task 1: Data Contracts & Type Definitions**
  - [ ] Add `RailViewMode`, `DrawerTabId`, `SelectedAgentContext`, and `DrawerState` to [`src/types.ts`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/src/types.ts).
  - [ ] Update `resolveAgentFlow` in [`src/services/agentFlow.ts`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/src/services/agentFlow.ts) to return staged understanding subset and artifact summaries.

- [ ] **Task 2: Interactive Left Vertical Rail**
  - [ ] Refactor [`src/components/AgentPipelineRail.tsx`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/src/components/AgentPipelineRail.tsx) to accept `selectedAgentId` and `onSelectAgent`.
  - [ ] Add view switcher toggle between `Understanding Agents (3)` and `Full Pipeline (11)`.
  - [ ] Add active ring styling, step badges, and click handlers on all stage cards.

- [ ] **Task 3: Right-Side Collapsible Drawer Component**
  - [ ] Create `src/components/AgentDetailDrawer.tsx` with responsive slide-over & docked desktop modes.
  - [ ] Implement `DrawerHeader`, `DrawerInputsTab`, `DrawerSubagentsTab`, `DrawerArtifactsTab`, and `DrawerActionsTab`.
  - [ ] Add quick collapse/expand floating toggle button.

- [ ] **Task 4: Staged 3-Agent Progression in Main Workspace**
  - [ ] Update [`src/components/HomeUploadPage.tsx`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/src/components/HomeUploadPage.tsx) to orchestrate Hero 1 (Docs) $\rightarrow$ Hero 2 (Codebase ZIP) $\rightarrow$ Hero 3 (AI Synthesis).
  - [ ] Add compact top summary cards with instant re-upload and detail inspection.

- [ ] **Task 5: Global Layout Integration**
  - [ ] Update [`src/App.tsx`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/src/App.tsx) to host `selectedAgentId` state and embed `<AgentDetailDrawer />`.
  - [ ] Ensure seamless 3-pane layout (`Left Rail` + `Center Workspace` + `Right Drawer`).

- [ ] **Task 6: Verification & Test Suite**
  - [ ] Add frontend unit tests in `src/__tests__/left_rail_drawer.test.tsx`.
  - [ ] Run `npm run build` and `npm test` to verify zero regressions.
  - [ ] Run `python -m pytest backend/tests` to verify backend integrity.
