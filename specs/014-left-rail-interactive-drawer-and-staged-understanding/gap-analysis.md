# Gap Analysis (Spec-Kit 014)

## 1. High-Level Problem Statement
The current implementation renders a static vertical list of 11 pipeline stages on the left (`AgentPipelineRail.tsx`), alongside a single vertically scrolling center content column. The intended user experience specified a dynamic **3-Agent staged understanding sequence**, interactive selection of any agent from the left sidebar, and a **right-side collapsible inspector window/drawer** allowing operators to inspect intermediate artifacts, live subagent logs, AST extractions, and requirement checklist matrices.

---

## 2. Detailed Gap Scope Matrix

| Gap ID | Area | Current Reality | Planned / Expected State | Impact & Severity |
| :--- | :--- | :--- | :--- | :--- |
| **GAP-01** | **Left-Rail Interactivity** | Static `<div>` cards without click handlers, active selection border, or inspection hooks. | Clickable agent stages with clear active/selected state (`selectedAgentId`), keyboard navigation, and status badges. | **High** &bull; Prevents operator from inspecting specific agent details. |
| **GAP-02** | **Right-Side Collapsible Drawer** | Non-existent. Details are either buried in vertical accordions or split across separate tabs. | Collapsible / dockable right-side inspector window with tabs for **Inputs**, **Live Subagent Logs**, **Outputs/Artifacts**, and **Actions**. | **Critical** &bull; Core architectural gap in agent visibility. |
| **GAP-03** | **3-Agent Progressive Scope** | Left rail immediately displays all 11 stages (`3 of 11 complete`) before pipeline kickoff. | Pre-pipeline phase focuses exclusively on the **3 Understanding Agents** (Requirement Understanding $\rightarrow$ Document Intake $\rightarrow$ Application Understanding), dynamically expanding to 11 stages only upon pipeline activation. | **Medium-High** &bull; Causes visual clutter and cognitive overload. |
| **GAP-04** | **Staged Hero UX Transitions** | Upload cards for Docs and Codebase ZIP sit side-by-side in `HomeUploadPage.tsx`. | **Agent 1** (Docs) is the prominent Hero; upon completion it shrinks into a top summary and **Agent 2** (Codebase) becomes the active Hero; once unpacked, **Agent 3** takes center stage for AI synthesis. | **High** &bull; Missing the orchestrated staged hero flow. |
| **GAP-05** | **Artifact Deep-Linking & Inspection** | Artifacts (parsed docs, AST component list, 15-point checklist matrix) are only visible inside specific page subsections. | Selecting an agent in the left rail or clicking an artifact chip immediately opens and focuses that artifact in the right drawer/inspector. | **Medium** &bull; Disconnected artifact discovery experience. |
| **GAP-06** | **Targeted Stage Retry / Reset** | Retry buttons exist only as small icons inside upload cards on the Home tab. | Left rail and right drawer both provide stage-specific retry/reset actions with downstream dependency invalidation alerts. | **Medium** &bull; Hard to re-trigger failed or modified stages. |

---

## 3. Root Cause Analysis

1. **Monolithic Component Layout**:
   `src/App.tsx` directly renders `<AgentPipelineRail />` and switches between full-page tabs without maintaining a global `selectedAgentId` or providing a right-side docked inspector.
2. **Disconnected State Resolution**:
   `resolveAgentFlow` calculates overall pipeline statuses but does not expose selection state, detailed artifact manifests per stage, or subagent log buffers to a dedicated inspector.
3. **Premature 11-Stage Rail Expansion**:
   `agentStages` array is unconditionally mapped in the left rail instead of rendering a phase-scoped view that distinguishes between the **Intake & Understanding Phase** (Stages 1–3) and the **Execution & Reporting Phase** (Stages 4–11).
