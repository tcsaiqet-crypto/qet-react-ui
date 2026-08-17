# Specit C — Agent 2: Coverage Planner + Parallel Batch Generator + Alignment Critic
## Feature: Intelligent Test Case Generation Pipeline

**Spec**: 026-C  
**Subfolder**: `c-agent2-test-case-generation`  
**Priority**: 🔴 Critical  
**Depends On**: Specit A (LangGraph), Specit B (Model Router)  
**Required By**: Specit D (Data), Specit E (Scripts)  

---

## 1. What This Feature Is

The complete redesign of test case generation as three coordinated subagents:

- **Subagent 2a — Coverage Planner**: AI decides WHAT test cases are needed and HOW MANY based on all 18 BRs
- **Subagent 2b — Parallel Batch Generator**: AI generates batches of 5 test cases simultaneously using parallel API keys
- **Alignment Critic Node**: AI audits every generated batch against BR alignment rules and either approves or sends back for regeneration

---

## 2. Current State vs Target

| Aspect | Current | Target |
| :--- | :--- | :--- |
| Planning | Hard-coded `max_cases=14` | AI decides per-BRD (range 20–30) |
| Generation | 1 API call, all cases at once | 5 parallel calls, 5 cases each |
| Key strategy | Single key, sequential | `random.sample(keys, 5)` in parallel |
| Alignment check | None | Automated critic with 3-cycle max loop |
| BR coverage | ~40% | 100% guaranteed |

---

## 3. Subagent 2a — Coverage Planner

### What It Does
Reads `state["requirements"]` (list of `BusinessRequirement` objects) and produces a `CoveragePlan` with:
- Total case count (AI determines, range 20–30)
- Distribution across types: Positive, Negative, Boundary, Validation, Error-Handling
- Per-BR blueprint: each BR gets at least 1 Positive case
- High-priority BRs (BR-04 Payment, BR-08 Proctoring, BR-10 Score Reporting) get extra Negative cases

### File: `backend/src/agents/coverage_planner_agent.py`
```python
class CoveragePlannerAgent:
    """Subagent 2a: Determines test case distribution from BRD."""

    def run(self, state: QETGraphState) -> dict:
        chain = self.router.get_chain("coverage_planning", COVERAGE_PLANNER_PROMPT, CoveragePlan)
        plan: CoveragePlan = chain.invoke({
            "requirements": [r.model_dump() for r in state["requirements"]],
            "requirement_count": len(state["requirements"]),
            "high_priority_brs": ["BR-04", "BR-08", "BR-10"],
        })
        return {"coverage_plan": plan}
```

### Prompt
```
You are a senior QA architect for CFA (Chartered Financial Analyst) digital platform testing.

Given {requirement_count} business requirements, design a complete test coverage plan.

Requirements: {requirements_json}

Rules:
- Every BR must have at least 1 Positive test case
- BR-04, BR-08, BR-10 require at least 2 Negative cases each
- Total case count: between 20 and 30
- Include all 5 types: Positive, Negative, Boundary, Validation, Error-Handling

Return a CoveragePlan with: total_case_count, distribution (dict), blueprints (list), br_coverage (dict).
```

---

## 4. Subagent 2b — Parallel Batch Generator

### What It Does
- Reads `CoveragePlan.blueprints`, partitions into batches of 5
- For N batches, selects `random.sample(keys, min(N, len(keys)))` — N different API keys
- Dispatches all N batches in parallel via `ThreadPoolExecutor(max_workers=N)`
- Each batch worker: if 429 or timeout → catch → pick next available key → retry once
- Merges all results into `state["test_case_batches"]`

### File: `backend/src/agents/batch_generator_agent.py`
```python
class BatchGeneratorAgent:
    """Subagent 2b: Generates test case batches in parallel using multiple API keys."""

    BATCH_SIZE = 5

    def run(self, state: QETGraphState) -> dict:
        plan = state["coverage_plan"]
        critic_feedback = state.get("alignment_report", {}).get("critique_feedback", "")
        blueprints = plan.blueprints
        slices = [blueprints[i:i+self.BATCH_SIZE] for i in range(0, len(blueprints), self.BATCH_SIZE)]
        n = len(slices)

        selected_keys = random.sample(self.key_pool, min(n, len(self.key_pool)))

        with ThreadPoolExecutor(max_workers=n) as executor:
            futures = {
                executor.submit(self._generate_batch, i, slices[i], selected_keys[i % len(selected_keys)], critic_feedback): i
                for i in range(n)
            }
            batches = []
            for future in as_completed(futures):
                batches.append(future.result())

        return {"test_case_batches": batches}

    def _generate_batch(self, batch_idx: int, blueprints: list, key: str, feedback: str) -> TestCaseBatch:
        try:
            chain = self._make_chain(key)
            return chain.invoke({"blueprints": blueprints, "feedback": feedback, "valid_br_ids": self.valid_br_ids})
        except (RateLimitError, TimeoutError):
            fallback_key = self._pick_fallback_key(key)
            chain = self._make_chain(fallback_key)
            return chain.invoke({"blueprints": blueprints, "feedback": feedback, "valid_br_ids": self.valid_br_ids})
```

