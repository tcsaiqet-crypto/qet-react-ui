# ISS-014 · Agent Detail Drawer — Real Agent Logs & Output Display

**Priority**: 🟡 Medium  
**Status**: Open  
**Feature Area**: Left Rail → AgentDetailDrawer

---

## Problem Statement

`AgentDetailDrawer.tsx` opens when a user clicks a stage in the `AgentPipelineRail`. Currently it shows:
- Generic agent description
- Status badge
- Generic "Overview / Logs / Output" tabs

It does **not** show real data:
1. **Logs tab** — shows placeholder text, not actual agent logs
2. **Output tab** — shows generic fields, not the actual agent output (e.g., extracted test cases, understanding JSON)
3. **Overview tab** — phase/description are hardcoded, not from `appState`

---

## Functional Requirements

### FR-014-A: Logs Tab — Real Agent Logs
Map agent ID → log prefix in backend logs:

| Agent ID | Log Prefix to filter |
| --- | --- |
| `requirement_understanding` | `[UnderstandingAgent]` |
| `test_case_generation` | `[TestCaseAgent]` |
| `playwright_generation` | `[PlaywrightAgent]` |
| `test_data_generation` | `[TestDataAgent]` |
| `report_generation` | `[ReportAgent]` |

Display filtered log lines in drawer logs tab, with timestamps.

### FR-014-B: Output Tab — Real Agent Output
| Agent | Output to Show |
| --- | --- |
| `requirement_understanding` | `understanding.executive_summary`, component count, flow count |
| `test_case_generation` | `test_suite.test_cases` count by category, first 3 cases preview |
| `playwright_generation` | `playwright_scripts` count, script filename list |
| `test_data_generation` | `synthetic_dataset` record count |
| `report_generation` | Links to `quality_report.html` and `quality_report.pdf` |

### FR-014-C: Overview Tab — Real Phase Data
- Show phase: `Intake / Analysis / Generation / Execution / Reporting`
- Show agent completion time (if available in `appState`)
- Show token usage if `provenance` data available
- Show AI provider + model used

### FR-014-D: Jump to Section
Each agent card in the drawer should have a "Jump to Section" link:
- `requirement_understanding` → scroll to UnderstandingPage
- `test_case_generation` → navigate to Execution tab and scroll to case table
- `playwright_generation` → navigate to Execution → open Script modal
- `report_generation` → navigate to Execution → Reports tab

---

## Files to Modify

| File | Change |
| --- | --- |
| `src/components/AgentDetailDrawer.tsx` | Wire real data to logs/output/overview tabs |
| `src/components/AgentPipelineRail.tsx` | Pass `appState` data per agent to drawer |
| `src/App.tsx` | Expose scroll/navigate callbacks to drawer via props |
