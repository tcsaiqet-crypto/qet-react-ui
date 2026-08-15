# Phase 01: Interactive Left Vertical Rail

## 1. Goal
Transform `src/components/AgentPipelineRail.tsx` from a static vertical list into an interactive agent navigator with active stage selection, phase filtering, and rich step indicators.

---

## 2. Key Changes

### A. Stage Selection & Active States
- Add `selectedAgentId: string | null` and `onSelectAgent: (agentId: string) => void` props to `AgentPipelineRail`.
- Apply active styling when `stage.id === selectedAgentId`:
  - Glowing accent border (`border-[var(--qet-accent)]`).
  - Elevated shadow (`shadow-md shadow-blue-500/10`).
  - Active indicator dot / pill next to the stage name.

### B. View Mode Switcher
- Add a segmented toggle in the rail header:
  - **"3 Understanding Agents"** (Focused view during intake & synthesis).
  - **"Full Pipeline (11)"** (Complete end-to-end execution flow).
- Default to **Understanding Focus** when the run is in `idle`, `uploading`, or `understanding_ready` status, and auto-expand to **Full Pipeline** when pipeline execution begins.

### C. Subagent Pulse & Progress
- Running subagents display an animated pulsing dot and live elapsed duration counter.
- Completed subagents display green checkmark icons with file/artifact count badges.
