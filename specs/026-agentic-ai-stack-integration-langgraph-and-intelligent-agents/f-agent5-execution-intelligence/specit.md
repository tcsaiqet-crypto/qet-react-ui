# Specit F — Agent 5: Execution Intelligence
## Feature: Pre-Run Risk Scan, Live Log Interpretation, Screenshot Evidence, Flakiness Classification

**Spec**: 026-F  
**Subfolder**: `f-agent5-execution-intelligence`  
**Priority**: 🟠 High  
**Depends On**: Specit A, Specit B, Specit E (scripts exist)  
**Required By**: Specit H (Dashboard reads from execution results)  

---

## 1. What This Feature Is

Four AI layers added around the existing Playwright execution engine — **without changing the core execution logic** (scripts still run via `subprocess.Popen`):

| Subagent | When | What |
| :--- | :--- | :--- |
| 5a — Risk Scanner | Before execution starts | Score each test case for execution risk |
| 5b — Log Interpreter | During execution | Annotate raw logs in plain English |
| 5c — Screenshot Validator | After each test completes | AI reads screenshot + expected result → confidence score |
| 5d — Flakiness Classifier | After any failure | Instantly classify failure into 1 of 5 buckets |

---

## 2. Subagent 5a — Pre-Run Risk Scanner

### What It Does
Before the "Start Execution" button triggers any scripts, reads each test case's selectors (from `pom_code`), synthetic data completeness, and BR criticality. Produces a `RiskScore` per case.

### When it runs
`GET /api/v1/runs/{run_id}/execution/risk-scan` (called on page load of Execute Workspace)

### File: Update `backend/src/services/execution_engine.py`
```python
async def scan_execution_risk(self, state: QETGraphState) -> Dict[str, RiskScore]:
    test_cases = state["final_test_suite"]
    records = {r.target_case_id: r for r in state["synthetic_records"]}
    
    # Batch 5 cases per AI call
    risk_scores = {}
    for batch in chunk(test_cases, 5):
        chain = self.router.get_chain("risk_scoring", RISK_SCANNER_PROMPT, RiskScoreBatch)
        result: RiskScoreBatch = chain.invoke({
            "test_cases": [tc.model_dump() for tc in batch],
            "records": {tc.case_id: records.get(tc.case_id, {}) for tc in batch},
            "pom_code_snippet": state["pom_code"][:2000],  # First 2000 chars of POM
        })
        for score in result.scores:
            risk_scores[score.case_id] = score
    
    return risk_scores
```

### Risk Scoring Prompt
```
You are a QA risk assessor. Score the execution risk of each test case.

Test Cases: {test_cases_json}
Synthetic Data Records: {records_json}
POM Code (excerpt): {pom_code_snippet}

For each test case, score:
- selector_confidence: 0.0–1.0 (how reliably selectors match expected UI elements)
- data_completeness: 0.0–1.0 (are all required data fields populated and valid)
- risk_level: LOW, MEDIUM, or HIGH
- reason: one sentence explaining the risk

Risk Heuristics:
- HIGH if case_type=Boundary and data has no explicit edge values
- HIGH if any synthetic_data_key not found in record
- MEDIUM if Negative case expected_result is vague
- LOW if Positive case with complete data and standard selectors
```

### Frontend Display
```typescript
// New prop on ExecuteWorkspace TestCaseRow
<TestCaseRow
  risk={riskScores[tc.case_id]}  // {risk_level: "HIGH", reason: "..."}
  badge={<RiskBadge level={risk.risk_level} />}
/>
// RiskBadge: 🟢 LOW | 🟡 MEDIUM | 🔴 HIGH
```

---

## 3. Subagent 5b — Live Log Interpreter

### What It Does
Runs in a background thread during script execution. Reads stdout/stderr line by line. Every 5 lines OR on a `FAILED/ERROR` keyword, calls AI to produce a 1-sentence plain-English annotation. Streams to frontend.

### Implementation Pattern
```python
class LiveLogInterpreter(threading.Thread):
    def __init__(self, log_queue: queue.Queue, broadcaster: SSEBroadcaster, router: QETModelRouter):
        self.log_queue = log_queue
        self.broadcaster = broadcaster
        self.router = router
        self.buffer = []

    def run(self):
        while True:
            line = self.log_queue.get(timeout=5)
            if line is None:  # sentinel — execution done
                break
            self.buffer.append(line)
            should_annotate = (
                len(self.buffer) >= 5 or
                any(kw in line for kw in ["FAILED", "Error:", "TimeoutError", "PASSED"])
            )
            if should_annotate:
                annotation = self._annotate(self.buffer)
                self.broadcaster.emit({"type": "ai_annotation", "text": annotation, "step": len(self.buffer)})
                self.buffer = []

    def _annotate(self, lines: list[str]) -> str:
        chain = self.router.get_chain("log_annotation", LOG_ANNOTATOR_PROMPT, LogAnnotation)
        result = chain.invoke({"log_lines": "\n".join(lines)})
        return result.plain_english_summary
```

