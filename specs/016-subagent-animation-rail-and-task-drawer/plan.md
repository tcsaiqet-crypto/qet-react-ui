# Plan: Subagent Animation Rail & Task Inspector Architecture

## 1. Left-Side Animation Rail Implementation
- Component: `src/components/AgentPipelineRail.tsx`
- Layout: Vertical stack of 5 cards with nested subagent rows.
- Dynamic States:
  - `active`: Glowing accent border with pulsating live badge and expanded subagents list.
  - `completed`: Compact 48px height, green check icon, muted sub-details.
  - `pending`: Outline border, low opacity.
- Auto-Scroll Engine: A `useEffect` in `AgentPipelineRail.tsx` watches `activeStageIndex`. When it changes, `document.getElementById('agent-card-' + activeStageIndex)?.scrollIntoView({ behavior: 'smooth', block: 'center' })` triggers smoothly.

## 2. Right-Side Inspector Drawer Synchronization
- Component: `src/components/AgentDetailDrawer.tsx`
- Adds a **"Subagent Tasks"** tab displaying live task items for the active/selected subagent with progress bars and duration counters.
