# Plan 004: Phase 4 — Playwright Script Agent Implementation Strategy

## 1. Technical Strategy
1. **Backend Implementation**:
   - In `backend/src/agents/playwright_agent.py`, synthesize Page Object Model classes and `.spec.ts` files based on AST selectors and test cases.
   - Package the generated scripts and fixtures into a downloadable zip bundle.
2. **Frontend Component Architecture**:
   - Create `src/components/PlaywrightScriptCard.tsx` with:
     - Header + Right-Side Sub-Agent Step Rail (1. POM Synthesis -> 2. Spec Generation -> 3. Data Binding).
     - Multi-file tab viewer / Monaco-like syntax viewer.
     - Download Zip button.
     - Bottom CTA: `"Launch Execution Workspace →"`.
3. **State Transitions & Auto-Collapse**:
   - Track `playwright_scripts_status: 'idle' | 'generating' | 'ready' | 'error'`.
   - Implement smooth auto-collapse on clicking `"Launch Execution Workspace →"`.

## 2. Component Mapping
- `backend/src/agents/playwright_agent.py`: Specialist Playwright script generator.
- `src/components/PlaywrightScriptCard.tsx`: UI code viewer component.

## 3. Verification Criteria
- [x] Generates clean TypeScript `@playwright/test` scripts and POM classes.
- [x] Test scripts correctly parameterize values from the active Test Data Hub.
- [x] Multi-file code viewer displays scripts with syntax highlighting.
- [x] Bottom CTA triggers Phase 4 collapse and advances to Phase 5.
