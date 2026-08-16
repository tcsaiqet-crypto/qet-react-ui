# Task Breakdown: Spec 025 — LangGraph Multi-Agent Architecture & Business Alignment Pipeline

## Phase 1: Deep Requirement Ingestion & Understanding Update
- [ ] **Task 1.1**: Update `UnderstandingAgent` to read full content of `.txt`, `.md`, and `.pdf` files from `uploads/{run_id}/documents/`.
- [ ] **Task 1.2**: Implement `BRDParser` utility to extract discrete `BR-01` through `BR-18` items with titles, scope, and acceptance criteria.
- [ ] **Task 1.3**: Update `backend/src/prompts/understanding_v4.py` to prioritize business acceptance criteria over source code file structures.
- [ ] **Task 1.4**: Unit test `UnderstandingAgent` against `requirement1.txt` to verify all 18 requirements are extracted into `AppState.understanding.requirements`.

## Phase 2: LangGraph Orchestration & Critic Node
- [ ] **Task 2.1**: Implement `backend/src/workflows/langgraph_pipeline.py` using `langgraph` (or state-graph engine fallback).
- [ ] **Task 2.2**: Implement `AlignmentCriticAgent` (`backend/src/agents/alignment_critic_agent.py`) to detect:
  - Framework leaks (`Streamlit`, `SQLite`, `pytest`, `DOM testids`).
  - Missing `requirement_id` mapping.
  - Distribution across all 5 test types (Positive, Negative, Boundary, Validation, Error-Handling).
- [ ] **Task 2.3**: Configure conditional edge `should_refine_test_cases` in LangGraph:
  - If `alignment_score < 0.90` and `critique_iteration < 3`: route back to `TestCaseAgent` with specific critique feedback.
  - Else: proceed to `TestDataAgent`.
- [ ] **Task 2.4**: Unit test the critic loop with intentional framework leaks to confirm self-healing refinement.

## Phase 3: Contextual Test Data Generation & Scripts
- [ ] **Task 3.1**: Update `TestDataAgent` to ingest `TestCase.requirement_id` and produce domain records (Candidates, KYC documents, Cards, Exam Appointments).
- [ ] **Task 3.2**: Update `PlaywrightAgent` to generate test scripts asserting business flows (e.g. verifying onboarding welcome screen, payment confirmation receipt, score report summary).
- [ ] **Task 3.3**: Validate that `<TestDataModal />` in React UI renders clean business mock records.

## Phase 4: UI & Telemetry Integration
- [ ] **Task 4.1**: Expose LangGraph node progression events on FastAPI WebSocket endpoint `/api/v1/runs/{run_id}/pipeline/events`.
- [ ] **Task 4.2**: Render `100% BRD Grounded` badge and linked `BR-XX` pill on `<TestCaseRow />` components.
- [ ] **Task 4.3**: End-to-end smoke test on local server (`http://localhost:5173`).
