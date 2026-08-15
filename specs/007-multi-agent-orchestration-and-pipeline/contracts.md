# Contracts 007: Pipeline Orchestration Contracts

## 1. Lifecycle Event Contract (`backend/schemas/contracts.py`)

```python
from typing import Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


class PipelineLifecycleEvent(BaseModel):
    event_id: str
    event_type: Literal[
        "pipeline_started",
        "agent_entered",
        "agent_completed",
        "agent_failed",
        "pipeline_paused",
        "pipeline_resumed",
        "pipeline_stopped",
        "downstream_invalidated"
    ]
    stage: str
    status: str
    message: str
    timestamp: str
    generation: int = 1
```

## 2. API Endpoints

- `POST /api/v1/runs/{run_id}/pipeline/start`: Run downstream pipeline after Understanding.
- `POST /api/v1/runs/{run_id}/pipeline/pause`: Pause pipeline cleanly before next stage.
- `POST /api/v1/runs/{run_id}/pipeline/resume`: Resume pipeline from paused stage.
- `POST /api/v1/runs/{run_id}/pipeline/stop`: Abort pipeline execution.
- `POST /api/v1/runs/{run_id}/retry`: Reset and retry a specific stage.
