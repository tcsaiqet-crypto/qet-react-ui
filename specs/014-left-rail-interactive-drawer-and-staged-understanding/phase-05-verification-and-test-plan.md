# Phase 05: Verification & Test Plan

## 1. Verification Strategy
Ensure high coverage of the new interactive rail, collapsible drawer, and staged understanding flow across unit and integration tests.

---

## 2. Test Cases to Implement

### A. Frontend Unit & Integration Tests (`src/__tests__/left_rail_drawer.test.tsx`)
1. **Left Rail Selection**: Verify clicking a stage card highlights the card and fires `onSelectAgent(agentId)`.
2. **View Mode Switching**: Verify toggling between `3 Understanding Agents` and `Full Pipeline (11)` updates the displayed stage count and cards.
3. **Drawer Expansion & Collapse**: Verify clicking the collapse/expand trigger toggles the drawer visibility and updates ARIA attributes.
4. **Drawer Tabs Content**: Verify switching between `Overview`, `Subagents`, `Artifacts`, and `Actions` renders correct context for the selected agent.
5. **Staged Hero Transition**: Verify uploading documents collapses Hero 1 and activates Hero 2.

### B. Regression & Build Validation
- `npm test`: All frontend Vitest suites pass.
- `npm run build`: TypeScript type-checking and Vite bundling complete with 0 errors.
- `python -m pytest backend/tests`: All 133 backend test cases pass without regressions.
