# Tasks 013: Live Playwright Execution, Lifecycle Controls & AI Intelligence

## Phase 1: Core Lifecycle & State Machine
- [x] **Task 1.1**: Update `backend/schemas/contracts.py` with `ExecutionStatus.PAUSED` and `ExecutionStatus.STOPPED`.
- [x] **Task 1.2**: Add thread-safe `pause()`, `resume()`, and `stop()` to `ExecutionManager` in `backend/src/services/execution_manager.py`.
- [x] **Task 1.3**: Add `pause_pipeline()`, `resume_pipeline()`, and `stop_pipeline()` to `SequentialQETPipeline` in `backend/src/workflows/pipeline.py`.
- [x] **Task 1.4**: Expose pipeline and execution control REST endpoints in `backend/src/api/fastapi_app.py`.

## Phase 2: Dedicated Script Generation & Headed Runner
- [x] **Task 2.1**: Update `PlaywrightAgent` in `backend/src/agents/playwright_agent.py` to generate dedicated `tests/test_{case_id}_{slug}.py` files for every test case.
- [x] **Task 2.2**: Integrate Page Object Models, fixtures, synthetic data payloads, and ZIP packager.
- [x] **Task 2.3**: Update `ExecutionEngine` in `backend/src/services/execution_engine.py` to enforce `--headed` new desktop window mode.
- [x] **Task 2.4**: Add per-case test runner support with selective `-k` or file execution.

## Phase 3: Visual Screenshot Capture & Storage
- [x] **Task 3.1**: Implement automated screenshot triggers in test execution for positive pass and negative rejection states.
- [x] **Task 3.2**: Persist screenshots in `uploads/{run_id}/artifacts/screenshots/{case_id}_{status}.png`.
- [x] **Task 3.3**: Expose `GET /api/v1/runs/{run_id}/screenshots/{filename}` endpoint in `fastapi_app.py`.
- [x] **Task 3.4**: Build `ScreenshotGallery.tsx` frontend component with thumbnail preview, case-type badges, and fullscreen zoom/download modal.

## Phase 4: Multi-Level JSON Diagnostic Reporting
- [x] **Task 4.1**: Implement `MultiLevelExecutionReport` synthesis in `ExecutionEngine`.
- [x] **Task 4.2**: Record Level 1 Summary, Level 2 Breakdowns (Case Type & Feature Area), and Level 3 Script records (`why_passed`, `why_failed`, failure taxonomy).
- [x] **Task 4.3**: Persist `uploads/{run_id}/artifacts/multi_level_execution_results.json`.
- [x] **Task 4.4**: Build `MultiLevelJsonViewer.tsx` frontend component with interactive hierarchy, search, raw JSON view, Copy JSON, and Download JSON.

## Phase 5: AI Test Intelligence & Script Auto-Healing
- [x] **Task 5.1**: Create `AITestAnalysisService` in `backend/src/services/ai_test_analysis_service.py`.
- [x] **Task 5.2**: Implement `analyze_results()` computing Health Score (0-100), Risk Rating, Defect Distribution, and per-case root causes.
- [x] **Task 5.3**: Implement `modify_script()` generating AI code repairs with explanations and diff summaries.
- [x] **Task 5.4**: Implement `apply_script_fix()` writing healed code to disk and updating run state.
- [x] **Task 5.5**: Build `AITestIntelligencePanel.tsx` and `AIScriptModifierModal.tsx` frontend components.

## Phase 6: Frontend Integration & Verification
- [x] **Task 6.1**: Create `src/components/execution/ExecutionControlsToolbar.tsx` with live status badges.
- [x] **Task 6.2**: Create `src/components/execution/LivePlaywrightRunner.tsx` with filterable test table and 1-click live execution.
- [x] **Task 6.3**: Upgrade `src/components/ExecutionPage.tsx` with tabbed architecture.
- [x] **Task 6.4**: Run full backend pytest suite (129 tests passed).
- [x] **Task 6.5**: Run `npm run build` production build (Vite + TypeScript passed).
