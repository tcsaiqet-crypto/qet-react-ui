# Plan: Spec 026 — Agentic AI Stack Integration

## 1. Problem Statement

### 1.1 Current State Analysis

The QET Agent Accelerator today operates as a sequential chain of deterministic Python agents:

```
[UnderstandingAgent] → [TestCaseAgent] → [TestDataAgent] → [PlaywrightAgent] → [ExecutionEngine] → [ReportAgent]
```

**Fundamental Problems:**
1. **No State Continuity**: Each agent call is isolated. If Playwright Agent fails at script 10 of 25, the entire pipeline must restart from the beginning.
2. **No Intelligence in 4 Agents**: `TestDataAgent`, `PlaywrightAgent`, `ExecutionEngine`, and `ReportAgent` are entirely deterministic Python — no AI involvement.
3. **Wasteful Token Usage**: The Understanding Agent call uses ~9,000 tokens to process the full codebase. Without state sharing, downstream agents cannot access this intelligence without re-reading the original source.
4. **No Critic Loop**: No automated verification that generated test cases, scripts, or data are business-grounded before proceeding to the next expensive stage.
5. **Single-Key Sequential Calls**: Test case generation calls one key at a time, waiting for each to succeed or fail before trying the next.

### 1.2 Target State

A **LangGraph StatefulGraph** that:
- Passes structured state between all 6 agent nodes without redundant re-reading
- Enables cyclic critic loops with max iteration guardrails
- Checkpoints after every node completion so failures are resumable
- Routes AI calls to the optimal model tier based on task complexity
- Embeds AI intelligence into all 6 agents (not just Understanding and Test Case Generation)

---

## 2. What We Are Building — Agent by Agent

### Agent 1: Application Understanding (Enhanced)
**Current**: Reads BRD file names only, not full content. Codebase parsing lacks deep BR extraction.

**New with Spec 026:**
- **Subagent 1.1 — BRD Deep Extractor**: Full text parsing of `requirement1.txt`, extracting each `BR-01` through `BR-18` into a structured `BusinessRequirement` object with title, description, acceptance criteria, and test coverage hint.
- **Subagent 1.2 — Codebase Semantic Scanner**: Reads all TypeScript/React/Python files and maps UI elements to their semantic business function (e.g., `#pay-btn` → BR-04 Payment).
- **Subagent 1.3 — Traceability & Testability Mapper**: Produces a coverage matrix (`BR-XX` → `UI Selector(s)` → `API Endpoint(s)` → `Testability Score`).

**AI Model**: Gemini Flash — full BRD text + source snapshot in context window.

---

### Agent 2: Test Case Generation (Enhanced from Spec 025)
**Current**: Single monolithic `TestCaseAgent.run()` that calls AI once and returns ≤14 cases.

**New with Spec 026:**
- **Subagent 2a — Strategy & Coverage Planner**: AI reads the traceability matrix and determines the total case count (e.g., 25) and distribution (POS: 8, NEG: 5, BND: 4, VAL: 4, ERR: 4) to guarantee 100% BR coverage.
- **Subagent 2b — Parallel Batch Generator**: Partitions 25 cases into 5 batches of 5 and dispatches using `ThreadPoolExecutor` with 5 random API keys. Instant failover on 429/timeout.
- **Alignment Critic Node (LangGraph)**: Evaluates every batch before merging. If `alignment_score < 0.90`, routes batch back to generator with specific feedback. Max 3 retry iterations.

**AI Model**: Gemini Flash Lite for strategy planning, Gemini Flash for batch generation.

---

### Agent 3: Data Generation (NEW AI Integration)
**Current**: Deterministic Python — random English names, hard-coded SSN formats, templated documents.

**New with Spec 026:**
- **Subagent 3a — Schema Architect**: AI reads each test case's `requirement_id` and `feature_area`. For `TC-POS-001 → BR-01 Candidate Registration`, it designs: `{first_name, last_name, email, dob, nationality, cfa_level, education_level}`. For `TC-POS-002 → BR-04 Payment`, it designs: `{card_number (Luhn-valid test PAN), card_holder, expiry, cvv, billing_address, expected_status}`.
- **Subagent 3b — Data Populator**: AI fills the designed schema with realistic, domain-appropriate values. Never generates real PII. Always uses fictional but plausible data.
- **Subagent 3c — Boundary Inflator**: For `Boundary` and `Negative` test cases, AI specifically generates edge values (exam booking at T-0, income at 0.01, card expiry tomorrow, max-length name fields).

**AI Model**: Gemini Flash Lite (schema design), Gemini Flash (data population).

---

### Agent 4: Test Script Generation (NEW AI Integration)
**Current**: String-templated Python Playwright scripts. Missing selectors result in `UNRESOLVED-SELECTOR:X` markers that cause immediate failures.

