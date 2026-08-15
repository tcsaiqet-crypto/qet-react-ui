"""Typed Pydantic Contracts and Schemas for QET Agent Accelerator MVP."""

from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class ExecutionMode(str, Enum):
    PLAYWRIGHT_UI = "playwright_ui"
    URL_EXECUTION = "url_execution"
    API_TESTING = "api_testing"
    PERFORMANCE_TESTING = "performance_testing"
    ACCESSIBILITY_EXECUTION = "accessibility_execution"
    SECURITY_SCANNING = "security_scanning"


class ExecutionStatus(str, Enum):
    IDLE = "idle"
    QUEUED = "queued"
    RUNNING = "running"
    PAUSED = "paused"
    STOPPED = "stopped"
    PASSED = "passed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    TIMED_OUT = "timed_out"
    BLOCKED = "blocked"
    NOT_RUN = "not_run"
    NOT_CONFIGURED = "not_configured"


class FileMetadata(BaseModel):
    rel_path: str
    size_bytes: int
    extension: str
    is_binary: bool = False


class IntakeManifest(BaseModel):
    upload_id: str
    zip_filename: str
    extracted_path: str
    total_files: int
    total_size_bytes: int
    files: List[FileMetadata] = Field(default_factory=list)
    doc_files: List[str] = Field(default_factory=list)
    excluded_file_count: int = 0
    created_at: str


class ZipFileDecision(BaseModel):
    rel_path: str
    extension: str
    size_bytes: int
    decision: str
    reason: str
    source: str


class ZipProcessingSummary(BaseModel):
    total_members: int = 0
    included_count: int = 0
    excluded_count: int = 0
    reviewed_by_ai_count: int = 0
    current_step: str = "idle"
    decisions: List[ZipFileDecision] = Field(default_factory=list)


class RequirementValidationItem(BaseModel):
    item_id: int
    item_name: str
    status: str  # Present, Partial, Missing, Not Applicable
    evidence_source: str
    confidence: str = "High"
    observations: str = ""


class RequirementValidationReport(BaseModel):
    quality_score_percentage: float
    evaluated_items_count: int
    present_count: int
    partial_count: int
    missing_count: int
    not_applicable_count: int
    items: List[RequirementValidationItem] = Field(default_factory=list)


class RequirementGap(BaseModel):
    gap_id: str
    title: str
    description: str
    category: str  # CodeWithoutRequirement, RequirementWithoutCode, Contradiction
    severity: str  # High, Medium, Low
    evidence_source: str
    confidence: str = "High"


class UIElementControl(BaseModel):
    control_id: str
    control_type: str  # button, link, form, text_field, select, checkbox, table, modal, upload_control
    name: str
    selector: str
    page_route: str
    confidence: str = "High"


class UIInventory(BaseModel):
    total_controls: int
    controls: List[UIElementControl] = Field(default_factory=list)
    controls_by_type: Dict[str, int] = Field(default_factory=dict)


class APIEndpointReference(BaseModel):
    endpoint_id: str
    method: str
    path: str
    description: str
    source_file: str
    analysis_only: bool = True


class APIInventory(BaseModel):
    total_endpoints: int
    endpoints: List[APIEndpointReference] = Field(default_factory=list)


class ApplicationComponent(BaseModel):
    component_id: str
    name: str
    type: str
    file_path: str
    description: str
    selectors: List[str] = Field(default_factory=list)


class ApplicationFlow(BaseModel):
    flow_id: str
    name: str
    start_point: str
    end_point: str
    steps: List[str] = Field(default_factory=list)
    description: str


class RequirementType(str, Enum):
    Functional = "Functional"
    NonFunctional = "NonFunctional"
    Security = "Security"
    Performance = "Performance"
    Accessibility = "Accessibility"
    Reliability = "Reliability"
    Integration = "Integration"
    Compliance = "Compliance"
    DataQuality = "DataQuality"
    Usability = "Usability"
    Uncategorized = "Uncategorized"


class Requirement(BaseModel):
    requirement_id: str
    title: str
    description: str
    type: RequirementType
    category_id: str
    source_evidence: str
    confidence: str = "High"


class RequirementCategory(BaseModel):
    category_id: str
    name: str
    type: RequirementType
    description: str
    requirements: List[Requirement] = Field(default_factory=list)


class ApplicationUnderstanding(BaseModel):
    requirements: List[Requirement] = Field(default_factory=list)
    requirement_categories: List[RequirementCategory] = Field(default_factory=list)
    summary: str
    architecture_notes: str
    quality_score_percentage: float = 0.0
    components: List[ApplicationComponent] = Field(default_factory=list)
    flows: List[ApplicationFlow] = Field(default_factory=list)
    entry_points: List[str] = Field(default_factory=list)
    gaps: List[RequirementGap] = Field(default_factory=list)
    validation_report: Optional[RequirementValidationReport] = None
    ui_inventory: Optional[UIInventory] = None
    api_inventory: Optional[APIInventory] = None
    testability_observations: List[str] = Field(default_factory=list)
    provenance: Dict[str, Any] = Field(default_factory=dict)
    validation_status: str = "VALIDATED"
    fallback_used: bool = False


