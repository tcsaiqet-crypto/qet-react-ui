# Phase 04: Artifact Deep-Linking & Stage Controls

## 1. Goal
Connect the Left Rail, Main Workspace, and Right Drawer with bidirectional deep-linking and stage-specific retry/reset controls.

---

## 2. Deep-Linking Features

1. **Artifact Chip Links**:
   - Clicking an indexed document file name opens the document preview inside the drawer's `Artifacts` tab.
   - Clicking a component name from the AST tree displays its DOM selector mappings and route associations.

2. **15-Point Checklist Explorer**:
   - Dedicated matrix view in the drawer with filterable status chips (`All`, `Passed`, `Gap Identified`, `Needs Review`).
   - Detailed rationale and requirement source links for each evaluation point.

3. **Stage-Specific Retry Controls**:
   - Both the Left Rail and Drawer provide a `Retry Stage` action.
   - Triggers downstream invalidation warning modal before wiping subsequent generated artifacts.
