"""FastAPI Runtime Layer exposing REST API contracts for React frontend with UI hosting."""

import asyncio
import shutil
from uuid import uuid4
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

import requests
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel

from schemas.contracts import (
    AppState,
    ApplicationUnderstanding,
    IntakeManifest,
    ExecutionMode,
    ExecutionRequest,
    ExecutionStatusResponse,
    MultiLevelExecutionReport,
    AITestAnalysisResult,
    AIScriptModificationRequest,
    AIScriptModificationResponse,
)
from src.config import config
from src.services.run_state_service import create_run_state, load_run_state, update_run_status, save_run_state, list_saved_runs, retry_run
from src.services.ai_settings_store import load_ai_settings_dict, save_ai_settings_dict
from src.services.zip_service import ZipService
from src.agents.understanding_agent import UnderstandingAgent, AIRequiredFailureException
from src.workflows.pipeline import SequentialQETPipeline
from src.services.llm_service import LLMService
from src.services.execution_manager import execution_manager
from src.services.ai_test_analysis_service import AITestAnalysisService
from src.utils.security import SecurityError
from src.utils.logger import logger, log_run_context

app = FastAPI(
    title="QET Automated Agents API",
    description="FastAPI Runtime Layer for React-first Home & Understanding flow",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CreateRunRequest(BaseModel):
    project_name: Optional[str] = "CFA Digital Journey"


class CreateRunResponse(BaseModel):
    run_id: str
    state: AppState


class RunSummary(BaseModel):
    run_id: str
    project_name: str = "CFA Digital Journey"
    status: str
    progress: float
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    total_files: int = 0
    doc_count: int = 0
    has_html_report: bool = False
    has_pdf_report: bool = False
    has_understanding: bool = False


class RunListResponse(BaseModel):
    runs: List[RunSummary]


class DocumentUploadResponse(BaseModel):
    uploaded_count: int
    files: List[str]


class CodebaseUploadResponse(BaseModel):
    intake_manifest: IntakeManifest
    state: AppState


class StatusResponse(BaseModel):
    run_id: str
    state: str
    progress: float
    error: Optional[Dict[str, Any]] = None
    intake_manifest: Optional[IntakeManifest] = None
    stage_timestamps: Dict[str, str] = {}
    launcher_state: Dict[str, Any] = {}
    agent_timeline: List[Dict[str, Any]] = []
    subagent_timeline: List[Dict[str, Any]] = []
    active_agent: Optional[str] = None
    upcoming_agent: Optional[str] = None
    reset_generation: int = 1


class AIProviderConfig(BaseModel):
    key_present: bool
    display_name: str


class AISettingsResponse(BaseModel):
    active_provider: str
    llm_enabled: bool
    providers: Dict[str, AIProviderConfig]
    runtime_state: Dict[str, Any]
    gemini_candidate_models: List[str] = []


class UpdateAISettingsRequest(BaseModel):
    active_provider: str
    provider_keys: Dict[str, str] = {}
    clear_provider_keys: List[str] = []


class AIProviderVerificationResult(BaseModel):
  provider: str
  configured: bool
  success: bool
  model: Optional[str] = None
  candidates: List[str] = []
  error_code: Optional[str] = None
  error_message: Optional[str] = None
  diagnostics: Optional[Dict[str, Any]] = None


class VerifyAISettingsResponse(BaseModel):
  active_provider: str
  verified_at: str
  results: Dict[str, AIProviderVerificationResult]


class ExecutionLaunchRequest(BaseModel):
    test_case_ids: List[str] = []
    explicit_user_approval: bool = False
    is_non_production_confirmed: bool = False
    is_script_reviewed: bool = False


@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "service": "QET FastAPI Runtime Layer"}


def _build_ai_settings_response() -> AISettingsResponse:
    llm = LLMService()
    active_provider = config.get_active_provider()
    runtime_state = llm.get_runtime_status()
    providers = {
        "gemini": AIProviderConfig(
            key_present=bool(config.get_provider_api_key("gemini")),
            display_name="Google Gemini",
        ),
        "gpt": AIProviderConfig(
            key_present=bool(config.get_provider_api_key("gpt")),
            display_name="OpenAI GPT",
        ),
    }
    gemini_models: List[str] = []
    for gemini_key in config.get_provider_api_keys("gemini"):
      candidates = llm.list_gemini_candidates(gemini_key)
      if candidates:
        for model in candidates:
          if model not in gemini_models:
            gemini_models.append(model)
    return AISettingsResponse(
        active_provider=active_provider,
        llm_enabled=config.is_llm_enabled(),
        providers=providers,
        runtime_state=runtime_state,
        gemini_candidate_models=gemini_models[:8],
    )


@app.get("/api/v1/ai/settings", response_model=AISettingsResponse)
@app.get("/api/v1/settings/ai", response_model=AISettingsResponse)
def get_ai_settings():
    return _build_ai_settings_response()


@app.post("/api/v1/ai/settings", response_model=AISettingsResponse)
@app.post("/api/v1/settings/ai", response_model=AISettingsResponse)
def update_ai_settings(req: UpdateAISettingsRequest):
    active_provider = "gpt" if req.active_provider.strip().lower() == "gpt" else "gemini"
    current = load_ai_settings_dict()
    provider_keys = current.get("provider_keys", {}) if isinstance(current, dict) else {}
    if not isinstance(provider_keys, dict):
        provider_keys = {}

    clear_set = {
        "gpt" if str(provider).strip().lower() == "gpt" else "gemini"
        for provider in (req.clear_provider_keys or [])
    }
    for provider in clear_set:
        provider_keys.pop(provider, None)

    invalid_keys: Dict[str, str] = {}

    for provider, value in req.provider_keys.items():
        normalized_provider = "gpt" if str(provider).strip().lower() == "gpt" else "gemini"
        clean_value = str(value).strip()
        if clean_value:
            sanitized = config._sanitize_provider_key(clean_value)
            if not sanitized:
                invalid_keys[normalized_provider] = "Looks like a placeholder or test key. Paste a real provider API key."
                continue
            provider_keys[normalized_provider] = sanitized

    if invalid_keys:
        err = {
            "error_code": "invalid_provider_key",
            "error_message": "One or more provider keys look invalid or placeholder.",
            "diagnostics": {
                "invalid_keys": invalid_keys,
                "remediation": "Open Tools > AI Settings and paste a valid production key for Gemini or OpenAI.",
            },
        }
        raise HTTPException(status_code=400, detail=err)

    save_ai_settings_dict(active_provider=active_provider, provider_keys=provider_keys)
    return _build_ai_settings_response()


@app.get("/api/v1/ai/models")
def get_available_models():
    """Return discoverable AI models including Gemini 3.7 Flash thinking tiers and OpenAI."""
    active_provider = config.get_active_provider()
    gemini_keys = config.get_provider_api_keys("gemini")
    gpt_keys = config.get_provider_api_keys("gpt")

    models = [
        {
            "id": "gemini-3.7-flash-medium",
            "name": "Gemini 3.7 Flash (Medium)",
            "provider": "gemini",
            "thinking_tier": "medium",
            "thinking_budget_tokens": 4096,
            "latency_estimate": "~2.9s",
            "recommended_for": "Balanced understanding, test cases, and synthetic data generation",
            "is_default": True,
            "is_available": bool(gemini_keys),
        },
        {
            "id": "gemini-3.7-flash-low",
            "name": "Gemini 3.7 Flash (Low)",
            "provider": "gemini",
            "thinking_tier": "low",
            "thinking_budget_tokens": 1024,
            "latency_estimate": "~1.9s",
            "recommended_for": "Ultra-fast AST parsing and requirement categorization",
            "is_default": False,
            "is_available": bool(gemini_keys),
        },
        {
            "id": "gemini-3.7-flash-high",
            "name": "Gemini 3.7 Flash (High)",
            "provider": "gemini",
            "thinking_tier": "high",
            "thinking_budget_tokens": 8192,
            "latency_estimate": "~4.7s",
            "recommended_for": "Deep reasoning, Playwright code synthesis, self-correction",
            "is_default": False,
            "is_available": bool(gemini_keys),
        },
        {
            "id": "gemini-3.1-flash-lite",
            "name": "Gemini 3.1 Flash Lite",
            "provider": "gemini",
            "thinking_tier": "low",
            "latency_estimate": "~1.9s",
            "recommended_for": "Fast lightweight tasks",
            "is_default": False,
            "is_available": bool(gemini_keys),
        },
        {
            "id": "gpt-4o-mini",
            "name": "OpenAI GPT-4o-mini",
            "provider": "gpt",
            "latency_estimate": "~2.5s",
            "recommended_for": "Cross-provider fallback",
            "is_default": False,
            "is_available": bool(gpt_keys),
        },
    ]

    return {
        "active_provider": active_provider,
        "active_model": "gemini-3.7-flash-medium" if active_provider == "gemini" else "gpt-4o-mini",
        "models": models,
    }


