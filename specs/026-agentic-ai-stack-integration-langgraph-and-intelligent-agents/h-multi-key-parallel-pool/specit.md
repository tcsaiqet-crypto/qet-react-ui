# Specit H — Multi-Key Parallel API Pool & Failover Engine
## Feature: Parallel Key Dispatch, Failover Chain, Budget Tracking

**Spec**: 026-H  
**Subfolder**: `h-multi-key-parallel-pool`  
**Priority**: 🔴 Critical — Required by Specit C (batch generation)  
**Depends On**: Specit B (Model Router)  
**Required By**: Specit C (Agent 2b), all other agents that use AI calls  

---

## 1. What This Feature Is

The engine that makes multiple Gemini/GPT API keys work together efficiently:
1. **Parallel Dispatch**: For Agent 2b, use N keys simultaneously for N batches
2. **Immediate Failover**: 429/timeout → next key in under 100ms
3. **Key State Tracking**: Track exhausted keys per run (not globally)
4. **Cross-Provider Fallback**: Flash → Flash Lite → Pro → GPT if all Gemini keys fail
5. **Budget Tracking**: Count tokens per run, abort if budget exceeded

---

## 2. Current State

The existing `LLMService` in `llm_service.py` has:
- `_GEMINI_KEY_INDEX` — global integer that rotates keys one by one
- `_pick_key()` — picks the next key in round-robin
- No parallel dispatch capability
- No per-run key exhaustion tracking
- No cross-provider fallback

---

## 3. New `ParallelKeyPool` Class

### File: `backend/src/services/parallel_key_pool.py` (NEW)
```python
import random
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed, Future
from typing import List, Callable, TypeVar, Optional
from enum import Enum

T = TypeVar("T")

class KeyStatus(Enum):
    AVAILABLE = "available"
    EXHAUSTED = "exhausted"   # 429 or timeout in this run
    FAILED = "failed"         # Auth failure (401/403) — disable globally


class ParallelKeyPool:
    """
    Manages a pool of API keys across providers for parallel and failover dispatch.
    Key exhaustion is tracked per-run (run_id) — a key exhausted in run A is
    still available for run B.
    """

    def __init__(self, gemini_keys: List[str], openai_keys: List[str] = None):
        self._gemini_keys = gemini_keys
        self._openai_keys = openai_keys or []
        self._run_key_status: dict[str, dict[str, KeyStatus]] = {}  # run_id → key → status
        self._lock = threading.Lock()

    def get_parallel_keys(self, run_id: str, count: int) -> List[str]:
        """Pick `count` distinct available Gemini keys for parallel dispatch."""
        available = self._available_keys(run_id, self._gemini_keys)
        if len(available) < 1:
            raise NoKeysAvailableError("No Gemini keys available. Add more in AI Settings.")
        return random.sample(available, min(count, len(available)))

    def get_fallback_key(self, run_id: str, failed_key: str, provider: str = "gemini") -> Optional[str]:
        """Return the next available key after a failure, excluding the failed key."""
        keys = self._gemini_keys if provider == "gemini" else self._openai_keys
        available = [k for k in self._available_keys(run_id, keys) if k != failed_key]
        return available[0] if available else None

    def mark_exhausted(self, run_id: str, key: str):
        """Mark key as exhausted for this run (429/timeout)."""
        with self._lock:
            self._run_key_status.setdefault(run_id, {})[key] = KeyStatus.EXHAUSTED

    def mark_failed(self, run_id: str, key: str):
        """Mark key as globally failed (auth error)."""
        with self._lock:
            for status_map in self._run_key_status.values():
                status_map[key] = KeyStatus.FAILED

    def _available_keys(self, run_id: str, keys: List[str]) -> List[str]:
        run_status = self._run_key_status.get(run_id, {})
        return [k for k in keys if run_status.get(k, KeyStatus.AVAILABLE) == KeyStatus.AVAILABLE]
```

---

## 4. Parallel Batch Dispatch Engine

