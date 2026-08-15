"""Unit tests for Phase 2 Application Understanding Agent & Artifacts."""

import json
import pytest
from pathlib import Path
from schemas.contracts import AppState, IntakeManifest
from src.agents.understanding_agent import UnderstandingAgent
from src.utils.errors import AIRequiredFailureException


AI_PAYLOAD = {
    "summary": "Uploaded portal with authentication and upload flows",
    "architecture_notes": "React SPA with REST services",
    "testability_observations": ["Login form exposes data-testid hooks"],
    "entry_points": ["/signin"],
    "components": [{
        "component_id": "c1",
        "name": "Sign In View",
        "type": "View",
        "file_path": "src/pages/SignIn.tsx",
        "description": "Credential capture",
        "selectors": ["[data-testid='signin-submit']"],
    }],
    "flows": [{
        "flow_id": "f1",
        "name": "Authenticate",
        "start_point": "/signin",
        "end_point": "/dashboard",
        "steps": ["Enter credentials", "Submit"],
        "description": "Successful sign in",
    }],
    "gaps": [{
        "gap_id": "g1",
        "title": "Timeout behaviour undefined",
        "description": "No retry policy documented",
        "category": "RequirementWithoutCode",
        "severity": "Medium",
        "evidence_source": "requirements.md",
        "confidence": "Medium",
    }],
}


def _stub_ai(monkeypatch: pytest.MonkeyPatch, agent: UnderstandingAgent, payload: dict) -> None:
    from src.config import config

    monkeypatch.setattr(type(config), "get_active_provider", lambda self: "gemini")
    monkeypatch.setattr(type(config), "get_provider_api_keys", lambda self, provider: ["gemini-key"] if provider == "gemini" else [])
    monkeypatch.setattr(agent.llm, "generate_text", lambda prompt, profile="default": json.dumps(payload))


def test_understanding_output_comes_from_model(monkeypatch: pytest.MonkeyPatch) -> None:
    agent = UnderstandingAgent(run_id="RUN-TEST-U1")
    _stub_ai(monkeypatch, agent, AI_PAYLOAD)

    updated_state = agent.run(AppState(run_id="RUN-TEST-U1"))
    u = updated_state.understanding

    assert u is not None
    assert u.summary == AI_PAYLOAD["summary"]
    assert [c.file_path for c in u.components] == ["src/pages/SignIn.tsx"]
    assert [f.flow_id for f in u.flows] == ["f1"]
    assert u.entry_points == ["/signin"]
    assert u.provenance["sample_data_used"] is False


def test_missing_model_sections_fail_instead_of_using_samples(monkeypatch: pytest.MonkeyPatch) -> None:
    agent = UnderstandingAgent(run_id="RUN-TEST-U2")
    _stub_ai(monkeypatch, agent, {"summary": "s", "architecture_notes": "a", "components": [], "flows": []})

    with pytest.raises(AIRequiredFailureException) as exc_info:
        agent.run(AppState(run_id="RUN-TEST-U2"))

    assert exc_info.value.error_code == "schema_validation_failed"
    assert "components" in exc_info.value.diagnostics["missing_sections"]


def test_inventories_and_score_are_model_derived(monkeypatch: pytest.MonkeyPatch) -> None:
    payload = dict(AI_PAYLOAD)
    payload["api_endpoints"] = [{
        "endpoint_id": "api_1",
        "method": "post",
        "path": "/api/session",
        "description": "Create session",
        "source_file": "src/api/session.ts",
    }]
    payload["requirement_validation"] = [
        {"item_id": 1, "item_name": "Unambiguous Language", "status": "Present", "evidence_source": "requirements.md", "confidence": "High", "observations": ""},
        {"item_id": 2, "item_name": "Testable Acceptance Criteria", "status": "Missing", "evidence_source": "requirements.md", "confidence": "High", "observations": ""},
    ]

    agent = UnderstandingAgent(run_id="RUN-TEST-U3")
    _stub_ai(monkeypatch, agent, payload)

    u = agent.run(AppState(run_id="RUN-TEST-U3")).understanding

    assert u.api_inventory.total_endpoints == 1
    assert u.api_inventory.endpoints[0].method == "POST"
    assert u.api_inventory.endpoints[0].analysis_only is True
    assert u.validation_report.evaluated_items_count == 2
    assert u.quality_score_percentage == 50.0
    assert u.ui_inventory.total_controls == 1


def test_no_sample_inventory_when_model_omits_them(monkeypatch: pytest.MonkeyPatch) -> None:
    agent = UnderstandingAgent(run_id="RUN-TEST-U5")
    _stub_ai(monkeypatch, agent, AI_PAYLOAD)

    u = agent.run(AppState(run_id="RUN-TEST-U5")).understanding

    assert u.api_inventory.total_endpoints == 0
    assert u.validation_report is None
    assert u.quality_score_percentage == 0.0
    assert "/api/v1/cfa/" not in u.model_dump_json()


def test_versioned_artifact_generation(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    agent = UnderstandingAgent(run_id="RUN-TEST-U4")
    agent.artifact_dir = tmp_path
    _stub_ai(monkeypatch, agent, AI_PAYLOAD)

    agent.run(AppState(run_id="RUN-TEST-U4"))

    for fname in [
        "application_understanding.json",
        "requirements_validation.json",
        "requirements_gaps.json",
        "module_inventory.json",
        "ui_inventory.json",
        "api_inventory.json",
    ]:
        assert (tmp_path / fname).exists(), f"Missing artifact file: {fname}"


def test_missing_provider_key_fails_fast(monkeypatch: pytest.MonkeyPatch) -> None:
    from src.config import config

    monkeypatch.setattr(type(config), "get_provider_api_keys", lambda self, provider: [])
    agent = UnderstandingAgent(run_id="RUN-TEST-OFFLINE")

    with pytest.raises(AIRequiredFailureException) as exc_info:
        agent.run(AppState(run_id="RUN-TEST-OFFLINE"))

    assert exc_info.value.error_code == "provider_key_missing"