### Log Annotation Prompt
```
You are interpreting Playwright test execution logs for a QA engineer.

Recent log lines:
{log_lines}

Write ONE clear sentence (max 20 words) explaining what just happened in plain English.
Focus on: what action was taken, what happened, and if failed — the likely cause.

Examples:
- "User login form submitted successfully with test credentials."
- "Step 4 failed: expected rejection banner not found after 30 seconds."
- "KYC document upload accepted; system moved to identity verification step."
```

### Frontend: AI Commentary Panel
```typescript
// Separate panel from raw log, shown in Execute Workspace
<AICommentaryPanel>
  <CommentaryLine timestamp="07:30:01" text="User login form submitted successfully." icon="✅" />
  <CommentaryLine timestamp="07:30:05" text="Step 4 failed: rejection banner not found." icon="❌" />
</AICommentaryPanel>
```

---

## 4. Subagent 5c — Screenshot Evidence Validator

### What It Does
After each test case completes and a screenshot is captured, sends the screenshot (base64) + test case expected result to the `flash` multimodal model. Returns an `Evidence Confidence` score.

### Integration Point
```python
# In execution_engine.py — after screenshot saved
screenshot_bytes = screenshot_path.read_bytes()
screenshot_b64 = base64.b64encode(screenshot_bytes).decode()

evidence = await self.evidence_validator.validate(
    case_id=case_id,
    expected_result=test_case.expected_result,
    screenshot_b64=screenshot_b64,
)
# Write to state
self.state["screenshot_evidence"][case_id] = evidence
```

### Multimodal Call
```python
from langchain_core.messages import HumanMessage

async def validate(self, case_id: str, expected_result: str, screenshot_b64: str) -> ScreenshotEvidence:
    model = self.router.get_model("screenshot_eval")  # Flash (multimodal)
    msg = HumanMessage(content=[
        {"type": "text", "text": f"Test ID: {case_id}\nExpected Result: {expected_result}\n\nDoes this screenshot show the expected outcome?"},
        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{screenshot_b64}"}}
    ])
    response = await model.ainvoke([msg])
    return ScreenshotEvidence.model_validate_json(response.content)
```

### Evidence Output
```json
{
  "case_id": "TC-NEG-001",
  "confidence_pct": 92.0,
  "verdict": "Rejection banner detected with text 'Document Expired'",
  "detected_elements": ["rejection-banner", "error-icon", "retry-button"],
  "matched_expected_result": true
}
```

---

## 5. Subagent 5d — Flakiness Classifier

### What It Does
On any FAILED test, immediately determines the failure category using a forced-choice prompt (no ambiguous free-text — must pick exactly one of 5 buckets).

### 5 Failure Categories
| Category | Meaning | Common Playwright Cause |
| :--- | :--- | :--- |
| `selector_defect` | UI selector no longer matches | Element ID changed, locator drift |
| `timing_issue` | Element not ready when interacted with | Missing `wait_for_load_state`, race condition |
| `application_defect` | App behaved incorrectly vs expected | Real bug in the CFA platform |
| `data_mismatch` | Synthetic data caused unexpected behavior | Wrong field format, boundary value exceeded |
| `environment_issue` | Network, port, env config problem | Dev server not running, port conflict |

### Prompt (Forced Choice)
```
You are classifying a Playwright test failure. You MUST choose exactly ONE of these categories:
selector_defect | timing_issue | application_defect | data_mismatch | environment_issue

Failure Log:
{failure_log}

Test Case Expected Result: {expected_result}
Synthetic Data Used: {data_record_json}

Return a FailureClassification JSON object with:
- category (one of the 5 above)
- confidence (0.0–1.0)
- remediation_hint (one sentence: what to fix)
```

---

## 6. Frontend Integration Summary

| Feature | New UI Element | Location |
| :--- | :--- | :--- |
| Risk Scanner | Risk badges (🟢🟡🔴) per test case row | Execute Workspace — before running |
| Log Interpreter | AI Commentary panel (separate from raw log) | Execute Workspace — during run |
| Screenshot Validator | Evidence confidence card per test case | Execute Workspace — after run |
| Flakiness Classifier | Failure tag inline on failed test row | Execute Workspace + Dashboard |

---

## 7. Acceptance Criteria

- [ ] Risk scores appear in UI **before** execution starts
- [ ] AI Commentary panel streams annotations within 2s of relevant log lines
- [ ] Raw log panel continues uninterrupted alongside AI Commentary
- [ ] Screenshot evidence JSON written to `screenshot_evidence.json` in artifacts
- [ ] Every FAILED test has a `FailureClassification` entry in state
- [ ] `flash_lite` used for 5a, 5b, 5d (NOT flash or pro)
- [ ] `flash` used for 5c (multimodal requires flash minimum)
- [ ] Log interpreter runs in background thread — does NOT block execution process

---

## 8. Missing / Open Questions

- [ ] Should risk scanning happen before or after the user selects which test cases to run? (Proposed: scan all, show on all, user still selects)
- [ ] Should 🔴 HIGH risk tests be blocked from running automatically, or just warned? (Proposed: warn + confirm dialog, never auto-block)
- [ ] If screenshot validator says `matched_expected_result: false` but Playwright says `PASSED` — what do we show? (Proposed: `⚠️ Script PASSED but AI Evidence Mismatch`)
