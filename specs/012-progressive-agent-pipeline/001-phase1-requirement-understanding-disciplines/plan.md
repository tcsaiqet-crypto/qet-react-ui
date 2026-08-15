# Plan 001: Phase 1 — Implementation Strategy & Step-by-Step Execution

## 1. Technical Strategy
1. **Frontend Layout**:
   - Refactor the Stage 1 workspace card in `HomeUploadPage.tsx` / `UnderstandingPage.tsx` to display:
     - Parent Agent Title & Metadata Header.
     - Right-Hand Sub-Step Pipeline Component showing 3 live sub-agents (`Intake Agent`, `App Understanding Agent`, `Requirement Scorer`).
     - 4-Discipline Tabs (`UI Testing` [Active], `API Testing` [Coming Soon], `Accessibility` [Coming Soon], `Performance` [Coming Soon]).
     - Bottom CTA: `"Run Test Case Generator Agent →"`.
2. **Backend Services**:
   - Update `UnderstandingAgent` to structure outputs under `disciplines` (UI, API, Accessibility, Performance).
   - Ensure the `/api/v1/runs/{run_id}/understanding` endpoint returns discipline-segmented payloads.
3. **Progressive Auto-Collapse**:
   - Add state tracking `isPhase1Collapsed: boolean` (auto-set to true when transitioning to Phase 2).
   - Add animated collapsible container with `[Expand Details / View Document]` toggle.
   - Smooth scroll animation on trigger click.

## 2. Component Mapping
- `src/components/HomeUploadPage.tsx`: Upload & Intake sub-agent experience.
- `src/components/UnderstandingPage.tsx`: 4-Discipline tabs, 15-point checklist, bottom CTA.
- `src/components/SubagentPipelineRail.tsx`: Right-hand sub-agent step pipeline.
- `backend/src/agents/understanding_agent.py`: Intelligence synthesis.

## 3. Verification Criteria
- [x] Uploading codebase ZIP + Docs indexes files without crashes (< 7s).
- [x] Understanding runs and produces UI discipline AST + requirement gap matrix.
- [x] API, Accessibility, and Performance tabs render clean "Coming Soon" capability previews.
- [x] Bottom button `"Run Test Case Generator Agent →"` triggers collapse and scrolls to Stage 2.
