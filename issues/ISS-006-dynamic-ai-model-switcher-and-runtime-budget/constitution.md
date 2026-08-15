# Issue Constitution: ISS-006 — Dynamic AI Model Switcher & Runtime Thinking Budget

## 1. Fundamental Invariants

### 1.1 Model Discovery & Switching Rules
1. **Zero Backend Restart**: Switching the active AI model or thinking budget tier MUST be dynamic via API state update (`POST /api/v1/ai/active-model`) without requiring a server reboot or pipeline state loss.
2. **Deterministic Discovery**: The model discovery endpoint (`GET /api/v1/ai/models`) must introspect both environment variables and Google GenAI APIs to return only currently validated, available models.
3. **Thinking Budget Mapping**:
   - `Low` / `Draft`: `1024` tokens (fast response, simple parsing).
   - `Medium` / `Standard`: `4096` tokens (recommended default for multi-step reasoning).
   - `High` / `Deep Reasoning`: `8192` tokens (complex AST & full Playwright script generation).
4. **Transparent Multi-Key Failover**: If an API key encounters HTTP 429 / quota exhaustion, the engine must silently rotate to the next key in the pool without dropping active agent context.

## 2. Default Fallbacks
- If no Gemini key is active: Fall back to local mock deterministic engine and display clear setup banner in header.