def _verify_gpt_key(llm: LLMService, api_keys: List[str]) -> AIProviderVerificationResult:
  if not api_keys:
    return AIProviderVerificationResult(
      provider="gpt",
      configured=False,
      success=False,
      error_code="provider_key_missing",
      error_message="OpenAI API key is not configured.",
    )

  failures: List[Dict[str, Any]] = []
  for key_index, api_key in enumerate(api_keys):
    try:
      response = requests.get(
        "https://api.openai.com/v1/models",
        headers={"Authorization": f"Bearer {api_key}"},
        timeout=llm.timeout_seconds,
      )
      if response.status_code != 200:
        status = response.status_code
        error_code = "provider_auth_failed" if status in (401, 403) else "provider_validation_failed"
        failures.append({
          "key_index": key_index,
          "error_code": error_code,
          "error_message": f"OpenAI model discovery returned status {status}.",
          "diagnostics": {"status_code": status, "response": response.text[:300]},
        })
        continue

      data = response.json().get("data") or []
      model_ids = [item.get("id") for item in data if isinstance(item, dict) and item.get("id")]
      selected_model = llm.gpt_model if llm.gpt_model in model_ids else (model_ids[0] if model_ids else llm.gpt_model)
      return AIProviderVerificationResult(
        provider="gpt",
        configured=True,
        success=True,
        model=selected_model,
        candidates=model_ids[:8],
      )
    except requests.exceptions.Timeout:
      failures.append({
        "key_index": key_index,
        "error_code": "provider_timeout",
        "error_message": "OpenAI model discovery timed out.",
        "diagnostics": {"timeout_seconds": llm.timeout_seconds},
      })
    except Exception as exc:
      failures.append({
        "key_index": key_index,
        "error_code": "provider_validation_failed",
        "error_message": f"OpenAI verification request failed: {exc}",
        "diagnostics": {"exception": str(exc)},
      })

  last_error = failures[-1] if failures else {}
  return AIProviderVerificationResult(
    provider="gpt",
    configured=True,
    success=False,
    error_code=last_error.get("error_code", "provider_validation_failed"),
    error_message=last_error.get("error_message", "OpenAI model discovery failed."),
    diagnostics={"attempts": failures},
  )


def _verify_gemini_key(llm: LLMService, api_keys: List[str]) -> AIProviderVerificationResult:
  if not api_keys:
    return AIProviderVerificationResult(
      provider="gemini",
      configured=False,
      success=False,
      error_code="provider_key_missing",
      error_message="Gemini API key is not configured.",
    )

  failures: List[Dict[str, Any]] = []
  for key_index, api_key in enumerate(api_keys):
    candidates = llm.list_gemini_candidates(api_key)
    if candidates:
      working_model = llm.get_gemini_model(api_key) or candidates[0]
      return AIProviderVerificationResult(
        provider="gemini",
        configured=True,
        success=True,
        model=working_model,
        candidates=candidates[:8],
      )
    failures.append({
      "key_index": key_index,
      "error_code": (llm.last_error or {}).get("error_code", "model_discovery_failed"),
      "error_message": (llm.last_error or {}).get("error_message", "Gemini model discovery failed."),
      "diagnostics": (llm.last_error or {}).get("diagnostics", {}),
    })

  last_error = failures[-1] if failures else {}
  return AIProviderVerificationResult(
    provider="gemini",
    configured=True,
    success=False,
    error_code=last_error.get("error_code", "model_discovery_failed"),
    error_message=last_error.get("error_message", "Gemini model discovery failed."),
    diagnostics={"attempts": failures},
  )


@app.post("/api/v1/ai/settings/verify", response_model=VerifyAISettingsResponse)
@app.post("/api/v1/settings/ai/verify", response_model=VerifyAISettingsResponse)
def verify_ai_settings():
    llm = LLMService()
    gemini_keys = config.get_provider_api_keys("gemini")
    gpt_keys = config.get_provider_api_keys("gpt")
    results = {
        "gemini": _verify_gemini_key(llm, gemini_keys),
        "gpt": _verify_gpt_key(llm, gpt_keys),
    }
    return VerifyAISettingsResponse(
        active_provider=config.get_active_provider(),
        verified_at=datetime.now(timezone.utc).isoformat(),
        results=results,
    )



class RetryRunRequest(BaseModel):
    target_agent_id: str = "requirement_understanding"


@app.post("/api/v1/runs/{run_id}/retry")
def retry_run_endpoint(run_id: str, req: Optional[RetryRunRequest] = None):
    target = req.target_agent_id if req else "requirement_understanding"
    state = retry_run(run_id, target)
    if not state:
        raise HTTPException(status_code=404, detail="Run ID not found.")
    return {
        "run_id": run_id,
        "reset_generation": getattr(state, "reset_generation", 1) or 1,
        "state": state
    }

@app.get("/api/v1/runs", response_model=RunListResponse)
def list_runs():
    """List all saved historical runs with artifact flags and metrics."""
    runs = list_saved_runs()
    return RunListResponse(runs=[RunSummary(**r) for r in runs])


