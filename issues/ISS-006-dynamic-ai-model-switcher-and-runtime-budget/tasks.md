# Task Breakdown & Verification: ISS-006

## 1. Implementation Tasks
- [x] **T-6.1**: Implement `GET /api/v1/ai/models` endpoint returning discovered models and capabilities.
- [x] **T-6.2**: Implement `POST /api/v1/ai/active-model` endpoint in `fastapi_app.py` to mutate `llm_service` runtime config.
- [x] **T-6.3**: Add UI header dropdown in `src/App.tsx` showing model names and thinking budget pills.
- [x] **T-6.4**: Implement multi-key automatic fallback loop with exponential backoff on 429 rate limits.

## 2. Verification Milestones
- [x] **V-6.1**: Query `GET /api/v1/ai/models` — confirm array of valid models returned.
- [x] **V-6.2**: Switch model to `gemini-3.7-flash` with 8192 thinking budget — verify subsequent LLM agent calls use updated parameters without server reboot.
- [x] **V-6.3**: Simulate 429 quota exhaustion on key #1 — verify seamless fallback to key #2.
