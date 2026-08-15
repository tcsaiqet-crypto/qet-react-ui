# Constitution: Logging Safety, Scoping, and Interruption Rules

## 1. Secrets Sanitization & Formatter Isolation
- All logger emitters must inherit from `SanitizedFormatter` in [logger.py](file:///d:/TcsQET/qet-react-ui/backend/src/utils/logger.py).
- API keys, credentials, and Authorization bearer tokens must be stripped/masked before any record hits stdout or `temp/run_{run_id}.log`.

## 2. Context Isolation
- Run logging must use `contextvars.ContextVar` to prevent cross-contamination between parallel execution runs.
- `current_run_id` must be set before agent execution commences and reset in a `finally` block or context manager.

## 3. Graceful Cancellation Invariants
- Cancelling a run must never corrupt or delete completed upstream artifacts (e.g. `test_cases.json`, `understanding_summary.json`).
- If an agent is mid-execution when cancellation is received, the current sub-step finishes safely, state transitions to `"stopped"`, and remaining stages are marked `"stopped"` or skipped.
