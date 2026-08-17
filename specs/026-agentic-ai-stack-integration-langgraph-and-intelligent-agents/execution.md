# Execution Plan: Spec 026 — Implementation Phases & Task Order

## Phase Overview

```
Phase 1: Foundation (Days 1-2)     → Install packages, define GraphState, scaffold nodes
Phase 2: Agent 1 Upgrade (Days 3-4) → Deep BRD extraction, UI semantic mapping, traceability
Phase 3: Agent 2 Upgrade (Day 5)    → Coverage planner + parallel batch generator + critic loop
Phase 4: Agent 3 AI (Day 6)         → Schema Architect + Data Populator + Boundary Inflator
Phase 5: Agent 4 AI (Days 7-8)      → POM Architect + Script Synthesizer + Self-Healer wiring
Phase 6: Agent 5 AI (Day 9)         → Risk scanner, live log interpreter, screenshot validator
Phase 7: Agent 6 AI (Day 10)        → Executive narrative, root cause, BR heatmap, next steps
Phase 8: Integration & Testing (Days 11-12) → End-to-end run, token budget verification
```

---

## Phase 1: Foundation — LangGraph & LangChain Setup

### Tasks

- [ ] **1.1** Install Python dependencies:
  ```bash
  pip install langgraph langchain langchain-core langchain-google-genai langchain-openai pydantic==2.*
  ```
  Add to `backend/requirements.txt`.

- [ ] **1.2** Create `backend/src/workflows/graph_state.py`:
  - Define `QETGraphState` TypedDict with all fields for all 6 agent stages.
  - Define `BusinessRequirement`, `CoveragePlan`, `AlignedTestCase`, `DataSchema`, `RiskScore` Pydantic models.

- [ ] **1.3** Create `backend/src/workflows/model_router.py`:
  - Implement `QETModelRouter` with the route map (task → model tier).
  - Wrap existing `LLMService` so it accepts a `task_name` and auto-routes to the correct model.

- [ ] **1.4** Create `backend/src/workflows/langgraph_pipeline.py`:
  - Define the `StateGraph`, add all 8 nodes (stub functions initially), and wire edges.
  - Add `SqliteSaver` checkpointer pointing to `uploads/{run_id}/checkpoints.db`.
  - Compile the graph and expose `run_pipeline(run_id, initial_state)` function.

- [ ] **1.5** Update `backend/src/api/fastapi_app.py`:
  - Replace `_execute_pipeline_task()` to call `run_pipeline()` instead of the old sequential agent chain.
  - Add WebSocket endpoint `/api/v1/runs/{run_id}/pipeline/graph-events` to stream LangGraph node events.

**Acceptance Criteria**: Running `workflow.invoke(initial_state)` completes all 6 stub nodes and writes checkpoint to SQLite without error.

---

## Phase 2: Agent 1 — Deep Understanding Upgrade

### Tasks

- [ ] **2.1** Create `backend/src/agents/brd_extractor.py`:
  - Read full text of every uploaded `.txt`, `.pdf`, `.md` document.
  - Use LangChain LCEL chain: `brd_prompt | flash_model | PydanticOutputParser(BusinessRequirement)`.
  - Extract each `BR-XX` as a structured `BusinessRequirement` object.
  - Write result to `AppState.requirements` and `artifacts/brd_extracted.json`.

- [ ] **2.2** Update `backend/src/agents/understanding_agent.py`:
  - Add `Subagent 1.2` — UI Semantic Scanner that maps selectors to BRs using AI.
  - Add `Subagent 1.3` — Traceability Mapper that produces `{BR-XX → [selectors] → [endpoints] → testability_score}`.
  - Save `artifacts/traceability_matrix.json`.

- [ ] **2.3** Update `backend/src/prompts/understanding_v4.py`:
  - New prompt prioritizes BRD acceptance criteria over source code details.
  - Explicitly instructs model to output `requirement_id` fields matching `BR-\d{2}` pattern.

**Acceptance Criteria**: After running with `requirement1.txt` uploaded, `AppState.requirements` contains 18 `BusinessRequirement` objects with IDs `BR-01` through `BR-18`.

---

## Phase 3: Agent 2 — Coverage Planner + Batch Generator + Critic

### Tasks

- [ ] **3.1** Create `backend/src/agents/coverage_planner_agent.py` (Subagent 2a):
  - Reads `AppState.requirements` (18 BRs).
  - AI determines total case count and 5-type distribution.
  - Produces `CoveragePlan` with per-BR test case blueprint (ID, title, type, objective).
  - Model: `flash_lite`.

- [ ] **3.2** Create `backend/src/agents/batch_generator_agent.py` (Subagent 2b):
  - Reads `CoveragePlan`, partitions into batches of 5.
  - Uses `ThreadPoolExecutor(max_workers=5)` to dispatch all batches simultaneously.
  - Each batch thread picks a random key from the pool via `LLMService._provider_keys()`.
  - Failover: if a key returns 429 or timeout, catch exception and pick next unused key.
  - Collects all batch results and writes to `AppState.test_case_batches`.

- [ ] **3.3** Create `backend/src/agents/alignment_critic_agent.py`:
  - Scans each test case for: forbidden technical terms list, missing `requirement_id`, empty `steps`.
  - Computes `alignment_score = valid_cases / total_cases`.
  - If `alignment_score < 0.90` and `critique_iteration < 3`: write critique feedback to state, return `"refine"`.
  - Else: return `"proceed"`.

- [ ] **3.4** Wire the conditional edge in `langgraph_pipeline.py`.

**Acceptance Criteria**: With 18 BRs uploaded, pipeline produces ≥20 test cases with `alignment_score ≥ 0.90`, all `requirement_id` values matching existing BRs.

---

