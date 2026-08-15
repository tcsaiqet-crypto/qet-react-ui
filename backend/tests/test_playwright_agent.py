"""Unit tests for Phase 4 Playwright Generation Agent & Package Structure."""

import zipfile
import pytest
from pathlib import Path
from schemas.contracts import AppState
from src.agents.playwright_agent import PlaywrightAgent


def _state_with_ui_evidence(run_id: str) -> AppState:
    """Playwright generation requires selectors discovered upstream, so tests supply them."""
    from schemas.contracts import ApplicationUnderstanding, UIElementControl, UIInventory

    controls = [
        UIElementControl(control_id="ui_01", control_type="text_field", name="Username Input", selector="[data-testid='username-input']", page_route="/login"),
        UIElementControl(control_id="ui_02", control_type="text_field", name="Password Input", selector="[data-testid='password-input']", page_route="/login"),
        UIElementControl(control_id="ui_03", control_type="button", name="Login Button", selector="[data-testid='login-button']", page_route="/login"),
    ]
    understanding = ApplicationUnderstanding(
        summary="Test app",
        architecture_notes="Test notes",
        ui_inventory=UIInventory(total_controls=len(controls), controls=controls, controls_by_type={"text_field": 2, "button": 1}),
    )
    return AppState(run_id=run_id, understanding=understanding)


def test_playwright_package_structure(tmp_path: Path) -> None:
    run_id = "RUN-TEST-PW1"
    agent = PlaywrightAgent(run_id=run_id)
    agent.artifact_dir = tmp_path
    agent.output_dir = tmp_path / "playwright_output"
    agent.output_dir.mkdir(parents=True, exist_ok=True)
    
    state = _state_with_ui_evidence(run_id)
    updated = agent.run(state)
    
    scripts = updated.playwright_scripts
    assert len(scripts) >= 2
    
    pkg_dir = agent.output_dir
    assert (pkg_dir / "pages" / "cfa_pages.py").exists()
    assert (pkg_dir / "tests" / "test_cfa_journey.py").exists()
    assert (pkg_dir / "fixtures" / "conftest.py").exists()
    assert (pkg_dir / "test-data" / "synthetic_data.json").exists()
    assert (pkg_dir / "requirements.txt").exists()
    assert (pkg_dir / "README.md").exists()


def test_data_testid_selector_preference(tmp_path: Path) -> None:
    agent = PlaywrightAgent(run_id="RUN-TEST-PW2")
    agent.artifact_dir = tmp_path
    agent.output_dir = tmp_path / "playwright_output"
    agent.output_dir.mkdir(parents=True, exist_ok=True)
    
    scripts = agent._generate_playwright_package(_state_with_ui_evidence("RUN-TEST-PW2"))
    pom_script = next(s for s in scripts if s.filename == "pages/cfa_pages.py")
    
    assert "[data-testid=" in pom_script.code
    assert "username-input" in pom_script.code
    assert "login-button" in pom_script.code


def test_downloadable_zip_created(tmp_path: Path) -> None:
    run_id = "RUN-TEST-PW3"
    agent = PlaywrightAgent(run_id=run_id)
    agent.artifact_dir = tmp_path
    agent.output_dir = tmp_path / "playwright_output"
    agent.output_dir.mkdir(parents=True, exist_ok=True)
    
    state = _state_with_ui_evidence(run_id)
    agent.run(state)
    
    zip_path = tmp_path / "playwright_automation_package.zip"
    assert zip_path.exists()
    
    with zipfile.ZipFile(zip_path, "r") as zf:
        namelist = zf.namelist()
        assert "pages/cfa_pages.py" in namelist or "pages\\cfa_pages.py" in namelist or any("cfa_pages.py" in n for n in namelist)
        assert "README.md" in namelist or any("README.md" in n for n in namelist)
