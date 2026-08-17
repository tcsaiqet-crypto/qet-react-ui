# Technical Stack: Spec 026 — How Everything Connects & Communicates

## 1. Full Stack Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          QET AGENTIC AI PLATFORM                                    │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                    REACT FRONTEND (Vite + TypeScript)                        │   │
│  │  ┌──────────────┐  ┌────────────────┐  ┌────────────────┐  ┌─────────────┐ │   │
│  │  │ AgentPipeline│  │ TestCase       │  │ Execute        │  │ Dashboard   │ │   │
│  │  │ Rail (Left)  │  │ Workspace      │  │ Workspace      │  │ Workspace   │ │   │
│  │  └──────┬───────┘  └───────┬────────┘  └───────┬────────┘  └──────┬──────┘ │   │
│  │         │                  │                    │                   │        │   │
│  │         └──────────────────┴────────────────────┴───────────────────┘        │   │
│  │                                       │                                       │   │
│  │                           WebSocket/SSE/REST API                             │   │
│  └───────────────────────────────────────┼───────────────────────────────────────┘  │
│                                          │                                          │
│  ┌───────────────────────────────────────▼───────────────────────────────────────┐  │
│  │                    FASTAPI BACKEND (Python 3.13)                               │  │
│  │                                                                               │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                  LANGGRAPH STATE GRAPH ENGINE                            │ │  │
│  │  │                                                                         │ │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │ │  │
│  │  │  │  Node 1  │→ │  Node 2  │→ │  Node 3  │→ │  Node 4  │→ │  Node 5 │  │ │  │
│  │  │  │Understanding│ TestCase │  │  Data    │  │  Script  │  │ Execute │  │ │  │
│  │  │  └──────────┘  └────┬─────┘  └──────────┘  └──────────┘  └────┬────┘  │ │  │
│  │  │                     │  ↑ (critic loop max 3x)                   │       │ │  │
│  │  │                     └──┘                                         ↓       │ │  │
│  │  │                                                           ┌──────────┐  │ │  │
│  │  │                                                           │  Node 6  │  │ │  │
│  │  │                                                           │Dashboard │  │ │  │
│  │  │                                                           └──────────┘  │ │  │
│  │  │  Shared QETGraphState ←─── All nodes read/write ────→                  │ │  │
│  │  │  + SQLite Checkpointer (crash-resumable)                               │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                               │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                     AI CALL LAYER (LangChain LCEL)                       │ │  │
│  │  │                                                                          │ │  │
│  │  │  PromptTemplate → ChatModel → PydanticOutputParser → Structured JSON     │ │  │
│  │  │  + Retry Logic (max 2 retries on parse failure)                          │ │  │
│  │  │  + LangChain RunnableWithFallbacks (Flash → Flash Lite → Pro → GPT)      │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                               │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                   MULTI-KEY PARALLEL POOL (Existing LLMService)          │ │  │
│  │  │                                                                          │ │  │
│  │  │  Key Pool: [Gemini Key 1..N] + [GPT Key 1..M]                           │ │  │
│  │  │  ThreadPoolExecutor → 5 batch calls in parallel → First-success wins     │ │  │
│  │  │  Failover: 429/timeout → next unused key immediately                     │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Framework Layer Responsibilities

### Layer 1: LangGraph (`langgraph`)
**Role**: Stateful directed graph orchestrator

```python
# Core structure
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite import SqliteSaver

workflow = StateGraph(QETGraphState)
workflow.add_node("understand", run_understanding_node)
workflow.add_node("plan_coverage", run_coverage_planner_node)
workflow.add_node("generate_batches", run_batch_generator_node)
workflow.add_node("critique_alignment", run_alignment_critic_node)
workflow.add_node("generate_data", run_data_generator_node)
workflow.add_node("synthesize_scripts", run_script_synthesizer_node)
workflow.add_node("execute_tests", run_execution_node)
workflow.add_node("generate_dashboard", run_dashboard_node)

# Conditional edges (the critic loop)
workflow.add_conditional_edges(
    "critique_alignment",
    should_refine,  # Returns "refine" or "proceed"
    {"refine": "generate_batches", "proceed": "generate_data"}
)

# Checkpointing
checkpointer = SqliteSaver.from_conn_string("uploads/checkpoints.db")
app = workflow.compile(checkpointer=checkpointer)
```

**What LangGraph provides:**
- State object (`QETGraphState`) is passed through all nodes automatically
- Each node reads what it needs and writes what it produces
- Checkpoints after every node — if server crashes at node 4, resume from node 4
- Conditional edges enable the critic loop without manual control flow

---

### Layer 2: LangChain LCEL (`langchain_core`)
**Role**: Structured AI call chains with retry and output parsing

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI

