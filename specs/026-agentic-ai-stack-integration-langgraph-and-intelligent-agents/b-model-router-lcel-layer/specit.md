# Specit B — Model Router & LangChain LCEL Layer
## Feature: Hierarchical Model Routing + Structured AI Call Chains

**Spec**: 026-B  
**Subfolder**: `b-model-router-lcel-layer`  
**Priority**: 🔴 Critical — Required by all AI-powered agents  
**Depends On**: Specit A (graph state exists)  
**Required By**: All features C through H  

---

## 1. What This Feature Is

A unified AI call layer that:
1. Routes every AI task to the correct model tier (Flash Lite → Flash → Pro) based on task complexity
2. Wraps every call in a LangChain LCEL chain with Pydantic structured output parsing and retry logic
3. Extends the existing `LLMService` and `AGENT_MODEL_POLICIES` to cover all 16 new task types

---

## 2. Current State

The existing `llm_service.py` has:
```python
AGENT_MODEL_POLICIES = {
    "default":       AgentModelPolicy("flash", None, 0.2, 8192),
    "understanding": AgentModelPolicy("flash", "pro", 0.2, 8192),
    "categorization":AgentModelPolicy("flash_lite", "flash", 0.1, 4000),
    "test_cases":    AgentModelPolicy("flash", "pro", 0.15, 8192),
}
```

This covers only 3 task types. With Spec 026, we need **16 additional task policies** across all 6 agents.

---

## 3. Components to Build

### 3.1 Extend `AGENT_MODEL_POLICIES`
**File**: `backend/src/services/llm_service.py` (extend existing dict)

```python
AGENT_MODEL_POLICIES = {
    # Existing
    "default":              AgentModelPolicy("flash", None,         0.20, 8192),
    "understanding":        AgentModelPolicy("flash", "pro",        0.20, 8192),
    "categorization":       AgentModelPolicy("flash_lite", "flash", 0.10, 4000),
    "test_cases":           AgentModelPolicy("flash", "pro",        0.15, 8192),

    # New: Agent 1
    "brd_extraction":       AgentModelPolicy("flash", "pro",        0.10, 8192),
    "ui_semantic_mapping":  AgentModelPolicy("flash_lite", "flash", 0.10, 4096),
    "traceability_mapping": AgentModelPolicy("flash_lite", "flash", 0.10, 4096),

    # New: Agent 2
    "coverage_planning":    AgentModelPolicy("flash_lite", "flash", 0.10, 4096),
    "batch_generation":     AgentModelPolicy("flash", "pro",        0.15, 8192),
    "alignment_critique":   AgentModelPolicy("flash_lite", "flash", 0.10, 2048),

    # New: Agent 3
    "schema_design":        AgentModelPolicy("flash_lite", "flash", 0.10, 2048),
    "data_population":      AgentModelPolicy("flash", None,         0.20, 4096),
    "boundary_inflation":   AgentModelPolicy("flash_lite", "flash", 0.10, 2048),

    # New: Agent 4
    "pom_generation":       AgentModelPolicy("flash", "pro",        0.10, 8192),
    "script_synthesis":     AgentModelPolicy("flash", "pro",        0.10, 8192),
    "script_healing":       AgentModelPolicy("flash_lite", "flash", 0.20, 4096),

    # New: Agent 5
    "risk_scoring":         AgentModelPolicy("flash_lite", None,    0.05, 2048),
    "log_annotation":       AgentModelPolicy("flash_lite", None,    0.20, 512),
    "screenshot_eval":      AgentModelPolicy("flash", None,         0.10, 2048),  # multimodal
    "failure_classify":     AgentModelPolicy("flash_lite", None,    0.05, 256),

    # New: Agent 6
    "exec_summary":         AgentModelPolicy("pro", None,           0.30, 4096),
    "root_cause":           AgentModelPolicy("flash", None,         0.20, 4096),
    "br_risk_heatmap":      AgentModelPolicy("flash_lite", "flash", 0.10, 2048),
    "next_step_advice":     AgentModelPolicy("flash", None,         0.25, 2048),
}
```

### 3.2 `QETModelRouter` Class
**File**: `backend/src/workflows/model_router.py` (NEW)

