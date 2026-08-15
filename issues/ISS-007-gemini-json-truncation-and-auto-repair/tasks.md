# Task Breakdown & Verification: ISS-007

## 1. Implementation Tasks
- [x] **T-7.1**: Configure `response_mime_type: "application/json"` across all Gemini API calls in `backend/src/services/llm_service.py`.
- [x] **T-7.2**: Implement 5-pass `repair_json` function with regex boundary extraction and brace balancing.
- [x] **T-7.3**: Increase default `max_output_tokens` to `8192` in agent prompt runners.
- [x] **T-7.4**: Add unit tests in `backend/tests/` covering truncated JSON string inputs.

## 2. Verification Milestones
- [x] **V-7.1**: Pass malformed/truncated JSON snippets to `repair_json` — verify all return valid Python objects.
- [x] **V-7.2**: Run end-to-end test case generator with complex 10-requirement document — confirm 0 JSON parse exceptions.