class TestCase(BaseModel):
    __test__ = False
    case_id: str
    title: str
    case_type: str = "Positive"  # Positive, Negative, Boundary, Validation, Error-Handling
    feature_area: str
    requirement_id: str = "REQ-001"
    description: str
    priority: str = "High"  # Critical, High, Medium, Low
    risk_level: str = "High"  # High, Medium, Low
    automation_candidate: bool = True
    preconditions: List[str] = Field(default_factory=list)
    steps: List[str] = Field(default_factory=list)
    expected_result: str
    evidence_source: str = "CFA_Requirements_Specification.md"
    confidence: str = "High"
    review_status: str = "Generated"  # Generated, Requires Review, Approved, Needs Revision
    synthetic_data_keys: List[str] = Field(default_factory=list)
    provenance: Dict[str, Any] = Field(default_factory=dict)
    upstream_ids: List[str] = Field(default_factory=list)
    validation_status: str = "VALIDATED"
    requirement_category_id: Optional[str] = None
    requirement_type: Optional[str] = None
    source_gap_id: Optional[str] = None


class TestSuite(BaseModel):
    __test__ = False
    suite_id: str
    name: str
    description: str
    test_cases: List[TestCase] = Field(default_factory=list)
    provenance: Dict[str, Any] = Field(default_factory=dict)
    validation_status: str = "VALIDATED"
    fallback_used: bool = False


class SyntheticDataset(BaseModel):
    dataset_id: str
    dataset_name: str
    data_schema: Dict[str, str]
    records: List[Dict[str, Any]] = Field(default_factory=list)
    test_case_id_mapping: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)
    is_synthetic: bool = True
    non_pii_disclaimer: str = "Strictly fictional synthetic data. No real PII, government IDs or secrets used."
    provenance: Dict[str, Any] = Field(default_factory=dict)
    upstream_case_ids: List[str] = Field(default_factory=list)
    validation_status: str = "VALIDATED"
    synthetic_only_validated: bool = True
    fallback_used: bool = False


class PlaywrightScript(BaseModel):
    script_id: str
    test_case_id: str
    filename: str
    code: str
    page_objects: List[str] = Field(default_factory=list)
    selectors_used: List[str] = Field(default_factory=list)
    uncertain_selectors: List[str] = Field(default_factory=list)
    provenance: Dict[str, Any] = Field(default_factory=dict)
    upstream_case_ids: List[str] = Field(default_factory=list)
    validation_status: str = "VALIDATED"
    selector_confidence_map: Dict[str, str] = Field(default_factory=dict)
    fallback_used: bool = False


class AccessibilityFinding(BaseModel):
    rule_id: str
    wcag_sc: str
    wcag_name: str
    impact: str
    description: str
    file_path: str
    line_number: int = 0
    snippet: str = ""


class AccessibilityRuleResult(BaseModel):
    rule_id: str
    wcag_sc: str
    wcag_name: str
    wcag_level: str
    impact: str
    passed: bool
    violation_count: int = 0


class AccessibilityReport(BaseModel):
    files_scanned: int = 0
    rules_total: int = 13
    rules_passed: int = 0
    rating: str = "Below A"
    total_violations: int = 0
    critical_count: int = 0
    serious_count: int = 0
    moderate_count: int = 0
    minor_count: int = 0
    rule_results: List[AccessibilityRuleResult] = Field(default_factory=list)
    findings: List[AccessibilityFinding] = Field(default_factory=list)
    engine: str = "static-rule-engine"
    generated_at: str = ""
    provenance: Dict[str, Any] = Field(default_factory=dict)


class ExecutionRequest(BaseModel):
    execution_id: str
    mode: ExecutionMode
    target_script_ids: List[str] = Field(default_factory=list)
    test_case_ids: List[str] = Field(default_factory=list)
    explicit_user_approval: bool = False
    is_non_production_confirmed: bool = False
    is_script_reviewed: bool = False


class ExecutionStatusResponse(BaseModel):
    execution_id: str
    run_id: str
    status: ExecutionStatus
    selected_test_case_ids: List[str] = Field(default_factory=list)
    current_test_case_id: Optional[str] = None
    current_step: Optional[str] = None
    logs: List[str] = Field(default_factory=list)
    result: Optional[ExecutionResult] = None


class TestStepResult(BaseModel):
    __test__ = False
    step_number: int
    description: str
    status: ExecutionStatus
    error_message: Optional[str] = None
    screenshot_path: Optional[str] = None


class ExecutionResult(BaseModel):
    execution_id: str
    mode: ExecutionMode
    status: ExecutionStatus
    duration_seconds: float
    passed_count: int
    failed_count: int
    blocked_count: int
    step_results: List[TestStepResult] = Field(default_factory=list)
    failure_summary: Optional[str] = None
    trace_file_path: Optional[str] = None
    execution_logs: List[str] = Field(default_factory=list)
    launcher_context: Dict[str, Any] = Field(default_factory=dict)
    evidence_paths: List[str] = Field(default_factory=list)
    base_url: Optional[str] = None
    provenance: Dict[str, Any] = Field(default_factory=dict)


