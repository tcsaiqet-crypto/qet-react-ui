# Contracts 009: Deterministic Execution Contracts

## 1. Execution Evidence Schema (`backend/schemas/contracts.py`)

```python
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ExecutionEvidence(BaseModel):
    execution_id: str
    status: str
    duration_seconds: float
    passed_count: int
    failed_count: int
    blocked_count: int
    step_results: List[Dict[str, Any]] = Field(default_factory=list)
    failure_classification: Optional[str] = None
    failure_summary: Optional[str] = None
    execution_logs: List[str] = Field(default_factory=list)
```
