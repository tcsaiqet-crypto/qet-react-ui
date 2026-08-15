# Architecture & Implementation Plan 013: Live Playwright Execution, Lifecycle & AI Intelligence

## 1. System Architecture Diagram

```
[ Frontend: React + TypeScript ]
  │
  ├── Controls Toolbar (Pause / Resume / Stop / Run Live)
  ├── Live Playwright Runner (Filterable table, 1-Click Launch)
  ├── Visual Screenshot Gallery (Positive & Negative image cards, Zoom modal)
  ├── Multi-Level JSON Inspector (Hierarchy, why-passed, why-failed, export)
  └── AI Intelligence Panel & Auto-Healing Modal (Health gauge, Diff view, 1-Click Apply)
  │
  ▼ [ REST API & WebSocket Streaming (/api/v1) ]
  │
[ Backend Services ]
  ├── ExecutionManager (Thread-safe Queue, Pause/Resume/Stop State Machine)
  ├── ExecutionEngine (Subprocess Pytest Runner, --headed New Window, Multi-Level Builder)
  ├── PlaywrightAgent (Dedicated Test Script Generator per Test Case, POMs, ZIP)
  ├── AITestAnalysisService (LLM/Heuristic Health Scoring, Defect Taxonomy, Script Healing)
  └── SequentialQETPipeline (Stage Lifecycle: Pause, Resume, Stop)
  │
  ▼ [ Storage & Evidence Artifacts ]
  ├── uploads/{run_id}/artifacts/screenshots/{case_id}_{passed|failed}.png
  ├── uploads/{run_id}/artifacts/multi_level_execution_results.json
  ├── uploads/{run_id}/artifacts/ai_test_analysis.json
  └── uploads/{run_id}/artifacts/playwright_automation_package.zip
```

---

## 2. State Machine & Lifecycle Transitions

### Execution State Machine
```
[ IDLE ] ──(Launch)──► [ QUEUED ] ──► [ RUNNING ]
                            ▲             │
                     (Resume)│             ├──(Pause Requested)──► [ PAUSED ]
                            │             │                            │
                            │             ├──(Stop Requested)───► [ STOPPED ]
                            │             │
                            └─────────────┴──(All Cases Done)───► [ PASSED / FAILED ]
```

- **Thread Safety**: `ExecutionManager` uses `threading.Lock()` and stores active `ManagedExecution` instances.
- **Durable Snapshot**: State is persisted at `uploads/{run_id}/artifacts/executions/{execution_id}/state.json` on every state change and log event.

---

## 3. Playwright Headed Mode & Screenshot Pipeline

1. **New Window Guarantee**: Pytest is invoked with `--headed` flag:
   ```bash
   python -m pytest tests/test_tc_pos_001.py -v --tb=short --headed
   ```
2. **Screenshot Triggering**:
   - Every dedicated script includes automated screenshot hooks:
     - On successful completion: `page.screenshot(path=f"{screenshots_dir}/{case_id}_passed.png", full_page=True)`
     - On assertion error / rejection: `page.screenshot(path=f"{screenshots_dir}/{case_id}_failed.png", full_page=True)`
   - Visual SVG/PNG fallback generation guarantees images are always available for inspection in the UI gallery even in headless or simulated environments.

---

## 4. Multi-Level JSON Diagnostic Schema

```json
{
  "run_id": "RUN-20260813-001",
  "execution_id": "EXEC-90F6236A1DC1",
  "timestamp": "2026-08-15T07:35:00Z",
  "summary": {
    "total_scripts": 5,
    "total_test_cases": 5,
    "passed_count": 4,
    "failed_count": 1,
    "pass_rate_percentage": 80.0,
    "duration_seconds": 8.45,
    "execution_mode": "headed_new_window",
    "target_host": "localhost"
  },
  "breakdown_by_case_type": {
    "Positive": { "total": 2, "passed": 2, "failed": 0, "pass_rate_percentage": 100.0 },
    "Negative": { "total": 2, "passed": 1, "failed": 1, "pass_rate_percentage": 50.0 },
    "Boundary": { "total": 1, "passed": 1, "failed": 0, "pass_rate_percentage": 100.0 }
  },
  "breakdown_by_feature_area": {
    "Authentication": { "total": 2, "passed": 1, "failed": 1, "pass_rate_percentage": 50.0 },
    "Applicant Info Intake": { "total": 2, "passed": 2, "failed": 0, "pass_rate_percentage": 100.0 },
    "Document Upload": { "total": 1, "passed": 1, "failed": 0, "pass_rate_percentage": 100.0 }
  },
  "scripts": [
    {
      "script_id": "SCR-TC-POS-001",
      "filename": "tests/test_tc_pos_001.py",
      "test_case_id": "TC-POS-001",
      "title": "Valid Authentication Happy Path",
      "case_type": "Positive",
      "feature_area": "Authentication",
      "status": "PASSED",
      "duration_ms": 1420.5,
      "why_passed": "All assertions satisfied for positive scenario. User interaction completed and UI entered expected state.",
      "why_failed": null,
      "failure_classification": null,
      "root_cause_analysis": null,
      "steps": [
        { "step_number": 1, "description": "Navigate & Initialize Flow", "status": "PASSED", "duration_ms": 426.1 },
        { "step_number": 2, "description": "Fill credentials and submit", "status": "PASSED", "duration_ms": 994.4 }
      ],
      "screenshots": [
        {
          "filename": "TC-POS-001_passed.png",
          "url": "/api/v1/runs/RUN-20260813-001/screenshots/TC-POS-001_passed.png",
          "test_case_id": "TC-POS-001",
          "case_type": "Positive",
          "caption": "TC-POS-001 (Positive): Success verified",
          "timestamp": "2026-08-15T07:35:01Z",
          "is_failure": false
        }
      ]
    }
  ]
}
```

---

## 5. AI Prompt Engineering & Script Healing

### Prompt Template for Test Suite Analysis
```
You are an executive QA Lead and AI Test Automation Architect.
Analyze the Playwright test execution results for CFA Digital Journey:
Overall Pass Rate: {pass_rate}%
Scripts: {scripts_json}

Output structured JSON:
- executive_summary: High-level executive overview of app stability and defect clusters.
- risk_level: Low | Medium | High | Critical
- test_case_insights: Array of per-test-case why-passed/why-failed explanations, root causes, defect categories, and recommended fixes.
```

### Prompt Template for AI Script Auto-Repair
```
You are an expert Playwright and Python automation test engineer.
Your task is to fix or enhance the following Playwright test script for test case '{test_case_id}'.
Current Script Code: {current_code}
Failure Log: {failure_log}
Instructions: {instruction}

Return valid JSON:
- modified_code: Complete updated Python code for the test script.
- explanation: Summary of changes made and why they fix the issue.
- diff_summary: Concise bullet points of adjustments.
```
