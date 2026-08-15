# Issue Constitution: ISS-007 — Gemini JSON Truncation & Schema Auto-Repair Resilience

## 1. Fundamental Invariants

### 1.1 JSON Integrity & Generation Governance
1. **Strict JSON Schema Mode**: All Gemini model calls intended to generate structured outputs (requirements, test cases, test data, and Playwright execution manifests) MUST specify `response_mime_type: "application/json"` in the `generation_config`.
2. **Never Crash on Incomplete JSON**: If an LLM response is truncated mid-stream due to token exhaustion or network timeout, the parsing pipeline must NEVER throw an unhandled `JSONDecodeError`. It must invoke the multi-pass auto-repair algorithm.
3. **Multi-Pass Auto-Repair Pipeline**:
   - **Pass 1**: Standard `json.loads` parsing.
   - **Pass 2**: Markdown fence stripping (removing ````json ... ````).
   - **Pass 3**: Regex boundary extraction (`{...}` or `[...]`).
   - **Pass 4**: Bracket balancing & trailing comma neutralization (auto-closing unclosed quotes, braces, and arrays).
   - **Pass 5**: Safe deterministic mock schema fallback with explicit warning telemetry.
4. **Token Capacity Ceiling**: Default `max_output_tokens` must be configured to at least `8192` for requirement and test case generation to prevent premature truncation.

## 2. Telemetry & Auditing
- Every invoked auto-repair pass must emit a structured warning to `temp/run_{run_id}.log` noting the repair pass applied.
