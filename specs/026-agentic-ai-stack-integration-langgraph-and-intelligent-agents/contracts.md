# Data Contracts: Spec 026 — Pydantic Models, Graph State, Node Signatures & API Contracts

## 1. LangGraph Graph State (`QETGraphState`)

```python
"""backend/src/workflows/graph_state.py"""

from __future__ import annotations
from typing import TypedDict, List, Dict, Optional, Annotated
from pydantic import BaseModel, Field
from typing import Literal


# ─────────────────────────────────────────────
# Domain Models: Agent 1 — Understanding
# ─────────────────────────────────────────────

class AcceptanceCriterion(BaseModel):
    criterion_id: str             # e.g. "AC-01-1"
    description: str
    verifiable: bool = True


class BusinessRequirement(BaseModel):
    requirement_id: str           # e.g. "BR-01"
    title: str                    # e.g. "Candidate Account Registration"
    description: str
    priority: Literal["Critical", "High", "Medium", "Low"]
    acceptance_criteria: List[AcceptanceCriterion]
    testability_score: float      # 0.0 – 1.0
    mapped_ui_selectors: List[str] = []
    mapped_api_endpoints: List[str] = []


class UISelector(BaseModel):
    name: str
    selector_value: str           # e.g. "#email-input", "[data-testid='login-btn']"
    selector_type: Literal["id", "testid", "role", "label", "css", "xpath"]
    page_route: str               # e.g. "/login"
    component_name: str           # e.g. "LoginForm"
    semantic_business_function: str  # e.g. "BR-01 Candidate Registration"


class UIInventory(BaseModel):
    selectors: List[UISelector]
    routes: List[str]
    form_groups: Dict[str, List[str]]  # form_name → [field_names]


class TraceabilityEntry(BaseModel):
    requirement_id: str
    selectors: List[str]
    api_endpoints: List[str]
    testability_score: float


# ─────────────────────────────────────────────
# Domain Models: Agent 2 — Test Case Generation
# ─────────────────────────────────────────────

class TestCaseBlueprint(BaseModel):
    case_id: str                  # e.g. "TC-POS-001"
    requirement_id: str           # e.g. "BR-01"
    case_type: Literal["Positive", "Negative", "Boundary", "Validation", "Error-Handling"]
    objective: str


class CoveragePlan(BaseModel):
    total_case_count: int
    distribution: Dict[str, int]  # e.g. {"Positive": 8, "Negative": 5, ...}
    blueprints: List[TestCaseBlueprint]
    br_coverage: Dict[str, List[str]]  # BR-XX → [case_ids]


class AlignedTestCase(BaseModel):
    case_id: str = Field(pattern=r"^TC-(POS|NEG|BND|VAL|ERR)-\d{3}$")
    title: str
    case_type: Literal["Positive", "Negative", "Boundary", "Validation", "Error-Handling"]
    requirement_id: str = Field(pattern=r"^BR-\d{2}$")
    feature_area: str
    priority: Literal["Critical", "High", "Medium", "Low"]
    preconditions: str
    steps: List[str] = Field(min_length=1)
    expected_result: str
    synthetic_data_keys: List[str]   # Keys to look up in SyntheticDataset


class TestCaseBatch(BaseModel):
    batch_id: str
    test_cases: List[AlignedTestCase]
    alignment_score: float = Field(ge=0.0, le=1.0)
    key_index_used: int              # Which API key was used


class AlignmentReport(BaseModel):
    iteration: int
    alignment_score: float
    total_cases: int
    valid_cases: int
    rejected_case_ids: List[str]
    rejection_reasons: Dict[str, str]  # case_id → reason
    critique_feedback: str             # Passed back to Agent 2b
    decision: Literal["refine", "proceed"]


# ─────────────────────────────────────────────
# Domain Models: Agent 3 — Data Generation
# ─────────────────────────────────────────────

class DataField(BaseModel):
    field_name: str
    field_type: Literal["string", "email", "date", "float", "int", "boolean", "card_pan", "passport_id", "phone"]
    description: str
    constraint: Optional[str] = None  # e.g. "Luhn-valid 16-digit", "YYYY-MM-DD", "min=0"
    is_boundary_sensitive: bool = False


class DataSchema(BaseModel):
    schema_id: str                    # Matches case_id
    requirement_id: str
    case_type: str
    fields: List[DataField]


class SyntheticRecord(BaseModel):
    record_id: str
    target_case_id: str
    is_synthetic: bool = True
    is_boundary: bool = False
    data: Dict[str, object]           # field_name → value


# ─────────────────────────────────────────────
# Domain Models: Agent 5 — Execution Intelligence
# ─────────────────────────────────────────────

class RiskScore(BaseModel):
    case_id: str
    risk_level: Literal["LOW", "MEDIUM", "HIGH"]
    reason: str
    selector_confidence: float       # 0.0 – 1.0
    data_completeness: float         # 0.0 – 1.0


class FailureClassification(BaseModel):
    case_id: str
    category: Literal[
        "selector_defect",
        "timing_issue",
        "application_defect",
        "data_mismatch",
        "environment_issue"
    ]
    confidence: float
    remediation_hint: str


class ScreenshotEvidence(BaseModel):
    case_id: str
    confidence_pct: float
    verdict: str
    detected_elements: List[str]
    matched_expected_result: bool


class LiveAnnotation(BaseModel):
    timestamp: str
    step_index: int
    raw_log_snippet: str
    plain_english_summary: str


# ─────────────────────────────────────────────
# Domain Models: Agent 6 — Dashboard Intelligence
# ─────────────────────────────────────────────

class BRRiskEntry(BaseModel):
    requirement_id: str
    risk_level: Literal["Low", "Medium", "High", "Critical"]
    test_cases_passed: int
    test_cases_failed: int
    coverage_percentage: float


class DashboardIntelligence(BaseModel):
    executive_summary: str           # 3-paragraph AI narrative
    root_cause_report: str           # Clustered failure analysis
    br_risk_heatmap: List[BRRiskEntry]
    next_steps: List[str]            # Top 3 recommendations
    risk_level: Literal["Low", "Medium", "High", "Critical"]


# ─────────────────────────────────────────────
# The Graph State — Shared Across All Nodes
# ─────────────────────────────────────────────

class QETGraphState(TypedDict):
    # Meta
    run_id: str
    critique_iteration: int          # Critic loop counter (max 3)

    # Agent 1 outputs
    requirements: List[BusinessRequirement]
    ui_inventory: UIInventory
    traceability_matrix: List[TraceabilityEntry]
    understanding_summary: str

    # Agent 2 outputs
    coverage_plan: CoveragePlan
    test_case_batches: List[TestCaseBatch]
    alignment_report: AlignmentReport
    final_test_suite: List[AlignedTestCase]

    # Agent 3 outputs
    data_schemas: Dict[str, DataSchema]       # case_id → schema
    synthetic_records: List[SyntheticRecord]

    # Agent 4 outputs
    pom_code: str
    playwright_scripts: List[Dict]            # Existing PlaywrightScript objects

    # Agent 5 outputs
    risk_scores: Dict[str, RiskScore]
    execution_results: Dict                   # Existing ExecutionResult objects
    failure_classifications: Dict[str, FailureClassification]
    live_annotations: List[LiveAnnotation]
    screenshot_evidence: Dict[str, ScreenshotEvidence]

    # Agent 6 outputs
    dashboard_intelligence: DashboardIntelligence
```