## Phase 4: Agent 3 — AI Data Generation

### Tasks

- [ ] **4.1** Create `backend/src/agents/data_schema_architect.py` (Subagent 3a):
  - For each test case, call AI to design a domain-specific field schema.
  - Use `flash_lite` model.
  - Output: `Dict[case_id, DataSchema]` written to state and `artifacts/data_schemas.json`.

- [ ] **4.2** Update `backend/src/agents/test_data_agent.py`:
  - Replace `_build_record()` random loop with LangChain chain call using `DataSchema` from 3a.
  - Call Subagent 3c for Boundary/Negative types to generate edge values.

- [ ] **4.3** Create `backend/src/agents/boundary_inflator.py` (Subagent 3c):
  - Specialized prompt: *"Generate extreme/boundary values for this schema given case_type=Boundary/Negative"*.
  - Uses `flash_lite` model.

**Acceptance Criteria**: `TC-POS-002 → BR-04 Payment` generates a record with a Luhn-valid test card number, cardholder name, expiry, CVV, and billing address — not a generic SSN/username pair.

---

## Phase 5: Agent 4 — AI Script Synthesis

### Tasks

- [ ] **5.1** Create `backend/src/agents/pom_architect.py` (Subagent 4a):
  - Reads `AppState.understanding.ui_inventory` (selectors, routes, forms).
  - AI writes `pages/cfa_pages.py` Python Playwright Page Object Model.
  - Uses `flash` model (complex code generation).
  - Zero `UNRESOLVED-SELECTOR` markers — AI infers best locator strategy from UI inventory.

- [ ] **5.2** Update `backend/src/agents/playwright_agent.py`:
  - Replace string-template `_generate_test_*` methods with LangChain LCEL chain calls.
  - Each script call receives: test case object, POM import path, synthetic data record.
  - AI generates complete `test_TC_XXX.py` with proper `async` Playwright assertions.

- [ ] **5.3** Wire `ai_test_analysis_service.py` `modify_script()` as Subagent 4c:
  - Called automatically after any `FAILED` execution result.
  - Sends failure log + screenshot bytes to AI, returns diff patch.
  - Write patched script to workspace and re-run automatically if `auto_heal = True`.

**Acceptance Criteria**: All generated scripts have zero `UNRESOLVED-SELECTOR` markers. Scripts execute without `AttributeError` on Playwright page objects.

---

## Phase 6: Agent 5 — Execution Intelligence

### Tasks

- [ ] **6.1** Add `pre_execution_risk_scan()` function to `execution_engine.py`:
  - For each selected test case, call `flash_lite` with: selectors used, data completeness, BR criticality.
  - Returns `RiskScore` enum per case (`LOW/MEDIUM/HIGH`).
  - Stream risk scores to frontend before execution starts via WebSocket.

- [ ] **6.2** Add `LiveLogInterpreter` background thread in `execution_engine.py`:
  - Reads stdout line by line during script execution.
  - Every 5 lines or on `FAILED` keyword, call `flash_lite` for a 1-sentence plain-English annotation.
  - Stream annotation to frontend via SSE event `{type: "ai_annotation", ...}`.

- [ ] **6.3** Add `ScreenshotEvidenceValidator` post-hook in `execution_engine.py`:
  - After screenshot captured, send `(screenshot_bytes_b64, expected_result_text)` to `flash` model.
  - Returns confidence score and verdict string.
  - Write to `AppState.execution_results[case_id].evidence`.

- [ ] **6.4** Add `FlakinesClassifier.classify(failure_log)` in `ai_test_analysis_service.py`:
  - Forced choice prompt: output must be exactly one of 5 categories.
  - Uses `flash_lite` model.

**Acceptance Criteria**: After any test execution, the frontend displays `🔴 Risk: High (2 cases)` before run, live English annotations during run, and evidence confidence scores after run.

---

## Phase 7: Agent 6 — Dashboard Intelligence

### Tasks

- [ ] **7.1** Update `backend/src/agents/report_agent.py`:
  - Add `_generate_executive_summary(state)` → LangChain call → `flash_pro` model.
  - Add `_generate_root_cause_report(state)` → LangChain call → `flash` model.
  - Add `_generate_br_risk_heatmap(state)` → LangChain call → `flash_lite` model.
  - Add `_generate_next_steps(state)` → LangChain call → `flash` model.

- [ ] **7.2** Update HTML report template in `ReportAgent._generate_html_report()`:
  - Add "Executive Summary" section with AI narrative text.
  - Add "Root Cause Analysis" section.
  - Add "Business Risk Heatmap" table (`BR-XX → Risk Level`).
  - Add "Recommended Next Steps" numbered list.

**Acceptance Criteria**: Generated `quality_report.html` contains AI-authored executive summary paragraph, root cause text, risk heatmap table for all 18 BRs, and 3 next-step recommendations.

---

## Phase 8: Integration & Token Budget Verification

### Tasks

- [ ] **8.1** End-to-end smoke test:
  - Upload `requirement1.txt` + `QET CFA.zip`.
  - Run full pipeline.
  - Verify output: 18 BRs extracted, ≥20 test cases, domain-specific data records, zero UNRESOLVED selectors, executive summary in HTML report.

- [ ] **8.2** Token budget measurement:
  - Log total tokens used per run via LangSmith or manual count from LLM response metadata.
  - Target: `≤ 20,000 tokens per full pipeline run`.

- [ ] **8.3** Checkpoint resume test:
  - Kill backend at Agent 4 mid-execution.
  - Restart backend.
  - Call `workflow.invoke(None, config={"configurable": {"thread_id": run_id}})` — should resume from Agent 4.

- [ ] **8.4** Commit and push to branch `1708` with tag `spec-026-complete`.
