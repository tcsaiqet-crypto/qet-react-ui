from datetime import datetime, timezone
from uuid import uuid4
from src.models.schemas import AppState
from src.agents.understanding_agent import UnderstandingAgent
from src.agents.test_case_agent import TestCaseAgent
from src.agents.requirement_categorizer import RequirementCategorizer
from src.agents.accessibility_agent import AccessibilityAgent
from src.config import config
from src.agents.test_data_agent import TestDataAgent
from src.agents.playwright_agent import PlaywrightAgent
from src.agents.report_agent import ReportAgent
from src.utils.logger import logger


class SequentialQETPipeline:
    """Sequential Agent Execution Pipeline for QET MVP."""

    STAGE_LABELS = {
        "Understanding": "Understanding Agent",
        "Requirement Categorization": "Requirement Categorizer",
        "Accessibility": "Accessibility Agent",
        "Test Cases": "Test Case Agent",
        "Test Data": "Test Data Agent",
        "Playwright": "Playwright Agent",
        "Report": "Report Agent",
    }

    @property
    def STAGES(self):
        stages = ["Understanding"]
        if config.features.enable_requirement_categorization:
            stages.append("Requirement Categorization")
        if config.features.enable_accessibility_scanning:
            stages.append("Accessibility")
        stages.extend(["Test Cases", "Test Data", "Playwright", "Report"])
        return stages

    def __init__(self):
        self.understanding_agent = UnderstandingAgent()
        self.requirement_categorizer = RequirementCategorizer()
        self.accessibility_agent = AccessibilityAgent()
        self.test_case_agent = TestCaseAgent()
        self.test_data_agent = TestDataAgent()
        self.playwright_agent = PlaywrightAgent()
        self.report_agent = ReportAgent()

    def run(self, initial_state: AppState) -> AppState:
        """Run all 5 agents sequentially to process intake and produce execution outputs."""
        logger.info("Initiating Sequential QET Agent MVP Pipeline...")
        state = self.run_from(initial_state, "Understanding")
        logger.info("QET Agent MVP Pipeline executed successfully!")
        return state

    def run_from(self, state: AppState, start_stage: str) -> AppState:
        """Run pipeline from a specific stage to the end while respecting dependencies."""
        if start_stage not in self.STAGES:
            state.errors.append(f"Unknown stage '{start_stage}'")
            return state

        if not self._dependencies_satisfied(state, start_stage):
            state.errors.append(
                f"Cannot run from '{start_stage}' because required upstream outputs are missing. "
                "Please upload sources and complete prior stages first."
            )
            self._record_lifecycle_event(
                state,
                event_type="agent_failed",
                stage=start_stage,
                status="blocked",
                message=f"{self.STAGE_LABELS.get(start_stage, start_stage)} is blocked by missing upstream output",
                timestamp=datetime.now(timezone.utc).isoformat(),
            )
            return state

        for stage in self.STAGES[self.STAGES.index(start_stage):]:
            state = self._execute_stage(stage, state)
            if state.errors:
                logger.error("Pipeline stopped at %s: %s", stage, state.errors)
                return state
        return state

    def retry_stage(self, state: AppState, stage: str) -> AppState:
        """Retry selected stage and reset all downstream outputs before re-running."""
        if stage not in self.STAGES:
            state.errors.append(f"Unknown stage '{stage}'")
            return state

        state.reset_generation = (getattr(state, "reset_generation", 1) or 1) + 1
        self._reset_downstream_outputs(state, stage)
        state.errors = []
        return self.run_from(state, stage)

    def run_single_stage(self, state: AppState, stage: str) -> AppState:
        """Run only one selected stage with dependency checks and rerun-safe downstream reset."""
        if stage not in self.STAGES:
            state.errors.append(f"Unknown stage '{stage}'")
            return state

        if not self._dependencies_satisfied(state, stage):
            state.errors.append(
                f"Cannot run '{stage}' because required upstream outputs are missing. "
                "Please complete prior stages first."
            )
            self._record_lifecycle_event(
                state,
                event_type="agent_failed",
                stage=stage,
                status="blocked",
                message=f"{self.STAGE_LABELS.get(stage, stage)} is blocked by missing upstream output",
                timestamp=datetime.now(timezone.utc).isoformat(),
            )
            return state

        if self._has_stage_output(state, stage):
            self._reset_downstream_outputs(state, stage)

        state.errors = []
        return self._execute_stage(stage, state)

    def _dependencies_satisfied(self, state: AppState, stage: str) -> bool:
        if stage == "Understanding":
            return state.intake_manifest is not None
        if stage == "Requirement Categorization":
            return state.understanding is not None
        if stage == "Accessibility":
            return state.intake_manifest is not None
        if stage == "Test Cases":
            if config.features.enable_requirement_categorization:
                return state.understanding is not None and len(state.understanding.requirements) > 0
            return state.understanding is not None
        if stage == "Test Data":
            return state.test_suite is not None
        if stage == "Playwright":
            return state.synthetic_dataset is not None
        if stage == "Report":
            return state.playwright_scripts is not None and len(state.playwright_scripts) > 0
        return False

    def _execute_stage(self, stage: str, state: AppState) -> AppState:
        now_str = datetime.now(timezone.utc).isoformat()
        self._record_lifecycle_event(
            state,
            event_type="agent_entered",
            stage=stage,
            status="running",
            message=f"{self.STAGE_LABELS.get(stage, stage)} started",
            timestamp=now_str,
        )
        try:
            if not self._validate_stage_preconditions(stage, state):
                return state

            if stage == "Understanding":
                state = self.understanding_agent.run(state)
            elif stage == "Requirement Categorization":
                state = self.requirement_categorizer.run(state)
            elif stage == "Accessibility":
                state = self.accessibility_agent.run(state)
            elif stage == "Test Cases":
                state = self.test_case_agent.run(state)
            elif stage == "Test Data":
                state = self.test_data_agent.run(state)
            elif stage == "Playwright":
                state = self.playwright_agent.run(state)
            elif stage == "Report":
                state = self.report_agent.run(state)
            else:
                state.errors.append(f"Unknown stage '{stage}'")
                return state

            if not self._validate_stage_outputs(stage, state):
                state.stage_validation[stage] = "INVALID_OUTPUT"
                self._record_lifecycle_event(
                    state,
                    event_type="agent_failed",
                    stage=stage,
                    status="failed",
                    message=f"{self.STAGE_LABELS.get(stage, stage)} produced invalid output",
                    timestamp=datetime.now(timezone.utc).isoformat(),
                )
                return state

            state.stage_timestamps[stage] = now_str
            state.stage_validation[stage] = "VALIDATED"
            state.stage_provenance[stage] = self._extract_stage_provenance(stage, state)
            self._record_lifecycle_event(
                state,
                event_type="agent_completed",
                stage=stage,
                status="completed",
                message=f"{self.STAGE_LABELS.get(stage, stage)} completed",
                timestamp=datetime.now(timezone.utc).isoformat(),
            )
            return state
        except Exception as exc:
            state.stage_validation[stage] = "FAILED"
            state.errors.append(f"Stage '{stage}' failed: {exc}")
            self._record_lifecycle_event(
                state,
                event_type="agent_failed",
                stage=stage,
                status="failed",
                message=f"{self.STAGE_LABELS.get(stage, stage)} failed: {exc}",
                timestamp=datetime.now(timezone.utc).isoformat(),
            )
            return state

    def _record_lifecycle_event(
        self,
        state: AppState,
        event_type: str,
        stage: str,
        status: str,
        message: str,
        timestamp: str,
    ) -> None:
        """Persist the minimum event data needed to rebuild the UI after refresh."""
        generation = getattr(state, "reset_generation", 1) or 1
        state.agent_timeline.append({
            "event_id": str(uuid4()),
            "event_type": event_type,
            "agent_id": stage,
            "label": self.STAGE_LABELS.get(stage, stage),
            "subagent_id": None,
            "status": status,
            "generation": generation,
            "message": message,
            "timestamp": timestamp,
            "source": "backend.pipeline",
        })
        state.active_agent = stage if status == "running" else self._next_stage(stage)
        state.upcoming_agent = self._next_stage(stage)

    def _next_stage(self, stage: str) -> str | None:
        stages = self.STAGES
        try:
            next_index = stages.index(stage) + 1
        except ValueError:
            return None
        return stages[next_index] if next_index < len(stages) else None

    def _validate_stage_preconditions(self, stage: str, state: AppState) -> bool:
        if not self._dependencies_satisfied(state, stage):
            state.errors.append(f"Precondition failed for stage '{stage}'")
            self._record_lifecycle_event(
                state,
                event_type="agent_failed",
                stage=stage,
                status="blocked",
                message=f"{self.STAGE_LABELS.get(stage, stage)} is blocked by missing upstream output",
                timestamp=datetime.now(timezone.utc).isoformat(),
            )
            return False
        return True

    def _validate_stage_outputs(self, stage: str, state: AppState) -> bool:
        if stage == "Understanding":
            return state.understanding is not None and len(state.understanding.summary) > 0
        if stage == "Requirement Categorization":
            return state.understanding is not None and len(state.understanding.requirements) > 0
        if stage == "Accessibility":
            return state.accessibility_report is not None
        if stage == "Test Cases":
            return state.test_suite is not None and len(state.test_suite.test_cases) > 0
        if stage == "Test Data":
            return state.synthetic_dataset is not None and len(state.synthetic_dataset.records) > 0
        if stage == "Playwright":
            return state.playwright_scripts is not None and len(state.playwright_scripts) > 0
        if stage == "Report":
            return state.latest_report is not None
        return False

    def _extract_stage_provenance(self, stage: str, state: AppState) -> dict:
        if stage == "Understanding" and state.understanding:
            return getattr(state.understanding, "provenance", {}) or {"stage": "Understanding", "status": "COMPLETED"}
        if stage == "Requirement Categorization" and state.understanding:
            return {"stage": "Requirement Categorization", "count": len(state.understanding.requirements)}
        if stage == "Accessibility" and state.accessibility_report:
            return getattr(state.accessibility_report, "provenance", {}) or {"stage": "Accessibility", "status": "COMPLETED"}
        if stage == "Test Cases" and state.test_suite:
            return getattr(state.test_suite, "provenance", {}) or {"stage": "Test Cases", "status": "COMPLETED"}
        if stage == "Test Data" and state.synthetic_dataset:
            return getattr(state.synthetic_dataset, "provenance", {}) or {"stage": "Test Data", "status": "COMPLETED"}
        if stage == "Playwright" and state.playwright_scripts:
            return {"stage": "Playwright", "count": len(state.playwright_scripts)}
        if stage == "Report" and state.latest_report:
            return getattr(state.latest_report, "provenance", {}) or {"stage": "Report", "status": "COMPLETED"}
        return {"stage": stage, "status": "UNKNOWN"}

    def _reset_downstream_outputs(self, state: AppState, stage: str) -> None:
        idx = self.STAGES.index(stage)
        downstream = self.STAGES[idx:]

        if "Understanding" in downstream:
            state.understanding = None
        if "Requirement Categorization" in downstream:
            if state.understanding:
                state.understanding.requirements = []
                state.understanding.requirement_categories = []
        if "Accessibility" in downstream:
            state.accessibility_report = None
        if "Test Cases" in downstream:
            state.test_suite = None
        if "Test Data" in downstream:
            state.synthetic_dataset = None
        if "Playwright" in downstream:
            state.playwright_scripts = []
        if "Report" in downstream:
            state.latest_report = None

        for s in downstream:
            state.stage_timestamps.pop(s, None)
            state.stage_validation.pop(s, None)
            state.stage_provenance.pop(s, None)

        generation = getattr(state, "reset_generation", 1) or 1
        state.agent_timeline = [
            event for event in state.agent_timeline
            if event.get("generation") != generation or event.get("agent_id") not in downstream
        ]
        for invalidated_stage in downstream:
            state.agent_timeline.append({
                "event_id": str(uuid4()),
                "event_type": "downstream_invalidated",
                "agent_id": invalidated_stage,
                "label": self.STAGE_LABELS.get(invalidated_stage, invalidated_stage),
                "subagent_id": None,
                "status": "invalidated",
                "generation": generation,
                "message": f"{self.STAGE_LABELS.get(invalidated_stage, invalidated_stage)} invalidated for retry",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "source": "backend.pipeline",
            })

    def _has_stage_output(self, state: AppState, stage: str) -> bool:
        if stage == "Understanding":
            return state.understanding is not None
        if stage == "Requirement Categorization":
            return state.understanding is not None and len(state.understanding.requirements) > 0
        if stage == "Accessibility":
            return state.accessibility_report is not None
        if stage == "Test Cases":
            return state.test_suite is not None
        if stage == "Test Data":
            return state.synthetic_dataset is not None
        if stage == "Playwright":
            return len(state.playwright_scripts) > 0
        if stage == "Report":
            return state.latest_report is not None
        return False

