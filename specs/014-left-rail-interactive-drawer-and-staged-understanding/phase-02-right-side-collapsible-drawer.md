# Phase 02: Right-Side Collapsible Inspector Drawer

## 1. Goal
Implement `src/components/AgentDetailDrawer.tsx` to provide a slide-out / docked inspection pane on the right side of the screen, displaying multi-tab details of the currently selected agent.

---

## 2. Key Components & Tabs

```
+-------------------------------------------------------------+
| [Agent Icon] 1. Requirement Understanding Agent  [x] Close  |
| Phase: Understand &bull; Status: Completed &bull; Step: 1 of 11        |
+-------------------------------------------------------------+
| [Overview & Inputs]  [Subagents]  [Artifacts]  [Actions]     |
+-------------------------------------------------------------+
|                                                             |
|  [Tab Content Area]                                         |
|  - Inputs: Indexed files, MIME types, tokens parsed         |
|  - Subagents: Step progress, live console logs              |
|  - Artifacts: JSON AST tree, 15-point checklist matrix      |
|  - Actions: Re-run stage, download JSON, clear cache       |
|                                                             |
+-------------------------------------------------------------+
| [<< Collapse Drawer]                       [Copy JSON]      |
+-------------------------------------------------------------+
```

### A. Responsive Docking Behavior
- **Desktop ($\ge 1280\text{px}$)**: Docks alongside the center workspace with seamless grid layout without covering main action buttons.
- **Laptop / Tablet ($< 1280\text{px}$)**: Slides out as an overlay sheet with backdrop blur.

### B. Tab Features
1. **Overview & Inputs**: Summary card, input files list with individual file sizes, extraction timestamps.
2. **Subagents & Logs**: Real-time log buffer stream, subagent status badges, execution duration ms.
3. **Artifacts & Checklist**: Interactive JSON tree viewer, 15-point checklist validation results (Pass / Fail / Score).
4. **Actions**: Targeted retry trigger with confirmation modal, artifact export buttons.
