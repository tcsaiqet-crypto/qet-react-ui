# Gap Analysis: Stability Hotfix Scope

## Critical Findings

### G1: Active backend import failure blocks test execution
- Location: qet-react-ui/backend/src/api/fastapi_app.py
- Symptom: IndentationError during test collection.
- Impact: FastAPI app cannot load, backend tests cannot run.

### G2: Source-of-truth ambiguity between backend copies
- There are two backend trees used across earlier runs:
  1) qet-react-ui/backend (active project)
  2) QET agents/QET agents (legacy copy)
- Impact: changes can be made in one copy while runtime/tests use the other.

### G3: Requirement categorizer bypasses resilient LLM wrapper path
- Location: qet-react-ui/backend/src/agents/requirement_categorizer.py
- Current behavior includes direct provider HTTP calls with fixed Gemini model usage.
- Impact: avoidable failures when model aliases change or key/model permissions differ.

### G4: Coverage endpoint assertions mostly validate empty state
- Location: backend tests for /coverage
- Impact: non-empty requirement mapping and category coverage correctness are not strongly validated.

## Required Corrections
1. Fix G1 first so backend can run.
2. Enforce one backend source-of-truth path in docs/prompt and execution scripts.
3. Refactor categorizer to reuse LLMService generation/parsing/error contract.
4. Expand coverage tests to verify mapped_test_cases and category percentages with seeded state.
