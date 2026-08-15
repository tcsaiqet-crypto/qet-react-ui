"""Tests for FastAPI Runtime Layer, state persistence, and failfast AI understanding."""

import io
import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from src.api.fastapi_app import app
from src.services import ai_settings_store
from src.services.run_state_service import load_run_state
from src.agents.understanding_agent import AIRequiredFailureException, UnderstandingAgent
from schemas.contracts import AppState

client = TestClient(app)


@pytest.fixture(autouse=True)
def isolate_ai_settings(monkeypatch: pytest.MonkeyPatch, tmp_path_factory: pytest.TempPathFactory):
    """Keep every test off the real workspace settings file so test keys can never leak into it."""
    settings_path = tmp_path_factory.mktemp("ai_settings") / "ai_settings.json"
    monkeypatch.setattr(ai_settings_store, "_settings_path", lambda: settings_path)
    yield


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    # Serves the built React app (dist/) when present, else the vanilla fallback/health text.
    assert "<div id=\"root\">" in response.text or "QET API Layer" in response.text or "QET Agent" in response.text

    health_resp = client.get("/api/v1/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "ok"


def test_create_run():
    response = client.post("/api/v1/runs", json={"project_name": "Test Project"})
    assert response.status_code == 200
    data = response.json()
    assert "run_id" in data
    assert data["state"]["status"] == "idle"
    
    saved_state = load_run_state(data["run_id"])
    assert saved_state is not None
    assert saved_state.project_name == "Test Project"


def test_upload_documents_and_status():
    run_resp = client.post("/api/v1/runs", json={"project_name": "Doc Test"})
    run_id = run_resp.json()["run_id"]

    files = [
        ("files", ("test_req.md", b"# Requirements\nFeature 1 spec", "text/markdown"))
    ]
    doc_resp = client.post(f"/api/v1/runs/{run_id}/documents", files=files)
    assert doc_resp.status_code == 200
    assert doc_resp.json()["uploaded_count"] == 1
    assert "test_req.md" in doc_resp.json()["files"]

    status_resp = client.get(f"/api/v1/runs/{run_id}/status")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["state"] == "uploading"
    assert status_data["progress"] == 30.0


def test_upload_codebase_zip_validation():
    run_resp = client.post("/api/v1/runs", json={"project_name": "ZIP Test"})
    run_id = run_resp.json()["run_id"]

    bad_files = [("file", ("code.txt", b"not a zip", "text/plain"))]
    resp = client.post(f"/api/v1/runs/{run_id}/codebase", files=bad_files)
    assert resp.status_code == 400
    assert "Only .zip files" in resp.json()["detail"]


def test_understanding_ai_failfast_when_no_key(monkeypatch: pytest.MonkeyPatch):
    run_resp = client.post("/api/v1/runs", json={"project_name": "Failfast Test"})
    run_id = run_resp.json()["run_id"]

    from src.config import config
    monkeypatch.setattr(type(config), "get_provider_api_keys", lambda self, provider: [])

    agent = UnderstandingAgent(run_id=run_id)

    state = load_run_state(run_id)
    with pytest.raises(AIRequiredFailureException) as exc_info:
        agent.run_ai_required(state)

    assert exc_info.value.error_code == "provider_key_missing"
    assert exc_info.value.diagnostics is not None


AI_UNDERSTANDING_PAYLOAD = json.dumps({
    "summary": "Analyzed uploaded application",
    "architecture_notes": "React frontend with service layer",
    "testability_observations": ["Stable test ids on login form"],
    "entry_points": ["/login"],
    "components": [{
        "component_id": "c1",
        "name": "Login View",
        "type": "View",
        "file_path": "src/Login.tsx",
        "description": "Credential entry",
        "selectors": ["[data-testid='login-button']"],
    }],
    "flows": [{
        "flow_id": "f1",
        "name": "Sign in",
        "start_point": "/login",
        "end_point": "/home",
        "steps": ["Enter credentials", "Submit"],
        "description": "Successful authentication",
    }],
    "gaps": [],
})


def test_understanding_prefers_selected_provider(monkeypatch: pytest.MonkeyPatch):
    from src.config import config
    from src.services.llm_service import LLMService

    monkeypatch.setattr(type(config), "get_active_provider", lambda self: "gemini")
    monkeypatch.setattr(type(config), "get_provider_api_keys", lambda self, provider: ["gemini-key"] if provider == "gemini" else ["gpt-key"])

    agent = UnderstandingAgent(run_id="RUN-TEST-PROVIDER")
    state = AppState(run_id="RUN-TEST-PROVIDER", project_name="Provider Test", status="idle", progress=0.0)

    calls: list[str] = []

    def fake_generate_text(prompt: str, profile: str = "default"):
        calls.append("gemini")
        return AI_UNDERSTANDING_PAYLOAD

    monkeypatch.setattr(agent.llm, "generate_text", fake_generate_text)

    agent.run_ai_required(state)

    assert calls == ["gemini"]


def test_understanding_emits_subagent_progress_events(monkeypatch: pytest.MonkeyPatch):
    from src.config import config

    monkeypatch.setattr(type(config), "get_active_provider", lambda self: "gemini")
    monkeypatch.setattr(type(config), "get_provider_api_keys", lambda self, provider: ["gemini-key"] if provider == "gemini" else [])

    persisted: list = []
    agent = UnderstandingAgent(run_id="RUN-TEST-SUBAGENTS", event_sink=lambda current: persisted.append(len(current.subagent_timeline)))
    state = AppState(run_id="RUN-TEST-SUBAGENTS", project_name="Subagent Test", status="idle", progress=0.0)

    monkeypatch.setattr(
        agent.llm,
        "generate_text",
        lambda prompt, profile="default": AI_UNDERSTANDING_PAYLOAD,
    )

    agent.run_ai_required(state)

    emitted = {(item["subagent_id"], item["status"]) for item in state.subagent_timeline}
    assert ("source_snapshot", "completed") in emitted
    assert ("journey_synthesizer", "completed") in emitted
    assert ("gap_analyzer", "completed") in emitted
    assert all(item["parent_agent_id"] == "application_understanding" for item in state.subagent_timeline)
    assert persisted, "event sink should persist progress during the run"


def test_understanding_never_substitutes_sample_data(monkeypatch: pytest.MonkeyPatch):
    from src.config import config

    monkeypatch.setattr(type(config), "get_active_provider", lambda self: "gemini")
    monkeypatch.setattr(type(config), "get_provider_api_keys", lambda self, provider: ["gemini-key"] if provider == "gemini" else [])

    agent = UnderstandingAgent(run_id="RUN-TEST-NO-SAMPLES")
    state = AppState(run_id="RUN-TEST-NO-SAMPLES", project_name="No Samples", status="idle", progress=0.0)
    monkeypatch.setattr(agent.llm, "generate_text", lambda prompt, profile="default": AI_UNDERSTANDING_PAYLOAD)

    updated, _ = agent.run_ai_required(state)
    understanding = updated.understanding

    assert [c.file_path for c in understanding.components] == ["src/Login.tsx"]
    assert [f.flow_id for f in understanding.flows] == ["f1"]

    # The model returned no endpoints or checklist, so nothing may be invented for them.
    assert understanding.api_inventory.total_endpoints == 0
    assert understanding.validation_report is None
    assert understanding.quality_score_percentage == 0.0
    assert understanding.provenance["sample_data_used"] is False

    serialized = understanding.model_dump_json()
    for sample_marker in ("CFA_Requirements_Specification.md", "ApplicantInfo.tsx", "ssn-input", "/api/v1/cfa/"):
        assert sample_marker not in serialized, f"sample data leaked: {sample_marker}"


def test_understanding_reports_key_rejection_with_retry_guidance(monkeypatch: pytest.MonkeyPatch):
    from src.config import config

    monkeypatch.setattr(type(config), "get_active_provider", lambda self: "gemini")
    monkeypatch.setattr(type(config), "get_provider_api_keys", lambda self, provider: ["gemini-key"] if provider == "gemini" else [])

    agent = UnderstandingAgent(run_id="RUN-TEST-KEY-REJECTED")
    state = AppState(run_id="RUN-TEST-KEY-REJECTED", project_name="Key Rejected", status="idle", progress=0.0)

    monkeypatch.setattr(agent.llm, "generate_text", lambda prompt, profile="default": None)
    agent.llm.last_error = {
        "error_code": "provider_disabled",
        "error_message": "Gemini returned status 401.",
        "diagnostics": {"status_code": 401},
    }

    with pytest.raises(AIRequiredFailureException) as exc_info:
        agent.run_ai_required(state)

    assert exc_info.value.error_code == "provider_key_rejected"
    assert "key" in exc_info.value.error_message.lower()
    assert "Tools > AI Settings" in exc_info.value.diagnostics["remediation"]


def test_understanding_emits_failed_subagent_on_bad_json(monkeypatch: pytest.MonkeyPatch):
    from src.config import config

    monkeypatch.setattr(type(config), "get_active_provider", lambda self: "gemini")
    monkeypatch.setattr(type(config), "get_provider_api_keys", lambda self, provider: ["gemini-key"] if provider == "gemini" else [])

    agent = UnderstandingAgent(run_id="RUN-TEST-SUBAGENT-FAIL")
    state = AppState(run_id="RUN-TEST-SUBAGENT-FAIL", project_name="Subagent Fail", status="idle", progress=0.0)

    monkeypatch.setattr(agent.llm, "generate_text", lambda prompt, profile="default": "I cannot help with that.")

    with pytest.raises(AIRequiredFailureException):
        agent.run_ai_required(state)

    assert ("gap_analyzer", "failed") in {(item["subagent_id"], item["status"]) for item in state.subagent_timeline}


def test_start_pipeline_requires_completed_understanding():
    run_resp = client.post("/api/v1/runs", json={"project_name": "Pipeline Gate"})
    run_id = run_resp.json()["run_id"]

    resp = client.post(f"/api/v1/runs/{run_id}/pipeline/start")
    assert resp.status_code == 400
    assert resp.json()["detail"]["error_code"] == "understanding_not_ready"


def test_start_understanding_requires_upload_ready_state():
    run_resp = client.post("/api/v1/runs", json={"project_name": "Gate Test"})
    run_id = run_resp.json()["run_id"]

    resp = client.post(f"/api/v1/runs/{run_id}/understanding/start")
    assert resp.status_code == 400
    payload = resp.json()
    assert payload["detail"]["error_code"] == "intake_not_ready"


def test_ai_settings_round_trip(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    monkeypatch.setattr(ai_settings_store, "_settings_path", lambda: tmp_path / "ai_settings.json")

    get_resp = client.get("/api/v1/ai/settings")
    assert get_resp.status_code == 200
    initial = get_resp.json()
    assert initial["active_provider"] == "gemini"
    assert "providers" in initial
    assert "model" in initial["runtime_state"]

    save_resp = client.post(
        "/api/v1/ai/settings",
        json={
            "active_provider": "gpt",
            "provider_keys": {
                "gpt": "sk-" + "t" * 44,
                "gemini": "AIza" + "T" * 35,
            },
        },
    )
    assert save_resp.status_code == 200
    saved = save_resp.json()
    assert saved["active_provider"] == "gpt"
    assert saved["providers"]["gpt"]["key_present"] is True
    assert saved["providers"]["gemini"]["key_present"] is True
    assert "model" in saved["runtime_state"]


def test_ai_settings_verify_endpoint():
    response = client.post("/api/v1/ai/settings/verify")
    assert response.status_code == 200
    payload = response.json()
    assert payload["active_provider"] in ["gemini", "gpt"]
    assert "verified_at" in payload
    assert set(payload["results"].keys()) == {"gemini", "gpt"}
    for provider_result in payload["results"].values():
        assert "configured" in provider_result
        assert "success" in provider_result
        assert "model" in provider_result


def test_gemini_candidate_key_fallback(monkeypatch: pytest.MonkeyPatch):
    from src.services.llm_service import LLMService

    service = LLMService()
    calls: list[str] = []

    monkeypatch.setattr(service, "list_gemini_candidates", lambda api_key: [] if api_key == "bad-key" else ["gemini-2.5-flash"])

    def fake_call(model: str, api_key: str, prompt: str, policy=None):
        calls.append(api_key)
        return None if api_key == "bad-key" else "{\"summary\": \"ok\", \"architecture_notes\": \"ok\"}"

    monkeypatch.setattr(service, "_call_gemini_model", fake_call)

    text, attempts = service.generate_with_gemini("prompt", ["bad-key", "good-key"])

    assert text is not None
    assert calls == ["good-key"]
    assert attempts and attempts[0]["key_index"] == 0


def test_ai_settings_rejects_placeholder_keys():
    resp = client.post(
        "/api/v1/ai/settings",
        json={
            "active_provider": "gpt",
            "provider_keys": {
                "gpt": "test-openai-key",
                "gemini": "placeholder-gemini-key",
            },
        },
    )
    assert resp.status_code == 400
    payload = resp.json()
    assert payload["detail"]["error_code"] == "invalid_provider_key"
    assert "invalid_keys" in payload["detail"]["diagnostics"]


def test_verify_ai_settings_reports_missing_keys(monkeypatch: pytest.MonkeyPatch):
    from src.config import config

    monkeypatch.setattr(type(config), "get_provider_api_keys", lambda self, provider: [])

    resp = client.post("/api/v1/ai/settings/verify")
    assert resp.status_code == 200
    payload = resp.json()
    assert payload["results"]["gemini"]["success"] is False
    assert payload["results"]["gemini"]["error_code"] == "provider_key_missing"
    assert payload["results"]["gpt"]["success"] is False
    assert payload["results"]["gpt"]["error_code"] == "provider_key_missing"


def test_verify_ai_settings_success(monkeypatch: pytest.MonkeyPatch):
    from src.config import config
    from src.services.llm_service import LLMService

    monkeypatch.setattr(type(config), "get_provider_api_key", lambda self, provider: "gem-key" if provider == "gemini" else "gpt-key")
    monkeypatch.setattr(LLMService, "list_gemini_candidates", lambda self, api_key: ["gemini-2.5-flash", "gemini-2.0-flash"])
    monkeypatch.setattr(LLMService, "get_gemini_model", lambda self, api_key: "gemini-2.5-flash")

    class _MockResponse:
        status_code = 200

        @staticmethod
        def json():
            return {"data": [{"id": "gpt-4o-mini"}, {"id": "gpt-5.3-mini"}]}

    import src.api.fastapi_app as fastapi_app_mod

    monkeypatch.setattr(fastapi_app_mod.requests, "get", lambda *args, **kwargs: _MockResponse())

    resp = client.post("/api/v1/ai/settings/verify")
    assert resp.status_code == 200
    payload = resp.json()
    assert payload["results"]["gemini"]["success"] is True
    assert payload["results"]["gemini"]["model"] == "gemini-2.5-flash"
    assert payload["results"]["gpt"]["success"] is True
    assert payload["results"]["gpt"]["model"] == "gpt-4o-mini"


def test_get_requirement_coverage_endpoint():
    run_resp = client.post("/api/v1/runs", json={"project_name": "Coverage API Test"})
    run_id = run_resp.json()["run_id"]

    # Initial state should return empty lists
    coverage_resp = client.get(f"/api/v1/runs/{run_id}/coverage")
    assert coverage_resp.status_code == 200
    data = coverage_resp.json()
    assert data["total_requirements"] == 0
    assert data["coverage_percentage"] == 0.0
    assert len(data["categories"]) == 0
    assert len(data["requirements"]) == 0



def test_get_requirement_coverage_endpoint_with_seeded_state():
    """G4: Validate coverage endpoint math when requirements and test cases are non-empty.

    Seeds a run state with:
    - 3 requirements across 2 categories (Security, Functional)
    - 2 test cases mapped to the first 2 requirements
    Then asserts exact coverage counts, percentages, mapped_test_cases, and category-level math.
    """
    from src.services.run_state_service import save_run_state, load_run_state
    from schemas.contracts import (
        AppState,
        ApplicationUnderstanding,
        ApplicationComponent,
        Requirement,
        RequirementCategory,
        RequirementType,
        TestSuite,
        TestCase,
    )

    # Create a new run
    run_resp = client.post("/api/v1/runs", json={"project_name": "Coverage Seeded Test"})
    assert run_resp.status_code == 200
    run_id = run_resp.json()["run_id"]

    # Build seeded requirements
    req_auth = Requirement(
        requirement_id="REQ-AUTH-01",
        title="Secure Login",
        description="JWT-based login must be enforced",
        type=RequirementType.Security,
        category_id="CAT-SEC",
        source_evidence="Login.tsx",
    )
    req_upload = Requirement(
        requirement_id="REQ-UPLOAD-01",
        title="Document Upload",
        description="Accept PDF/DOCX uploads up to 10 MB",
        type=RequirementType.Functional,
        category_id="CAT-FUNC",
        source_evidence="Upload.tsx",
    )
    req_flow = Requirement(
        requirement_id="REQ-FLOW-01",
        title="Application Submission",
        description="End-to-end loan application flow",
        type=RequirementType.Functional,
        category_id="CAT-FUNC",
        source_evidence="pipeline.py",
    )

    cat_sec = RequirementCategory(
        category_id="CAT-SEC",
        name="Security Controls",
        type=RequirementType.Security,
        description="Security requirement catalog group",
        requirements=[req_auth],
    )
    cat_func = RequirementCategory(
        category_id="CAT-FUNC",
        name="Functional Verification",
        type=RequirementType.Functional,
        description="Functional requirement catalog group",
        requirements=[req_upload, req_flow],
    )

    # Map 2 test cases to REQ-AUTH-01 and REQ-UPLOAD-01; REQ-FLOW-01 stays uncovered
    tc1 = TestCase(
        case_id="TC-AUTH-001",
        title="Login with valid credentials",
        feature_area="Authentication",
        description="Happy path login test",
        preconditions=["User account exists"],
        steps=["Navigate to /login", "Enter credentials", "Click Login"],
        expected_result="Redirect to dashboard",
        case_type="Positive",
        priority="High",
        requirement_id="REQ-AUTH-01",
        requirement_category_id="CAT-SEC",
        requirement_type="Security",
    )
    tc2 = TestCase(
        case_id="TC-UPLOAD-001",
        title="Upload valid PDF",
        feature_area="Document Upload",
        description="Happy path upload test",
        preconditions=["User is logged in"],
        steps=["Click Upload", "Select PDF < 10 MB", "Confirm"],
        expected_result="File accepted and listed",
        case_type="Positive",
        priority="Medium",
        requirement_id="REQ-UPLOAD-01",
        requirement_category_id="CAT-FUNC",
        requirement_type="Functional",
    )

    # Load and mutate state
    state = load_run_state(run_id)
    assert state is not None

    und = ApplicationUnderstanding(
        summary="CFA Loan Application",
        architecture_notes="React + FastAPI",
        components=[],
        requirements=[req_auth, req_upload, req_flow],
        requirement_categories=[cat_sec, cat_func],
    )
    state.understanding = und
    state.test_suite = TestSuite(suite_id="TS-G4-001", name="G4 Coverage Test Suite", description="Seeded test suite for G4 coverage endpoint verification", test_cases=[tc1, tc2])
    save_run_state(state)

    # Call coverage endpoint
    coverage_resp = client.get(f"/api/v1/runs/{run_id}/coverage")
    assert coverage_resp.status_code == 200
    data = coverage_resp.json()

    # --- Top-level coverage math ---
    assert data["total_requirements"] == 3
    assert data["covered_requirements"] == 2       # REQ-AUTH-01 + REQ-UPLOAD-01
    assert data["coverage_percentage"] == 66.7     # round(2/3*100, 1)

    # --- Per-requirement mapped_test_cases ---
    req_map = {r["requirement_id"]: r for r in data["requirements"]}
    assert req_map["REQ-AUTH-01"]["is_covered"] is True
    assert "TC-AUTH-001" in req_map["REQ-AUTH-01"]["mapped_test_cases"]

    assert req_map["REQ-UPLOAD-01"]["is_covered"] is True
    assert "TC-UPLOAD-001" in req_map["REQ-UPLOAD-01"]["mapped_test_cases"]

    assert req_map["REQ-FLOW-01"]["is_covered"] is False
    assert req_map["REQ-FLOW-01"]["mapped_test_cases"] == []

    # --- Category-level math ---
    cat_map = {c["category_id"]: c for c in data["categories"]}

    # CAT-SEC: 1 req, 1 covered => 100%
    assert cat_map["CAT-SEC"]["total_requirements"] == 1
    assert cat_map["CAT-SEC"]["covered_requirements"] == 1
    assert cat_map["CAT-SEC"]["coverage_percentage"] == 100.0

    # CAT-FUNC: 2 reqs, 1 covered => 50%
    assert cat_map["CAT-FUNC"]["total_requirements"] == 2
    assert cat_map["CAT-FUNC"]["covered_requirements"] == 1
    assert cat_map["CAT-FUNC"]["coverage_percentage"] == 50.0


def test_list_runs_and_get_full_state():
    """Verify GET /api/v1/runs lists saved runs and GET /api/v1/runs/{id} returns full state."""
    # 1. Create a run
    create_resp = client.post("/api/v1/runs", json={"project_name": "CFA Digital Journey"})
    assert create_resp.status_code == 200
    run_id = create_resp.json()["run_id"]

    # 2. List runs
    list_resp = client.get("/api/v1/runs")
    assert list_resp.status_code == 200
    runs = list_resp.json().get("runs", [])
    assert len(runs) > 0
    matched = [r for r in runs if r["run_id"] == run_id]
    assert len(matched) == 1
    assert matched[0]["project_name"] == "CFA Digital Journey"
    assert "has_html_report" in matched[0]
    assert "has_understanding" in matched[0]

    # 3. Get full state
    get_resp = client.get(f"/api/v1/runs/{run_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["run_id"] == run_id
    assert get_resp.json()["state"]["status"] == "idle"


def test_get_nonexistent_run_returns_404():
    """Verify GET /api/v1/runs/nonexistent returns 404."""
    resp = client.get("/api/v1/runs/RUN-NONEXISTENT-999999")
    assert resp.status_code == 404


def test_get_run_report_artifact_endpoint():
    """Verify GET /api/v1/runs/{run_id}/reports/{filename} serves per-run report artifacts."""
    create_resp = client.post("/api/v1/runs", json={"project_name": "Report Test Run"})
    assert create_resp.status_code == 200
    run_id = create_resp.json()["run_id"]

    # Write a test quality_report.html
    report_dir = Path("uploads") / run_id / "artifacts"
    report_dir.mkdir(parents=True, exist_ok=True)
    html_file = report_dir / "quality_report.html"
    html_file.write_text("<html><body><h1>Quality Test Report</h1></body></html>", encoding="utf-8")

    # Fetch report
    resp = client.get(f"/api/v1/runs/{run_id}/reports/quality_report.html")
    assert resp.status_code == 200
    assert "text/html" in resp.headers.get("content-type", "")
    assert "Quality Test Report" in resp.text

    # Check non-existent report
    resp_404 = client.get(f"/api/v1/runs/{run_id}/reports/non_existent.pdf")
    assert resp_404.status_code == 404




def test_retry_run_endpoint_clears_downstream():
    """Verify POST /api/v1/runs/{run_id}/retry clears downstream artifacts and increments reset_generation."""
    create_resp = client.post("/api/v1/runs", json={"project_name": "Retry Test Run"})
    assert create_resp.status_code == 200
    run_id = create_resp.json()["run_id"]

    # 1. Retry Requirement Understanding (Agent 1)
    retry_resp = client.post(f"/api/v1/runs/{run_id}/retry", json={"target_agent_id": "requirement_understanding"})
    assert retry_resp.status_code == 200
    data = retry_resp.json()
    assert data["reset_generation"] >= 2
    assert data["state"]["status"] == "idle"
    assert data["state"]["progress"] == 0.0

    # 2. Retry Document Intake (Agent 2)
    retry_resp2 = client.post(f"/api/v1/runs/{run_id}/retry", json={"target_agent_id": "document_intake"})
    assert retry_resp2.status_code == 200
    assert retry_resp2.json()["state"]["status"] == "uploading"

    # 3. Retry non-existent run returns 404
    retry_404 = client.post("/api/v1/runs/RUN-NONEXISTENT/retry", json={"target_agent_id": "requirement_understanding"})
    assert retry_404.status_code == 404