### File: `backend/src/services/parallel_dispatcher.py` (NEW)
```python
class ParallelBatchDispatcher:
    """
    Dispatches N work units in parallel using N different API keys.
    On 429/timeout: immediate failover to next available key.
    On all keys exhausted: cross-provider fallback to OpenAI.
    """

    def __init__(self, pool: ParallelKeyPool, router: QETModelRouter):
        self.pool = pool
        self.router = router

    def dispatch(
        self,
        run_id: str,
        batches: List[any],
        worker_fn: Callable[[any, str], any],  # (batch_data, api_key) → result
        task_name: str,
    ) -> List[any]:
        """
        Dispatch all batches in parallel. Each batch gets its own key.
        Returns results in input order (not completion order).
        """
        n = len(batches)
        keys = self.pool.get_parallel_keys(run_id, n)
        results = [None] * n

        def run_batch(idx: int, batch_data: any, key: str) -> tuple[int, any]:
            try:
                result = worker_fn(batch_data, key)
                return idx, result
            except RateLimitError:
                self.pool.mark_exhausted(run_id, key)
                fallback = self.pool.get_fallback_key(run_id, key)
                if fallback:
                    return idx, worker_fn(batch_data, fallback)
                raise NoKeysAvailableError(f"All keys exhausted for batch {idx}")
            except TimeoutError:
                self.pool.mark_exhausted(run_id, key)
                fallback = self.pool.get_fallback_key(run_id, key)
                if fallback:
                    return idx, worker_fn(batch_data, fallback)
                raise

        with ThreadPoolExecutor(max_workers=n) as executor:
            futures: List[Future] = [
                executor.submit(run_batch, i, batches[i], keys[i % len(keys)])
                for i in range(n)
            ]
            for future in as_completed(futures):
                idx, result = future.result()
                results[idx] = result

        return results
```

---

## 5. Cross-Provider Fallback Chain

When ALL Gemini keys are exhausted for a run, the system falls back to OpenAI:

```
Gemini Flash (Key 1)
    ↓ 429
Gemini Flash (Key 2)
    ↓ 429
Gemini Flash (Key 3..N)
    ↓ all exhausted
Gemini Flash Lite (Key 1)
    ↓ 429
    ... (Flash Lite keys)
Gemini Pro (Key 1)
    ↓ 429
OpenAI GPT-4o-mini (Key 1)
    ↓ 429
OpenAI GPT-4o (Key 1)
    ↓ all exhausted
→ Raise PipelineAbortError("No API keys available. Run cannot continue.")
```

### File: Update `backend/src/workflows/model_router.py`
```python
def get_chain_with_cross_provider_fallback(self, task_name: str, prompt, output_model) -> Runnable:
    primary = self._build_lcel_chain(task_name, "gemini", "flash", prompt, output_model)
    lite_fallback = self._build_lcel_chain(task_name, "gemini", "flash_lite", prompt, output_model)
    pro_fallback = self._build_lcel_chain(task_name, "gemini", "pro", prompt, output_model)
    gpt_mini_fallback = self._build_lcel_chain(task_name, "openai", "gpt-4o-mini", prompt, output_model)
    gpt_fallback = self._build_lcel_chain(task_name, "openai", "gpt-4o", prompt, output_model)
    return primary.with_fallbacks([lite_fallback, pro_fallback, gpt_mini_fallback, gpt_fallback])
```

---

## 6. Key Configuration & UI

### Backend Config
Keys are read from `backend/src/config.py`:
```python
class Config:
    @property
    def gemini_keys(self) -> List[str]:
        # Read comma-separated from env var
        raw = os.getenv("GEMINI_API_KEYS", os.getenv("GEMINI_API_KEY", ""))
        return [k.strip() for k in raw.split(",") if k.strip()]

    @property
    def openai_keys(self) -> List[str]:
        raw = os.getenv("OPENAI_API_KEYS", os.getenv("OPENAI_API_KEY", ""))
        return [k.strip() for k in raw.split(",") if k.strip()]
```

