# Specit A — LangGraph Pipeline Engine
## Feature: Core Stateful Orchestration Graph

**Spec**: 026-A  
**Subfolder**: `a-langgraph-pipeline-engine`  
**Priority**: 🔴 Critical — Foundation for all other features  
**Depends On**: Nothing (this is the base)  
**Required By**: All features B through H  

---

## 1. What This Feature Is

Replace the current sequential Python function call chain:
```python
# CURRENT — fragile, no state, no recovery
state = understanding_agent.run(state)
state = test_case_agent.run(state)
state = test_data_agent.run(state)
state = playwright_agent.run(state)
state = execution_engine.run(state)
state = report_agent.run(state)
```

With a **LangGraph StateGraph**:
```python
# TARGET — stateful, checkpointed, cyclic, resumable
app = workflow.compile(checkpointer=SqliteSaver(...))
result = app.invoke(initial_state, config={"configurable": {"thread_id": run_id}})
```

---

## 2. Why This Matters

| Problem Today | With LangGraph |
| :--- | :--- |
| If Agent 4 crashes, restart from Agent 1 | Resume from Agent 4 checkpoint |
| No cyclic critic loop possible | Critic → Generator → Critic loops built into graph edges |
| State mutation is uncontrolled | State is an immutable TypedDict snapshot per node |
| No visibility of which node is running | Node events stream to frontend via WebSocket |
| Agent failures silently corrupt state | Node errors are isolated; last good state is preserved |

---

## 3. Components to Build

### 3.1 `QETGraphState` TypedDict
**File**: `backend/src/workflows/graph_state.py`

The single shared state object. Every node reads from it and writes a partial dict back. Fields cover all 6 agent stages:
```python
class QETGraphState(TypedDict):
    run_id: str
    critique_iteration: int          # 0–3, managed by Critic node
    requirements: list               # BR-01 to BR-18 objects
    ui_inventory: dict
    traceability_matrix: list
    coverage_plan: dict
    test_case_batches: list
    alignment_report: dict
    final_test_suite: list
    data_schemas: dict
    synthetic_records: list
    pom_code: str
    playwright_scripts: list
    risk_scores: dict
    execution_results: dict
    failure_classifications: dict
    live_annotations: list
    screenshot_evidence: dict
    dashboard_intelligence: dict
```

### 3.2 Node Functions (one per agent stage)
**File**: `backend/src/workflows/langgraph_pipeline.py`

```python
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite import SqliteSaver

workflow = StateGraph(QETGraphState)

# Add nodes
workflow.add_node("understand",        run_understanding_node)
workflow.add_node("plan_coverage",     run_coverage_planner_node)
workflow.add_node("generate_batches",  run_batch_generator_node)
workflow.add_node("critique",          run_alignment_critic_node)
workflow.add_node("generate_data",     run_data_generator_node)
workflow.add_node("synthesize_scripts",run_script_synthesizer_node)
workflow.add_node("execute",           run_execution_node)
workflow.add_node("dashboard",         run_dashboard_node)

# Edges
workflow.set_entry_point("understand")
workflow.add_edge("understand",        "plan_coverage")
workflow.add_edge("plan_coverage",     "generate_batches")
workflow.add_edge("generate_batches",  "critique")

# Critic loop (cyclic edge)
workflow.add_conditional_edges(
    "critique",
    should_refine,
    {"refine": "generate_batches", "proceed": "generate_data"}
)
workflow.add_edge("generate_data",     "synthesize_scripts")
workflow.add_edge("synthesize_scripts","execute")
workflow.add_edge("execute",           "dashboard")
workflow.add_edge("dashboard",          END)

# Compile with checkpointer
checkpointer = SqliteSaver.from_conn_string("uploads/{run_id}/checkpoints.db")
app = workflow.compile(checkpointer=checkpointer)
```

### 3.3 Node Event Broadcaster
**File**: `backend/src/workflows/node_events.py`

```python
class NodeEventBroadcaster:
    """Emits structured events to the FastAPI WebSocket manager on each node transition."""

    async def on_node_start(self, node_id: str, state: QETGraphState): ...
    async def on_node_complete(self, node_id: str, state: QETGraphState, duration_ms: int): ...
    async def on_critic_reject(self, iteration: int, score: float, rejected_ids: list): ...
    async def on_checkpoint_saved(self, node_id: str, thread_id: str): ...
    async def on_error(self, node_id: str, error: Exception): ...
```

### 3.4 FastAPI Integration
**File**: `backend/src/api/fastapi_app.py` (update)

- Replace `_execute_pipeline_task()` to call `app.invoke()` (LangGraph)
- Add WebSocket endpoint `/api/v1/runs/{run_id}/pipeline/graph-events`
- Add `GET /api/v1/runs/{run_id}/pipeline/checkpoint` to return last completed node

---

## 4. Dependencies

```
pip install langgraph>=0.2.0 langgraph-checkpoint-sqlite
```

---

## 5. Acceptance Criteria

- [ ] Running `app.invoke(initial_state)` completes all 8 nodes without error
- [ ] SQLite checkpoint file written to `uploads/{run_id}/checkpoints.db`
- [ ] Killing backend mid-run and restarting resumes from last node
- [ ] WebSocket sends `node_start` and `node_complete` events for each node
- [ ] Critic loop executes max 3 times then always proceeds
- [ ] Frontend left rail highlights the active node in real-time

---

## 6. Risks

| Risk | Mitigation |
| :--- | :--- |
| LangGraph API breaking changes | Pin version `langgraph==0.2.x` in requirements |
| SQLite checkpoint locking under concurrent runs | Use separate `.db` file per `run_id` |
| Node function raises unhandled exception | Wrap each node body in `try/except` and emit `on_error` event |
