# Contracts 002: Phase 2 Test Case Data Contracts

## 1. Backend Schemas (Pydantic)

```python
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

class TestCase(BaseModel):
    case_id: str
    title: str
    case_type: Literal["Positive", "Negative", "Boundary", "Validation", "Error-Handling", "Security"]
    feature_area: str
    requirement_id: str
    requirement_category_id: Optional[str] = None
    description: str
    preconditions: List[str] = Field(default_factory=list)
    steps: List[str] = Field(default_factory=list)
    expected_result: str
    priority: Literal["Critical", "High", "Medium", "Low"] = "Medium"
    risk_level: Literal["Critical", "High", "Medium", "Low"] = "Medium"
    automation_candidate: bool = True
    synthetic_data_keys: List[str] = Field(default_factory=list)
    evidence_source: str = "LLM-Assisted Generation"
    confidence: str = "High"
    review_status: str = "Validated"
    provenance: Dict[str, Any] = Field(default_factory=dict)
    validation_status: str = "VALIDATED"

class TestSuite(BaseModel):
    suite_id: str
    name: str
    description: str
    discipline: str = "ui"
    test_cases: List[TestCase]
    provenance: Dict[str, Any] = Field(default_factory=dict)
    validation_status: str = "VALIDATED"
```

## 2. Frontend TypeScript Interfaces

```typescript
export type CaseType = 'Positive' | 'Negative' | 'Boundary' | 'Validation' | 'Error-Handling' | 'Security';
export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface TestCase {
  case_id: string;
  title: string;
  case_type: CaseType;
  feature_area: string;
  requirement_id: string;
  description: string;
  preconditions: string[];
  steps: string[];
  expected_result: string;
  priority: PriorityLevel;
  risk_level: PriorityLevel;
  automation_candidate: boolean;
  synthetic_data_keys: string[];
  evidence_source: string;
  confidence: string;
  review_status: string;
}

export interface TestSuite {
  suite_id: string;
  name: string;
  description: string;
  discipline: string;
  test_cases: TestCase[];
  validation_status: string;
}
```
