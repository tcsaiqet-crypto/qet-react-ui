# Issue Constitution: ISS-003 — Dual Upload Lanes UI Layout Optimization

## 1. Fundamental Invariants

### 1.1 UI Viewport & Accessibility Rules
1. **Immediate Viewport Visibility**: The Dual Intake Dropzones (Lane 1: Requirements/PRDs, Lane 2: Target Codebase/ZIP) MUST be visible above the fold on standard desktop resolutions (>= 1280x720) without requiring vertical scrolling upon initial page load.
2. **Zero-Clutter Above Intake**: No redundant subagent animation cards, duplicate execution headers, or speculative diagnostic boxes may be rendered above the intake dropzones prior to file upload.
3. **Clear Drag-and-Drop Feedback**: Active drag states must clearly highlight the targeted dropzone with accessible borders and glowing visual cues (accent color `#3B82F6` or `--primary`).
4. **Immediate File Telemetry**: When files are selected or dropped, the file name, size (formatted in KB/MB), and badge icon must render instantly with an explicit remove button (`X`).

## 2. Responsive Boundaries
- On narrow viewports (< 1024px), stack the two upload lanes vertically while preserving all functional buttons and dropzone interactions.
