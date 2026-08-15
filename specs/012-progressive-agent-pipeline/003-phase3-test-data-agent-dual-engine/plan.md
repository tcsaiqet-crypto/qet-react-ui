# Plan 003: Phase 3 — Test Data Agent Implementation Strategy

## 1. Technical Strategy
1. **Backend Implementation**:
   - In `backend/src/agents/test_data_agent.py`, implement dual mode:
     - `generate_synthetic_data(state: AppState) -> SyntheticDataset` (Pure LLM-driven generation).
     - `ingest_custom_data(run_id: str, file_content: bytes, filename: str) -> CustomDataset` (CSV/JSON parser with AI column alignment).
   - Expose REST endpoints:
     - `POST /api/v1/runs/{run_id}/test-data/generate` (Generate synthetic AI data).
     - `POST /api/v1/runs/{run_id}/test-data/upload` (Upload custom CSV/JSON).
     - `POST /api/v1/runs/{run_id}/test-data/toggle-mode` (Switch active mode between synthetic vs custom).
2. **Frontend Component Architecture**:
   - Create `src/components/TestDataAgentCard.tsx` with:
     - Header + Right-Side Sub-Agent Step Rail (1. Schema Extraction -> 2. AI Synthetic Generation -> 3. Custom Intake & Transformation).
     - Mode Toggle Switch (`AI Synthetic` vs `Custom Uploaded`).
     - Data Table / JSON Editor.
     - Bottom CTA: `"Generate Playwright Automation Scripts →"`.
3. **State Transitions & Auto-Collapse**:
   - Track `test_data_status: 'idle' | 'generating' | 'ready' | 'error'`.
   - Implement smooth auto-collapse on clicking `"Generate Playwright Automation Scripts →"`.

## 2. Component Mapping
- `backend/src/agents/test_data_agent.py`: Specialist test data agent.
- `src/components/TestDataAgentCard.tsx`: UI component for Test Data Hub.

## 3. Verification Criteria
- [x] Pure AI synthetic data generates without any fallback or hardcoded sample data.
- [x] Drag-and-drop CSV upload parses rows and binds them to test case keys.
- [x] Toggle switch instantly switches active execution dataset between Synthetic and Custom.
- [x] Bottom CTA triggers Phase 3 collapse and advances to Phase 4.