---

## 2. LangGraph Node Signatures

```python
"""Each node is a pure function: (state: QETGraphState) → partial QETGraphState"""

def run_understanding_node(state: QETGraphState) -> dict:
    """Runs Agents 1.1, 1.2, 1.3. Returns requirements, ui_inventory, traceability_matrix."""
    ...

def run_coverage_planner_node(state: QETGraphState) -> dict:
    """Runs Subagent 2a. Reads state.requirements. Returns coverage_plan."""
    ...

def run_batch_generator_node(state: QETGraphState) -> dict:
    """Runs Subagent 2b. Reads coverage_plan + critique_feedback. Returns test_case_batches."""
    ...

def run_alignment_critic_node(state: QETGraphState) -> dict:
    """Runs Critic. Returns alignment_report. Increments critique_iteration."""
    ...

def should_refine(state: QETGraphState) -> Literal["refine", "proceed"]:
    """Edge condition. Returns 'refine' if score < 0.90 and iteration < 3."""
    report = state["alignment_report"]
    iteration = state["critique_iteration"]
    if report["alignment_score"] < 0.90 and iteration < 3:
        return "refine"
    return "proceed"

def run_data_generator_node(state: QETGraphState) -> dict:
    """Runs Subagents 3a, 3b, 3c. Returns data_schemas + synthetic_records."""
    ...

def run_script_synthesizer_node(state: QETGraphState) -> dict:
    """Runs Subagents 4a, 4b. Returns pom_code + playwright_scripts."""
    ...

def run_execution_node(state: QETGraphState) -> dict:
    """Runs Agent 5 subagents + actual Playwright execution. Returns risk_scores,
    execution_results, failure_classifications, live_annotations, screenshot_evidence."""
    ...

def run_dashboard_node(state: QETGraphState) -> dict:
    """Runs Agent 6 subagents. Returns dashboard_intelligence."""
    ...
```

---

## 3. LangChain LCEL Chain Patterns