# Example: Agent 3a Schema Architect
schema_prompt = ChatPromptTemplate.from_template("""
You are a test data architect. Design a realistic synthetic data schema for this test case.

Test Case: {case_id} — {title}
Requirement: {requirement_id} — {requirement_title}
Test Type: {case_type}
Expected Result: {expected_result}

Return a JSON schema definition with field names, types, and constraints.
{format_instructions}
""")

# Pydantic model enforces exact output shape
parser = PydanticOutputParser(pydantic_object=DataSchema)

# LCEL chain with automatic retry
chain = schema_prompt | flash_lite_model | parser
chain_with_retry = chain.with_retry(stop_after_attempt=2)
```

**What LangChain LCEL provides:**
- `|` pipe operator composes prompt → model → parser in one clean chain
- `PydanticOutputParser` injects schema instructions into the prompt automatically
- `with_retry()` retries only on parse failures, not on model errors
- `RunnableWithFallbacks` routes Flash → Pro if Flash fails

---

### Layer 3: Pydantic V2 (Schema Enforcement)
**Role**: Zero-retry structured JSON — the model is forced to produce a valid object

```python
from pydantic import BaseModel, Field
from typing import List, Literal

class AlignedTestCase(BaseModel):
    case_id: str = Field(pattern=r"^TC-(POS|NEG|BND|VAL|ERR)-\d{3}$")
    title: str
    case_type: Literal["Positive", "Negative", "Boundary", "Validation", "Error-Handling"]
    requirement_id: str = Field(pattern=r"^BR-\d{2}$")
    feature_area: str
    priority: Literal["Critical", "High", "Medium", "Low"]
    preconditions: str
    steps: List[str]
    expected_result: str
    synthetic_data_keys: List[str]

class TestCaseBatch(BaseModel):
    batch_id: str
    test_cases: List[AlignedTestCase]
    alignment_score: float = Field(ge=0.0, le=1.0)
```

**What Pydantic provides:**
- Field-level validation with regex, range, and enum constraints
- If AI produces malformed JSON, Pydantic raises `ValidationError` → LCEL retry kicks in
- No partial/incomplete outputs accepted — the entire object must be valid

---

### Layer 4: Model Router
**Role**: Route each task to the appropriate model tier to minimize cost

```python
class QETModelRouter:
    """Routes each agent task to the optimal Gemini/GPT model based on complexity."""

    ROUTE_MAP = {
        # [task]              [model_tier]   [reason]
        "brd_extraction":     "flash",        # Text extraction, medium context
        "coverage_planning":  "flash_lite",   # Simple count + distribution math
        "batch_generation":   "flash",        # Test case synthesis, medium complexity
        "alignment_critique": "flash_lite",   # Binary classification task
        "schema_design":      "flash_lite",   # Short JSON schema output
        "data_population":    "flash",        # Realistic value generation
        "pom_generation":     "flash",        # Complex code writing
        "script_synthesis":   "flash",        # Complex code writing
        "script_healing":     "flash_lite",   # Targeted diff repair
        "risk_scoring":       "flash_lite",   # Short classification
        "log_annotation":     "flash_lite",   # Short 1-sentence annotation
        "screenshot_eval":    "flash",        # Multimodal vision required
        "failure_classify":   "flash_lite",   # Forced 5-bucket classification
        "exec_summary":       "pro",          # Leadership narrative quality
        "root_cause":         "flash",        # Medium analysis
        "br_risk_heatmap":    "flash_lite",   # Structured table output
        "next_step_advice":   "flash",        # Short recommendation list
    }
```

---

## 3. Data Flow — How State Moves Between Agents

```
┌─────────────────────────────────────────────────────────────────────┐
│                        QETGraphState                                 │
│                                                                     │
│  run_id: str                                                        │
│  uploaded_files: List[str]              ← Set by Agent 1 intake    │
│  codebase_snapshot: str                 ← Set by Agent 1 intake    │
│                                                                     │
│  requirements: List[BusinessRequirement] ← Set by Agent 1.1        │
│  understanding_summary: str              ← Set by Agent 1.3        │
│  ui_inventory: UIInventory               ← Set by Agent 1.2        │
│  traceability_matrix: dict               ← Set by Agent 1.3        │
│                                                                     │
│  coverage_plan: CoveragePlan             ← Set by Agent 2a         │
│  test_case_batches: List[TestCaseBatch]  ← Set by Agent 2b         │
│  alignment_evaluation: AlignmentReport   ← Set by Critic Node      │
│  critique_iteration: int                 ← Incremented by Critic   │
│  final_test_suite: List[AlignedTestCase] ← Set after critic pass   │
│                                                                     │
│  data_schemas: Dict[str, DataSchema]     ← Set by Agent 3a         │
│  synthetic_dataset: SyntheticDataset     ← Set by Agent 3b/3c      │
│                                                                     │
│  pom_code: str                           ← Set by Agent 4a         │
│  playwright_scripts: List[PlScript]      ← Set by Agent 4b         │
│                                                                     │
│  execution_results: ExecutionResults     ← Set by Agent 5          │
│  risk_scores: Dict[str, RiskScore]       ← Set by Agent 5a         │
│  failure_classifications: Dict[str, str] ← Set by Agent 5d         │
│                                                                     │
│  executive_summary: str                  ← Set by Agent 6a         │
│  root_cause_report: str                  ← Set by Agent 6b         │
│  br_risk_heatmap: Dict[str, str]         ← Set by Agent 6c         │
│  next_steps: List[str]                   ← Set by Agent 6d         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Communication Between Frontend & Backend

