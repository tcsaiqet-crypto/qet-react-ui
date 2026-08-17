# Constitution: Spec 026 — Non-Negotiable Invariants, Guardrails & Quality Rules

## Core Principles

These rules are architectural invariants. Any implementation that violates them is **rejected**, regardless of whether it "works."

---

## I. Token Budget Guardrails

### Rule T-01: Maximum Tokens Per Full Pipeline Run
```
Target: ≤ 20,000 tokens per complete 6-agent pipeline run
Hard limit: ≤ 35,000 tokens (pipeline MUST abort with error if exceeded)
```
**Enforcement**: LangChain callback `TokenCounterCallback` tracks cumulative tokens. If `total_tokens > 35,000` at any node, throw `TokenBudgetExceededException` and checkpoint the last completed node.

---

### Rule T-02: Mandatory Model Routing Table
No LLM call may be made without specifying the task name in `QETModelRouter`. The routing table is the single source of truth for which model handles which task.

```
flash_lite MUST be used for:  coverage_planning, alignment_critique, schema_design,
                               risk_scoring, log_annotation, failure_classify, br_risk_heatmap

flash MUST be used for:       brd_extraction, batch_generation, data_population,
                               pom_generation, script_synthesis, root_cause, next_step_advice,
                               screenshot_eval (multimodal)

pro MUST be used for:         exec_summary (and ONLY exec_summary)
```

Violation: Using `pro` for a task mapped to `flash_lite` is a **build blocker**.

---

### Rule T-03: Batch Size is Fixed at 5
- Agent 2b MUST always send exactly 5 test cases per AI call.
- Agent 3 and Agent 4 MUST process in batches of 5 (group 5 cases per AI call, not 1 at a time).
- Exception: if fewer than 5 cases remain, the final batch may be smaller.

---

### Rule T-04: State Sharing — No Re-Reading Upstream Data
- No agent downstream of Agent 1 may re-read `requirement1.txt` or the uploaded ZIP.
- All downstream agents MUST read from `QETGraphState` fields populated by earlier nodes.
- Violation: any `open(file)` call for source/BRD files inside Agent 2 through 6 is **rejected**.

---

## II. Alignment & Quality Invariants

### Rule A-01: 100% BR Traceability in Final Test Suite
Every `AlignedTestCase` in `state.final_test_suite` MUST have a `requirement_id` that:
- Is non-empty
- Matches the pattern `^BR-\d{2}$`
- Exists as an ID in `state.requirements`

A test case without a valid `requirement_id` is **invalid** and must be rejected by the Alignment Critic.

---

### Rule A-02: Alignment Score Threshold
- The Alignment Critic MUST compute `alignment_score = valid_cases / total_cases`.
- If `alignment_score < 0.90`: the batch MUST be rejected and sent back to the generator.
- If `critique_iteration ≥ 3` and score is still < 0.90: raise `AlignmentThresholdException` and surface error to user (do NOT silently proceed with low-quality test cases).

---

### Rule A-03: Forbidden Terms in Test Cases
The following terms MUST NOT appear in any `title`, `steps`, or `expected_result` field:

```
["SQLite", "Streamlit", "session token", "ORM", "database schema", "pytest",
 "conftest", "FastAPI route", "uvicorn", "React component", "useState", "useEffect",
 "TypeScript interface", "Pydantic model", "LangGraph node"]
```

These are internal implementation details. All test case language must be in the vocabulary of a CFA candidate, exam center operator, or CFA Institute administrator.

---

### Rule A-04: Every BR Must Have ≥1 Test Case
If any `BusinessRequirement` in `state.requirements` has zero test cases after alignment check, the Alignment Critic MUST reject the batch with reason: `"No coverage for {requirement_id}"`.

---

## III. Synthetic Data Integrity Rules

### Rule D-01: No Real PII
The `TestDataAgent` and all AI-driven data generation MUST NEVER produce:
- Real Social Security Numbers (format 999-XX-XXXX is a test-reserved range)
- Real credit card numbers (only Luhn-valid test PANs from ranges: 4111..., 5500..., etc.)
- Real passport IDs
- Real email addresses from non-fictional domains (only `@example.com`, `@test.cfa.local`, `@synthetic.qa`)
- Real phone numbers