```python
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

class QETModelRouter:
    """
    Provides a ready-to-use LangChain ChatModel for any named task.
    Auto-selects model tier, temperature, and token limit from AGENT_MODEL_POLICIES.
    Falls back to escalation_tier if preferred tier fails.
    """

    def __init__(self, llm_service: LLMService):
        self._svc = llm_service

    def get_model(self, task_name: str) -> BaseChatModel:
        """Return the optimal LangChain model instance for this task."""
        policy = AGENT_MODEL_POLICIES.get(task_name, AGENT_MODEL_POLICIES["default"])
        key = self._svc._pick_key()  # existing key rotation
        return self._build_model(policy.preferred_tier, key, policy)

    def get_chain(self, task_name: str, prompt: ChatPromptTemplate, output_model: type) -> Runnable:
        """Return a full LCEL chain: prompt | model.with_structured_output(pydantic) with retry."""
        model = self.get_model(task_name)
        policy = AGENT_MODEL_POLICIES.get(task_name, AGENT_MODEL_POLICIES["default"])
        chain = prompt | model.with_structured_output(output_model)
        return chain.with_retry(stop_after_attempt=2)
```

### 3.3 LangChain LCEL Chain Patterns Reference
**File**: `backend/src/workflows/chain_patterns.py` (NEW — reference implementations)

```python
# Pattern 1: Standard structured output
chain = router.get_chain("coverage_planning", coverage_prompt, CoveragePlan)
result: CoveragePlan = chain.invoke({"requirements": state["requirements"]})

# Pattern 2: Multimodal (screenshot evaluation)
from langchain_core.messages import HumanMessage
msg = HumanMessage(content=[
    {"type": "text", "text": f"Expected: {expected_result}"},
    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_b64}"}}
])
result = model.invoke([msg])

# Pattern 3: Streaming (log annotation)
async for chunk in chain.astream({"log_lines": recent_lines}):
    await broadcaster.emit_annotation(chunk)

# Pattern 4: Fallback chain (Flash → Flash Lite → Pro)
chain_with_fallback = primary_chain.with_fallbacks([lite_chain, pro_chain])
```

### 3.4 Token Budget Callback
**File**: `backend/src/workflows/token_budget.py` (NEW)

```python
from langchain_core.callbacks import BaseCallbackHandler

class TokenBudgetCallback(BaseCallbackHandler):
    """Tracks cumulative tokens and raises error if budget exceeded."""

    def __init__(self, budget: int = 35_000):
        self.total_tokens = 0
        self.budget = budget

    def on_llm_end(self, response, **kwargs):
        usage = response.llm_output.get("token_usage", {})
        self.total_tokens += usage.get("total_tokens", 0)
        if self.total_tokens > self.budget:
            raise TokenBudgetExceededException(self.total_tokens, self.budget)
```

---

## 4. Pydantic Output Enforcement

Every AI call returns a Pydantic V2 model. The `with_structured_output()` method injects the JSON schema into the prompt automatically and raises `ValidationError` (triggering retry) on malformed responses.

```python
class TestCaseBatch(BaseModel):
    batch_id: str
    test_cases: List[AlignedTestCase]
    alignment_score: float = Field(ge=0.0, le=1.0)
    key_index_used: int

# The chain enforces this shape — no markdown, no wrapping JSON, exact fields
result: TestCaseBatch = chain.invoke(inputs)
assert isinstance(result, TestCaseBatch)  # Guaranteed
```

---

## 5. Key Routing in Multi-Key Pool

```python
class KeyAwareModelRouter(QETModelRouter):
    """Extended router that tracks key assignments per batch for parallel dispatch."""

    def get_model_for_batch(self, task_name: str, key_index: int) -> BaseChatModel:
        """Pick a specific key index for parallel batch execution."""
        policy = AGENT_MODEL_POLICIES[task_name]
        key = self._svc.gemini_keys[key_index % len(self._svc.gemini_keys)]
        return self._build_model(policy.preferred_tier, key, policy)
```

---

## 6. Dependencies

```
pip install langchain>=0.3.0 langchain-core langchain-google-genai langchain-openai
```

---

## 7. Acceptance Criteria

- [ ] All 24 task names in `AGENT_MODEL_POLICIES` map to correct model tier
- [ ] `QETModelRouter.get_chain()` returns a runnable chain for any task name
- [ ] Chain with `with_structured_output(Pydantic)` returns exact model instance — no raw string
- [ ] `TokenBudgetCallback` raises error after 35,000 tokens
- [ ] Retry fires once on `ValidationError` and succeeds on second attempt
- [ ] Flash Lite model is used for 9 task types (token savings verified via callback)

---

## 8. Validation Checklist

- [ ] `coverage_planning` → Flash Lite (NOT Flash or Pro)
- [ ] `exec_summary` → Pro (NOT Flash)
- [ ] `screenshot_eval` → Flash (multimodal capable, NOT Flash Lite)
- [ ] All `log_annotation` calls → max 512 output tokens (enforced by policy)
- [ ] No task calls an AI model without going through `QETModelRouter`
