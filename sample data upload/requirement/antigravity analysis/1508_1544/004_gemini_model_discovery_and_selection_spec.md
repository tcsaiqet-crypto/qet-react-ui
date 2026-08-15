# 004 Gemini 3.7 Flash Discovery & Reasoning Tier Specification

**Date**: 2026-08-15  
**Timestamp**: 15:44 / 16:13 Update  
**Target Scope**: Model Selection, Gemini 3.7 Flash (Low / Medium / High) Thinking Tiers, Runtime Key Rotation  

---

## 1. Overview & Flagship Model Strategy

The platform standardizes on **Gemini 3.7 Flash** as the default flagship foundation model, leveraging its hybrid thinking budget architecture to tailor reasoning depth to each pipeline phase:

1. **Gemini 3.7 Flash (Low)**:
   - **Thinking Budget**: ~1,024 tokens.
   - **Characteristics**: Low latency (~1.5s), immediate response.
   - **Agents**: Fast AST parsing, intake manifest extraction, UI label verification.

2. **Gemini 3.7 Flash (Medium)** [Default]:
   - **Thinking Budget**: ~4,096 tokens.
   - **Characteristics**: Balanced deliberate reasoning (~3-5s).
   - **Agents**: Requirement understanding, 5-category test case synthesis, synthetic test dataset generation.

3. **Gemini 3.7 Flash (High)**:
   - **Thinking Budget**: ~16,384 tokens.
   - **Characteristics**: Deep step-by-step reasoning (~8-12s).
   - **Agents**: Playwright script code generation, complex assertions, execution failure root cause diagnostics, and auto-healing repair.

---

## 2. Dynamic Model Discovery Engine

### A. API Endpoints & Discovery Heuristics
* Backend endpoint `GET /api/v1/ai/models` queries available API keys and provides candidate tiers:
  - `gemini-3.7-flash-high` (`Gemini 3.7 Flash (High)`)
  - `gemini-3.7-flash-medium` (`Gemini 3.7 Flash (Medium)`)
  - `gemini-3.7-flash-low` (`Gemini 3.7 Flash (Low)`)
  - `gpt-4o-mini` (`OpenAI GPT-4o-mini`)

### B. Header Model Selector
- A top navigation bar dropdown enables instantaneous runtime switching across the 3 Gemini 3.7 Flash thinking tiers without requiring full settings page navigation.

---

## 3. Fallback & Resilience Strategy
- **Round-Robin Multi-Key Rotation**: Automatically rotates configured Gemini API keys on 429 quota exhaustion.
- **Thinking Tier Fallback**: If `High` tier experiences latency spikes or rate limits, auto-fall back to `Medium` or `Low`, followed by local AST rule generation.
