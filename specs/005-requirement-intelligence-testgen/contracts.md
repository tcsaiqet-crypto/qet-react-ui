# Contracts 005: Requirement Intelligence Contracts

## 1. Categorization Schema (`backend/schemas/contracts.py`)

```python
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CategorizedRequirement(BaseModel):
    req_id: str
    title: str
    category: str
    priority: str
    acceptance_criteria: List[str] = Field(default_factory=list)
    linked_test_case_ids: List[str] = Field(default_factory=list)


class RequirementCoverageReport(BaseModel):
    total_requirements: int
    covered_requirements: int
    coverage_percentage: float
    category_distribution: Dict[str, int] = Field(default_factory=dict)
```
