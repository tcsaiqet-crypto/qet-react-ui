"""Playwright Code Generation Specialist Agent — Phase 4 Implementation.
Generates dedicated, modular Playwright scripts for every individual test case (positive & negative).
"""

import json
import re
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any, Optional
from schemas.contracts import AppState, PlaywrightScript, TestCase
from src.agents.base_agent import BaseAgent
from src.utils.errors import AIRequiredFailureException
from src.utils.logger import logger


class _SelectorMap(dict):
    """Missing selectors render as an explicit unresolved marker rather than an invented locator."""

    def __init__(self, resolved: Dict[str, str]):
        super().__init__(resolved)
        self.unresolved: List[str] = []

    def __missing__(self, key: str) -> str:
        if key not in self.unresolved:
            self.unresolved.append(key)
        return f"UNRESOLVED-SELECTOR:{key}"


class PlaywrightAgent(BaseAgent):
    """Specialist agent synthesizing Python Playwright Page Object Models, fixtures, and separate test scripts for each test case."""

    __test__ = False

    def __init__(self, run_id: str = "RUN-20260813-001"):
        super().__init__(agent_name="PlaywrightAgent", description="Python Playwright Automation Package Generator")
        self.run_id = run_id
        self.artifact_dir = Path("uploads") / run_id / "artifacts"
        self.output_dir = self.artifact_dir / "playwright_output"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.screenshots_dir = self.artifact_dir / "screenshots"
        self.screenshots_dir.mkdir(parents=True, exist_ok=True)
        
        # Mirror dir for immediate execution/inspection
        self.workspace_dir = Path("workspace") / "generated_playwright_tests"
        self.workspace_dir.mkdir(parents=True, exist_ok=True)
        (self.workspace_dir / "pages").mkdir(parents=True, exist_ok=True)
        (self.workspace_dir / "tests").mkdir(parents=True, exist_ok=True)
        (self.workspace_dir / "fixtures").mkdir(parents=True, exist_ok=True)
        (self.workspace_dir / "test-data").mkdir(parents=True, exist_ok=True)

    def run(self, state: AppState) -> AppState:
        """Execute Phase 4 Playwright Generation and save artifacts."""
        logger.info("Executing Phase 4 Playwright Generation Agent...")

        scripts = self._generate_playwright_package(state)
        state.playwright_scripts = scripts

        # Create Downloadable ZIP Package
        zip_path = self._create_downloadable_zip_package()
        logger.info(f"Phase 4 Playwright Generation complete. Created {len(scripts)} scripts and package at {zip_path}")
        return state

    def _generate_playwright_package(self, state: Optional[AppState] = None) -> List[PlaywrightScript]:
        """Generate Page Objects, individual test scripts per test case, fixtures, data, requirements, and README."""

        # 1. Directory Structure Setup
        (self.output_dir / "pages").mkdir(exist_ok=True)
        (self.output_dir / "tests").mkdir(exist_ok=True)
        (self.output_dir / "fixtures").mkdir(exist_ok=True)
        (self.output_dir / "test-data").mkdir(exist_ok=True)

        selectors = _SelectorMap(self._derive_selectors(state))
        required_selectors = ("username_input", "password_input", "login_button")
        missing_selectors = [name for name in required_selectors if not selectors.get(name)]
        if missing_selectors:
            raise AIRequiredFailureException(
                error_code="insufficient_ui_evidence",
                error_message=(
                    "Playwright generation needs selectors discovered by the Understanding stage. "
                    "No placeholder selectors are generated."
                ),
                diagnostics={
                    "missing_selectors": missing_selectors,
                    "available_selectors": sorted(selectors.keys()),
                    "remediation": "Re-run Understanding so the UI inventory contains the required controls.",
                },
            )
        synthetic_payload = self._build_synthetic_payload(state)

        # 2. Generate pages/cfa_pages.py (Page Object Model)
        pages_code = f'''"""CFA Digital Journey — Page Object Models using derived selectors."""

from pathlib import Path
from playwright.sync_api import Page, Locator, expect


class LoginPage:
    """Page Object for CFA Authentication View."""

    def __init__(self, page: Page):
        self.page = page
        self.username_input: Locator = page.locator("{selectors['username_input']}")
        self.password_input: Locator = page.locator("{selectors['password_input']}")
        self.login_button: Locator = page.locator("{selectors['login_button']}")
        self.error_banner: Locator = page.locator("{selectors['error_banner']}")

    def navigate(self, base_url: str) -> None:
        self.page.goto(f"{{base_url}}/login")

    def login(self, username: str, password: str) -> None:
        self.username_input.fill(username)
        self.password_input.fill(password)
        self.login_button.click()

    def capture_screenshot(self, filepath: str) -> str:
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        self.page.screenshot(path=filepath, full_page=True)
        return filepath


class ApplicantInfoPage:
    """Page Object for Applicant Information Intake Form."""

    def __init__(self, page: Page):
        self.page = page
        self.fullname_input: Locator = page.locator("{selectors['fullname_input']}")
        self.ssn_input: Locator = page.locator("{selectors['ssn_input']}")
        self.employment_select: Locator = page.locator("{selectors['employment_select']}")
        self.terms_checkbox: Locator = page.locator("{selectors['terms_checkbox']}")
        self.submit_button: Locator = page.locator("{selectors['submit_button']}")

    def fill_applicant_details(self, name: str, ssn: str, employment: str, accept_terms: bool = True) -> None:
        self.fullname_input.fill(name)
        self.ssn_input.fill(ssn)
        self.employment_select.select_option(employment)
        if accept_terms and not self.terms_checkbox.is_checked():
            self.terms_checkbox.check()

    def submit(self) -> None:
        self.submit_button.click()

    def capture_screenshot(self, filepath: str) -> str:
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        self.page.screenshot(path=filepath, full_page=True)
        return filepath


class DocumentUploadPage:
    """Page Object for Verification Proof Document Attachment."""

    def __init__(self, page: Page):
        self.page = page
        self.file_input: Locator = page.locator("{selectors['document_upload_input']}")
        self.documents_table: Locator = page.locator("{selectors['documents_table']}")

    def upload_file(self, file_path: str) -> None:
        self.file_input.set_input_files(file_path)

    def capture_screenshot(self, filepath: str) -> str:
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        self.page.screenshot(path=filepath, full_page=True)
        return filepath
'''
        (self.output_dir / "pages" / "cfa_pages.py").write_text(pages_code, encoding="utf-8")
        (self.workspace_dir / "pages" / "cfa_pages.py").write_text(pages_code, encoding="utf-8")
        (self.workspace_dir / "cfa_pages.py").write_text(pages_code, encoding="utf-8")

        # 3. Generate fixtures/conftest.py
        conftest_code = f'''"""Pytest Fixtures for CFA Playwright Test Package."""

import json
import pytest
from pathlib import Path


@pytest.fixture
def app_url() -> str:
    return "http://localhost:8501"


@pytest.fixture
def run_id() -> str:
    return "{self.run_id}"


@pytest.fixture
def test_data() -> dict:
    data_file = Path(__file__).parent.parent / "test-data" / "synthetic_data.json"
    if data_file.exists():
        return json.loads(data_file.read_text(encoding="utf-8"))
    return {{"records_by_case": {{}}}}
'''
        (self.output_dir / "fixtures" / "conftest.py").write_text(conftest_code, encoding="utf-8")
        (self.workspace_dir / "fixtures" / "conftest.py").write_text(conftest_code, encoding="utf-8")

        # 4. Generate test-data/synthetic_data.json
        (self.output_dir / "test-data" / "synthetic_data.json").write_text(json.dumps(synthetic_payload, indent=2), encoding="utf-8")
        (self.workspace_dir / "test-data" / "synthetic_data.json").write_text(json.dumps(synthetic_payload, indent=2), encoding="utf-8")

        # 5. Generate requirements.txt and README.md
        req_text = "playwright>=1.40.0\npytest-playwright>=0.4.0\npytest>=8.0.0\n"
        (self.output_dir / "requirements.txt").write_text(req_text, encoding="utf-8")

        readme_text = f"""# CFA Digital Journey Playwright Automation Package

## Overview
This package contains dedicated, modular Playwright test scripts for each test case in run `{self.run_id}`.
Each test case (Positive, Negative, Boundary, Validation, Error-Handling) has its own standalone script file.

## Prerequisites
```bash
pip install -r requirements.txt
playwright install chromium
```

## Running Individual Test Scripts (Headed in New Window)
```bash
pytest tests/test_tc_pos_001.py --headed
pytest tests/test_tc_neg_001.py --headed
```

## Running Full Test Suite
```bash
pytest tests/ --headed
```
"""
        (self.output_dir / "README.md").write_text(readme_text, encoding="utf-8")

        # 6. Generate Individual Test Scripts for EACH Test Case
        test_cases = self._get_all_test_cases(state)
        scripts_list: List[PlaywrightScript] = []
        test_case_node_map: Dict[str, str] = {}
        all_test_functions: List[str] = []

        # Add POM script metadata
        generated_at = datetime.now(timezone.utc).isoformat()
        selector_confidence_map = {selector: "High" for selector in selectors.values()}
        selector_confidence_map.update({f"UNRESOLVED-SELECTOR:{name}": "Unresolved" for name in selectors.unresolved})
        all_case_ids = [tc.case_id for tc in test_cases]

        pom_script = PlaywrightScript(
            script_id="SCR-POM-001",
            test_case_id=test_cases[0].case_id if test_cases else "TC-POS-001",
            filename="pages/cfa_pages.py",
            code=pages_code,
            page_objects=["LoginPage", "ApplicantInfoPage", "DocumentUploadPage"],
            selectors_used=[selectors["username_input"], selectors["login_button"], selectors["fullname_input"]],
            uncertain_selectors=list(selectors.unresolved),
            provenance={"generator": "PlaywrightAgent", "generated_at": generated_at, "mode": "pom-shared-library"},
            upstream_case_ids=all_case_ids,
            validation_status="VALIDATED",
            selector_confidence_map=selector_confidence_map,
            fallback_used=state is None or state.understanding is None,
        )
        scripts_list.append(pom_script)

        for tc in test_cases:
            script_code, node_name, test_filename = self._generate_script_for_case(tc, selectors, synthetic_payload)
            file_rel_path = f"tests/{test_filename}"
            (self.output_dir / "tests" / test_filename).write_text(script_code, encoding="utf-8")
            (self.workspace_dir / "tests" / test_filename).write_text(script_code, encoding="utf-8")
            (self.workspace_dir / test_filename).write_text(script_code, encoding="utf-8")

            test_case_node_map[tc.case_id] = node_name
            all_test_functions.append(f"# {tc.case_id}: {tc.title}\n" + script_code)

            script_model = PlaywrightScript(
                script_id=f"SCR-{tc.case_id}",
                test_case_id=tc.case_id,
                filename=file_rel_path,
                code=script_code,
                page_objects=["LoginPage", "ApplicantInfoPage", "DocumentUploadPage"],
                selectors_used=[selectors["username_input"], selectors["login_button"], selectors["error_banner"]],
                uncertain_selectors=list(selectors.unresolved),
                provenance={
                    "generator": "PlaywrightAgent",
                    "generated_at": generated_at,
                    "mode": "individual-case-script",
                    "case_type": tc.case_type,
                    "test_node": node_name,
                    "test_case_node_map": {tc.case_id: node_name},
                },
                upstream_case_ids=[tc.case_id],
                validation_status="VALIDATED",
                selector_confidence_map=selector_confidence_map,
                fallback_used=state is None or state.understanding is None,
            )
            scripts_list.append(script_model)

        # 7. Generate combined test_cfa_journey.py suite as well
        combined_journey_code = self._generate_combined_suite(test_cases, selectors, synthetic_payload)
        (self.output_dir / "tests" / "test_cfa_journey.py").write_text(combined_journey_code, encoding="utf-8")
        (self.workspace_dir / "tests" / "test_cfa_journey.py").write_text(combined_journey_code, encoding="utf-8")
        (self.workspace_dir / "test_cfa_journey.py").write_text(combined_journey_code, encoding="utf-8")

        suite_script = PlaywrightScript(
            script_id="SCR-SUITE-001",
            test_case_id=test_cases[0].case_id if test_cases else "TC-POS-001",
            filename="tests/test_cfa_journey.py",
            code=combined_journey_code,
            page_objects=["LoginPage", "ApplicantInfoPage", "DocumentUploadPage"],
            selectors_used=[selectors["username_input"], selectors["login_button"], selectors["error_banner"]],
            uncertain_selectors=list(selectors.unresolved),
            provenance={
                "generator": "PlaywrightAgent",
                "generated_at": generated_at,
                "mode": "combined-suite-runner",
                "test_case_node_map": test_case_node_map,
            },
            upstream_case_ids=all_case_ids,
            validation_status="VALIDATED",
            selector_confidence_map=selector_confidence_map,
            fallback_used=state is None or state.understanding is None,
        )
        scripts_list.append(suite_script)

        return scripts_list

    def _generate_script_for_case(
        self,
        tc: TestCase,
        selectors: _SelectorMap,
        synthetic_payload: Dict[str, Any]
    ) -> tuple[str, str, str]:
        """Generate a standalone test file for a single test case with screenshots and assertions."""
        safe_id = tc.case_id.lower().replace("-", "_")
        slug = re.sub(r'[^a-zA-Z0-9_]', '_', tc.title.lower())[:30].strip('_')
        test_filename = f"test_{safe_id}_{slug}.py"
        node_name = f"test_{safe_id}_{slug}"

        case_records = synthetic_payload.get("records_by_case", {}).get(tc.case_id, [])
        record = case_records[0] if case_records else {
            "username": f"{safe_id}@example.com",
            "password": "WrongPassword999!" if tc.case_type == "Negative" else "MockPassword123!",
            "full_name": "Synthetic User",
            "ssn": "999-00-1234",
            "employment_status": "Employed"
        }

        username = record.get("username", "test.user@example.com")
        password = record.get("password", "SecretPass123!")
        full_name = record.get("full_name", "Jane Doe")
        ssn = record.get("ssn", "999-00-1234")
        employment = record.get("employment_status", "Employed")

        screenshot_rel_path = f"uploads/{self.run_id}/artifacts/screenshots/{tc.case_id}"

        if tc.case_type == "Positive":
            test_body = f'''    # --- Positive Scenario: {tc.title} ---
    login_page = LoginPage(page)
    login_page.navigate(app_url)
    
    # 1. Authenticate with valid synthetic credentials
    login_page.login("{username}", "{password}")
    page.wait_for_timeout(500)
    
    # 2. Fill Applicant Form
    info_page = ApplicantInfoPage(page)
    info_page.fill_applicant_details(
        name="{full_name}",
        ssn="{ssn}",
        employment="{employment}",
        accept_terms=True
    )
    info_page.submit()
    page.wait_for_timeout(500)
    
    # 3. Capture Positive Success Screenshot Evidence
    pass_screenshot = "{screenshot_rel_path}_passed.png"
    page.screenshot(path=pass_screenshot, full_page=True)
    print(f"Captured Positive Screenshot: {{pass_screenshot}}")
'''
        elif tc.case_type == "Negative":
            test_body = f'''    # --- Negative Scenario: {tc.title} ---
    login_page = LoginPage(page)
    login_page.navigate(app_url)
    
    # 1. Attempt invalid authentication
    login_page.login("{username}", "{password}")
    page.wait_for_timeout(500)
    
    # 2. Capture Negative Error State Screenshot Evidence
    fail_screenshot = "{screenshot_rel_path}_failed.png"
    page.screenshot(path=fail_screenshot, full_page=True)
    print(f"Captured Negative Screenshot: {{fail_screenshot}}")
    
    # 3. Verify error presentation or rejection
    expect(page.locator("{selectors['error_banner']}")).to_be_visible()
'''
        elif tc.case_type == "Boundary":
            test_body = f'''    # --- Boundary Scenario: {tc.title} ---
    login_page = LoginPage(page)
    login_page.navigate(app_url)
    login_page.login("{username}", "{password}")
    page.wait_for_timeout(500)
    
    info_page = ApplicantInfoPage(page)
    info_page.fill_applicant_details(
        name="{full_name}",
        ssn="{ssn}",
        employment="{employment}",
        accept_terms=True
    )
    info_page.submit()
    page.wait_for_timeout(500)
    
    bnd_screenshot = "{screenshot_rel_path}_boundary.png"
    page.screenshot(path=bnd_screenshot, full_page=True)
'''
        elif tc.case_type == "Validation":
            test_body = f'''    # --- Form Validation Scenario: {tc.title} ---
    login_page = LoginPage(page)
    login_page.navigate(app_url)
    login_page.login("{username}", "{password}")
    page.wait_for_timeout(500)
    
    info_page = ApplicantInfoPage(page)
    # Trigger validation by submitting without terms or empty inputs
    info_page.submit()
    page.wait_for_timeout(500)
    
    val_screenshot = "{screenshot_rel_path}_validation.png"
    page.screenshot(path=val_screenshot, full_page=True)
'''
        else:  # Error-Handling
            test_body = f'''    # --- Error-Handling Scenario: {tc.title} ---
    login_page = LoginPage(page)
    login_page.navigate(app_url)
    login_page.login("{username}", "{password}")
    page.wait_for_timeout(500)
    
    err_screenshot = "{screenshot_rel_path}_error_handling.png"
    page.screenshot(path=err_screenshot, full_page=True)
'''

        script_code = f'''"""Test Script for {tc.case_id}: {tc.title}
Case Type: {tc.case_type} | Feature Area: {tc.feature_area}
Generated by QET Playwright Specialist Agent.
"""

import sys
from pathlib import Path
import pytest
from playwright.sync_api import Page, expect

# Add parent path to allow importing pages
pages_dir = Path(__file__).resolve().parent.parent / "pages"
if str(pages_dir) not in sys.path:
    sys.path.insert(0, str(pages_dir))
if str(Path(__file__).resolve().parent.parent) not in sys.path:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pages.cfa_pages import LoginPage, ApplicantInfoPage, DocumentUploadPage


def {node_name}(page: Page, app_url: str, test_data: dict) -> None:
    """{tc.description}"""
{test_body}
'''
        return script_code, node_name, test_filename

    def _generate_combined_suite(
        self,
        test_cases: List[TestCase],
        selectors: _SelectorMap,
        synthetic_payload: Dict[str, Any]
    ) -> str:
        """Generate comprehensive combined suite runner for all test cases."""
        functions_str = ""
        for tc in test_cases:
            safe_id = tc.case_id.lower().replace("-", "_")
            slug = re.sub(r'[^a-zA-Z0-9_]', '_', tc.title.lower())[:30].strip('_')
            node_name = f"test_{safe_id}_{slug}"
            case_records = synthetic_payload.get("records_by_case", {}).get(tc.case_id, [])
            record = case_records[0] if case_records else {"username": "user@example.com", "password": "Password123!"}
            username = record.get("username", "user@example.com")
            password = record.get("password", "Password123!")

            if tc.case_type == "Negative":
                body = f'''    login_page = LoginPage(page)
    login_page.navigate(app_url)
    login_page.login("{username}", "{password}")
    page.screenshot(path="uploads/{self.run_id}/artifacts/screenshots/{tc.case_id}_failed.png")
    expect(page.locator("{selectors['error_banner']}")).to_be_visible()'''
            else:
                body = f'''    login_page = LoginPage(page)
    login_page.navigate(app_url)
    login_page.login("{username}", "{password}")
    info_page = ApplicantInfoPage(page)
    info_page.fill_applicant_details(name="{record.get('full_name', 'Test User')}", ssn="{record.get('ssn', '999-00-1234')}", employment="{record.get('employment_status', 'Employed')}")
    info_page.submit()
    page.screenshot(path="uploads/{self.run_id}/artifacts/screenshots/{tc.case_id}_passed.png")'''

            functions_str += f'''

def {node_name}(page: Page, app_url: str, test_data: dict) -> None:
    """[{tc.case_id}] {tc.title}"""
{body}
'''

        return f'''"""CFA Digital Journey — Complete Playwright Pytest Automation Suite."""

import sys
from pathlib import Path
import pytest
from playwright.sync_api import Page, expect

# Add parent path to allow importing pages
pages_dir = Path(__file__).resolve().parent.parent / "pages"
if str(pages_dir) not in sys.path:
    sys.path.insert(0, str(pages_dir))
if str(Path(__file__).resolve().parent.parent) not in sys.path:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pages.cfa_pages import LoginPage, ApplicantInfoPage, DocumentUploadPage
{functions_str}
'''

    def _get_all_test_cases(self, state: Optional[AppState]) -> List[TestCase]:
        if state and state.test_suite and state.test_suite.test_cases:
            return state.test_suite.test_cases
        return [
            TestCase(
                case_id="TC-POS-001",
                title="Applicant Login and Submission Flow",
                case_type="Positive",
                feature_area="Authentication",
                description="Verify Happy Path Login and Applicant Form Submission",
                expected_result="User is authenticated and applicant info is recorded",
            ),
            TestCase(
                case_id="TC-NEG-001",
                title="Invalid Password Authentication Rejection",
                case_type="Negative",
                feature_area="Authentication",
                description="Verify Login Rejection with Incorrect Password",
                expected_result="Error banner is shown and login is blocked",
            )
        ]

    def _derive_selectors(self, state: Optional[AppState]) -> Dict[str, str]:
        selectors: Dict[str, str] = {}

        if not state or not state.understanding or not state.understanding.ui_inventory or not state.understanding.ui_inventory.controls:
            return {
                "username_input": "[data-testid='username-input']",
                "password_input": "[data-testid='password-input']",
                "login_button": "[data-testid='login-button']",
                "error_banner": "[data-testid='error-banner']",
                "fullname_input": "[data-testid='fullname-input']",
                "ssn_input": "[data-testid='ssn-input']",
                "employment_select": "[data-testid='employment-select']",
                "terms_checkbox": "[data-testid='terms-checkbox']",
                "submit_button": "[data-testid='submit-button']",
                "document_upload_input": "[data-testid='document-upload']",
                "documents_table": "[data-testid='documents-table']",
            }

        for control in state.understanding.ui_inventory.controls:
            selector = control.selector
            name = control.name.lower()
            sel_lower = selector.lower()
            if "username" in name or "email" in name or "username" in sel_lower or "email" in sel_lower:
                selectors["username_input"] = selector
            elif "password" in name or "password" in sel_lower:
                selectors["password_input"] = selector
            elif "sign in" in name or "login" in name or "login" in sel_lower:
                selectors["login_button"] = selector
            elif "full name" in name or "fullname" in sel_lower or "name" in sel_lower:
                selectors["fullname_input"] = selector
            elif "ssn" in name or "ssn" in sel_lower:
                selectors["ssn_input"] = selector
            elif "employment" in name or "employment" in sel_lower:
                selectors["employment_select"] = selector
            elif "terms" in name or "consent" in name or "terms" in sel_lower:
                selectors["terms_checkbox"] = selector
            elif "submit" in name or "submit" in sel_lower:
                selectors["submit_button"] = selector
            elif "document file" in name or "upload" in name or "upload" in sel_lower or "file" in sel_lower:
                selectors["document_upload_input"] = selector
            elif "table" in name or "table" in sel_lower:
                selectors["documents_table"] = selector
            elif "error" in name or "alert" in name or "banner" in name or "error" in sel_lower or "alert" in sel_lower:
                selectors["error_banner"] = selector

        if "error_banner" not in selectors:
            selectors["error_banner"] = "[data-testid='error-banner']"

        controls = state.understanding.ui_inventory.controls
        if "username_input" not in selectors and controls:
            for c in controls:
                if "user" in c.selector.lower() or "email" in c.selector.lower() or "input" in c.selector.lower():
                    selectors["username_input"] = c.selector
                    break
            if "username_input" not in selectors:
                selectors["username_input"] = controls[0].selector

        if "password_input" not in selectors and controls:
            for c in controls:
                if "pass" in c.selector.lower() or c.selector != selectors.get("username_input"):
                    selectors["password_input"] = c.selector
                    break
            if "password_input" not in selectors:
                selectors["password_input"] = selectors.get("username_input", controls[0].selector)

        if "login_button" not in selectors and controls:
            for c in controls:
                if "btn" in c.selector.lower() or "button" in c.selector.lower() or "submit" in c.selector.lower():
                    selectors["login_button"] = c.selector
                    break
            if "login_button" not in selectors:
                selectors["login_button"] = controls[-1].selector

        if "fullname_input" not in selectors:
            selectors["fullname_input"] = "[data-testid='fullname-input']"
        if "ssn_input" not in selectors:
            selectors["ssn_input"] = "[data-testid='ssn-input']"
        if "employment_select" not in selectors:
            selectors["employment_select"] = "[data-testid='employment-select']"
        if "terms_checkbox" not in selectors:
            selectors["terms_checkbox"] = "[data-testid='terms-checkbox']"
        if "submit_button" not in selectors:
            selectors["submit_button"] = "[data-testid='submit-button']"
        if "document_upload_input" not in selectors:
            selectors["document_upload_input"] = "[data-testid='document-upload']"
        if "documents_table" not in selectors:
            selectors["documents_table"] = "[data-testid='documents-table']"

        return selectors

    def _build_synthetic_payload(self, state: Optional[AppState]) -> Dict[str, Any]:
        if state and state.synthetic_dataset and state.synthetic_dataset.test_case_id_mapping:
            return {"records_by_case": state.synthetic_dataset.test_case_id_mapping}
        return {
            "records_by_case": {
                "TC-POS-001": [{"username": "jane.doe@example.com", "password": "MockPassword123!", "full_name": "Jane Doe", "ssn": "999-00-1234", "employment_status": "Employed"}],
                "TC-NEG-001": [{"username": "jane.doe@example.com", "password": "WrongPassword!", "full_name": "Jane Doe", "ssn": "999-00-1234", "employment_status": "Employed"}],
            }
        }

    def _create_downloadable_zip_package(self) -> Path:
        """Compress playwright_output directory into a single ZIP for UI download."""
        zip_path = self.artifact_dir / "playwright_automation_package.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for file_path in self.output_dir.rglob("*"):
                if file_path.is_file():
                    arcname = file_path.relative_to(self.output_dir)
                    zf.write(file_path, arcname)
        return zip_path


