"""Application Understanding Specialist Agent — AI-first analysis with deterministic fallback and AI-required failfast mode."""

import json
import requests
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple, Callable
from uuid import uuid4
from schemas.contracts import (
    AppState,
    ApplicationUnderstanding,
    ApplicationComponent,
    ApplicationFlow,
    RequirementValidationReport,
    RequirementValidationItem,
    RequirementGap,
    UIInventory,
    UIElementControl,
    APIInventory,
    APIEndpointReference
)
from src.agents.base_agent import BaseAgent
from src.services.llm_service import LLMService
from src.prompts.understanding_v3 import PROMPT_VERSION, build_prompt
from src.utils.errors import AIRequiredFailureException
from src.utils.logger import logger


class UnderstandingAgent(BaseAgent):
    """Specialist agent analyzing application requirements, source code, UI inventory, and gaps."""

    __test__ = False

    CHECKLIST_ITEMS = [
        (1, "Unambiguous Language"),
        (2, "Testable Acceptance Criteria"),
        (3, "Complete Input Specification"),
        (4, "Clear Output Expectations"),
        (5, "Explicit Error Handling Rules"),
        (6, "Boundary Conditions Defined"),
        (7, "Security & Authentication Rules"),
        (8, "Data Format & Validation Constraints"),
        (9, "User Flow Completeness"),
        (10, "System State Transitions"),
        (11, "Non-Functional Performance Rules"),
        (12, "Accessibility Standards (WCAG)"),
        (13, "Cross-Browser Compatibility"),
        (14, "Data Privacy & Retention Rules"),
        (15, "Integration & API Contracts")
    ]

    def __init__(self, run_id: str = "RUN-20260813-001", event_sink: Optional[Callable[[AppState], None]] = None):
        super().__init__(agent_name="UnderstandingAgent", description="Requirement & Codebase Analyst")
        self.run_id = run_id
        self.artifact_dir = Path("uploads") / run_id / "artifacts"
        self.artifact_dir.mkdir(parents=True, exist_ok=True)
        self.llm = LLMService()
        # Persists partial progress mid-run so the UI can render live subagent state.
        self.event_sink = event_sink

    def _emit_subagent(self, state: AppState, subagent_id: str, label: str, status: str, message: str) -> None:
        state.subagent_timeline.append({
            "event_id": str(uuid4()),
            "parent_agent_id": "application_understanding",
            "subagent_id": subagent_id,
            "label": label,
            "status": status,
            "message": message,
            "generation": getattr(state, "reset_generation", 1) or 1,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "backend.understanding_agent",
        })
        if self.event_sink:
            try:
                self.event_sink(state)
            except Exception:
                logger.warning("Subagent event sink failed; continuing analysis.")

    def _call_gpt(self, prompt: str, api_key: str) -> str:
        """Call OpenAI; raises AIRequiredFailureException with diagnostics on any failure."""
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}
        payload = {
            "model": self.llm.gpt_model,
            "temperature": 0.2,
            "max_tokens": 900,
            "messages": [
                {"role": "system", "content": "You are a QA automation engineering assistant."},
                {"role": "user", "content": prompt}
            ]
        }
        try:
            res = requests.post(url, json=payload, headers=headers, timeout=self.llm.timeout_seconds)
            if res.status_code in [401, 403]:
                raise AIRequiredFailureException(
                    error_code="provider_key_missing",
                    error_message="OpenAI API key validation failed (Status 401/403).",
                    diagnostics={"provider": "gpt", "status_code": res.status_code, "response": res.text[:200]}
                )
            elif res.status_code != 200:
                raise AIRequiredFailureException(
                    error_code="provider_disabled",
                    error_message=f"OpenAI service returned error status {res.status_code}.",
                    diagnostics={"provider": "gpt", "status_code": res.status_code, "response": res.text[:200]}
                )
            body = res.json()
            return body["choices"][0]["message"]["content"].strip()
        except requests.exceptions.Timeout:
            raise AIRequiredFailureException(
                error_code="model_timeout",
                error_message="OpenAI service request timed out.",
                diagnostics={"provider": "gpt", "timeout_seconds": self.llm.timeout_seconds}
            )
        except AIRequiredFailureException:
            raise
        except Exception as e:
            raise AIRequiredFailureException(
                error_code="invalid_model_json",
                error_message=f"OpenAI connection error: {str(e)}",
                diagnostics={"provider": "gpt", "exception": str(e)}
            )

    def _call_gemini(self, prompt: str, api_key: str) -> str:
        """Call Gemini, trying auto-discovered candidate models until one succeeds.

        Raises AIRequiredFailureException with per-attempt diagnostics if all candidates fail.
        """
        text, attempts = self.llm.generate_with_gemini(prompt, [api_key])
        if text:
            return text

        if not attempts:
            raise AIRequiredFailureException(
                error_code="model_discovery_failed",
                error_message="Could not discover any Gemini model supporting generateContent for this API key.",
                diagnostics={"provider": "gemini", **(self.llm.last_error or {})}
            )

        last_attempt = attempts[-1]
        raise AIRequiredFailureException(
            error_code=last_attempt.get("error_code", "invalid_model_json"),
            error_message=last_attempt.get("error_message", "All Gemini model candidates failed."),
            diagnostics={"provider": "gemini", "attempts": attempts}
        )

    def run_ai_required(self, state: AppState) -> Tuple[AppState, Dict[str, Any]]:
        logger.info(f"Executing AI-Required Understanding analysis for run {self.run_id}...")

        preferred_provider = self.llm._active_provider()
        gemini_keys = self.llm._provider_keys("gemini")
        gpt_keys = self.llm._provider_keys("gpt")
        provider_keys = {"gemini": gemini_keys, "gpt": gpt_keys}

        if not any(provider_keys.values()):
            raise AIRequiredFailureException(
                error_code="provider_key_missing",
                error_message="No valid Gemini or GPT API key is configured for AI understanding.",
                diagnostics={
                    "reason": "No configured provider has a usable API key",
                    "selected_provider": preferred_provider,
                    "remediation": "Open Tools > AI Settings and configure a valid Gemini or GPT key."
                }
            )

        extracted_path = Path(state.intake_manifest.extracted_path) if state.intake_manifest else Path("sample_cfa_app")
        doc_files = state.intake_manifest.doc_files if state.intake_manifest else ["requirements.md"]
        self._emit_subagent(state, "source_snapshot", "Source Snapshot Builder", "running", "Scanning extracted source files")
        source_snapshot = self._build_source_snapshot(extracted_path)
        self._emit_subagent(
            state,
            "source_snapshot",
            "Source Snapshot Builder",
            "completed",
            f"Indexed source snapshot from {len(doc_files)} requirement document(s)",
        )

        prompt = build_prompt(doc_files, source_snapshot, self.llm.JSON_OUTPUT_INSTRUCTION)

        llm_text = ""
        provider = preferred_provider
        attempt_failures: List[Dict[str, Any]] = []
        self._emit_subagent(
            state,
            "journey_synthesizer",
            "UI Journey Synthesizer",
            "running",
            f"Requesting application synthesis from {preferred_provider} with fallback routing",
        )
        llm_text = self.llm.generate_text(prompt, profile="understanding") or ""
        routing = self.llm.last_generation or {}
        provider = str(routing.get("provider") or preferred_provider)
        if not llm_text and self.llm.last_error:
            attempt_failures.append(self.llm.last_error)

        if not llm_text:
            self._emit_subagent(
                state,
                "journey_synthesizer",
                "UI Journey Synthesizer",
                "failed",
                "No usable response from the selected AI provider",
            )
            err_info = self.llm.last_error or {}
            is_key_fail = self._looks_like_key_failure(attempt_failures or [err_info] or err_info)
            err_code = "provider_key_rejected" if is_key_fail else (err_info.get("error_code") or "all_gemini_keys_exhausted")
            err_msg = (
                "Every configured AI key was rejected by the provider (authentication failed). "
                "Replace it with a valid key, or add a different key, and run the analysis again."
                if is_key_fail
                else (err_info.get("error_message") or "All configured Gemini API keys failed. Please provide a valid Gemini key and retry.")
            )
            remediation = err_info.get("diagnostics", {}).get("remediation") if isinstance(err_info.get("diagnostics"), dict) else None
            if not remediation:
                remediation = (
                    "Open Tools > AI Settings or update keys/gemini keys.txt with a valid Gemini key, then click Retry Analysis."
                    if self._looks_like_key_failure(attempt_failures)
                    else "Provide a new active Gemini API key and retry the analysis."
                )

            raise AIRequiredFailureException(
                error_code=err_code,
                error_message=err_msg,
                diagnostics={
                    "attempts": attempt_failures or [err_info],
                    "selected_provider": preferred_provider,
                    "keys_tried": {name: len(keys) for name, keys in provider_keys.items()},
                    "remediation": remediation,
                }
            )

        self._emit_subagent(
            state,
            "journey_synthesizer",
            "UI Journey Synthesizer",
            "completed",
            f"Received application synthesis from {provider}",
        )
        self._emit_subagent(
            state,
            "gap_analyzer",
            "Requirement Gap Analyzer",
            "running",
            "Validating model output and requirement gap coverage",
        )

        llm_data, parse_diag = self.llm.parse_json_payload_with_diagnostics(llm_text)
        if not llm_data or not isinstance(llm_data, dict):
            self._emit_subagent(
                state,
                "gap_analyzer",
                "Requirement Gap Analyzer",
                "failed",
                "Model output was not valid JSON",
            )
            raise AIRequiredFailureException(
                error_code="invalid_model_json",
                error_message="Model returned response that could not be parsed as valid JSON.",
                diagnostics={
                    "provider": provider,
                    "parser": parse_diag or {},
                    "raw_preview": (llm_text[:300] if llm_text else "")
                }
            )

        summary = llm_data.get("summary")
        architecture_notes = llm_data.get("architecture_notes")
        if not summary or not architecture_notes:
            self._emit_subagent(
                state,
                "gap_analyzer",
                "Requirement Gap Analyzer",
                "failed",
                "AI output missing mandatory summary or architecture notes",
            )
            raise AIRequiredFailureException(
                error_code="schema_validation_failed",
                error_message="AI output missing mandatory summary or architecture_notes fields.",
                diagnostics={"received_keys": list(llm_data.keys())}
            )

        self._emit_subagent(
            state,
            "gap_analyzer",
            "Requirement Gap Analyzer",
            "completed",
            "Validated AI output schema and gap coverage",
        )

        # AI-required mode: no deterministic sample data may enter the output.
        components = self._parse_components(llm_data.get("components"), [])
        flows = self._parse_flows(llm_data.get("flows"), [])
        gaps = self._parse_gaps(llm_data.get("gaps"), [])

        missing_sections = [
            key for key, value in (("components", components), ("flows", flows)) if not value
        ]
        if missing_sections:
            self._emit_subagent(
                state,
                "gap_analyzer",
                "Requirement Gap Analyzer",
                "failed",
                f"AI output missing required sections: {', '.join(missing_sections)}",
            )
            raise AIRequiredFailureException(
                error_code="schema_validation_failed",
                error_message=(
                    f"AI output did not contain usable {' and '.join(missing_sections)}. "
                    "No sample or placeholder content is substituted in AI-required mode."
                ),
                diagnostics={
                    "provider": provider,
                    "model": routing.get("model"),
                    "missing_sections": missing_sections,
                    "received_keys": list(llm_data.keys()),
                    "remediation": "Retry the analysis, or switch provider/model if the model keeps truncating output.",
                },
            )

        testability_obs = llm_data.get("testability_observations")
        testability_observations = (
            [str(x).strip() for x in testability_obs if str(x).strip()][:4]
            if isinstance(testability_obs, list)
            else []
        )

        entry_pts = llm_data.get("entry_points")
        entry_points = (
            [str(x).strip() for x in entry_pts if str(x).strip()][:6]
            if isinstance(entry_pts, list)
            else []
        )

        ui_inventory = self._build_ui_inventory_from_components(
            components, UIInventory(total_controls=0, controls=[], controls_by_type={})
        )
        api_inventory = self._parse_api_inventory(llm_data.get("api_endpoints"))
        validation_report = self._parse_validation_report(llm_data.get("requirement_validation"))

        provenance = {
            "provider": provider,
            "model": routing.get("model"),
            "prompt_version": PROMPT_VERSION,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "fallback_used": bool(routing.get("fallback_used")),
            "sample_data_used": False,
            "requirement_validation_source": "ai" if validation_report else "not_evaluated",
            "validation_status": "VALIDATED"
        }

        understanding = ApplicationUnderstanding(
            summary=summary,
            architecture_notes=architecture_notes,
            quality_score_percentage=validation_report.quality_score_percentage if validation_report else 0.0,
            components=components,
            flows=flows,
            entry_points=entry_points,
            gaps=gaps,
            validation_report=validation_report,
            ui_inventory=ui_inventory,
            api_inventory=api_inventory,
            testability_observations=testability_observations,
            provenance=provenance,
            validation_status="VALIDATED",
            fallback_used=bool(routing.get("fallback_used"))
        )

        state.understanding = understanding
        state.stage_provenance["understanding"] = provenance
        state.stage_validation["understanding"] = "VALIDATED"
        state.stage_timestamps["understanding"] = datetime.now(timezone.utc).isoformat()

        self._save_artifacts(understanding, validation_report, gaps, components, ui_inventory, api_inventory)
        return state, provenance

    def run(self, state: AppState) -> AppState:
        """AI-required. There is no deterministic sample-data path; failures surface as errors."""
        updated_state, _ = self.run_ai_required(state)
        return updated_state

    def _build_source_snapshot(self, extracted_path: Path) -> str:
        if not extracted_path.exists():
            return "No extracted codebase files found."
        lines = []
        for file in extracted_path.rglob("*"):
            if file.is_file() and file.suffix in [".tsx", ".ts", ".jsx", ".js", ".py", ".md", ".json"]:
                rel_path = file.relative_to(extracted_path)
                try:
                    snippet = file.read_text(encoding="utf-8", errors="ignore")[:500]
                    lines.append(f"--- File: {rel_path} ---\n{snippet}\n")
                except Exception:
                    continue
            if len(lines) >= 8:
                break
        return "\n".join(lines) if lines else "Empty codebase directory."

    def _parse_components(self, raw: Any, fallback: List[ApplicationComponent]) -> List[ApplicationComponent]:
        if not isinstance(raw, list):
            return fallback
        result = []
        for i, item in enumerate(raw[:6]):
            if not isinstance(item, dict):
                continue
            comp_id = str(item.get("component_id") or f"comp_ai_{i+1}")
            name = str(item.get("name") or f"Component {i+1}")
            c_type = str(item.get("type") or "View Component")
            file_path = str(item.get("file_path") or "src/components/View.tsx")
            desc = str(item.get("description") or "Analyzed UI component")
            selectors_raw = item.get("selectors")
            selectors = [str(s) for s in selectors_raw] if isinstance(selectors_raw, list) else []
            result.append(ApplicationComponent(component_id=comp_id, name=name, type=c_type, file_path=file_path, description=desc, selectors=selectors))
        return result or fallback

    def _parse_flows(self, raw: Any, fallback: List[ApplicationFlow]) -> List[ApplicationFlow]:
        if not isinstance(raw, list):
            return fallback
        result = []
        for i, item in enumerate(raw[:4]):
            if not isinstance(item, dict):
                continue
            flow_id = str(item.get("flow_id") or f"flow_ai_{i+1}")
            name = str(item.get("name") or f"Discovered Flow {i+1}")
            start = str(item.get("start_point") or "/start")
            end = str(item.get("end_point") or "/end")
            desc = str(item.get("description") or "Discovered business process flow")
            steps_raw = item.get("steps")
            steps = [str(s) for s in steps_raw] if isinstance(steps_raw, list) else ["Step 1"]
            result.append(ApplicationFlow(flow_id=flow_id, name=name, start_point=start, end_point=end, steps=steps, description=desc))
        return result or fallback

    def _parse_gaps(self, raw: Any, fallback: List[RequirementGap]) -> List[RequirementGap]:
        if not isinstance(raw, list):
            return fallback
        result = []
        for i, item in enumerate(raw[:6]):
            if not isinstance(item, dict):
                continue
            gap_id = str(item.get("gap_id") or f"gap_ai_{i+1}")
            title = str(item.get("title") or f"Inferred Gap {i+1}")
            desc = str(item.get("description") or "Requirement contradiction or coverage gap")
            cat = str(item.get("category") or "RequirementWithoutCode")
            sev = str(item.get("severity") or "Medium")
            ev = str(item.get("evidence_source") or "Source static analysis")
            conf = str(item.get("confidence") or "High")
            result.append(RequirementGap(gap_id=gap_id, title=title, description=desc, category=cat, severity=sev, evidence_source=ev, confidence=conf))
        return result or fallback

    @staticmethod
    def _looks_like_key_failure(payload: Any) -> bool:
        """Detects auth rejections anywhere in nested routing diagnostics."""
        auth_codes = {"provider_key_missing", "provider_auth_failed", "provider_key_rejected"}
        if isinstance(payload, dict):
            if str(payload.get("error_code") or "") in auth_codes:
                return True
            if payload.get("status_code") in (401, 403):
                return True
            return any(UnderstandingAgent._looks_like_key_failure(value) for value in payload.values())
        if isinstance(payload, list):
            return any(UnderstandingAgent._looks_like_key_failure(item) for item in payload)
        return False

    @staticmethod
    def _safe_int(value: Any, default: int) -> int:
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    def _parse_api_inventory(self, raw: Any) -> APIInventory:
        """AI-derived endpoints only; reports an empty inventory instead of sample endpoints."""
        if not isinstance(raw, list):
            return APIInventory(total_endpoints=0, endpoints=[])

        endpoints: List[APIEndpointReference] = []
        for index, item in enumerate(raw):
            if not isinstance(item, dict):
                continue
            path = str(item.get("path") or "").strip()
            if not path:
                continue
            endpoints.append(APIEndpointReference(
                endpoint_id=str(item.get("endpoint_id") or f"api_{index + 1:02d}"),
                method=str(item.get("method") or "GET").strip().upper(),
                path=path,
                description=str(item.get("description") or "").strip(),
                source_file=str(item.get("source_file") or "").strip(),
                analysis_only=True,
            ))
        return APIInventory(total_endpoints=len(endpoints), endpoints=endpoints)

    def _parse_validation_report(self, raw: Any) -> Optional[RequirementValidationReport]:
        """Returns None when the model gave no assessment, so no fabricated score is displayed."""
        if not isinstance(raw, list) or not raw:
            return None

        valid_statuses = {"Present", "Partial", "Missing", "Not Applicable"}
        items: List[RequirementValidationItem] = []
        for index, item in enumerate(raw):
            if not isinstance(item, dict):
                continue
            item_name = str(item.get("item_name") or "").strip()
            status = str(item.get("status") or "").strip().title()
            if not item_name or status not in valid_statuses:
                continue
            items.append(RequirementValidationItem(
                item_id=self._safe_int(item.get("item_id"), index + 1),
                item_name=item_name,
                status=status,
                evidence_source=str(item.get("evidence_source") or "").strip(),
                confidence=str(item.get("confidence") or "Medium").strip(),
                observations=str(item.get("observations") or "").strip(),
            ))

        if not items:
            return None

        present = sum(1 for i in items if i.status == "Present")
        partial = sum(1 for i in items if i.status == "Partial")
        missing = sum(1 for i in items if i.status == "Missing")
        not_applicable = sum(1 for i in items if i.status == "Not Applicable")
        scored = len(items) - not_applicable
        quality_score = round(((present + 0.5 * partial) / scored) * 100.0, 1) if scored else 0.0

        return RequirementValidationReport(
            quality_score_percentage=quality_score,
            evaluated_items_count=len(items),
            present_count=present,
            partial_count=partial,
            missing_count=missing,
            not_applicable_count=not_applicable,
            items=items,
        )

    def _build_ui_inventory_from_components(self, components: List[ApplicationComponent], fallback: UIInventory) -> UIInventory:
        controls: List[UIElementControl] = []
        idx = 1
        for comp in components:
            for sel in comp.selectors:
                c_type = "text_field" if "input" in sel else "button" if "button" in sel else "select" if "select" in sel else "upload_control" if "upload" in sel else "link"
                controls.append(UIElementControl(
                    control_id=f"ui_ai_{idx:02d}",
                    control_type=c_type,
                    name=f"{comp.name} Locator",
                    selector=sel,
                    page_route="/" + comp.file_path.split("/")[-1].replace(".tsx", "").lower()
                ))
                idx += 1
        if not controls:
            return fallback
        counts: Dict[str, int] = {}
        for c in controls:
            counts[c.control_type] = counts.get(c.control_type, 0) + 1
        return UIInventory(total_controls=len(controls), controls=controls, controls_by_type=counts)

    def _save_artifacts(
        self,
        understanding: ApplicationUnderstanding,
        validation: Optional[RequirementValidationReport],
        gaps: List[RequirementGap],
        components: List[ApplicationComponent],
        ui: UIInventory,
        api: APIInventory
    ) -> None:
        artifacts_map = {
            "application_understanding.json": understanding.model_dump(),
            "requirements_validation.json": validation.model_dump() if validation else None,
            "requirements_gaps.json": [g.model_dump() for g in gaps],
            "module_inventory.json": [c.model_dump() for c in components],
            "ui_inventory.json": ui.model_dump(),
            "api_inventory.json": api.model_dump()
        }

        for filename, data in artifacts_map.items():
            path = self.artifact_dir / filename
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            logger.info(f"Saved Phase 2 artifact: {path}")
