# Lifecycle Contract

## Canonical Order

```text
intake -> understanding -> requirement_categorization -> test_cases -> test_data -> playwright -> report
```

## Statuses

`pending`, `running`, `completed`, `failed`, `invalidated`, and `blocked` are distinct. `blocked` means a dependency is not satisfied; it is not a failure.

## Event Shape

```json
{
  "event_id": "uuid",
  "event_type": "agent_entered|agent_completed|agent_failed|subagent_started|subagent_completed|subagent_failed|agent_retry_requested|downstream_invalidated",
  "run_id": "RUN-...",
  "agent_id": "understanding",
  "subagent_id": null,
  "generation": 1,
  "message": "Human-readable current work",
  "timestamp": "ISO8601",
  "source": "backend.pipeline"
}
```

## Retry

Retrying stage N increments `generation`. All stages after N become `invalidated`, their outputs are removed from active state, and their old events remain only as historical evidence.