class QualityReport(BaseModel):
    report_id: str
    timestamp: str
    total_scenarios: int
    passed: int
    failed: int
    blocked: int
    pass_rate_percentage: float
    risk_assessment: str
    failure_analyses: List[Dict[str, Any]] = Field(default_factory=list)
    html_report_path: Optional[str] = None
    pdf_report_path: Optional[str] = None
    evidence_references: List[str] = Field(default_factory=list)
    traceability_matrix: Dict[str, Any] = Field(default_factory=dict)
    provenance: Dict[str, Any] = Field(default_factory=dict)


class ScreenshotEvidence(BaseModel):
    filename: str
    url: str
    test_case_id: str
    case_type: str = "Positive"  # Positive, Negative, Boundary, Validation
    caption: str
    timestamp: str
    is_failure: bool = False


class TestStepExecutionDetail(BaseModel):
    __test__ = False
    step_number: int
    description: str
    status: str
    duration_ms: float = 0.0
    screenshot_path: Optional[str] = None
    error_message: Optional[str] = None


class ScriptExecutionDetail(BaseModel):
    __test__ = False
    script_id: str
    filename: str
    test_case_id: str
    title: str
    case_type: str = "Positive"
    feature_area: str = "General"
    status: str = "PASSED"
    duration_ms: float = 0.0
    why_passed: Optional[str] = None
    why_failed: Optional[str] = None
    failure_classification: Optional[str] = None
    root_cause_analysis: Optional[str] = None
    steps: List[TestStepExecutionDetail] = Field(default_factory=list)
    screenshots: List[ScreenshotEvidence] = Field(default_factory=list)
    execution_logs: List[str] = Field(default_factory=list)
    code_snippet: Optional[str] = None


class MultiLevelExecutionReport(BaseModel):
    run_id: str
    execution_id: str
    timestamp: str
    summary: Dict[str, Any] = Field(default_factory=dict)
    breakdown_by_case_type: Dict[str, Any] = Field(default_factory=dict)
    breakdown_by_feature_area: Dict[str, Any] = Field(default_factory=dict)
    scripts: List[ScriptExecutionDetail] = Field(default_factory=list)
    screenshots_gallery: List[ScreenshotEvidence] = Field(default_factory=list)
    overall_pass_rate_percentage: float = 0.0
    total_scripts_count: int = 0


class AITestCaseInsight(BaseModel):
    test_case_id: str
    title: str
    case_type: str
    status: str
    explanation: str
    root_cause: Optional[str] = None
    defect_category: Optional[str] = None
    recommended_fix: Optional[str] = None


class AITestAnalysisResult(BaseModel):
    analysis_id: str
    run_id: str
    timestamp: str
    overall_health_score: float
    test_success_rate: float
    executive_summary: str
    risk_level: str
    defect_distribution: Dict[str, int] = Field(default_factory=dict)
    test_case_insights: List[AITestCaseInsight] = Field(default_factory=list)
    key_recommendations: List[str] = Field(default_factory=list)


class AIScriptModificationRequest(BaseModel):
    script_filename: str
    test_case_id: str
    current_code: str
    failure_log: Optional[str] = None
    instruction: Optional[str] = None


class AIScriptModificationResponse(BaseModel):
    script_filename: str
    test_case_id: str
    original_code: str
    modified_code: str
    explanation: str
    diff_summary: str


class AppState(BaseModel):
    """Workflow state structure for one demo run."""
    run_id: str = "RUN-20260813-001"
    project_name: str = "CFA Digital Journey"
    intake_manifest: Optional[IntakeManifest] = None
    understanding: Optional[ApplicationUnderstanding] = None
    test_suite: Optional[TestSuite] = None
    synthetic_dataset: Optional[SyntheticDataset] = None
    playwright_scripts: List[PlaywrightScript] = Field(default_factory=list)
    last_execution_result: Optional[ExecutionResult] = None
    accessibility_report: Optional[AccessibilityReport] = None
    latest_report: Optional[QualityReport] = None
    errors: List[str] = Field(default_factory=list)
    stage_timestamps: Dict[str, str] = Field(default_factory=dict)
    stage_validation: Dict[str, str] = Field(default_factory=dict)
    stage_provenance: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    launcher_state: Dict[str, Any] = Field(default_factory=dict)
    execution_evidence_index: Dict[str, Any] = Field(default_factory=dict)
    status: str = "idle"
    progress: float = 0.0
    last_error: Optional[Dict[str, Any]] = None
    agent_timeline: List[Dict[str, Any]] = Field(default_factory=list)
    subagent_timeline: List[Dict[str, Any]] = Field(default_factory=list)
    active_agent: Optional[str] = None
    upcoming_agent: Optional[str] = None
    reset_generation: int = 1
    upload_summary_left: Optional[Dict[str, Any]] = None
    upload_summary_right: Optional[Dict[str, Any]] = None
    pipeline_control_state: str = "idle"
    paused_stage: Optional[str] = None
    latest_multi_level_results: Optional[Dict[str, Any]] = None
    ai_test_analysis: Optional[Dict[str, Any]] = None