### Minimum Key Requirements
```python
def validate_key_pool():
    keys = config.gemini_keys
    if len(keys) < 2:
        raise ConfigurationError(
            "Minimum 2 Gemini API keys required for parallel batch generation. "
            "Set GEMINI_API_KEYS=key1,key2,... in your .env file."
        )
```

### AI Settings UI (Frontend)
```typescript
// Existing AI Settings panel — add key count display
<KeyPoolStatus>
  <KeyCount label="Gemini Keys" count={geminiKeyCount} minimum={2} />
  <KeyCount label="OpenAI Keys (fallback)" count={openaiKeyCount} minimum={0} />
  <ParallelCapacity label="Max Parallel Batches" value={Math.min(geminiKeyCount, 5)} />
</KeyPoolStatus>
```

---

## 7. Token Budget Tracking Per Run

### File: `backend/src/workflows/token_budget.py` (NEW)
```python
class RunTokenBudget:
    """Tracks cumulative token usage per run and enforces budget limit."""

    SOFT_LIMIT = 20_000   # Warn
    HARD_LIMIT = 35_000   # Abort

    def __init__(self, run_id: str):
        self.run_id = run_id
        self.total_tokens = 0
        self._lock = threading.Lock()

    def record(self, prompt_tokens: int, completion_tokens: int, task_name: str):
        with self._lock:
            self.total_tokens += prompt_tokens + completion_tokens
            if self.total_tokens > self.HARD_LIMIT:
                raise TokenBudgetExceededException(
                    f"Run {self.run_id} exceeded hard token limit of {self.HARD_LIMIT}. "
                    f"Used: {self.total_tokens}. Last task: {task_name}."
                )
            if self.total_tokens > self.SOFT_LIMIT:
                logger.warning(f"Run {self.run_id} approaching token budget: {self.total_tokens}/{self.HARD_LIMIT}")

    def summary(self) -> dict:
        return {
            "run_id": self.run_id,
            "total_tokens": self.total_tokens,
            "soft_limit": self.SOFT_LIMIT,
            "hard_limit": self.HARD_LIMIT,
            "budget_used_pct": round(self.total_tokens / self.HARD_LIMIT * 100, 1),
        }
```

---

## 8. Key Usage Log in Provenance

Every AI call logs which key was used and token count to `AppState.provenance`:
```json
{
  "ai_calls": [
    {"task": "brd_extraction", "key_index": 2, "model": "gemini-flash", "tokens": 4821, "success": true},
    {"task": "batch_generation_0", "key_index": 0, "model": "gemini-flash", "tokens": 2340, "success": false, "error": "429"},
    {"task": "batch_generation_0", "key_index": 3, "model": "gemini-flash", "tokens": 2380, "success": true, "fallback": true}
  ]
}
```

---

## 9. Acceptance Criteria

- [ ] `ParallelKeyPool.get_parallel_keys(run_id, 5)` returns 5 different keys (or all available if < 5)
- [ ] 429 error on key K causes immediate retry with next key — total latency added < 500ms
- [ ] Exhausted keys in run A are still available for run B
- [ ] Auth failure (401) disables key across all runs (marks as FAILED)
- [ ] When all Gemini keys exhausted, fallback to OpenAI GPT-4o-mini automatically
- [ ] `TokenBudgetCallback` raises `TokenBudgetExceededException` at 35,001 tokens
- [ ] Warning logged at 20,001 tokens
- [ ] AI Settings UI shows current key count and parallel batch capacity
- [ ] `provenance.ai_calls` log written to artifacts after each run

---

## 10. Missing / Open Questions

- [ ] Should exhausted keys be restored after 60 seconds (rate limit cooldown) for the same run?
- [ ] Should the UI show a live key health status (green/red per key) during execution?
- [ ] How should we handle the case where only 1 key is available? (Proposed: sequential generation, show UI warning about reduced parallelism)
