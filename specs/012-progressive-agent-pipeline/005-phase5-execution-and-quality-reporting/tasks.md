# Tasks 005: Phase 5 Actionable Checklist

## Backend Execution & Reporting Services
- [ ] Implement Playwright runner subprocess execution with non-production checks.
- [ ] Implement failure screenshot and DOM snapshot capture on error.
- [ ] Implement Executive Quality Report synthesis with Go/No-Go signoff recommendation.
- [ ] Expose endpoint `GET /api/v1/runs/{run_id}/report/download` to download HTML/PDF report.

## Sub-Agents Execution Pipeline
- [ ] Sub-Agent 5.1: Playwright Test Runner.
- [ ] Sub-Agent 5.2: Defect & Evidence Collector.
- [ ] Sub-Agent 5.3: Executive Summary & Quality Scorer.

## UI Component & Verification
- [ ] Create `ExecutionReportCard.tsx` with right-hand sub-agent step rail.
- [ ] Render live progress telemetry bar and terminal log stream.
- [ ] Render Defect Gallery with screenshot zoom modal.
- [ ] Render Executive Summary card with sign-off badge and download report action.