@app.get("/api/v1/runs/{run_id}", response_model=CreateRunResponse)
def get_run_full_state(run_id: str):
    """Fetch complete AppState for reopening/inspecting a specific historical run."""
    state = load_run_state(run_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    return CreateRunResponse(run_id=state.run_id, state=state)


@app.get("/api/v1/runs/{run_id}/reports/{filename}")
def get_run_report_artifact(run_id: str, filename: str):
    """Serve per-run report artifacts (HTML, PDF, JSON)."""
    candidate_paths = [
        Path("uploads") / run_id / "artifacts" / filename,
        Path(__file__).resolve().parents[2] / "uploads" / run_id / "artifacts" / filename,
    ]
    for p in candidate_paths:
        if p.exists():
            media_type = "text/html" if filename.endswith(".html") else ("application/pdf" if filename.endswith(".pdf") else "application/json")
            return FileResponse(str(p), media_type=media_type)
    raise HTTPException(status_code=404, detail=f"Report {filename} not found for run {run_id}")


@app.post("/api/v1/runs", response_model=CreateRunResponse)
def create_run(req: Optional[CreateRunRequest] = None):
    project_name = req.project_name if req else "CFA Digital Journey"
    state = create_run_state(project_name=project_name)
    return CreateRunResponse(run_id=state.run_id, state=state)


@app.post("/api/v1/runs/{run_id}/documents", response_model=DocumentUploadResponse)
@app.post("/api/v1/runs/{run_id}/upload/documents", response_model=DocumentUploadResponse)
async def upload_documents(
    run_id: str,
    files: Optional[List[UploadFile]] = File(None),
    file: Optional[UploadFile] = File(None)
):
    upload_files: List[UploadFile] = []
    if files:
        upload_files.extend(files)
    if file:
        upload_files.append(file)
    if not upload_files:
        raise HTTPException(status_code=400, detail="No files provided for document upload")

    with log_run_context(run_id):
        logger.info(f"Ingesting {len(upload_files)} specification document(s) for run {run_id}...")

        state = load_run_state(run_id)
        if not state:
            state = create_run_state(run_id=run_id)

        doc_dir = Path("uploads") / run_id / "documents"
        doc_dir.mkdir(parents=True, exist_ok=True)

        saved_filenames = []
        for idx, f in enumerate(upload_files):
            raw_name = f.filename or f"doc_{idx + 1}.md"
            safe_name = Path(raw_name).name or f"doc_{idx + 1}.md"
            file_path = doc_dir / safe_name
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(f.file, buffer)
            file_size_kb = file_path.stat().st_size / 1024.0 if file_path.exists() else 0
            logger.info(f"Saved document: '{safe_name}' ({file_size_kb:.1f} KB)")
            saved_filenames.append(safe_name)

        update_run_status(run_id, status="uploading", progress=30.0)

        state = load_run_state(run_id)
        if state:
            if not state.intake_manifest:
                state.intake_manifest = IntakeManifest(
                    upload_id=run_id,
                    zip_filename="",
                    extracted_path=str(Path("uploads") / run_id / "extracted"),
                    total_files=0,
                    total_size_bytes=0,
                    doc_files=saved_filenames,
                    created_at=datetime.now(timezone.utc).isoformat()
                )
            else:
                state.intake_manifest.doc_files = list(set(state.intake_manifest.doc_files + saved_filenames))
            save_run_state(state)

        logger.info(f"Successfully indexed {len(saved_filenames)} requirement document(s) into intake manifest.")
        return DocumentUploadResponse(uploaded_count=len(saved_filenames), files=saved_filenames)


@app.post("/api/v1/runs/{run_id}/codebase", response_model=CodebaseUploadResponse)
@app.post("/api/v1/runs/{run_id}/upload/codebase", response_model=CodebaseUploadResponse)
async def upload_codebase(run_id: str, file: UploadFile = File(...)):
    with log_run_context(run_id):
        state = load_run_state(run_id)
        if not state:
            state = create_run_state(run_id=run_id)

        raw_name = file.filename or "codebase.zip"
        safe_filename = Path(raw_name).name or "codebase.zip"
        if not safe_filename.endswith(".zip"):
            raise HTTPException(status_code=400, detail="Only .zip files are supported for codebase upload")

        update_run_status(run_id, status="processing_zip", progress=45.0)

        upload_dir = Path("uploads") / run_id
        upload_dir.mkdir(parents=True, exist_ok=True)
        zip_path = upload_dir / safe_filename

        with open(zip_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size_kb = zip_path.stat().st_size / 1024.0 if zip_path.exists() else 0
        logger.info(f"Received codebase archive '{safe_filename}' ({file_size_kb:.1f} KB). Extracting files safely...")

        try:
            zip_service = ZipService(target_dir=Path("uploads"))
            manifest, zip_processing = zip_service.process_zip_upload(run_id, zip_path, safe_filename)
            logger.info(f"Archive unpacked successfully: {manifest.total_files} source files ({manifest.total_size_bytes / 1024:.1f} KB) indexed.")
        except Exception as e:
            error_code = "zip_validation_failed" if isinstance(e, SecurityError) else "zip_extraction_failed"
            logger.error(f"ZIP processing failure ({error_code}): {str(e)}")
            err = {"error_code": error_code, "error_message": str(e), "diagnostics": {"file": file.filename}}
            update_run_status(run_id, status="error", progress=45.0, error=err)
            raise HTTPException(status_code=400, detail=err)

        state = load_run_state(run_id)
        if state and state.intake_manifest and state.intake_manifest.doc_files:
            manifest.doc_files = list(set(manifest.doc_files + state.intake_manifest.doc_files))

        state.intake_manifest = manifest
        state.launcher_state["zip_processing"] = zip_processing
        save_run_state(state)
        update_run_status(run_id, status="indexing", progress=60.0)

        logger.info(f"Intake pipeline complete: {len(manifest.doc_files)} doc(s), {manifest.total_files} code file(s) ready for AI Understanding.")
        state = load_run_state(run_id)
        return CodebaseUploadResponse(intake_manifest=manifest, state=state)


@app.get("/api/v1/runs/{run_id}/logs")
def get_run_logs(run_id: str):
    """Retrieve backend execution logs for a specific run."""
    log_file = Path("temp") / f"run_{run_id}.log"
    if not log_file.exists():
        settings = load_ai_settings_dict()
        provider = settings.get("active_provider", "Unknown")
        model = settings.get("runtime_state", {}).get("model", "Auto")
        return {
            "run_id": run_id,
            "backend_logs": f"[SYSTEM] Log session initialized for run {run_id}.\n[SYSTEM] Active Provider: {provider}\n[SYSTEM] Current Model: {model}\n"
        }

    try:
        content = log_file.read_text(encoding="utf-8", errors="replace")
        return {"run_id": run_id, "backend_logs": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read log file: {str(e)}")


@app.get("/api/v1/runs/{run_id}/logs/download")
@app.get("/api/v1/runs/{run_id}/logs/backend")
def download_run_logs(run_id: str):
    """Download backend execution log file for a specific run."""
    log_file = Path("temp") / f"run_{run_id}.log"
    if not log_file.exists():
        settings = load_ai_settings_dict()
        provider = settings.get("active_provider", "Unknown")
        model = settings.get("runtime_state", {}).get("model", "Auto")
        log_file.parent.mkdir(parents=True, exist_ok=True)
        log_file.write_text(f"[SYSTEM] Log session initialized for run {run_id}.\n[SYSTEM] Active Provider: {provider}\n[SYSTEM] Current Model: {model}\n", encoding="utf-8")
    return FileResponse(
        str(log_file),
        media_type="text/plain",
        filename=f"backend_logs_{run_id}.txt"
    )


@app.get("/api/v1/runs/{run_id}/status", response_model=StatusResponse)
def get_run_status(run_id: str):
    state = load_run_state(run_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")

    return StatusResponse(
        run_id=run_id,
        state=state.status,
        progress=state.progress,
        error=state.last_error,
        intake_manifest=state.intake_manifest,
      stage_timestamps=state.stage_timestamps,
      launcher_state=state.launcher_state,
      agent_timeline=state.agent_timeline,
      subagent_timeline=state.subagent_timeline,
      active_agent=state.active_agent,
      upcoming_agent=state.upcoming_agent,
      reset_generation=state.reset_generation,
    )


def _execute_understanding_task(run_id: str):
  with log_run_context(run_id):
    state = load_run_state(run_id)
    if not state:
      return

    generation = getattr(state, "reset_generation", 1) or 1
    state.subagent_timeline = [
      event for event in state.subagent_timeline if event.get("generation") != generation
    ]
    state.agent_timeline.append({
      "event_id": str(uuid4()),
      "event_type": "agent_entered",
      "agent_id": "Understanding",
      "label": "Understanding Agent",
      "subagent_id": None,
      "status": "running",
      "generation": generation,
      "message": "Understanding Agent started",
      "timestamp": datetime.now(timezone.utc).isoformat(),
      "source": "backend.fastapi",
    })
    state.active_agent = "Understanding"
    state.upcoming_agent = "Requirement Categorization" if config.features.enable_requirement_categorization else "Test Cases"
    save_run_state(state)
    update_run_status(run_id, status="ai_understanding_running", progress=75.0)
    agent = UnderstandingAgent(run_id=run_id, event_sink=save_run_state)
    try:
      updated_state, provenance = agent.run_ai_required(state)

      if config.features.enable_requirement_categorization:
        from src.agents.requirement_categorizer import RequirementCategorizer
        categorizer = RequirementCategorizer(run_id=run_id)
        if not categorizer.llm.is_enabled():
          updated_state = categorizer.run(updated_state)
        else:
          updated_state, cat_prov = categorizer.run_ai_required(updated_state)

      updated_state.agent_timeline.append({
        "event_id": str(uuid4()),
        "event_type": "agent_completed",
        "agent_id": "Understanding",
        "label": "Understanding Agent",
        "subagent_id": None,
        "status": "completed",
        "generation": generation,
        "message": "Understanding Agent completed",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": "backend.fastapi",
      })
      updated_state.active_agent = updated_state.upcoming_agent
      save_run_state(updated_state)
      update_run_status(run_id, status="understanding_ready", progress=100.0)
    except AIRequiredFailureException as e:
      err_payload = {
        "error_code": e.error_code,
        "error_message": e.error_message,
        "diagnostics": e.diagnostics,
        "retryable": True,
      }
      failed_state = load_run_state(run_id) or state
      failed_state.agent_timeline.append({
        "event_id": str(uuid4()),
        "event_type": "agent_failed",
        "agent_id": "Understanding",
        "label": "Understanding Agent",
        "subagent_id": None,
        "status": "failed",
        "generation": generation,
        "message": e.error_message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": "backend.fastapi",
      })
      failed_state.active_agent = "Understanding"
      save_run_state(failed_state)
      update_run_status(run_id, status="error", progress=75.0, error=err_payload)
    except Exception as e:
      err_payload = {
        "error_code": "understanding_execution_error",
        "error_message": str(e),
        "diagnostics": {"exception": str(e)},
        "retryable": True,
      }
      failed_state = load_run_state(run_id) or state
      failed_state.agent_timeline.append({
        "event_id": str(uuid4()),
        "event_type": "agent_failed",
        "agent_id": "Understanding",
        "label": "Understanding Agent",
        "subagent_id": None,
        "status": "failed",
        "generation": generation,
        "message": str(e),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": "backend.fastapi",
      })
      failed_state.active_agent = "Understanding"
      save_run_state(failed_state)
      update_run_status(run_id, status="error", progress=75.0, error=err_payload)


@app.post("/api/v1/runs/{run_id}/understanding/start")
@app.post("/api/v1/runs/{run_id}/understanding")
@app.post("/api/v1/runs/{run_id}/start-understanding")
def start_understanding(run_id: str, background_tasks: BackgroundTasks):
    state = load_run_state(run_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")

    intake_manifest = state.intake_manifest
    has_intake = bool(intake_manifest) and (
        bool(intake_manifest.doc_files) or (getattr(intake_manifest, "total_files", 0) or 0) > 0
    )
    if not has_intake:
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": "intake_not_ready",
                "error_message": "Understanding analysis can only start after at least one document or codebase upload has been indexed.",
                "diagnostics": {"intake_manifest": intake_manifest.model_dump() if intake_manifest else None},
                "retryable": False,
            },
        )

    update_run_status(run_id, status="ai_understanding_running", progress=75.0)
    background_tasks.add_task(_execute_understanding_task, run_id)
    return {"status": "started", "run_id": run_id}


def _execute_pipeline_task(run_id: str):
    with log_run_context(run_id):
        state = load_run_state(run_id)
        if not state:
            return

        update_run_status(run_id, status="generation_running", progress=80.0)
        state = load_run_state(run_id)
        pipeline = SequentialQETPipeline()
        updated_state = pipeline.run_from(state, "Test Cases")
        save_run_state(updated_state)

        if updated_state.errors:
            update_run_status(
                run_id,
                status="error",
                progress=80.0,
                error={
                    "error_code": "pipeline_stage_failed",
                    "error_message": updated_state.errors[-1],
                    "diagnostics": {"errors": updated_state.errors},
                    "retryable": True,
                },
            )
        else:
            update_run_status(run_id, status="pipeline_complete", progress=100.0)


@app.post("/api/v1/runs/{run_id}/pipeline/start")
def start_pipeline(run_id: str, background_tasks: BackgroundTasks):
    """Run the downstream agents (test cases, data, Playwright, report) after Understanding."""
    state = load_run_state(run_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")

    if not state.understanding:
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": "understanding_not_ready",
                "error_message": "Downstream agents require a completed Understanding stage.",
                "diagnostics": {"status": state.status},
                "retryable": False,
            },
        )

    background_tasks.add_task(_execute_pipeline_task, run_id)
    return {"status": "started", "run_id": run_id}


@app.post("/api/v1/runs/{run_id}/pipeline/pause")
def pause_pipeline_endpoint(run_id: str):
    """Pause the running agent pipeline."""
    state = load_run_state(run_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    pipeline = SequentialQETPipeline()
    updated_state = pipeline.pause_pipeline(state)
    save_run_state(updated_state)
    return {"status": "paused", "run_id": run_id, "paused_stage": updated_state.paused_stage}


@app.post("/api/v1/runs/{run_id}/pipeline/resume")
def resume_pipeline_endpoint(run_id: str, background_tasks: BackgroundTasks):
    """Resume the agent pipeline from its paused stage."""
    state = load_run_state(run_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    
    def _resume_task():
        pipeline = SequentialQETPipeline()
        resumed_state = pipeline.resume_pipeline(state)
        save_run_state(resumed_state)
        if resumed_state.errors:
            update_run_status(run_id, status="error", progress=80.0, error={"error_code": "pipeline_resumed_failed", "error_message": resumed_state.errors[-1]})
        else:
            update_run_status(run_id, status="pipeline_complete", progress=100.0)

    background_tasks.add_task(_resume_task)
    return {"status": "resumed", "run_id": run_id}


@app.post("/api/v1/runs/{run_id}/pipeline/stop")
def stop_pipeline_endpoint(run_id: str):
    """Stop the running agent pipeline."""
    state = load_run_state(run_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    pipeline = SequentialQETPipeline()
    updated_state = pipeline.stop_pipeline(state)
    save_run_state(updated_state)
    update_run_status(run_id, status="idle", progress=state.progress)
    return {"status": "stopped", "run_id": run_id}


@app.post("/api/v1/runs/{run_id}/cancel")
def cancel_pipeline_endpoint(run_id: str):
    """Cancel/Stop the active agent pipeline run."""
    return stop_pipeline_endpoint(run_id)



@app.get("/api/v1/runs/{run_id}/understanding")
def get_understanding(run_id: str):
    state = load_run_state(run_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")

    if state.status == "error" or state.last_error:
        err = state.last_error or {
            "error_code": "unknown_error",
            "error_message": "Understanding analysis failed",
            "diagnostics": {},
            "retryable": True
        }
        return {
            "status": "failed",
            "error_code": err.get("error_code", "failed"),
            "error_message": err.get("error_message", "Understanding stage failed"),
            "diagnostics": err.get("diagnostics", {}),
            "retryable": err.get("retryable", True)
        }

    if state.understanding and state.status == "understanding_ready":
        return {
            "status": "ready",
            "understanding": state.understanding
        }

    return {
        "status": "running" if state.status == "ai_understanding_running" else state.status,
        "progress": state.progress
    }

@app.get("/api/v1/runs/{run_id}/coverage")
def get_requirement_coverage(run_id: str):
    state = load_run_state(run_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
        
    und = state.understanding
    if not und or not getattr(und, "requirements", None):
        return {
            "run_id": run_id,
            "total_requirements": 0,
            "covered_requirements": 0,
            "coverage_percentage": 0.0,
            "categories": [],
            "requirements": []
        }
        
    # Get all test cases
    test_cases = []
    if state.test_suite and state.test_suite.test_cases:
        test_cases = state.test_suite.test_cases
        
    # Map requirements to test cases
    req_to_cases = {}
    for tc in test_cases:
        req_id = tc.requirement_id
        if req_id:
            req_to_cases[req_id] = req_to_cases.get(req_id, [])
            req_to_cases[req_id].append(tc.case_id)
            
    reqs_out = []
    covered_count = 0
    for req in und.requirements:
        mapped = req_to_cases.get(req.requirement_id, [])
        is_covered = len(mapped) > 0
        if is_covered:
            covered_count += 1
            
        reqs_out.append({
            "requirement_id": req.requirement_id,
            "title": req.title,
            "description": req.description,
            "type": req.type,
            "category_id": req.category_id,
            "source_evidence": req.source_evidence,
            "confidence": req.confidence,
            "is_covered": is_covered,
            "mapped_test_cases": mapped
        })
        
    # Categories coverage
    categories_out = []
    for cat in und.requirement_categories:
        cat_reqs = [r for r in reqs_out if r["category_id"] == cat.category_id]
        cat_total = len(cat_reqs)
        cat_covered = sum(1 for r in cat_reqs if r["is_covered"])
        cat_percentage = (cat_covered / cat_total * 100.0) if cat_total > 0 else 100.0
        
        categories_out.append({
            "category_id": cat.category_id,
            "name": cat.name,
            "type": cat.type,
            "description": cat.description,
            "total_requirements": cat_total,
            "covered_requirements": cat_covered,
            "coverage_percentage": round(cat_percentage, 1),
            "requirements": cat_reqs
        })
        
    total_reqs = len(und.requirements)
    overall_percentage = (covered_count / total_reqs * 100.0) if total_reqs > 0 else 0.0
    
    return {
        "run_id": run_id,
        "total_requirements": total_reqs,
        "covered_requirements": covered_count,
        "coverage_percentage": round(overall_percentage, 1),
        "categories": categories_out,
        "requirements": reqs_out
    }


@app.post("/api/v1/runs/{run_id}/executions", response_model=ExecutionStatusResponse)
def launch_execution(run_id: str, payload: ExecutionLaunchRequest):
    state = load_run_state(run_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    request = ExecutionRequest(
        execution_id=f"EXEC-{uuid4().hex[:12].upper()}",
        mode=ExecutionMode.PLAYWRIGHT_UI,
        test_case_ids=payload.test_case_ids,
        explicit_user_approval=payload.explicit_user_approval,
        is_non_production_confirmed=payload.is_non_production_confirmed,
        is_script_reviewed=payload.is_script_reviewed,
    )
    try:
        managed = execution_manager.start(state, request)
        return execution_manager.snapshot(managed.execution_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"error_code": "invalid_test_selection", "error_message": str(exc)})


@app.get("/api/v1/runs/{run_id}/executions/{execution_id}", response_model=ExecutionStatusResponse)
def get_execution_status(run_id: str, execution_id: str):
    try:
        snapshot = execution_manager.snapshot(execution_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Execution {execution_id} not found")
    if snapshot.run_id != run_id:
        raise HTTPException(status_code=404, detail=f"Execution {execution_id} not found for run {run_id}")
    return snapshot


@app.post("/api/v1/runs/{run_id}/executions/{execution_id}/pause", response_model=ExecutionStatusResponse)
def pause_execution(run_id: str, execution_id: str):
    try:
        managed = execution_manager.pause(execution_id)
        snapshot = execution_manager.snapshot(managed.execution_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Execution {execution_id} not found")
    if snapshot.run_id != run_id:
        raise HTTPException(status_code=404, detail=f"Execution {execution_id} not found for run {run_id}")
    return snapshot


@app.post("/api/v1/runs/{run_id}/executions/{execution_id}/resume", response_model=ExecutionStatusResponse)
def resume_execution(run_id: str, execution_id: str):
    try:
        managed = execution_manager.resume(execution_id)
        snapshot = execution_manager.snapshot(managed.execution_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Execution {execution_id} not found")
    if snapshot.run_id != run_id:
        raise HTTPException(status_code=404, detail=f"Execution {execution_id} not found for run {run_id}")
    return snapshot


@app.post("/api/v1/runs/{run_id}/executions/{execution_id}/stop", response_model=ExecutionStatusResponse)
def stop_execution(run_id: str, execution_id: str):
    try:
        managed = execution_manager.stop(execution_id)
        snapshot = execution_manager.snapshot(managed.execution_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Execution {execution_id} not found")
    if snapshot.run_id != run_id:
        raise HTTPException(status_code=404, detail=f"Execution {execution_id} not found for run {run_id}")
    return snapshot


@app.post("/api/v1/runs/{run_id}/executions/{execution_id}/cancel", response_model=ExecutionStatusResponse)
def cancel_execution(run_id: str, execution_id: str):
    return stop_execution(run_id, execution_id)


@app.get("/api/v1/runs/{run_id}/screenshots/{filename}")
def get_screenshot(run_id: str, filename: str):
    """Serve screenshot evidence PNG or SVG image."""
    candidates = [
        Path("uploads") / run_id / "artifacts" / "screenshots" / filename,
        Path("backend") / "uploads" / run_id / "artifacts" / "screenshots" / filename,
    ]
    screenshot_path = None
    for p in candidates:
        if p.exists():
            screenshot_path = p
            break
        svg_p = p.with_suffix(".svg")
        if svg_p.exists():
            screenshot_path = svg_p
            break

    if not screenshot_path:
        # Generate on-demand placeholder if valid test case screenshot filename
        target_path = candidates[0]
        target_path.parent.mkdir(parents=True, exist_ok=True)
        is_passed = "passed" in filename.lower()
        case_id = filename.split("_")[0] if "_" in filename else "TC-001"
        from src.services.execution_engine import ExecutionEngine
        ExecutionEngine(run_id=run_id)._ensure_screenshot_placeholder(target_path, case_id, "Standard", is_passed)
        if target_path.exists():
            screenshot_path = target_path
        elif target_path.with_suffix(".svg").exists():
            screenshot_path = target_path.with_suffix(".svg")
        else:
            raise HTTPException(status_code=404, detail=f"Screenshot {filename} not found")
    
    media_type = "image/png" if str(screenshot_path).endswith(".png") else ("image/svg+xml" if str(screenshot_path).endswith(".svg") else "application/octet-stream")
    return FileResponse(screenshot_path, media_type=media_type)



@app.get("/api/v1/runs/{run_id}/executions/{execution_id}/multi-level-results")
def get_multi_level_results(run_id: str, execution_id: str):
    """Retrieve multi-level JSON execution report."""
    path = Path("uploads") / run_id / "artifacts" / "multi_level_execution_results.json"
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            pass
    state = load_run_state(run_id)
    if state and state.latest_multi_level_results:
        return state.latest_multi_level_results
    raise HTTPException(status_code=404, detail="Multi-level execution results not found. Please run tests first.")


@app.get("/api/v1/runs/{run_id}/execution-results")
def get_latest_execution_results(run_id: str):
    """Retrieve the latest multi-level execution report for the run."""
    path = Path("uploads") / run_id / "artifacts" / "multi_level_execution_results.json"
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            pass
    state = load_run_state(run_id)
    if state and state.latest_multi_level_results:
        return state.latest_multi_level_results
    if state and state.last_execution_result:
        return state.last_execution_result.model_dump()
    raise HTTPException(status_code=404, detail="No execution results available for this run.")


@app.post("/api/v1/runs/{run_id}/ai-analysis", response_model=AITestAnalysisResult)
def run_ai_test_analysis(run_id: str):
    """Perform deep AI analysis and health diagnostics on execution results."""
    state = load_run_state(run_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    service = AITestAnalysisService(run_id=run_id)
    analysis = service.analyze_results(state)
    return analysis


@app.post("/api/v1/runs/{run_id}/ai-modify-script", response_model=AIScriptModificationResponse)
def ai_modify_script(run_id: str, payload: AIScriptModificationRequest):
    """Propose AI-assisted script repairs with explanation and diff."""
    state = load_run_state(run_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    service = AITestAnalysisService(run_id=run_id)
    return service.modify_script(
        script_filename=payload.script_filename,
        test_case_id=payload.test_case_id,
        current_code=payload.current_code,
        failure_log=payload.failure_log,
        instruction=payload.instruction,
    )


class ApplyScriptFixRequest(BaseModel):
    script_filename: str
    test_case_id: str
    modified_code: str


@app.post("/api/v1/runs/{run_id}/apply-script-fix")
def apply_script_fix_endpoint(run_id: str, payload: ApplyScriptFixRequest):
    """Apply approved AI script modification to filesystem and state."""
    state = load_run_state(run_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    service = AITestAnalysisService(run_id=run_id)
    result = service.apply_script_fix(
        script_filename=payload.script_filename,
        test_case_id=payload.test_case_id,
        modified_code=payload.modified_code,
    )
    return result


@app.websocket("/api/v1/runs/{run_id}/executions/{execution_id}/events")
async def stream_execution_events(websocket: WebSocket, run_id: str, execution_id: str):
    await websocket.accept()
    try:
        while True:
            try:
                snapshot = execution_manager.snapshot(execution_id)
            except KeyError:
                await websocket.send_json({"error": "execution_not_found"})
                return
            if snapshot.run_id != run_id:
                await websocket.send_json({"error": "execution_not_found"})
                return
            await websocket.send_json(snapshot.model_dump(mode="json"))
            if snapshot.status.value in {"passed", "failed", "cancelled", "stopped", "timed_out", "not_run"}:
                return
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        return


from fastapi.staticfiles import StaticFiles
import os

# Resolve dist directory path across the layouts this API can be launched from:
# __file__ is backend/src/api/fastapi_app.py
# parents[2] is backend/, parents[3] is the repo root (where `npm run build` outputs dist/)
_dist_candidates = [
    Path(__file__).resolve().parents[2] / "dist",
    Path(__file__).resolve().parents[3] / "dist",
    Path(__file__).resolve().parents[3] / "qet-react-ui" / "dist",
]
dist_path = next((p for p in _dist_candidates if p.exists() and os.listdir(p)), _dist_candidates[0])

if dist_path.exists() and os.listdir(dist_path):
    logger.info(f"Serving static production React build from {dist_path}")
    app.mount("/", StaticFiles(directory=str(dist_path), html=True), name="static")
else:
    logger.info("React production build not detected at dist/. Serving API health check at root.")


@app.get("/", response_class=HTMLResponse)
def serve_vanilla_spa():
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=0.5, maximum-scale=5.0, user-scalable=yes" />
  <title>QET Agent Studio</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #020617;
      --text-color: #f1f5f9;
      --header-bg: rgba(2, 6, 23, 0.8);
      --header-border: #1e293b;
      --card-bg: #0f172a;
      --card-border: #1e293b;
      --muted-text: #94a3b8;
      --cyan-glow: rgba(6, 182, 212, 0.15);
      --purple-glow: rgba(168, 85, 247, 0.15);
      --tab-active-bg: #1e1b4b;
      --tab-active-text: #c084fc;
      --tab-active-border: #682773;
    }
    
    .light {
      --bg-color: #f8fafc;
      --text-color: #0f172a;
      --header-bg: rgba(255, 255, 255, 0.9);
      --header-border: #e2e8f0;
      --card-bg: #ffffff;
      --card-border: #e2e8f0;
      --muted-text: #64748b;
      --cyan-glow: rgba(6, 182, 212, 0.05);
      --purple-glow: rgba(168, 85, 247, 0.05);
      --tab-active-bg: #eff6ff;
      --tab-active-text: #1d4ed8;
      --tab-active-border: #bfdbfe;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background-color: var(--bg-color);
      color: var(--text-color);
      transition: background-color 0.2s, color 0.2s;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    header {
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(8px);
      background-color: var(--header-bg);
      border-bottom: 1px solid var(--header-border);
      padding: 1rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .header-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-badge {
      width: 2rem;
      height: 2rem;
      border-radius: 0.5rem;
      background: linear-gradient(135deg, #06b6d4, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: white;
      box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
    }

    .header-title h1 {
      font-size: 1rem;
      font-weight: 700;
      background: linear-gradient(to right, #22d3ee, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .header-title p {
      font-size: 0.65rem;
      font-family: 'JetBrains Mono', monospace;
      color: var(--muted-text);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .run-badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.75rem;
      border-radius: 0.5rem;
      background-color: var(--card-bg);
      border: 1px solid var(--card-border);
      font-family: 'JetBrains Mono', monospace;
    }

    .run-badge span { color: var(--muted-text); }
    .run-badge code { color: #22d3ee; font-weight: 700; }

    .theme-btn {
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid var(--card-border);
      background-color: var(--card-bg);
      color: var(--text-color);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .theme-btn:hover {
      opacity: 0.9;
    }

    .tab-ribbon {
      border-bottom: 1px solid var(--header-border);
      background-color: var(--header-bg);
      padding: 0.5rem 1.5rem;
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
    }

    .tab-btn {
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid transparent;
      background: transparent;
      color: var(--muted-text);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      transition: all 0.2s;
    }

    .tab-btn.active {
      background-color: var(--tab-active-bg);
      color: var(--tab-active-text);
      border-color: var(--tab-active-border);
    }

    .tab-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
    
    /* Coverage Matrix Styles */
    section#sect-coverage {
      display: none;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    section#sect-coverage.active {
      display: flex;
    }

    main {
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
      padding: 1.5rem;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .toast {
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid #1e1b4b;
      background-color: #0c0a09;
      color: #a78bfa;
      font-size: 0.75rem;
      display: none;
    }

    .toast.error {
      background-color: #450a0a;
      border-color: #7f1d1d;
      color: #fca5a5;
    }

    .hero-panel {
      border: 1px solid var(--card-border);
      border-radius: 1rem;
      padding: 1.5rem;
      background-color: var(--card-bg);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .hero-panel h2 { font-size: 1.25rem; font-weight: 700; }
    .hero-panel p { font-size: 0.75rem; color: var(--muted-text); }

    .upload-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    @media (min-width: 768px) {
      .upload-grid { grid-template-columns: 1fr 1fr; }
    }

    .upload-card {
      border: 1px solid var(--card-border);
      border-radius: 0.75rem;
      padding: 1.5rem;
      background-color: var(--card-bg);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 1rem;
      transition: all 0.2s;
    }

    .upload-card.dragging {
      border-color: #22d3ee;
      background-color: var(--cyan-glow);
    }

    .card-info h3 { font-size: 0.875rem; font-weight: 700; margin-bottom: 0.25rem; }
    .card-info.docs h3 { color: #22d3ee; }
    .card-info.zip h3 { color: #a78bfa; }
    .card-info p { font-size: 0.75rem; color: var(--muted-text); }

    .drop-zone-label {
      display: block;
      width: 100%;
      text-align: center;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 2rem 1rem;
      border: 1px dashed var(--card-border);
      border-radius: 0.5rem;
      cursor: pointer;
      background-color: rgba(0, 0, 0, 0.15);
      transition: all 0.2s;
    }

    .drop-zone-label:hover {
      background-color: rgba(0, 0, 0, 0.25);
    }

    .file-input { display: none; }

    .file-badge-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .file-badge {
      font-size: 0.75rem;
      font-family: 'JetBrains Mono', monospace;
      padding: 0.5rem;
      border-radius: 0.5rem;
      border: 1px solid var(--card-border);
      background-color: rgba(0,0,0,0.2);
    }

    .progress-panel {
      border: 1px solid var(--card-border);
      border-radius: 0.75rem;
      padding: 1.5rem;
      background-color: var(--card-bg);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .progress-bar-bg {
      width: 100%;
      height: 0.5rem;
      border-radius: 0.25rem;
      background-color: rgba(0,0,0,0.3);
      border: 1px solid var(--card-border);
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(to right, #06b6d4, #6366f1, #a855f7);
      width: 0%;
      transition: width 0.3s;
    }

    .btn-primary {
      padding: 0.75rem 1.5rem;
      border-radius: 0.75rem;
      border: none;
      background: linear-gradient(to right, #06b6d4, #8b5cf6);
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(6, 182, 212, 0.2);
      transition: all 0.2s;
    }

    .btn-primary:hover:not(:disabled) {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .btn-primary:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      box-shadow: none;
    }

    footer {
      border-top: 1px solid var(--header-border);
      padding: 1.5rem;
      text-align: center;
      font-size: 0.75rem;
      color: var(--muted-text);
      background-color: var(--card-bg);
    }

    section { display: none; flex-direction: column; gap: 1.5rem; }
    section.active { display: flex; }

    /* AI Understanding styles */
    .diagnostics-box {
      background-color: rgba(69, 10, 10, 0.4);
      border: 1px solid #991b1b;
      border-radius: 0.75rem;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      font-size: 0.75rem;
    }

    .diagnostics-box h3 { color: #fca5a5; font-size: 0.875rem; }
    .diagnostics-box code { background-color: rgba(0,0,0,0.3); padding: 0.125rem 0.375rem; border-radius: 0.25rem; color: white; }
    .diagnostics-box pre { background-color: #020617; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #7f1d1d; overflow-x: auto; font-size: 0.7rem; color: #fca5a5; }

    .provenance-card {
      border: 1px solid var(--card-border);
      border-radius: 0.75rem;
      padding: 1.25rem;
      background-color: var(--card-bg);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 0.75rem;
    }

    .provenance-card h3 {
      font-size: 0.65rem;
      font-weight: 800;
      color: #06b6d4;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .provenance-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      font-family: 'JetBrains Mono', monospace;
    }

    @media (min-width: 768px) {
      .provenance-grid { grid-template-columns: repeat(4, 1fr); }
    }

    .text-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    @media (min-width: 768px) {
      .text-grid { grid-template-columns: 1fr 1fr; }
    }

    .text-card {
      border: 1px solid var(--card-border);
      border-radius: 0.75rem;
      padding: 1.25rem;
      background-color: var(--card-bg);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .text-card h4 { font-size: 0.75rem; font-weight: 700; color: var(--muted-text); text-transform: uppercase; }
    .text-card p { font-size: 0.75rem; line-height: 1.5; }

    .component-inventory {
      border: 1px solid var(--card-border);
      border-radius: 0.75rem;
      padding: 1.25rem;
      background-color: var(--card-bg);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .component-inventory h4 { font-size: 0.75rem; font-weight: 700; color: var(--muted-text); text-transform: uppercase; }
    .comp-grid { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
    @media (min-width: 640px) {
      .comp-grid { grid-template-columns: 1fr 1fr; }
    }

    .comp-item {
      padding: 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid var(--card-border);
      background-color: rgba(0,0,0,0.1);
      font-size: 0.75rem;
    }

    .comp-name { font-weight: 700; color: #818cf8; }
    .comp-desc { font-size: 0.7rem; color: var(--muted-text); margin-top: 0.25rem; }
  </style>
</head>
<body>

  <header>
    <div class="header-logo">
      <div class="logo-badge">Q</div>
      <div class="header-title">
        <h1>QET Agent Studio</h1>
        <p>Offline-safe vanilla platform</p>
      </div>
    </div>
    
    <div class="header-actions">
      <div class="run-badge">
        <span>Active Run: </span>
        <code id="active-run-id">Initializing...</code>
      </div>
      <div style="display: flex; align-items: center; gap: 0.25rem;">
        <button id="zoom-out-btn" class="theme-btn" style="padding: 0.5rem 0.75rem;" title="Zoom Out">🔎➖</button>
        <span id="zoom-val" style="font-size: 0.75rem; font-family: monospace; min-width: 2.5rem; text-align: center;">100%</span>
        <button id="zoom-in-btn" class="theme-btn" style="padding: 0.5rem 0.75rem;" title="Zoom In">🔎➕</button>
      </div>
      <button id="theme-btn" class="theme-btn">☀️ Light</button>
      <button id="reset-run-btn" class="theme-btn" style="color:#06b6d4; border-color:transparent;">Reset Run</button>
    </div>
  </header>

  <div class="tab-ribbon">
    <button id="tab-home-btn" class="tab-btn active">🏠 1. Home Upload</button>
    <button id="tab-understanding-btn" class="tab-btn" disabled>🧠 2. AI Understanding 🔒</button>
    <button class="tab-btn" disabled>Test Cases 🔒</button>
    <button class="tab-btn" disabled>Synthetic Data 🔒</button>
    <button class="tab-btn" disabled>Playwright Scripts 🔒</button>
  </div>

  <main>
    <div id="toast" class="toast">Status update...</div>

    <!-- Section 1: Home Upload -->
    <section id="sect-home" class="active">
      <div class="hero-panel">
        <h2>F01 Home Upload Experience</h2>
        <p>Create a workspace run, upload business requirement documents, and upload codebase ZIP packages. Drag-and-drop zones are active below.</p>
      </div>

      <div class="upload-grid">
        <!-- Docs Upload Card -->
        <div id="drop-docs" class="upload-card">
          <div class="card-info docs">
            <h3>1. Requirement Specifications</h3>
            <p>Drag & Drop files here, or click upload button below.</p>
          </div>
          <label class="drop-zone-label">
            Select Document Files (.md, .pdf, .txt)
            <input type="file" id="file-docs" class="file-input" multiple accept=".md,.pdf,.txt,.docx" />
          </label>
          <div id="doc-files-list" class="file-badge-list"></div>
        </div>

        <!-- ZIP Upload Card -->
        <div id="drop-zip" class="upload-card">
          <div class="card-info zip">
            <h3>2. Codebase ZIP Archive</h3>
            <p>Drag & Drop codebase .zip archive here, or click to upload.</p>
          </div>
          <label class="drop-zone-label">
            Select ZIP Archive (.zip)
            <input type="file" id="file-zip" class="file-input" accept=".zip" />
          </label>
          <div id="zip-files-list" class="file-badge-list"></div>
        </div>
      </div>

      <div class="progress-panel">
        <div class="progress-header">
          <span>Runtime Stage: <code id="stage-label" style="color:#06b6d4;">idle</code></span>
          <span id="progress-percentage">Progress: 0%</span>
        </div>
        <div class="progress-bar-bg">
          <div id="progress-bar-fill" class="progress-bar-fill"></div>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end;">
        <button id="proceed-btn" class="btn-primary" disabled>Proceed to Understanding Tab →</button>
      </div>
    </section>

    <!-- Section 2: AI Understanding -->
    <section id="sect-understanding">
      <div class="hero-panel" style="display:flex; flex-direction:row; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
        <div>
          <h2>F02 AI-Required Understanding Engine</h2>
          <p>Generates structured understanding with AI provenance. Fails fast if AI key or model is invalid.</p>
        </div>
        <button id="start-analysis-btn" class="btn-primary">Start AI Analysis</button>
      </div>

      <div id="diagnostics-panel" class="diagnostics-box" style="display:none;">
        <h3 id="diag-title">❌ AI Fail-Fast Execution Error</h3>
        <p>Error Code: <code id="diag-code">unknown_error</code></p>
        <p id="diag-msg">Connection failed.</p>
        <pre id="diag-details">{}</pre>
      </div>

      <div id="understanding-results" style="display:none; flex-direction:column; gap:1.5rem;">
        <div class="provenance-card">
          <h3>AI Output Provenance Audit</h3>
          <div class="provenance-grid">
            <div><span style="color:var(--muted-text)">Provider:</span> <span id="prov-provider">gemini</span></div>
            <div><span style="color:var(--muted-text)">Model:</span> <span id="prov-model">gemini-1.5-flash</span></div>
            <div><span style="color:var(--muted-text)">Fallback Used:</span> <span id="prov-fallback" style="color:#818cf8">false</span></div>
            <div><span style="color:var(--muted-text)">Validation:</span> <span id="prov-validation" style="color:#34d399">VALIDATED</span></div>
          </div>
        </div>

        <div class="text-grid">
          <div class="text-card">
            <h4>Executive Summary</h4>
            <p id="result-summary">No summary loaded.</p>
          </div>
          <div class="text-card">
            <h4>Architecture Notes</h4>
            <p id="result-arch">No architecture notes loaded.</p>
          </div>
        </div>

        <div class="component-inventory">
          <h4>Discovered UI Components</h4>
          <div id="result-comps" class="comp-grid"></div>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <p>QET Agent Studio &bull; Spec-Kit 004 Corrective Pass &bull; Antigravity Platform</p>
  </footer>

  <script>
    // Zoom scaling controls
    let uiScale = 1.0;
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomVal = document.getElementById('zoom-val');

    function updateZoom() {
      document.body.style.zoom = uiScale;
      zoomVal.innerText = Math.round(uiScale * 100) + '%';
    }

    zoomInBtn.addEventListener('click', () => {
      if (uiScale < 1.8) {
        uiScale += 0.1;
        updateZoom();
      }
    });

    zoomOutBtn.addEventListener('click', () => {
      if (uiScale > 0.6) {
        uiScale -= 0.1;
        updateZoom();
      }
    });

    // Theme toggle
    const themeBtn = document.getElementById('theme-btn');
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('light');
      if (document.body.classList.contains('light')) {
        themeBtn.innerText = '🌙 Dark';
      } else {
        themeBtn.innerText = '☀️ Light';
      }
    });

    // Run context variables
    const API_BASE = '/api/v1';
    let runId = '';
    let appState = null;
    let isIntakeReady = false;

    // Toast helpers
    const toast = document.getElementById('toast');
    function showToast(msg, isError = false) {
      toast.innerText = msg;
      toast.style.display = 'block';
      if (isError) {
        toast.classList.add('error');
      } else {
        toast.classList.remove('error');
      }
    }

    // Initialize run ID on page load
    async function initRun() {
      try {
        const res = await fetch(API_BASE + '/runs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project_name: 'CFA Digital Journey' })
        });
        const data = await res.json();
        runId = data.run_id;
        appState = data.state;
        document.getElementById('active-run-id').innerText = runId;
        showToast('Fresh execution run initialized: ' + runId);
        updateProgressUI(0, 'idle');
      } catch (err) {
        showToast('Failed to initialize workspace run.', true);
      }
    }

    // Update Stage & Progress indicators
    function updateProgressUI(progress, status) {
      document.getElementById('stage-label').innerText = status;
      document.getElementById('progress-percentage').innerText = 'Progress: ' + progress + '%';
      document.getElementById('progress-bar-fill').style.width = progress + '%';
    }

    // Status Poller
    async function pollStatus() {
      if (!runId) return;
      try {
        const res = await fetch(API_BASE + '/runs/' + runId + '/status');
        const data = await res.json();
        
        appState = data;
        updateProgressUI(data.progress, data.state);

        // Update file lists if manifest exists
        if (data.intake_manifest) {
          const manifest = data.intake_manifest;
          
          // Render Docs list
          const docsList = document.getElementById('doc-files-list');
          if (manifest.doc_files && manifest.doc_files.length > 0) {
            docsList.innerHTML = manifest.doc_files.map(f => `<div class="file-badge">📄 ${f}</div>`).join('');
          } else {
            docsList.innerHTML = '';
          }

          // Render ZIP status
          const zipList = document.getElementById('zip-files-list');
          if (manifest.total_files > 0) {
            zipList.innerHTML = `<div class="file-badge" style="border-color:#a78bfa;">📦 ZIP Extracted (${manifest.total_files} files)</div>`;
          } else {
            zipList.innerHTML = '';
          }

          // Check if intake ready
          isIntakeReady = Boolean(manifest.total_files > 0 || (manifest.doc_files && manifest.doc_files.length > 0));
          const proceedBtn = document.getElementById('proceed-btn');
          const tabBtn = document.getElementById('tab-understanding-btn');
          if (isIntakeReady) {
            proceedBtn.removeAttribute('disabled');
            tabBtn.removeAttribute('disabled');
            tabBtn.innerHTML = '🧠 2. AI Understanding';
          } else {
            proceedBtn.setAttribute('disabled', 'true');
            tabBtn.setAttribute('disabled', 'true');
            tabBtn.innerHTML = '🧠 2. AI Understanding 🔒';
          }
        }
      } catch (err) {
        console.error('Poller error:', err);
      }
    }

    // Set polling interval
    setInterval(() => {
      const activeStates = ['uploading', 'processing_zip', 'indexing', 'ai_understanding_running'];
      if (appState && activeStates.indexOf(appState.status) !== -1) {
        pollStatus();
      }
    }, 2000);

    // Tab Navigation
    const tabs = {
      'home': { btn: document.getElementById('tab-home-btn'), sect: document.getElementById('sect-home') },
      'understanding': { btn: document.getElementById('tab-understanding-btn'), sect: document.getElementById('sect-understanding') },
      'coverage': { btn: document.getElementById('tab-coverage-btn'), sect: document.getElementById('sect-coverage') }
    };

    function switchTab(target) {
      Object.keys(tabs).forEach(k => {
        tabs[k].btn.classList.remove('active');
        tabs[k].sect.classList.remove('active');
      });
      tabs[target].btn.classList.add('active');
      tabs[target].sect.classList.add('active');
    }

    tabs.home.btn.addEventListener('click', () => switchTab('home'));
    tabs.understanding.btn.addEventListener('click', () => switchTab('understanding'));
    tabs.coverage.btn.addEventListener('click', () => switchTab('coverage'));
    document.getElementById('proceed-btn').addEventListener('click', () => switchTab('understanding'));
    document.getElementById('reset-run-btn').addEventListener('click', () => initRun());

    // File Selector & Upload Handlers
    const fileDocs = document.getElementById('file-docs');
    fileDocs.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        uploadDocuments(Array.from(e.target.files));
      }
    });

    const fileZip = document.getElementById('file-zip');
    fileZip.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        uploadCodebaseZip(e.target.files[0]);
      }
    });

    // Upload Documents
    async function uploadDocuments(files) {
      if (!runId) return;
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      showToast('Uploading requirement documents...');
      try {
        const res = await fetch(API_BASE + '/runs/' + runId + '/documents', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        showToast('Successfully uploaded ' + data.uploaded_count + ' requirement file(s).');
        pollStatus();
      } catch (err) {
        showToast('Failed to upload requirement documents.', true);
      }
    }

    // Upload Codebase ZIP
    async function uploadCodebaseZip(file) {
      if (!runId) return;
      if (!file.name.endsWith('.zip')) {
        showToast('Only ZIP archive formats (.zip) are supported for codebases.', true);
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      showToast('Uploading and indexing codebase ZIP package...');
      try {
        const res = await fetch(API_BASE + '/runs/' + runId + '/codebase', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        showToast('Codebase ZIP uploaded and indexed successfully.');
        pollStatus();
      } catch (err) {
        showToast('Failed to process codebase ZIP upload.', true);
      }
    }

    // Setup Drag-and-Drop Event Listeners
    function setupDragAndDrop(dropAreaId, onFilesDropped) {
      const dropArea = document.getElementById(dropAreaId);
      
      dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('dragging');
      });

      dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('dragging');
      });

      dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('dragging');
        if (e.dataTransfer.files.length > 0) {
          onFilesDropped(e.dataTransfer.files);
        }
      });
    }

    setupDragAndDrop('drop-docs', (files) => uploadDocuments(Array.from(files)));
    setupDragAndDrop('drop-zip', (files) => uploadCodebaseZip(files[0]));

    // AI Analysis Start button handler
    const startBtn = document.getElementById('start-analysis-btn');
    startBtn.addEventListener('click', async () => {
      if (!runId) return;
      startBtn.setAttribute('disabled', 'true');
      startBtn.innerText = 'Analyzing codebase...';
      document.getElementById('diagnostics-panel').style.display = 'none';
      document.getElementById('understanding-results').style.display = 'none';

      try {
        await fetch(API_BASE + '/runs/' + runId + '/understanding/start', { method: 'POST' });
        
        // Poll for AI results
        const interval = setInterval(async () => {
          const res = await fetch(API_BASE + '/runs/' + runId + '/understanding');
          const data = await res.json();
          
          if (data.status === 'ready') {
            clearInterval(interval);
            startBtn.removeAttribute('disabled');
            startBtn.innerText = 'Start AI Analysis';
            renderUnderstanding(data.understanding);
            pollStatus();
          } else if (data.status === 'failed') {
            clearInterval(interval);
            startBtn.removeAttribute('disabled');
            startBtn.innerText = 'Start AI Analysis';
            renderDiagnostics(data);
            pollStatus();
          }
        }, 1500);
      } catch (err) {
        startBtn.removeAttribute('disabled');
        startBtn.innerText = 'Start AI Analysis';
        showToast('Failed to start AI Analysis.', true);
      }
    });

    // Render Diagnostics Errors
    function renderDiagnostics(data) {
      document.getElementById('diagnostics-panel').style.display = 'flex';
      document.getElementById('diag-code').innerText = data.error_code || 'unknown_error';
      document.getElementById('diag-msg').innerText = data.error_message || 'AI engine failed.';
      document.getElementById('diag-details').innerText = JSON.stringify(data.diagnostics || {}, null, 2);
    }

    // Render AI Results
    
    async function fetchCoverage() {
      if (!runId) return;
      try {
        const res = await fetch(API_BASE + '/runs/' + runId + '/coverage');
        const data = await res.json();
        
        document.getElementById('coverage-percentage-val').innerText = data.coverage_percentage + '%';
        document.getElementById('coverage-bar-fill').style.width = data.coverage_percentage + '%';
        document.getElementById('total-requirements-val').innerText = data.total_requirements;
        
        const list = document.getElementById('coverage-categories-list');
        if (data.categories && data.categories.length > 0) {
          list.innerHTML = data.categories.map(cat => `
            <div class="upload-card" style="display:flex; flex-direction:column; gap:0.75rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--card-border); padding-bottom:0.5rem;">
                <h4 style="font-size:0.9rem; font-weight:600;">${cat.name} (${cat.type})</h4>
                <div style="font-size:0.75rem; font-family:monospace; background:#292524; padding:0.25rem 0.5rem; border-radius:0.25rem;">
                  Coverage: ${cat.covered_requirements}/${cat.total_requirements} (${cat.coverage_percentage}%)
                </div>
              </div>
              <p style="font-size:0.7rem; color:var(--muted-text);">${cat.description}</p>
              <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem;">
                ${cat.requirements.map(req => `
                  <div style="display:flex; justify-content:space-between; align-items:center; background:#1c1917; padding:0.5rem; border-radius:0.35rem; font-size:0.7rem;">
                    <div style="max-width:70%;">
                      <strong style="color:#06b6d4;">${req.requirement_id}: ${req.title}</strong>
                      <p style="color:var(--muted-text); font-size:0.65rem; margin-top:0.15rem;">${req.description}</p>
                      <p style="font-size:0.6rem; color:#a8a29e; margin-top:0.25rem;">Evidence: <code>${req.source_evidence}</code> (Confidence: ${req.confidence})</p>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:end; gap:0.25rem;">
                      ${req.is_covered 
                        ? `<span style="background:#065f46; color:#34d399; font-weight:600; padding:0.15rem 0.4rem; border-radius:0.25rem; font-size:0.6rem;"> Covered</span>`
                        : `<span style="background:#78350f; color:#fbbf24; font-weight:600; padding:0.15rem 0.4rem; border-radius:0.25rem; font-size:0.6rem;"> Uncovered</span>`
                      }
                      ${req.mapped_test_cases && req.mapped_test_cases.length > 0
                        ? `<span style="font-size:0.6rem; color:var(--muted-text);">Tests: ${req.mapped_test_cases.join(', ')}</span>`
                        : ''
                      }
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('');
        } else {
          list.innerHTML = '<p style="font-size:0.75rem; color:var(--muted-text)">No requirement categories mapped yet.</p>';
        }
      } catch (err) {
        console.error('Error fetching coverage:', err);
      }
    }


    function renderUnderstanding(und) {
      document.getElementById('understanding-results').style.display = 'flex';
      document.getElementById('prov-provider').innerText = und.provenance ? und.provenance.provider : 'gemini';
      document.getElementById('prov-model').innerText = (und.provenance && und.provenance.model) || 'gemini-1.5-flash';
      document.getElementById('prov-fallback').innerText = und.provenance ? und.provenance.fallback_used : 'false';
      document.getElementById('prov-validation').innerText = und.validation_status || 'VALIDATED';

      document.getElementById('result-summary').innerText = und.summary || 'No summary.';
      document.getElementById('result-arch').innerText = und.architecture_notes || 'No architecture notes.';

      // Components Grid
      const compGrid = document.getElementById('result-comps');
      if (und.components && und.components.length > 0) {
        compGrid.innerHTML = und.components.map(c => `
          <div class="comp-item">
            <span class="comp-name">${c.name}</span> (${c.type})
            <p class="comp-desc">${c.description}</p>
          </div>
        `).join('');
      } else {
        compGrid.innerHTML = '<p style="font-size:0.75rem; color:var(--muted-text)">No components found.</p>';
      }
    }

    // Start execution run on load
    initRun();
  </script>
</body>
</html>
"""