### 4.1 REST API Calls (Existing)
| Endpoint | Method | What It Does |
| :--- | :--- | :--- |
| `/api/v1/runs` | POST | Create a new LangGraph run, initialize state |
| `/api/v1/runs/{id}/pipeline/start` | POST | Trigger `workflow.invoke(initial_state)` |
| `/api/v1/runs/{id}` | GET | Fetch current state snapshot from DB |
| `/api/v1/runs/{id}/logs` | GET | Fetch backend log buffer |

### 4.2 Real-Time Streaming (WebSocket / SSE)
| Stream Type | Direction | What It Carries |
| :--- | :--- | :--- |
| LangGraph node events | Backend → Frontend | `{node: "critique_alignment", status: "running", iteration: 2}` |
| Log line streaming | Backend → Frontend | Raw Python log lines |
| Agent 5b Live Annotations | Backend → Frontend | `{type: "ai_annotation", message: "Step 4 timing issue suspected"}` |
| Agent 5c Screenshot Evidence | Backend → Frontend | `{case_id: "TC-NEG-001", confidence: 94, verdict: "Banner detected"}` |

### 4.3 New State Events for LangGraph Nodes
```typescript
// Frontend type additions needed
interface LangGraphNodeEvent {
  event_type: 'node_start' | 'node_complete' | 'critic_reject' | 'checkpoint_saved';
  node_id: string;
  node_label: string;
  iteration?: number;
  alignment_score?: number;
  timestamp: string;
}
```

---

## 5. API Key Pool Routing

```
Key Pool (from keys/ directory or AI Settings UI)
│
├── Gemini Keys: [K1, K2, K3, ... KN]
└── OpenAI Keys: [G1, G2]

Routing for Parallel Batch (Agent 2b):
  random.sample(gemini_keys, min(5, len(gemini_keys)))
  → Dispatch 5 batches simultaneously via ThreadPoolExecutor
  → If Ki fails (429/timeout): pick next available key from pool
  → Merge 5 batch results into state.test_case_batches

Failover Chain for Single Calls:
  Flash (Key 1) → Flash (Key 2) → Flash Lite (Key 1) → Pro (Key 1) → GPT
  Stop at first success. Log key_index + model + tier in AppState provenance.
```

---

## 6. File System Artifacts per Run

```
uploads/{run_id}/
├── documents/               ← Uploaded BRD files
├── codebase/                ← Extracted ZIP source
├── checkpoints.db           ← LangGraph SQLite checkpoint store
└── artifacts/
    ├── brd_extracted.json           ← Agent 1.1 output
    ├── ui_inventory.json            ← Agent 1.2 output
    ├── traceability_matrix.json     ← Agent 1.3 output
    ├── coverage_plan.json           ← Agent 2a output
    ├── test_cases_batch_1..5.json   ← Agent 2b output (5 files)
    ├── alignment_report.json        ← Critic node output
    ├── test_cases_final.json        ← Merged + validated suite
    ├── data_schemas.json            ← Agent 3a output
    ├── synthetic_test_data.json     ← Agent 3b/3c output
    ├── synthetic_test_data.csv      ← CSV export
    ├── playwright_output/
    │   ├── pages/cfa_pages.py       ← Agent 4a POM
    │   ├── tests/test_TC_*.py       ← Agent 4b scripts (1 per case)
    │   └── fixtures/conftest.py     ← Test fixtures
    ├── execution_results.json       ← Agent 5 raw results
    ├── risk_scores.json             ← Agent 5a output
    ├── failure_classifications.json ← Agent 5d output
    ├── ai_annotations.jsonl         ← Agent 5b streaming log
    ├── quality_report.html          ← Agent 6 HTML report
    └── quality_report.pdf           ← Agent 6 PDF report
```

---

## 7. LangGraph Checkpointing Behavior

| Scenario | Without Checkpoint | With Checkpoint |
| :--- | :--- | :--- |
| Server crash at Agent 4 | Restart entire 6-agent pipeline (~85k tokens) | Resume from Agent 4 (~10k tokens) |
| Rate limit on Agent 2b batch 3 | Fail entire generation | Retry batch 3 with different key |
| Critic rejects batch (iteration 1) | Agent must regenerate from scratch | State preserves critic feedback for Agent 2b to use |
| User retries from Dashboard | Full restart | Fast-forward to last successfully completed node |
