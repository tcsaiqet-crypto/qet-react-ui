# Phase 03: Understanding Lifecycle Contract (G3)
`/api/v1/runs/{id}/understanding` endpoint contract:
- Returns `status: "ready"` strictly when `state.understanding` is non-null and `state.status == "understanding_ready"`.
- Returns `status: "running"` during `ai_understanding_running` and `indexing`.
- Transparently relays error payloads and diagnostics during failures.