Any violation is a **critical compliance failure** — not just a code quality issue.

---

### Rule D-02: `is_synthetic = True` on Every Record
Every generated data record MUST have `is_synthetic: True` at the root level. This flag is checked before any record enters the execution pipeline.

---

### Rule D-03: Schema Must Match Test Case Intent
The data schema designed by Subagent 3a MUST be specific to the test case's `requirement_id` and `feature_area`. A payment test case MUST have payment-specific fields. A KYC test case MUST have identity document fields.

A generic `{username, password, ssn, income}` schema applied to a `BR-08 Proctoring` test case is a quality violation.

---

## IV. Playwright Script Rules

### Rule S-01: No UNRESOLVED-SELECTOR Markers
The final Playwright scripts written by Subagent 4b MUST contain zero `UNRESOLVED-SELECTOR:*` strings. Any script containing this marker MUST NOT be included in the output package.

---

### Rule S-02: POM-First Architecture
All selectors in test scripts MUST come from the Page Object Model (`cfa_pages.py`) generated by Subagent 4a. Direct hardcoded CSS selectors in test files are **forbidden** (except in the POM itself).

---

### Rule S-03: Synthetic Data Injection via Fixtures
Test scripts MUST read test data from the fixture (`conftest.py`) using keys like `test_data["TC-POS-001"]`, not from hardcoded values. This enables data-driven re-runs.

---

## V. LangGraph Operational Rules

### Rule G-01: Checkpointing is Mandatory
The SQLite checkpointer MUST be attached to the compiled graph. `workflow.compile()` called without a `checkpointer` is **forbidden in production**.

---

### Rule G-02: Max 3 Critic Iterations
The Alignment Critic loop MUST have a hard `max_iterations = 3` guard. If iteration exceeds 3, `should_refine()` MUST return `"proceed"` regardless of alignment score, and a `LOW_CONFIDENCE` flag MUST be set on `state.alignment_report`.

---

### Rule G-03: Node Functions Are Pure
Every LangGraph node function MUST:
- Accept exactly one argument: `state: QETGraphState`
- Return a `dict` containing only the fields it modified
- Contain no mutable global state
- Be independently testable with a mock `QETGraphState`

---

## VI. API Key Management Rules

### Rule K-01: Random Key Selection for Parallel Dispatch
Agent 2b MUST use `random.sample(key_pool, min(5, len(key_pool)))` to select keys. Never use the same key for 2 batches in the same run.

---

### Rule K-02: Immediate Failover on 429 or Timeout
Any `429 ResourceExhausted` or `TimeoutError` response MUST immediately:
1. Mark the current key as `exhausted` for this run (not globally disabled)
2. Pick the next available key from the pool
3. Retry the same batch (max 1 retry per batch per key)
4. Log `{batch_id, key_index, error_type, fallback_key_index}` to `AppState.provenance`

---

### Rule K-03: Cross-Provider Fallback Order
```
Gemini Flash → Gemini Flash Lite → Gemini Pro → OpenAI GPT-4o-mini → OpenAI GPT-4o
```
Never skip tiers. Never go from Flash directly to Pro without trying Flash Lite first.

---

### Rule K-04: Key Pool Minimum
The system MUST have at least 2 API keys configured to proceed with the pipeline. If fewer than 2 keys are available, display error: *"Minimum 2 API keys required for parallel batch generation. Please add keys in AI Settings."*

---

## VII. Frontend Contract Rules

### Rule F-01: Agent 5 Risk Scores Must Be Displayed Before Execution
The `🟢/🟡/🔴` risk badge from Agent 5a MUST be rendered on each test case row in the Execute Workspace **before** the user clicks "Start Execution". The UI MUST NOT start execution until risk scores are loaded.

---

### Rule F-02: AI Annotations Are Non-Blocking
Live log annotations from Agent 5b MUST be streamed to a separate "AI Commentary" panel — they MUST NOT replace or block the raw log stream. Both panels are shown simultaneously.

---

### Rule F-03: Dashboard AI Content Must Be Timestamped
Every AI-generated text block in the HTML/PDF report (executive summary, root cause, next steps) MUST include the generation timestamp and model used (e.g., `Generated by Gemini Pro at 2026-08-17 07:30 UTC`).
