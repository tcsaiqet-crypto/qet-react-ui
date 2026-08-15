# Task Breakdown & Verification: ISS-003

## 1. Implementation Tasks
- [x] **T-3.1**: Refactor `HomeUploadPage.tsx` to remove excessive top margin and redundant subagent status wrappers.
- [x] **T-3.2**: Implement responsive dual-column grid for Specifications and Codebase dropzones.
- [x] **T-3.3**: Add drag-and-drop listener hooks with instant visual highlight state (`isDraggingDoc`, `isDraggingCode`).
- [x] **T-3.4**: Integrate sample dataset selector buttons with preloaded fixture paths.
- [x] **T-3.5**: Connect upload submission to `POST /api/v1/runs/upload` and trigger stage navigation.

## 2. Verification Milestones
- [x] **V-3.1**: Inspect page layout on 1920x1080 and 1366x768 resolutions — confirm zero vertical scrolling required to view both dropzones.
- [x] **V-3.2**: Drag multiple PDF/MD files onto Lane 1 — verify files appear in staged list with size badges.
- [x] **V-3.3**: Click sample preset — confirm instant population of demo files and enabled CTA button.
