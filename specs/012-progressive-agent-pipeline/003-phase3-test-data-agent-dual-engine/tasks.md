# Tasks 003: Phase 3 Actionable Checklist

## Backend Dual-Engine Test Data Service
- [ ] Implement `TestDataAgent.generate_synthetic_data` using pure LLM synthesis (no static sample data fallback).
- [ ] Implement `TestDataAgent.ingest_custom_data` to parse user CSV/JSON and match columns to test case parameter keys.
- [ ] Implement endpoint `POST /api/v1/runs/{run_id}/test-data/upload`.
- [ ] Implement endpoint `POST /api/v1/runs/{run_id}/test-data/toggle-mode`.

## Sub-Agents Execution Pipeline
- [ ] Sub-Agent 3.1: Implement Data Schema & Fixture Extractor.
- [ ] Sub-Agent 3.2: Implement Pure AI Synthetic Generator.
- [ ] Sub-Agent 3.3: Implement Custom Dataset Intake & AI Transformer.

## UI Component & Progressive Collapse
- [ ] Create `TestDataAgentCard.tsx` with right-hand sub-agent step rail.
- [ ] Implement interactive toggle switch: `[AI Synthetic Data]` ⇄ `[Custom Uploaded Data]`.
- [ ] Implement drag-and-drop CSV/JSON upload dropzone.
- [ ] Render data grid table with inline edit, search, and CSV download.
- [ ] Add bottom CTA: `"Generate Playwright Automation Scripts →"`.
- [ ] Implement auto-collapse and auto-scroll to Phase 4 on CTA click.
