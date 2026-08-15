"""Integration tests for end-to-end QET MVP Pipeline and artifact generation."""

import pytest
from pathlib import Path
from src.models.schemas import AppState, ExecutionMode, ExecutionRequest, IntakeManifest
from src.services.zip_service import ZipService
from src.services.execution_engine import ExecutionEngine, ExecutionNotAllowedError
from src.workflows.pipeline import SequentialQETPipeline


def test_end_to_end_mvp_pipeline(tmp_path: Path) -> None:
    sample_zip = Path("cfa_digital_journey_sample.zip")
    assert sample_zip.exists(), "Sample ZIP archive must exist"
    
    zip_service = ZipService()
    manifest, _ = zip_service.process_zip_upload(
        upload_id="test_upl_001",
        zip_path=sample_zip,
        filename="cfa_digital_journey_sample.zip"
    )
    
    initial_state = AppState(intake_manifest=manifest)
    pipeline = SequentialQETPipeline()
    
    final_state = pipeline.run(initial_state)
    
    # 1. Verify Application Understanding
    assert final_state.understanding is not None
    assert len(final_state.understanding.components) > 0
    assert len(final_state.understanding.flows) > 0
    
    # 2. Verify Positive and Negative Test Case Generation
    assert final_state.test_suite is not None
    pos_cases = [tc for tc in final_state.test_suite.test_cases if "POS" in tc.case_id]
    neg_cases = [tc for tc in final_state.test_suite.test_cases if "NEG" in tc.case_id]
    assert len(pos_cases) > 0, "Positive test cases must be generated"
    assert len(neg_cases) > 0, "Negative test cases must be generated"
    
    # 3. Verify Synthetic Test Data Generation
    assert final_state.synthetic_dataset is not None
    assert final_state.synthetic_dataset.is_synthetic is True
    assert len(final_state.synthetic_dataset.records) > 0
    
    # 4. Verify Playwright Script Generation
    assert len(final_state.playwright_scripts) > 0
    pom_file = Path("workspace/generated_playwright_tests/cfa_pages.py")
    script_file = Path("workspace/generated_playwright_tests/test_cfa_journey.py")
    assert pom_file.exists(), "Page Object Model file must be written to disk"
    assert script_file.exists(), "Test script file must be written to disk"
    
    # 5. Verify HTML & PDF Report Generation
    assert final_state.latest_report is not None
    html_file = Path(final_state.latest_report.html_report_path)
    pdf_file = Path(final_state.latest_report.pdf_report_path)
    assert html_file.exists(), "HTML quality report file must be written to disk"
    assert pdf_file.exists(), "PDF quality report export file must be written to disk"


def test_disabled_execution_modes_blocked() -> None:
    engine = ExecutionEngine()
    disabled_modes = [
        ExecutionMode.URL_EXECUTION,
        ExecutionMode.API_TESTING,
        ExecutionMode.PERFORMANCE_TESTING,
        ExecutionMode.ACCESSIBILITY_EXECUTION,
        ExecutionMode.SECURITY_SCANNING
    ]
    
    for mode in disabled_modes:
        req = ExecutionRequest(execution_id="test_blocked", mode=mode, explicit_user_approval=True)
        with pytest.raises(ExecutionNotAllowedError):
            engine.validate_request(req)


def test_run_single_stage_executes_only_selected_stage(monkeypatch) -> None:
    pipeline = SequentialQETPipeline()
    state = AppState()

    called = []

    monkeypatch.setattr(pipeline, "_dependencies_satisfied", lambda s, stage: True)

    def fake_execute(stage, current):
        called.append(stage)
        return current

    monkeypatch.setattr(pipeline, "_execute_stage", fake_execute)

    updated = pipeline.run_single_stage(state, "Test Cases")
    assert updated is state
    assert called == ["Test Cases"]


def test_run_single_stage_rerun_resets_downstream(monkeypatch) -> None:
    pipeline = SequentialQETPipeline()
    state = AppState()

    state.understanding = object()
    state.test_suite = object()
    state.synthetic_dataset = object()
    state.playwright_scripts = [object()]
    state.latest_report = object()

    def fake_execute(stage, current):
        assert stage == "Test Cases"
        assert current.understanding is not None
        assert current.test_suite is None
        assert current.synthetic_dataset is None
        assert current.playwright_scripts == []
        assert current.latest_report is None
        current.test_suite = "recomputed"
        return current

    monkeypatch.setattr(pipeline, "_execute_stage", fake_execute)

    updated = pipeline.run_single_stage(state, "Test Cases")
    assert updated.test_suite == "recomputed"


def test_pipeline_records_stage_lifecycle_and_upcoming_agent(monkeypatch) -> None:
    pipeline = SequentialQETPipeline()
    manifest = IntakeManifest(
        upload_id="test",
        zip_filename="",
        extracted_path="uploads/test/extracted",
        total_files=1,
        total_size_bytes=1,
        doc_files=["requirements.md"],
        created_at="2026-08-15T00:00:00+00:00",
    )
    state = AppState(intake_manifest=manifest)

    monkeypatch.setattr(pipeline, "_dependencies_satisfied", lambda current, stage: True)
    monkeypatch.setattr(pipeline, "_validate_stage_outputs", lambda stage, current: True)
    monkeypatch.setattr(pipeline.understanding_agent, "run", lambda current: current)

    updated = pipeline.run_single_stage(state, "Understanding")

    assert [event["event_type"] for event in updated.agent_timeline] == [
        "agent_entered",
        "agent_completed",
    ]
    assert updated.agent_timeline[-1]["generation"] == 1
    assert updated.active_agent == "Requirement Categorization" if pipeline.STAGES[1] == "Requirement Categorization" else "Test Cases"
    assert updated.upcoming_agent == pipeline.STAGES[1]


def test_pipeline_retry_increments_generation_and_invalidates_downstream(monkeypatch) -> None:
    pipeline = SequentialQETPipeline()
    manifest = IntakeManifest(
        upload_id="test",
        zip_filename="",
        extracted_path="uploads/test/extracted",
        total_files=1,
        total_size_bytes=1,
        doc_files=["requirements.md"],
        created_at="2026-08-15T00:00:00+00:00",
    )
    state = AppState(intake_manifest=manifest, reset_generation=1)
    state.test_suite = object()
    state.agent_timeline = [
        {"agent_id": "Understanding", "generation": 1, "status": "completed"},
        {"agent_id": "Test Cases", "generation": 1, "status": "completed"},
    ]

    monkeypatch.setattr(pipeline, "_dependencies_satisfied", lambda current, stage: True)
    monkeypatch.setattr(pipeline, "_validate_stage_outputs", lambda stage, current: True)
    monkeypatch.setattr(pipeline.understanding_agent, "run", lambda current: current)
    monkeypatch.setattr(pipeline, "_execute_stage", lambda stage, current: current)

    updated = pipeline.retry_stage(state, "Understanding")

    assert updated.reset_generation == 2
    assert updated.test_suite is None
    invalidated = [event for event in updated.agent_timeline if event["status"] == "invalidated"]
    assert invalidated
    assert all(event["generation"] == 2 for event in invalidated)


def test_pipeline_records_blocked_dependency() -> None:
    pipeline = SequentialQETPipeline()
    state = AppState()

    updated = pipeline.run_single_stage(state, "Understanding")

    assert updated.errors
    assert updated.agent_timeline[-1]["status"] == "blocked"
    assert updated.agent_timeline[-1]["agent_id"] == "Understanding"
