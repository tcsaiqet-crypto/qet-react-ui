# Constitution: AI Model Safety and Key Rotation Invariants

## 1. Key Masking & Storage Safety
- Raw API keys must never be logged or transmitted in plain-text status endpoints.
- UI displays only masked key identifiers (e.g. `AIzaSy...4F8x`).

## 2. Dynamic Model Fallback Bounds
- If the selected Gemini model (`gemini-2.5-pro`) encounters a 429 quota exhaustion, the system automatically attempts key rotation, then falls back to `gemini-2.5-flash` or `gemini-1.5-pro`, and finally to deterministic AST rule generation without crashing the pipeline.
