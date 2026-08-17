# Specit E — Agent 4: AI-Powered Test Script Synthesis
## Feature: AI-Generated Playwright POM + Test Scripts

**Spec**: 026-E  
**Subfolder**: `e-agent4-ai-script-synthesis`  
**Priority**: 🟠 High  
**Depends On**: Specit A, Specit B, Specit C (test cases), Specit D (data schemas)  
**Required By**: Specit F (execution reads scripts)  

---

## 1. What This Feature Is

Replace string-template Playwright script generation with AI-authored Page Object Models and test functions that:
- Use real selectors discovered by Agent 1 (never invent selectors)
- Reference AI-generated synthetic data records by key
- Produce zero `UNRESOLVED-SELECTOR:X` markers
- Write Playwright-idiomatic async Python with proper `expect()` assertions

---

## 2. Current State vs Target

| Aspect | Current | Target |
| :--- | :--- | :--- |
| POM generation | Hard-coded Python class templates with f-string substitution | AI writes POM from discovered UI inventory |
| Selector strategy | Uses whatever `_derive_selectors()` finds; uses `UNRESOLVED-SELECTOR:X` if missing | AI infers best stable selector strategy; raises structured error if truly unresolvable |
| Test function | String-templated `_generate_test_function()` method | AI generates per case with proper assertions |
| Data injection | Hard-coded field picks from generic record | AI maps `synthetic_data_keys` → `conftest.py` fixture lookup |
| Self-healing | `ai_test_analysis_service.modify_script()` exists but is unconnected | Wired as automatic post-failure trigger |

---

## 3. Subagent 4a — POM Architect

### What It Does
Reads `state["ui_inventory"]` (list of `UISelector` objects discovered by Agent 1) and writes the full `pages/cfa_pages.py` Page Object Model using AI.

### AI Strategy
The AI is given the full UI inventory and instructed to:
1. Group selectors by page route (LoginPage, RegistrationPage, KYCPage, PaymentPage, etc.)
2. Choose the most stable locator strategy per selector: `get_by_testid()` > `get_by_role()` > `get_by_label()` > `get_by_placeholder()` > CSS last resort
3. Write a proper Python class per page with typed methods (e.g., `async def fill_card_number(self, pan: str) -> None`)

### File: `backend/src/agents/pom_architect.py` (NEW)
```python
class POMArchitect:
    """Subagent 4a: AI-writes the Page Object Model from discovered UI selectors."""

    def run(self, state: QETGraphState) -> dict:
        inventory = state["ui_inventory"]
        chain = self.router.get_chain("pom_generation", POM_ARCHITECT_PROMPT, POMOutput)
        result: POMOutput = chain.invoke({
            "selectors": [s.model_dump() for s in inventory.selectors],
            "routes": inventory.routes,
            "form_groups": inventory.form_groups,
        })
        # Write the generated code to file
        pom_path = self.output_dir / "pages" / "cfa_pages.py"
        pom_path.write_text(result.python_code, encoding="utf-8")
        return {"pom_code": result.python_code}
```

### Prompt
```
You are a senior Python Playwright automation engineer.

Write a production-quality Page Object Model (POM) file for the CFA Digital Candidate Journey platform.

Available UI Selectors: {selectors_json}
Available Routes: {routes_list}
Form Groups: {form_groups_json}

Locator strategy priority (use highest available):
1. page.get_by_test_id("...") — prefer [data-testid] attributes
2. page.get_by_role("button", name="...") — for interactive elements
3. page.get_by_label("...") — for form fields with labels
4. page.get_by_placeholder("...") — for inputs with placeholders
5. page.locator("#id") — CSS id last resort

Rules:
- Write one Python class per page route
- Every method must be async
- Use typed parameters (str, bool, int)
- No hardcoded test data in POM — data is always passed as parameters
- Output only valid Python code, no markdown fences
```

---

## 4. Subagent 4b — Script Synthesizer

### What It Does
For each `AlignedTestCase`, generates a complete Python Playwright test file (`tests/test_TC_XXX.py`).

