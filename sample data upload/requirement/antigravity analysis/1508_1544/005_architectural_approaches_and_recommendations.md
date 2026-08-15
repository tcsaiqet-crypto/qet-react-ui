# 005 Architectural Implementation Approaches & Recommendations

**Date**: 2026-08-15  
**Timestamp**: 15:44  
**Target Scope**: UI Layout Restoration, Agent Choreography Rail, Task Drawer, Model Selector Approaches  

---

## Executive Summary

To restore the missed features (Console Logs UI, Stop Execution Button) and deliver the requested UI enhancements (Animated Agent Rail, Subagent Tasks Drawer, Dynamic Model Switcher), we present **3 Architectural Approaches** for user approval.

---

## Option 1: Incremental Seamless Integration (RECOMMENDED)

### Description
Directly merge the `c6a1aa4` features (ConsoleLogDrawer, Stop Run Handler, Backend Cancel Endpoint) back into the current clean 3-pane layout (`src/App.tsx`, `AgentPipelineRail.tsx`, `AgentDetailDrawer.tsx`). Add a top-bar Model Selector dropdown and enable auto-scroll + auto-collapse on the left rail.

### Technical Breakdown
1. **Console Log Drawer**: Place `<ConsoleLogDrawer>` inline beneath the active tab content area in `src/App.tsx`.
2. **Cancellation**: Re-attach `onCancelRun` handlers across `App.tsx`, `ActiveProcessBar`, and `UnderstandingPage`.
3. **Left Rail**: Add auto-collapse CSS transitions and auto-scroll handlers on stage completion.
4. **Right Inspector Drawer**: Synchronize subagent task breakdown and artifact deep-linking.
5. **Model Switcher**: Add a quick Gemini model selector dropdown in the header next to theme controls.

### Pros
- Fast implementation with zero breaking changes to existing components.
- Preserves all recent work from spec-014 while restoring 100% of missed features.
- Lowest risk and highest performance.

### Cons
- Slightly higher component density in `App.tsx`.

---

## Option 2: Tab-Based Workspace Splitting

### Description
Keep logs and execution inspectors in dedicated full-page tabs rather than inline bottom drawers.

### Pros
- Extremely uncluttered UI.

### Cons
- Requires switching tabs to monitor logs during active pipeline execution.
- Disrupts real-time visibility during automated test runs.

---

## Option 3: Floating Dock Modal System

### Description
Convert Console Logs and Subagent Task lists into floating modal popups that can be dragged or docked.

### Pros
- Flexible window positions.

### Cons
- Screen overlays cover critical requirement and execution metrics.
- Harder to navigate on smaller screens.

---

## Final Recommendation

We strongly recommend **Option 1: Incremental Seamless Integration**. It provides full visibility of logs and controls during pipeline runs while keeping the UI clean, modern, and aligned with all project specifications.
