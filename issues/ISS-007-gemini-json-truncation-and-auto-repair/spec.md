# Specification: ISS-007 — Gemini JSON Truncation & Schema Auto-Repair Resilience

## 1. Problem Statement
When generating extensive test suites (e.g. 20+ test cases with detailed Playwright steps), large JSON payloads occasionally hit token limits or omitted closing brackets, causing standard `json.loads` in Python to crash the pipeline stage.

## 2. User Stories
- **US-1**: As an end user running large specifications, I want test case generation to complete reliably without failing due to unclosed JSON braces.
- **US-2**: As an AI service layer, I want automated schema repair heuristics to salvage partially generated objects rather than discarding the entire response.
- **US-3**: As a developer inspecting logs, I want full visibility into when an LLM output required auto-repair.

## 3. Functional Requirements
1. **Gemini Configuration Hardening**:
   - Set `response_mime_type: "application/json"`.
   - Expand `max_output_tokens` to `8192`.
2. **Auto-Repair Engine**:
   - `repair_json(raw_text: str) -> dict | list`: Sequentially executes 5-pass salvage heuristics.
   - Fixes unclosed strings by scanning for unescaped `"` and appending `"]}` or `}"`.
   - Strips trailing commas preceding closing `}` or `]`.
3. **Graceful Degradation**:
   - If repair is impossible, synthesize a valid default payload conforming to the stage's Pydantic schema and log a critical remediation alert.

## 4. Acceptance Criteria
- [x] Input with truncated closing `]}` is successfully repaired and parsed into a valid Python dict/list.
- [x] Markdown wrapped payloads ````json { "key": "val" } ```` parse cleanly without errors.
- [x] Pipeline stage completes successfully even under synthetic truncated LLM responses.
