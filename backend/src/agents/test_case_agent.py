"""Test Case Generation Specialist Agent — Phase 3 Implementation."""

import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any, Optional
from schemas.contracts import AppState, TestCase, TestSuite, RequirementType
from src.agents.base_agent import BaseAgent
from src.services.llm_service import LLMService
from src.prompts.test_cases_v2 import PROMPT_VERSION, build_prompt
from src.config import config
from src.utils.logger import logger


class TestCaseAgent(BaseAgent):
    """Specialist agent synthesizing positive, negative, boundary, validation, and error-handling test cases."""

    __test__ = False

    def __init__(self, run_id: str = "RUN-20260813-001"):
        super().__init__(agent_name="TestCaseAgent", description="Positive & Negative Test Suite Generator")
        self.run_id = run_id
        self.artifact_dir = Path("uploads") / run_id / "artifacts"
        self.artifact_dir.mkdir(parents=True, exist_ok=True)
        self.llm = LLMService()

    def run(self, state: AppState) -> AppState:
        """Execute Phase 3 Test Case Generation and save artifacts."""
        logger.info("Executing Phase 3 Test Case Generation Agent...")

        test_cases: List[TestCase] = []
        if self.llm.is_enabled():
            try:
                test_cases = self._generate_ai_test_cases(state)
            except Exception as e:
                logger.warning("AI test case generation error: %s. Using requirement-derived generator.", e)

        if not test_cases:
            logger.info("Deriving test cases from application understanding and requirements...")
            test_cases = self._generate_test_cases(state)

        provenance = {
            "generator": "TestCaseAgent",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "mode": "ai-first" if test_cases and self.llm.is_enabled() else "requirement-derived",
            "provider": self.llm._active_provider(),
            "model": (self.llm.last_generation or {}).get("model") or "gemini-2.5-flash",
            "prompt_version": PROMPT_VERSION,
            "fallback_used": bool((self.llm.last_generation or {}).get("fallback_used")),
        }

        suite = TestSuite(
            suite_id="TS-CFA-V1",
            name="CFA Digital Journey Comprehensive Test Suite",
            description="Positive, Negative, Boundary, Validation and Error-Handling scenarios mapped to CFA requirements.",
            test_cases=test_cases,
            provenance=provenance,
            validation_status="VALIDATED",
            fallback_used=bool((self.llm.last_generation or {}).get("fallback_used")),
        )

        state.test_suite = suite

        # Save Required Artifacts
        self._save_artifacts(test_cases)

        logger.info(f"Phase 3 Test Case Generation complete. Generated {len(test_cases)} test cases.")
        return state

    def _generate_ai_test_cases(self, state: AppState) -> List[TestCase]:
        """Generate AI-first cases in strict JSON shape."""
        if config.features.enable_requirement_categorization and state.understanding and state.understanding.requirements:
            req_details = [{"id": r.requirement_id, "title": r.title, "type": r.type, "category_id": r.category_id} for r in state.understanding.requirements]
            prompt = build_prompt("Categorized requirements", req_details, self.llm.JSON_OUTPUT_INSTRUCTION)
        else:
            understanding_text = state.understanding.summary if state.understanding else "CFA Digital Journey"
            feature_areas = []
            if state.understanding and state.understanding.components:
                feature_areas = [component.name for component in state.understanding.components[:5]]
            prompt = build_prompt("Application evidence", {"summary": understanding_text, "feature_areas": feature_areas}, self.llm.JSON_OUTPUT_INSTRUCTION)
            
        llm_text = self.llm.generate_text(prompt, profile="test_cases")
        llm_data, parse_diag = self.llm.parse_json_payload_with_diagnostics(llm_text)
        if not llm_data:
            if parse_diag:
                logger.warning("TestCaseAgent JSON parsing error: %s", parse_diag)
            return []

        raw_cases = llm_data.get("test_cases")
        if not isinstance(raw_cases, list):
            return []

        generated: List[TestCase] = []
        for item in raw_cases[:14]:
            if not isinstance(item, dict):
                continue
            try:
                case_type = str(item.get("case_type", "Validation"))
                feature_area = str(item.get("feature_area", "General"))
                requirement_id = str(item.get("requirement_id") or self._requirement_id_for_feature(feature_area))
                req_cat_id = str(item.get("requirement_category_id") or "")
                req_type = str(item.get("requirement_type") or "")
                steps = item.get("steps") if isinstance(item.get("steps"), list) else ["Execute generated scenario steps in automation harness."]
                preconditions = item.get("preconditions") if isinstance(item.get("preconditions"), list) else []
                synthetic_data_keys = item.get("synthetic_data_keys") if isinstance(item.get("synthetic_data_keys"), list) else self._default_synthetic_keys(case_type, feature_area)
                generated.append(
                    TestCase(
                        case_id=str(item.get("case_id", f"TC-AI-{len(generated)+1:03d}")),
                        title=str(item.get("title", "AI Generated Scenario")),
                        case_type=case_type,
                        feature_area=feature_area,
                        requirement_id=requirement_id,
                        requirement_category_id=req_cat_id or None,
                        requirement_type=req_type or None,
                        description=str(item.get("description", "Model-generated scenario.")),
                        expected_result=str(item.get("expected_result", "Expected behavior validated.")),
                        priority=str(item.get("priority", "Medium")),
                        risk_level=str(item.get("risk_level", "Medium")),
                        automation_candidate=bool(item.get("automation_candidate", True)),
                        preconditions=[str(x) for x in preconditions if str(x).strip()],
                        steps=[str(x) for x in steps if str(x).strip()],
                        evidence_source="LLM-Assisted Generation",
                        confidence=str(item.get("confidence", "Medium")),
                        review_status=str(item.get("review_status", "Requires Review")),
                        synthetic_data_keys=[str(x) for x in synthetic_data_keys if str(x).strip()],
                        provenance={"generator": "TestCaseAgent", "mode": "ai-first", "provider": self.llm._active_provider()},
                        upstream_ids=self._upstream_ids_for_feature(state, feature_area),
                        validation_status="VALIDATED",
                    )
                )
            except Exception:
                continue

        return generated

    def _generate_test_cases(self, state: Optional[AppState] = None) -> List[TestCase]:
        """Generate structured test cases from Understanding outputs instead of a fixed catalog."""
        understanding = state.understanding if state else None
        
        if config.features.enable_requirement_categorization and understanding and understanding.requirements:
            generated: List[TestCase] = []
            counters = {"Positive": 0, "Negative": 0, "Boundary": 0, "Validation": 0, "Error-Handling": 0}
            case_specs = [
                ("Positive", "happy path validates", True),
                ("Negative", "invalid inputs rejected safely", True),
                ("Boundary", "boundary cases handled correctly", True),
                ("Validation", "validation warnings checked", True),
                ("Error-Handling", "error recovery states tested", False),
            ]
            
            for idx, req in enumerate(understanding.requirements, start=1):
                for case_type, outcome, autocan in case_specs:
                    counters[case_type] += 1
                    case_id = f"TC-{self._case_type_prefix(case_type)}-{counters[case_type]:03d}"
                    
                    generated.append(TestCase(
                        case_id=case_id,
                        title=f"{req.title} - {case_type} Scenario",
                        case_type=case_type,
                        feature_area=req.category_id,
                        requirement_id=req.requirement_id,
                        requirement_category_id=req.category_id,
                        requirement_type=req.type.value if hasattr(req.type, "value") else str(req.type),
                        description=f"Verify requirement {req.requirement_id}: {req.description}",
                        expected_result=f"Verify {req.title.lower()} {outcome}.",
                        priority="High" if case_type in {"Positive", "Negative"} else "Medium",
                        risk_level="Medium",
                        automation_candidate=autocan,
                        preconditions=["System state initialized for requirement " + req.requirement_id],
                        steps=[f"Interact with controls mapped to requirement {req.requirement_id}.", "Perform " + case_type.lower() + " check."],
                        evidence_source=req.source_evidence,
                        confidence="High",
                        review_status="Approved" if case_type in {"Positive", "Negative"} else "Generated",
                        synthetic_data_keys=self._default_synthetic_keys(case_type, req.category_id),
                        provenance={"generator": "TestCaseAgent", "mode": "category-driven-fallback"},
                        upstream_ids=[req.requirement_id],
                        validation_status="VALIDATED"
                    ))
            return generated

        feature_sources = self._derive_feature_sources(understanding)
        case_specs = [
            ("Positive", "happy path behavior validates", True),
            ("Negative", "invalid input is rejected safely", True),
            ("Boundary", "boundary values are handled correctly", True),
            ("Validation", "required field and form validation rules are enforced", True),
            ("Error-Handling", "user-visible recovery behavior appears on failure", False),
        ]

        generated: List[TestCase] = []
        counters: Dict[str, int] = {"Positive": 0, "Negative": 0, "Boundary": 0, "Validation": 0, "Error-Handling": 0}

        for feature_index, feature in enumerate(feature_sources, start=1):
            for case_type, outcome_text, automation_candidate in case_specs:
                counters[case_type] += 1
                generated.append(
                    self._build_case(
                        understanding=understanding,
                        feature=feature,
                        feature_index=feature_index,
                        case_type=case_type,
                        ordinal=counters[case_type],
                        outcome_text=outcome_text,
                        automation_candidate=automation_candidate,
                    )
                )

        return generated

    def _derive_feature_sources(self, understanding: Any) -> List[Dict[str, Any]]:
        if understanding and getattr(understanding, "components", None):
            features: List[Dict[str, Any]] = []
            for component in understanding.components[:4]:
                features.append(
                    {
                        "name": component.name,
                        "area": self._normalize_feature_area(component.name),
                        "selectors": list(component.selectors),
                        "description": component.description,
                        "component_id": component.component_id,
                    }
                )
            return features

        # Default CFA Candidate Journey feature areas
        return [
            {"name": "Candidate Registration & Onboarding", "area": "Authentication", "selectors": ["[data-testid='cfa-register-form']"], "description": "BR-01 Guided digital registration", "component_id": "comp_reg"},
            {"name": "Identity Verification & KYC", "area": "Document Upload", "selectors": ["[data-testid='kyc-upload']"], "description": "BR-02 KYC verification", "component_id": "comp_kyc"},
            {"name": "Program & Exam Discovery", "area": "Applicant Info", "selectors": ["[data-testid='cfa-program-catalog']"], "description": "BR-03 CFA Level discovery", "component_id": "comp_disc"},
            {"name": "Enrollment & Payment Gateway", "area": "Application Status", "selectors": ["[data-testid='payment-gateway']"], "description": "BR-04 PCI-DSS fee payment", "component_id": "comp_pay"},
        ]

    def _build_case(
        self,
        understanding: Any,
        feature: Dict[str, Any],
        feature_index: int,
        case_type: str,
        ordinal: int,
        outcome_text: str,
        automation_candidate: bool,
    ) -> TestCase:
        feature_area = feature["area"]
        feature_name = feature["name"]
        selectors = feature["selectors"]
        requirement_id = self._requirement_id_for_feature(feature_area)
        case_id = f"TC-{self._case_type_prefix(case_type)}-{ordinal:03d}"
        title = f"{feature_name} {case_type} Scenario"
        preconditions = self._build_preconditions(feature_area, case_type)
        steps = self._build_steps(feature_name, feature_area, case_type, selectors)
        expected_result = f"Verify {feature_name.lower()} {outcome_text}."
        priority, risk_level = self._priority_and_risk(case_type, feature_area)
        review_status = "Requires Review" if case_type == "Error-Handling" else ("Approved" if case_type in {"Positive", "Negative"} else "Generated")
        evidence_source = feature.get("component_id", feature_name)
        upstream_ids = [feature.get("component_id", feature_name)]
        if understanding and getattr(understanding, "flows", None):
            upstream_ids.extend([flow.flow_id for flow in understanding.flows[:1]])

        return TestCase(
            case_id=case_id,
            title=title,
            case_type=case_type,
            feature_area=feature_area,
            requirement_id=requirement_id,
            description=f"Assess how {feature_name.lower()} behaves when the scenario is executed as a {case_type.lower()} check.",
            priority=priority,
            risk_level=risk_level,
            automation_candidate=automation_candidate,
            preconditions=preconditions,
            steps=steps,
            expected_result=expected_result,
            evidence_source=evidence_source,
            confidence="High" if case_type in {"Positive", "Negative"} else "Medium",
            review_status=review_status,
            synthetic_data_keys=self._default_synthetic_keys(case_type, feature_area),
            provenance={"generator": "TestCaseAgent", "mode": "derived-fallback"},
            upstream_ids=upstream_ids,
            validation_status="VALIDATED",
        )

    @staticmethod
    def _normalize_feature_area(name: str) -> str:
        lowered = name.lower()
        if "auth" in lowered or "login" in lowered or "register" in lowered:
            return "Authentication"
        if "document" in lowered or "upload" in lowered or "kyc" in lowered:
            return "Document Upload"
        if "status" in lowered or "payment" in lowered or "enroll" in lowered:
            return "Application Status"
        return "Applicant Info"

    @staticmethod
    def _case_type_prefix(case_type: str) -> str:
        return {
            "Positive": "POS",
            "Negative": "NEG",
            "Boundary": "BND",
            "Validation": "VAL",
            "Error-Handling": "ERR",
        }.get(case_type, "GEN")

    @staticmethod
    def _requirement_id_for_feature(feature_area: str) -> str:
        if feature_area == "Authentication":
            return "BR-01"
        if feature_area == "Document Upload":
            return "BR-02"
        if feature_area == "Application Status":
            return "BR-04"
        return "BR-03"

    @staticmethod
    def _default_synthetic_keys(case_type: str, feature_area: str) -> List[str]:
        keys = ["username", "password"] if feature_area == "Authentication" else ["full_name", "ssn", "employment_status"]
        if feature_area == "Document Upload":
            keys.extend(["document_file", "document_bytes"])
        return keys

    @staticmethod
    def _build_preconditions(feature_area: str, case_type: str) -> List[str]:
        preconditions = ["Application under test is accessible in the browser test harness."]
        if feature_area != "Authentication":
            preconditions.append("Candidate session state is established.")
        if case_type == "Boundary":
            preconditions.append("Boundary threshold inputs are prepared.")
        return preconditions

    @staticmethod
    def _build_steps(feature_name: str, feature_area: str, case_type: str, selectors: List[str]) -> List[str]:
        selector = selectors[0] if selectors else "#app-root"
        if case_type == "Positive":
            return [
                f"Navigate to {feature_name} section.",
                f"Populate valid candidate data into {selector}.",
                "Submit form and verify confirmation state.",
            ]
        if case_type == "Negative":
            return [
                f"Navigate to {feature_name} section.",
                f"Inject invalid or malformed data into {selector}.",
                "Attempt submission and assert field validation banner.",
            ]
        if case_type == "Boundary":
            return [
                f"Navigate to {feature_name} section.",
                f"Enter boundary test values into {selector}.",
                "Verify system accepts and processes boundary limits without truncation.",
            ]
        if case_type == "Validation":
            return [
                f"Navigate to {feature_name} section.",
                f"Leave required inputs blank on {selector}.",
                "Verify required validation messages are displayed.",
            ]
        return [
            f"Navigate to {feature_name} section.",
            "Simulate transient connection interrupt during payload transmission.",
            "Verify graceful recovery banner and retry interaction.",
        ]

    @staticmethod
    def _priority_and_risk(case_type: str, feature_area: str):
        if case_type in {"Positive", "Negative"}:
            return "High", "High"
        if case_type == "Boundary":
            return "High", "Medium"
        if case_type == "Validation":
            return "Medium", "Medium"
        return "Medium", "Low"

    def _upstream_ids_for_feature(self, state: AppState, feature_area: str) -> List[str]:
        if state.understanding and state.understanding.components:
            for comp in state.understanding.components:
                if self._normalize_feature_area(comp.name) == feature_area:
                    return [comp.component_id]
        return []

    def _save_artifacts(self, test_cases: List[TestCase]) -> None:
        """Save test_cases.json, test_cases.csv, and traceability_matrix.json inside run folder."""
        # 1. Save JSON
        json_path = self.artifact_dir / "test_cases.json"
        with open(json_path, "w", encoding="utf-8") as f:
            cases_dict = [case.model_dump() for case in test_cases]
            json.dump(cases_dict, f, indent=2)

        # 2. Save CSV
        csv_path = self.artifact_dir / "test_cases.csv"
        if test_cases:
            fieldnames = [
                "case_id", "title", "case_type", "feature_area", "requirement_id",
                "priority", "risk_level", "automation_candidate", "expected_result", "review_status"
            ]
            with open(csv_path, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
                writer.writeheader()
                for case in test_cases:
                    writer.writerow(case.model_dump())

        # 3. Save Traceability Matrix
        tm_path = self.artifact_dir / "traceability_matrix.json"
        with open(tm_path, "w", encoding="utf-8") as f:
            matrix = [{"case_id": c.case_id, "requirement_id": c.requirement_id} for c in test_cases]
            json.dump(matrix, f, indent=2)
