"""Integration test suite for Spec 013 Live Playwright Execution, Lifecycle Controls, and AI Intelligence."""

import os
import json
import pytest
from fastapi.testclient import TestClient
from src.api.fastapi_app import app
from schemas.contracts import (
    AppState,
    ExecutionStatus,
    TestCase,
    TestSuite,
    ExecutionRequest,
    AIScriptModificationRequest,
)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def run_with_test_cases(client):
    # Create a new run
    resp = client.post("/api/v1/runs", json={"project_name": "Spec013 Test Run"})
    assert resp.status_code == 200
    data = resp.json()
    run_id = data["run_id"]

    # Seed state with test cases
    from src.services.run_state_service import load_run_state, save_run_state
    state = load_run_state(run_id)
    if not state:
        state = AppState(run_id=run_id, project_name="Spec013 Test Run")

    state.test_suite = TestSuite(
        suite_id="TS-001",
        name="Spec 013 Suite",
        description="Spec 013 Suite Description",
        test_cases=[
            TestCase(
                case_id="TC-POS-001",
                title="Valid Login Flow",
                case_type="Positive",
                feature_area="Authentication",
                priority="High",
                description="Valid credentials login",
                expected_result="Dashboard loads successfully",
                review_status="approved"
            ),
            TestCase(
                case_id="TC-NEG-001",
                title="Invalid Password Rejection",
                case_type="Negative",
                feature_area="Authentication",
                priority="High",
                description="Invalid credentials error banner",
                expected_result="Error banner is shown",
                review_status="approved"
            ),
        ]
    )
    save_run_state(state)
    return run_id


def test_pipeline_lifecycle_endpoints(client, run_with_test_cases):
    run_id = run_with_test_cases

    # 1. Pause pipeline
    res_pause = client.post(f"/api/v1/runs/{run_id}/pipeline/pause")
    assert res_pause.status_code == 200
    assert res_pause.json()["status"] == "paused"

    # 2. Resume pipeline
    res_resume = client.post(f"/api/v1/runs/{run_id}/pipeline/resume")
    assert res_resume.status_code == 200
    assert res_resume.json()["status"] == "resumed"

    # 3. Stop pipeline
    res_stop = client.post(f"/api/v1/runs/{run_id}/pipeline/stop")
    assert res_stop.status_code == 200
    assert res_stop.json()["status"] == "stopped"


def test_execution_launch_pause_resume_stop(client, run_with_test_cases):
    run_id = run_with_test_cases

    # Launch execution with gate approvals
    launch_payload = {
        "test_case_ids": ["TC-POS-001", "TC-NEG-001"],
        "explicit_user_approval": True,
        "is_non_production_confirmed": True,
        "is_script_reviewed": True,
    }
    res_launch = client.post(f"/api/v1/runs/{run_id}/executions", json=launch_payload)
    assert res_launch.status_code == 200
    exec_data = res_launch.json()
    execution_id = exec_data["execution_id"]
    assert execution_id.startswith("EXEC-")

    # Pause execution
    res_pause = client.post(f"/api/v1/runs/{run_id}/executions/{execution_id}/pause")
    assert res_pause.status_code == 200
    assert res_pause.json()["status"] in ["paused", "running", "passed", "failed"]

    # Resume execution
    res_resume = client.post(f"/api/v1/runs/{run_id}/executions/{execution_id}/resume")
    assert res_resume.status_code == 200

    # Stop execution
    res_stop = client.post(f"/api/v1/runs/{run_id}/executions/{execution_id}/stop")
    assert res_stop.status_code == 200


def test_multi_level_results_and_screenshots(client, run_with_test_cases):
    run_id = run_with_test_cases

    # Launch execution
    res_exec = client.post(
        f"/api/v1/runs/{run_id}/executions",
        json={
            "test_case_ids": ["TC-POS-001"],
            "explicit_user_approval": True,
            "is_non_production_confirmed": True,
            "is_script_reviewed": True,
        }
    )
    assert res_exec.status_code == 200
    execution_id = res_exec.json()["execution_id"]

    # Poll until execution finishes
    import time
    for _ in range(100):
        status_res = client.get(f"/api/v1/runs/{run_id}/executions/{execution_id}")
        if status_res.status_code == 200:
            st = status_res.json()["status"]
            if st in ["passed", "failed", "stopped"]:
                break
        time.sleep(0.1)

    # Fetch multi-level execution results
    res_results = client.get(f"/api/v1/runs/{run_id}/execution-results")
    assert res_results.status_code == 200
    report = res_results.json()
    assert "summary" in report
    assert "breakdown_by_case_type" in report
    assert "scripts" in report
    assert len(report["scripts"]) >= 1
    assert "why_passed" in report["scripts"][0]

    # Test screenshot serving endpoint
    screenshot_res = client.get(f"/api/v1/runs/{run_id}/screenshots/TC-POS-001_passed.png")
    assert screenshot_res.status_code == 200
    assert "image/" in screenshot_res.headers.get("content-type", "")


def test_ai_analysis_and_script_healing_endpoints(client, run_with_test_cases):
    run_id = run_with_test_cases

    # 1. AI Test Intelligence Analysis
    res_ai = client.post(f"/api/v1/runs/{run_id}/ai-analysis")
    assert res_ai.status_code == 200
    analysis = res_ai.json()
    assert "overall_health_score" in analysis
    assert "risk_level" in analysis
    assert "defect_distribution" in analysis
    assert "test_case_insights" in analysis

    # 2. AI Script Modification Request
    mod_payload = {
        "script_filename": "test_tc_pos_001.py",
        "test_case_id": "TC-POS-001",
        "current_code": "def test_step(page):\n    page.goto('http://localhost:8501')\n",
        "failure_log": "TimeoutError: element not found",
        "instruction": "Add explicit wait for selector"
    }
    res_mod = client.post(f"/api/v1/runs/{run_id}/ai-modify-script", json=mod_payload)
    assert res_mod.status_code == 200
    mod_data = res_mod.json()
    assert "modified_code" in mod_data
    assert "explanation" in mod_data
    assert "diff_summary" in mod_data

    # 3. Apply Script Fix
    apply_payload = {
        "script_filename": "test_tc_pos_001.py",
        "test_case_id": "TC-POS-001",
        "modified_code": mod_data["modified_code"]
    }
    res_apply = client.post(f"/api/v1/runs/{run_id}/apply-script-fix", json=apply_payload)
    assert res_apply.status_code == 200
    assert res_apply.json()["status"] == "applied"