### Key Selection Logic
```
Available keys: [K1, K2, K3, K4, K5, K6, K7]
Run with 5 batches:
  → random.sample([K1..K7], 5) = [K3, K7, K1, K4, K6]
  → Batch 0 uses K3, Batch 1 uses K7, ... Batch 4 uses K6
  → If K7 fails → pick next unused key from [K2, K5] → K2
```

---

## 5. Alignment Critic Node

### What It Does
Validates every test case against 5 rules. Computes `alignment_score = valid / total`. Routes to refine or proceed.

### Validation Rules
| Rule | Check | Rejection Message |
| :--- | :--- | :--- |
| R1 | `requirement_id` matches `BR-\d{2}` | "Missing or invalid BR reference" |
| R2 | `requirement_id` exists in `state["requirements"]` | "BR-XX not in uploaded requirements" |
| R3 | No forbidden terms in `steps` or `title` | "Technical implementation leak: '{term}' found" |
| R4 | `steps` has at least 2 entries | "Steps too sparse to be a valid test" |
| R5 | `expected_result` is non-empty | "No expected result defined" |

### File: `backend/src/agents/alignment_critic_agent.py`
```python
FORBIDDEN_TERMS = [
    "SQLite", "Streamlit", "session token", "ORM", "database schema",
    "pytest", "conftest", "FastAPI route", "uvicorn", "React component",
    "useState", "useEffect", "TypeScript interface", "Pydantic model", "LangGraph node"
]

class AlignmentCriticAgent:
    def run(self, state: QETGraphState) -> dict:
        all_cases = [tc for batch in state["test_case_batches"] for tc in batch.test_cases]
        valid_br_ids = {r.requirement_id for r in state["requirements"]}
        
        rejected, reasons = {}, {}
        for tc in all_cases:
            reason = self._validate(tc, valid_br_ids)
            if reason:
                rejected[tc.case_id] = reason
                reasons[tc.case_id] = reason

        score = (len(all_cases) - len(rejected)) / len(all_cases)
        iteration = state.get("critique_iteration", 0) + 1
        decision = "refine" if (score < 0.90 and iteration < 3) else "proceed"

        # Generate feedback text for Agent 2b on next iteration
        feedback = self._build_feedback(reasons) if decision == "refine" else ""

        return {
            "critique_iteration": iteration,
            "alignment_report": AlignmentReport(
                iteration=iteration, alignment_score=score,
                total_cases=len(all_cases), valid_cases=len(all_cases) - len(rejected),
                rejected_case_ids=list(rejected.keys()),
                rejection_reasons=reasons, critique_feedback=feedback,
                decision=decision
            )
        }
```

### LangGraph Conditional Edge
```python
def should_refine(state: QETGraphState) -> str:
    return state["alignment_report"]["decision"]

workflow.add_conditional_edges(
    "critique",
    should_refine,
    {"refine": "generate_batches", "proceed": "generate_data"}
)
```

---

## 6. Dependencies

```
pip install langchain langchain-google-genai
# Existing: concurrent.futures (stdlib)
```

---

## 7. Acceptance Criteria

- [ ] Agent 2a produces `CoveragePlan` with `total_case_count` between 20 and 30
- [ ] Every BR in `state["requirements"]` appears in `CoveragePlan.br_coverage`
- [ ] Agent 2b dispatches N batches in parallel (N = number of 5-case groups)
- [ ] Each batch uses a different API key
- [ ] 429/timeout failover fires correctly and produces a valid result
- [ ] Critic correctly rejects cases with missing `requirement_id`
- [ ] Critic loop terminates after 3 iterations maximum
- [ ] After critic pass, `alignment_score >= 0.90`
- [ ] All generated cases have `requirement_id` matching an uploaded BR

---

## 8. Missing / Open Questions

- [ ] Should the critic also use AI to score semantic quality (not just structural rules)? Or is rule-based sufficient?
- [ ] When critique_iteration hits 3 and score is still low, should we surface a warning in the UI or silently proceed?
- [ ] What is the max allowed case count? (Proposed: 30. Beyond this, token cost becomes uncontrolled.)
