# Spec: Dynamic Model Discovery and Gemini 3.7 Flash (Low / Medium / High) Switcher

## 1. Functional Specifications

### A. Gemini 3.7 Flash Model & Thinking Tiers
The system uses **Gemini 3.7 Flash** (`gemini-3.7-flash`) as the core flagship model, supporting configurable reasoning/thinking tiers:

1. **Gemini 3.7 Flash (Low)**:
   - **Thinking Budget**: ~1,024 tokens (or minimal thinking).
   - **Use Case**: Fast requirement categorization, AST intake parsing, low-latency UI responsiveness.
   - **Latency**: Ultra-fast (~1.5s).

2. **Gemini 3.7 Flash (Medium)** (Default):
   - **Thinking Budget**: ~4,096 tokens.
   - **Use Case**: Balanced requirement understanding, test step generation, synthetic data synthesis.
   - **Latency**: Optimal balance (~3-5s).

3. **Gemini 3.7 Flash (High)**:
   - **Thinking Budget**: ~16,384 tokens (Deep Reasoning).
   - **Use Case**: Complex Playwright UI test generation, self-correction repair, root cause analysis on failed execution traces.
   - **Latency**: Deep deliberate reasoning (~8-12s).

---

### B. Dynamic Model Discovery & Header Switcher
1. **Header Switcher**:
   - A dropdown in the top header allows instant switching between:
     - `Gemini 3.7 Flash (High)`
     - `Gemini 3.7 Flash (Medium)` [Recommended]
     - `Gemini 3.7 Flash (Low)`
     - `OpenAI GPT-4o-mini`
2. **Auto-Fallback**:
   - If `Gemini 3.7 Flash (High)` encounters rate limits (429), automatically rotates keys and falls back to `Gemini 3.7 Flash (Medium)` or `Gemini 3.7 Flash (Low)`.
