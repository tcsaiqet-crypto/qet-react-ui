# Tasks 002: Phase 2 Actionable Checklist

## Backend Bug Fix & Token Ceiling
- [ ] Update `llm_service.py` policy for `test_cases` to `max_output_tokens=8000`.
- [ ] Optimize `test_cases_v2.py` prompt template for concise JSON output.
- [ ] Enhance `test_case_agent.py` with unclosed bracket repair and structured error handling.
- [ ] Verify test case synthesis against real CFA requirement and component inputs.

## Sub-Agents Execution Pipeline
- [ ] Sub-Agent 2.1: Implement Scenario & Boundary Synthesizer (Positive, Negative, Boundary, Validation).
- [ ] Sub-Agent 2.2: Implement Traceability & Coverage Mapper (link test cases to requirement IDs).
- [ ] Sub-Agent 2.3: Implement Discipline Suite Formatter (UI Active + API/A11y/Perf stubs).

## UI Component & Progressive Progressive Collapse
- [ ] Create/Update `TestCaseGeneratorCard.tsx` with right-hand sub-agent step rail.
- [ ] Render 4 discipline suite tabs (UI Testing Active, 3 Coming Soon).
- [ ] Implement search bar, case-type filter pills (Positive/Negative/Boundary), and JSON/CSV export buttons.
- [ ] Add bottom CTA: `"Run Test Data Agent →"`.
- [ ] Implement auto-collapse and auto-scroll to Phase 3 on CTA click.
