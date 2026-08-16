# Feature 04: Test Script Agent

## 1. Overview

The Test Script Agent is the **fourth stage** in the QET pipeline. It generates a dedicated, standalone, executable Python Playwright test script for **each** selected test case. Scripts use Page Object Models (POMs), import their synthetic data record, and include automatic screenshot capture on both Pass and Fail.

**Every test case = one Python script file.** No monolithic test runner files.

---

## 2. Generated File Structure

```
uploads/{run_id}/artifacts/playwright/
├── pages/
│   ├── base_page.py              # Base POM class with shared utilities
│   └── app_pages.py              # All discovered pages as POM classes
├── fixtures/
│   └── conftest.py               # pytest fixtures (browser launch, data loading)
├── test_data/
│   └── test_data.py              # Data accessor module keyed by case_id
└── tests/
    ├── test_TC_POS_001_valid_login.py
    ├── test_TC_NEG_002_invalid_password.py
    ├── test_TC_BND_003_income_threshold.py
    ├── test_TC_VAL_004_required_fields.py
    └── test_TC_ERR_005_session_expiry.py
```

---

## 3. Script Template Structure

Each generated script follows this pattern:
```python
"""Test: TC-POS-001 — Valid Login Authentication (Positive)"""

import pytest
from playwright.sync_api import Page, expect
from pages.app_pages import LoginPage
from test_data.test_data import get_test_record

TEST_CASE_ID = "TC-POS-001"

@pytest.fixture(autouse=True)
def capture_evidence(page: Page, request):
    """Auto-capture screenshot on pass and fail."""
    yield
    status = "PASSED" if request.node.rep_call.passed else "FAILED"
    page.screenshot(
        path=f"artifacts/screenshots/{TEST_CASE_ID}_{status}.png",
        full_page=True
    )

def test_valid_login_authentication(page: Page):
    record = get_test_record(TEST_CASE_ID)
    login_page = LoginPage(page)
    
    # Step 1: Navigate to login
    login_page.navigate()
    
    # Step 2: Enter valid credentials
    login_page.fill_credentials(record["username"], record["password"])
    
    # Step 3: Submit
    login_page.submit()
    
    # Step 4: Assert dashboard is visible
    expect(page.locator("[data-testid='dashboard-welcome']")).to_be_visible()
```

---

## 4. User Stories

- **US-1**: As a QA engineer, I see a list of all generated test scripts, one per test case, with their generation status.
- **US-2**: As a QA engineer, I can click `[View Script]` on any row to open a modal showing the full Python code with syntax highlighting, line numbers, and a `[Copy]` button.
- **US-3**: As a QA engineer, I can click `[View Data]` on any row to see the synthetic data record that will be injected into this script.
- **US-4**: As a QA engineer, I can download all scripts as a ZIP package for local use.
- **US-5**: As a QA engineer, I see a confidence badge per script indicating whether all selectors were resolved with high confidence or have uncertain locators.
- **US-6**: As a QA engineer, I can click `[Regenerate Script]` on a single script if it has uncertain selectors or I want a fresh generation.

---

## 5. Workspace UI Design

```
┌─ Test Script Agent ─────────────────────────────────────────────────────┐
│                                                                         │
│  🐍 Generated 12 Python Playwright scripts  [⬇ Download All Scripts]   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ TC-POS-001  Valid Login Auth       [✅ High Conf]  [Script] [Data]│  │
│  │ TC-NEG-002  Invalid Password       [✅ High Conf]  [Script] [Data]│  │
│  │ TC-BND-003  Income Threshold       [⚠️ Med Conf]   [Script] [Data]│  │
│  │   └─ Uncertain selector: `.income-slider` (no data-testid found) │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─ Bottom CTA ────────────────────────────────────────────────────┐   │
│  │  ✅ 12 scripts ready   [Proceed to Execute Agent →]              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Functional Requirements

### FR-1: Script Synthesis per Test Case
- One Python file per test case in `tests/` directory.
- Filename format: `test_{case_id}_{slugified_title}.py`
- All steps from the test case are converted to Playwright interactions.
- Expected results become `expect()` assertions.

### FR-2: Selector Grounding
- Selectors used in scripts must come from the UI inventory produced by sub-agent 1c.
- Unknown selectors (where evidence is insufficient) are marked as `uncertain_selectors`.
- Scripts with uncertain selectors get a ⚠️ Medium Confidence badge.

### FR-3: Automated Screenshot Capture
- `conftest.py` includes a session-scoped `capture_evidence` fixture.
- On test PASS: saves `{case_id}_PASSED.png`
- On test FAIL: saves `{case_id}_FAILED.png`
- Both saves occur even when test raises an exception (try/finally pattern).

### FR-4: Data Binding
- Each script calls `get_test_record(TEST_CASE_ID)` from `test_data/test_data.py`.
- `test_data.py` loads from `synthetic_dataset.json` and returns the record for the given case ID.
- No hardcoded test data values inside the script itself.

### FR-5: Script Viewer Modal
- Opens on `[View Script]` click.
- Displays: filename, full Python code with line numbers and syntax highlighting, list of selectors used, confidence map, copy button, download button.
- If uncertain selectors: shows them highlighted in red with a note.

### FR-6: Download Package
- `[Download All Scripts]` button creates a `.zip` of the entire playwright directory.
- Includes: `pages/`, `fixtures/`, `test_data/`, `tests/`, and a `README_HOW_TO_RUN.md`.

---

## 7. Artifacts Saved

| Artifact | Path |
| :--- | :--- |
| Per-case Python script | `uploads/{run_id}/artifacts/playwright/tests/test_TC_*.py` |
| Page Objects | `uploads/{run_id}/artifacts/playwright/pages/*.py` |
| Fixtures | `uploads/{run_id}/artifacts/playwright/fixtures/conftest.py` |
| Data accessor | `uploads/{run_id}/artifacts/playwright/test_data/test_data.py` |
| Scripts ZIP | `uploads/{run_id}/artifacts/playwright_scripts.zip` |

---

## 8. Backend API Contracts

```
POST /api/v1/runs/{run_id}/generate-scripts
  Response: SSE stream → { event: "script_ready", data: { case_id, filename, confidence } }

GET /api/v1/runs/{run_id}/scripts/{case_id}
  Response: { script: PlaywrightScript }

GET /api/v1/runs/{run_id}/artifacts/playwright_scripts.zip
  Response: Binary ZIP download

POST /api/v1/runs/{run_id}/scripts/{case_id}/retry
  Response: { script: PlaywrightScript }
```

---

## 9. Acceptance Criteria
- [ ] One Python file generated per test case.
- [ ] Scripts use grounded selectors from UI inventory.
- [ ] `conftest.py` includes screenshot fixture capturing PASSED and FAILED states.
- [ ] `test_data.py` accessor correctly returns records by case_id.
- [ ] Script viewer modal shows full syntax-highlighted code, selectors, and confidence map.
- [ ] Download All creates a valid ZIP with README.
- [ ] Uncertain selectors are flagged with ⚠️ badge and highlighted in modal.
- [ ] Per-script regeneration replaces only that script without affecting others.