### Pattern A: Structured JSON Output (all generation tasks)
```python
chain = prompt_template | model.with_structured_output(PydanticModel)
result: PydanticModel = chain.invoke({"key": "value"})
```

### Pattern B: Retry on Parse Failure (Agent 2b, 4a, 4b)
```python
chain = (
    prompt_template
    | model
    | PydanticOutputParser(pydantic_object=AlignedTestCase)
).with_retry(stop_after_attempt=2)
```

### Pattern C: Multimodal (Agent 5c — Screenshot)
```python
from langchain_core.messages import HumanMessage
message = HumanMessage(content=[
    {"type": "text", "text": f"Expected result: {expected_result}"},
    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{screenshot_b64}"}}
])
response = flash_model.invoke([message])
evidence: ScreenshotEvidence = ScreenshotEvidence.model_validate_json(response.content)
```

### Pattern D: Parallel Batch Dispatch (Agent 2b)
```python
from concurrent.futures import ThreadPoolExecutor, as_completed

def dispatch_batch(batch_index: int, blueprint_slice: List[TestCaseBlueprint], key_index: int) -> TestCaseBatch:
    key = api_keys[key_index]
    model = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=key)
    chain = batch_gen_prompt | model.with_structured_output(TestCaseBatch)
    return chain.invoke({"blueprints": blueprint_slice, "feedback": critic_feedback})

with ThreadPoolExecutor(max_workers=5) as executor:
    futures = {
        executor.submit(dispatch_batch, i, slices[i], random_keys[i]): i
        for i in range(num_batches)
    }
    results = [future.result() for future in as_completed(futures)]
```

---

## 4. Frontend → Backend API Contracts (New Additions)

### WebSocket Events: LangGraph Node Progress

**Endpoint**: `ws://localhost:8080/api/v1/runs/{run_id}/pipeline/graph-events`

**Event shape from backend:**
```json
{
  "event_type": "node_start | node_complete | critic_reject | checkpoint_saved | error",
  "node_id": "run_alignment_critic_node",
  "node_label": "Alignment Critic",
  "timestamp": "2026-08-17T07:30:00Z",
  "payload": {
    "alignment_score": 0.76,
    "iteration": 2,
    "rejected_cases": ["TC-NEG-003"]
  }
}
```

**Frontend TypeScript type:**
```typescript
interface GraphNodeEvent {
  event_type: 'node_start' | 'node_complete' | 'critic_reject' | 'checkpoint_saved' | 'error';
  node_id: string;
  node_label: string;
  timestamp: string;
  payload?: Record<string, unknown>;
}
```

### REST: Get Graph Checkpoint State

**Endpoint**: `GET /api/v1/runs/{run_id}/pipeline/checkpoint`

**Response:**
```json
{
  "last_completed_node": "run_script_synthesizer_node",
  "critique_iteration": 1,
  "final_test_suite_count": 22,
  "alignment_score": 0.95,
  "checkpoint_timestamp": "2026-08-17T07:31:00Z"
}
```

---

## 5. AI Call Prompt Contracts

### Agent 2a — Coverage Planner Prompt

```
System: You are a senior QA architect specializing in CFA (Chartered Financial Analyst) digital platform testing.

Task: Given the following {requirement_count} business requirements, design a complete test coverage plan.

Requirements:
{requirements_json}

Rules:
- Every BR must have at least 1 Positive test case
- BR-04 (Payment), BR-08 (Proctoring), BR-10 (Score Reporting) require at least 2 Negative cases each
- Total case count should be between 20 and 30
- Distribution must include Positive, Negative, Boundary, Validation, Error-Handling types

Return a CoveragePlan JSON object.
```

### Agent 2b — Batch Generator Prompt

```
System: You are a QA test case writer specializing in CFA digital journey testing.

Task: Write {batch_size} complete test cases from the following blueprints.

Blueprints: {blueprints_json}
Previous Critique Feedback (if any): {critique_feedback}

Rules:
- Every case_id must match regex: TC-(POS|NEG|BND|VAL|ERR)-\d{3}
- Every requirement_id must be one of: {valid_br_ids}
- Steps must be written as testable UI actions, not implementation details
- Never mention: SQLite, Streamlit, session tokens, internal database schemas

Return a TestCaseBatch JSON object with alignment_score.
```

### Agent 6a — Executive Summary Prompt

```
System: You are writing for CFA Institute QA leadership. Be concise, precise, and professional.

Task: Write a 3-paragraph executive summary of this automated QA test run.

Results: {execution_summary_json}
Run Date: {run_date}
Application: CFA Digital Candidate Journey Platform

Paragraph 1: What was tested (BR coverage scope).
Paragraph 2: Key findings (pass/fail with business impact framing).
Paragraph 3: Risk posture and recommended position.

Max 250 words total.
```
