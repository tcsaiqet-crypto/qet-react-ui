# Plan 002: Phase 2 — Implementation Strategy & Bug Fixes

## 1. Technical Strategy & Robustness Fixes
1. **Fix Token Truncation in Backend**:
   - In `backend/src/services/llm_service.py`, update `AGENT_MODEL_POLICIES["test_cases"]` to set `max_output_tokens=8000` (up from 3,000).
   - In `backend/src/prompts/test_cases_v2.py`, optimize the prompt to request 8–12 concise, high-impact cases with compact step descriptions to keep response size optimal (~2,500–3,500 tokens).
2. **Parser Error Recovery**:
   - In `backend/src/agents/test_case_agent.py`, use `LLMService.parse_json_payload_with_diagnostics` with automatic trailing comma removal and unclosed bracket repair.
3. **Frontend Component Architecture**:
   - Create/Update `src/components/TestCaseGeneratorCard.tsx` with:
     - Header + Right-Side Sub-Agent Step Rail (1. Flow Extraction -> 2. Scenario Synthesis -> 3. Traceability Mapping).
     - Discipline Switcher Tabs (UI active, API/A11y/Perf Coming Soon).
     - Filterable Test Case Table / Cards (Filter by Positive/Negative/Boundary, Search by Title).
     - Bottom CTA: `"Run Test Data Agent →"`.
4. **State Transitions & Auto-Collapse**:
   - Update `AppState` to track `test_suite_status: 'idle' | 'running' | 'ready' | 'error'`.
   - Implement smooth auto-collapse on clicking `"Run Test Data Agent →"`.

## 2. Component Mapping
- `backend/src/agents/test_case_agent.py`: Specialist test case synthesis agent.
- `backend/src/prompts/test_cases_v2.py`: Prompt builder.
- `backend/src/services/llm_service.py`: LLM policy with 8k token limit.
- `src/components/TestCaseGeneratorCard.tsx`: UI Test Case Suite component.

## 3. Verification Criteria
- [x] Test Case Agent completes with HTTP 200 without JSON truncation or parsing errors.
- [x] Returns 8–12 validated test cases with requirement traceability IDs and synthetic data keys.
- [x] Discipline tabs allow inspecting UI suite and viewing Coming Soon previews.
- [x] Bottom CTA triggers Phase 2 collapse and advances to Phase 3.