### Per-Script AI Call Inputs
```python
{
    "test_case": tc.model_dump(),
    "synthetic_data_record": state["synthetic_records"][tc.case_id],
    "pom_import": "from pages.cfa_pages import LoginPage, RegistrationPage, KYCPage, PaymentPage",
    "expected_result": tc.expected_result,
    "preconditions": tc.preconditions,
    "steps": tc.steps,
}
```

### Prompt
```
You are a Python Playwright test engineer.

Write a complete pytest-playwright test file for this test case.

Test Case: {test_case_json}
Synthetic Data Record: {data_record_json}
POM Import: {pom_import}

Rules:
- Import from conftest fixture: `def test_xyz(page, test_data)`
- Access data as: `data = test_data["{case_id}"]`
- Use POM methods, never write selectors directly in the test file
- Write proper async Playwright assertions using `expect(locator)` API
- Handle the expected result literally — if expected is "rejection banner visible", assert the banner
- Never use time.sleep() — use `page.wait_for_load_state("networkidle")` or Playwright waits
- Output only valid Python code, no markdown, no explanations
```

### File: Update `backend/src/agents/playwright_agent.py`
- Replace `_generate_test_function()` with AI chain call
- Keep `_generate_playwright_package()` structure but use AI for each file body
- Process 5 test cases per AI call batch (reduce token calls by 5×)

---

## 5. Subagent 4c — Self-Healer (Auto-Wire Existing Service)

### Current State
`ai_test_analysis_service.py` has `modify_script()` implemented but called only via manual API endpoint.

### Target
Wire as automatic post-execution trigger:
```python
# In execution_node (Agent 5):
for case_id, result in execution_results.items():
    if result.status == "FAILED":
        healer = ScriptHealerSubagent(run_id)
        patch = healer.heal(
            script_path=result.script_path,
            failure_log=result.failure_output,
            screenshot_b64=result.screenshot_b64,
        )
        if patch.has_changes:
            apply_patch(result.script_path, patch)
            re_run_single(case_id)  # optional, if auto_heal=True
```

### Healing Prompt
```
You are fixing a failing Playwright test script.

Failed Script: {script_content}
Failure Log: {failure_log}
Screenshot (base64): {screenshot_b64}

Analyze the failure and return a diff patch to fix the script.
Rules:
- Only fix what is broken, do not rewrite the entire script
- If the failure is a selector issue, find the correct alternative selector
- If the failure is a timing issue, add appropriate waits
- Output as a unified diff format
```

---

## 6. State Outputs

```python
state["pom_code"]          # Full content of pages/cfa_pages.py
state["playwright_scripts"] # List of PlaywrightScript objects (existing schema)
```

---

## 7. File System Outputs

```
uploads/{run_id}/artifacts/playwright_output/
├── pages/
│   └── cfa_pages.py          ← AI-written (Subagent 4a)
├── tests/
│   ├── test_TC_POS_001.py    ← AI-written per case (Subagent 4b)
│   ├── test_TC_NEG_001.py
│   └── ...
├── fixtures/
│   └── conftest.py           ← Data fixture loading from synthetic_test_data.json
└── test-data/
    └── synthetic_test_data.json ← Copied from Agent 3 output
```

---

## 8. Acceptance Criteria

- [ ] `pages/cfa_pages.py` contains at least 4 page classes (Login, Registration, KYC, Payment)
- [ ] Zero `UNRESOLVED-SELECTOR:X` strings in any generated file
- [ ] Every test file imports from `pages.cfa_pages`, no direct selectors in test files
- [ ] `conftest.py` loads `synthetic_test_data.json` and provides `test_data[case_id]` fixture
- [ ] Negative test scripts assert rejection/error, not success
- [ ] Boundary test scripts assert exact boundary condition behavior
- [ ] Self-healer is triggered automatically after any FAILED result
- [ ] `pom_code` in `QETGraphState` is non-empty after this node

---

## 9. Missing / Open Questions

- [ ] Should each test script be run through a `py_compile` check before saving to catch syntax errors from AI?
- [ ] What should happen if POM Architect cannot find a selector for a required UI element? (Proposed: raise structured error with specific missing element name, not silently skip)
- [ ] Should the self-healer auto-rerun the fixed test, or just produce the patch and let the user decide?
