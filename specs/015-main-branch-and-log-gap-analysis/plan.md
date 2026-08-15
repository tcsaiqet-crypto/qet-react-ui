# Architecture & Plan 015: Gap Resolution & Consolidation

## 1. System Map & Component Alignment

```
[ Navigation Header ] (Theme Toggle, Viewport Zoom, Active Provider Badge)
        │
[ Active Process Bar ] (Run ID, Live Stage Progress, Stop Button)
        │
[ Left Rail (AgentPipelineRail) ] ◄──► [ Main Content Area ] ◄──► [ Right Drawer (AgentDetailDrawer) ]
  • Phase 1: Understanding                • HomeUploadPage (2-Lane Drop)    • Overview Tab
  • Phase 2: Test Cases                   • UnderstandingPage (Gaps/UI)     • Artifacts Tab
  • Phase 3: Synthetic Data               • ExecutionPage (Runner/Gallery/  • Execution Tab
  • Phase 4: Playwright Scripts             Multi-Level/AI Panel)           • Action Triggers
  • Phase 5: Execution & Reporting        • AISettingsPanel
                                          • RunsDashboard
        │
[ Console Log Drawer ] (All/Info/Status/Error Levels, Search Highlighting, Auto-Scroll)
```

## 2. Continuous Verification Plan
- Maintain 100% pass rates across all 22 backend pytest test suites and frontend Vitest suites.
- Guarantee clean TypeScript compilation on every build.