**New with Spec 026:**
- **Subagent 4a — POM Architect**: AI reads the UI Inventory from `AppState.understanding` (selectors, routes, component names) and writes a production-quality `pages/cfa_pages.py` Page Object Model with reliable Playwright locator strategies (`get_by_role`, `get_by_label`, `data-testid` precedence chain).
- **Subagent 4b — Script Synthesizer**: For each test case, AI generates a complete Python Playwright test function: correct selectors from POM, injected synthetic data from the dataset, assertions grounded in `expected_result` from the test case contract.
- **Subagent 4c — Self-Healer** *(post-execution)*: After test failure, AI reads failure log + screenshot bytes (base64) and proposes a diff patch to fix the broken selector or assertion. This already partially exists via `ai_test_analysis_service.py` — needs full wiring.

**AI Model**: Gemini Flash for 4a and 4b (complex code generation), Gemini Flash Lite for 4c (targeted diff repair).

---

### Agent 5: Execute Agent (NEW AI Integration)
**Current**: Runs Playwright scripts, streams stdout/stderr to the frontend via SSE. Zero AI interpretation.

**New with Spec 026:**
- **Subagent 5a — Pre-Run Risk Scanner**: Before execution starts, AI scores each selected test case for execution risk (selector confidence, data completeness, known selector drift history). Displayed as `🟢/🟡/🔴` risk badge on each test case row.
- **Subagent 5b — Live Console Interpreter**: A lightweight background thread reads the live log stream and emits plain-English AI annotations: *"Step 4 failed: `#kyc-upload` not found — possible page load timing issue or selector drift."*
- **Subagent 5c — Screenshot Evidence Validator**: After each test case completes, sends the screenshot (base64-encoded) to AI with the expected result. Returns `Evidence Confidence: 94% — rejection banner detected`.
- **Subagent 5d — Flakiness Classifier**: On any failure, immediately classifies into one of 5 buckets: `selector_defect`, `timing_issue`, `application_defect`, `data_mismatch`, `environment_issue`. No LLM call needed — uses a pre-defined structured prompt with forced classification.

**AI Model**: Gemini Flash Lite for 5a (risk scoring), 5b (log annotation), 5d (classification). Gemini Flash for 5c (screenshot multimodal).

---

### Agent 6: Dashboard Agent (NEW AI Integration)
**Current**: Static HTML/PDF with hard-coded risk narrative string: `"Low Risk — High Requirement & Test Coverage on Core CFA Digital Flows"`.

**New with Spec 026:**
- **Subagent 6a — Executive Summary Writer**: AI reads complete execution results and writes a tailored 3-paragraph narrative for CFA QA leadership.
- **Subagent 6b — Root Cause Analyst**: AI groups failures by shared theme (common selector, common BR, common flow stage) and identifies the systemic root cause.
- **Subagent 6c — BR Risk Heatmap Generator**: AI produces a risk score per BR (`BR-01: Low`, `BR-04: High`) based on which requirements had failures, coverage gaps, or boundary violations.
- **Subagent 6d — Next-Step Advisor**: AI recommends the top 3 prioritised actions for the team before the next CFA exam window.

**AI Model**: Gemini Pro for 6a (premium narrative quality matters for leadership). Gemini Flash for 6b, 6c, 6d.

---

## 3. Token Budget Strategy

### Principle: One Context, Many Outputs

| Technique | Token Saving | Applied Where |
| :--- | :--- | :--- |
| LangGraph state sharing | 80% reduction — no re-reading BRD/codebase | All agents after Agent 1 |
| Batch generation (5 per call) | 50% reduction over individual calls | Agent 2b, Agent 3, Agent 4 |
| Flash Lite for classify/plan tasks | 70% cost reduction per call | Agents 2a, 3a, 5a, 5b, 5d |
| Pydantic structured output (no retries) | 30% reduction — eliminates markdown retry waste | All agents |
| LangGraph checkpointing | 100% reduction on resume after failure | All agents |
| **Combined target** | **≥80% per full run** | **Entire pipeline** |

---

## 4. Expected Outcomes

| Metric | Before Spec 026 | After Spec 026 |
| :--- | :--- | :--- |
| AI-powered agents | 2 of 6 | **6 of 6** |
| Tokens per full pipeline run | ~85,000 | **~15,000** |
| Test cases grounded in BRs | ~40% | **~100%** |
| Script failure due to missing selectors | ~30% | **<5%** |
| Post-execution insight quality | Static numbers | **AI narrative + root cause + heatmap** |
| Pipeline crash recovery | Manual full restart | **Auto-resume from last checkpoint** |
