# 003 Agent Choreography Rail and Task Drawer Specification

**Date**: 2026-08-15  
**Timestamp**: 15:44  
**Target Scope**: Left Rail Agent Animation, Subagent Progress, Right Inspector Drawer Tasks, One-Button UI Rules  

---

## 1. Left-Side Animated Agent Rail

### A. Structure & Stage Progression
The left-side rail (`src/components/AgentPipelineRail.tsx`) renders the full list of core agents and subagents:
1. **Intake Agent** (`Intake subagent`, `Zip Extractor`)
2. **Requirement Understanding Agent** (`Doc Parsing`, `Context Analysis`, `Test Case Synthesizer`)
3. **Test Generation Agent** (`Playwright Code Gen`, `API Test Synthesizer`, `Data Generator`)
4. **Execution Agent** (`Playwright UI Runner`, `API Execution`, `Evidence Collector`)
5. **Quality Intelligence Agent** (`Failure Diagnostics`, `Self-Correction Repair`)

### B. Animated Micro-Interactions & Auto-Scroll
- **Active Stage Pulse**: The active agent card displays glowing gradient borders and dynamic subagent step progress indicators.
- **Auto-Collapse & Auto-Scroll**: When an agent completes its stage:
  1. The completed agent automatically collapses into a compact summary card.
  2. The view automatically scrolls down to focus on the next active agent.
  3. Details of the new active agent automatically expand to present progress and metrics.
- **One Button Rule**:
  - Each agent card contains **exactly ONE primary call-to-action button** (e.g. "Run Agent", "View Results", "Resume Stage").
  - Secondary or diagnostic actions are placed inside the right inspector drawer to prevent visual clutter.

---

## 2. Right-Side Inspector & Task Drawer

### A. Subagent Task List Synchronization
- When an agent or subagent is selected (or actively running), the **Right-Side Drawer** (`src/components/AgentDetailDrawer.tsx`) opens automatically or on demand.
- The drawer displays:
  - **Subagent Task Breakdown**: Detailed task progress for subagents (e.g. Task 1/3: Extracting AST, Task 2/3: Categorizing endpoints).
  - **Live Log Stream**: Filtered subagent logs.
  - **Artifact Previews**: Generated test scripts, data models, or execution evidence.
  - **Retry & Invalidation Controls**: Individual stage retry triggering.

---

## 3. Visual Layout Architecture

```
+---------------------------------------------------------------------------------------+
|  HEADER (Run ID: RUN-20260815-001 | Active Agent Status Strip | Stop Run | Theme)     |
+------------------------------+----------------------------------+---------------------+
|  LEFT RAIL (Animated)        |  CENTER WORKSPACE                |  RIGHT DRAWER       |
|                              |                                  |  (Subagent Tasks)   |
|  [✓] 1. Intake Agent         |  +----------------------------+  |  +----------------+ |
|      (Collapsed)             |  | Main Workspace Content      |  |  | Active Tasks   | |
|                              |  | (Upload / Understanding /   |  |  | Task 1: AST    | |
|  [▶] 2. Requirement Agent    |  |  Execution Results)        |  |  | Task 2: Synt...| |
|      - Subagent 1: Doc Parser|  +----------------------------+  |  |                | |
|      - Subagent 2: Context   |                                  |  |  [ Artifacts ] | |
|      [ Single Primary Button]|  +----------------------------+  |  |  [ Diagnostics]| |
|                              |  | Console Log Drawer (Inline)|  |  +----------------+ |
|  [ ] 3. Test Gen Agent       |  | [All|Info|Status|Error]    |  |                     |
|  [ ] 4. Execution Agent      |  +----------------------------+  |                     |
+------------------------------+----------------------------------+---------------------+
```
