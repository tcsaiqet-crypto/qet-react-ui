# Task Breakdown & Verification: ISS-005

## 1. Implementation Tasks
- [x] **T-5.1**: Unify navigation into 5 canonical stages inside `src/components/AgentPipelineRail.tsx`.
- [x] **T-5.2**: Add `useAutoScrollToActive` hook attached to active stage DOM elements.
- [x] **T-5.3**: Enforce single-button progression rule at the footer of each active stage view.
- [x] **T-5.4**: Add lock icons and stage prerequisite tooltips for unreached pipeline stages.

## 2. Verification Milestones
- [x] **V-5.1**: Verify Left Rail displays exactly 5 canonical stages on screen.
- [x] **V-5.2**: Step through stages 1 to 5 — confirm rail auto-scrolls smoothly to keep the active stage visible.
- [x] **V-5.3**: Attempt to click Stage 4 before Stage 3 completes — confirm locked state prevents unauthorized jump.
