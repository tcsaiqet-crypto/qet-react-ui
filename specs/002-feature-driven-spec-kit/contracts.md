# Contracts 002: Feature-Driven Schemas

## 1. Application Understanding (`backend/schemas/contracts.py`)

```python
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ApplicationUnderstanding(BaseModel):
    summary: str
    architecture_notes: str
    quality_score_percentage: float
    components: List[Dict[str, Any]] = Field(default_factory=list)
    flows: List[Dict[str, Any]] = Field(default_factory=list)
    entry_points: List[str] = Field(default_factory=list)
    gaps: List[Dict[str, Any]] = Field(default_factory=list)
    testability_observations: List[str] = Field(default_factory=list)
    provenance: Dict[str, Any] = Field(default_factory=dict)
    validation_status: str = "VALIDATED"
    fallback_used: bool = False
```
