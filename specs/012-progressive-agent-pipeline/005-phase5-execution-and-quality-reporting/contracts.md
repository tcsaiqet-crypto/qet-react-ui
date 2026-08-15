# Contracts 005: Phase 5 Execution & Report Contracts

## 1. Backend Schemas (Pydantic)

```python
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

class TestExecutionResult(BaseModel):
    case_id: str
    status: Literal["PASSED", "FAILED", "SKIPPED", "BLOCKED"]
    duration_ms: int
    error_message: Optional[str] = None
    screenshot_path: Optional[str] = None
    dom_snapshot_path: Optional[str] = None

class QualityReport(BaseModel):
    report_id: str
    total_tests: int
    passed_count: int
    failed_count: int
    skipped_count: int
    pass_rate_percentage: float
    overall_quality_score: float
    signoff_recommendation: Literal["GO", "NO_GO", "CONDITIONAL_GO"]
    results: List[TestExecutionResult]
    provenance: Dict[str, Any] = Field(default_factory=dict)
```

## 2. Frontend TypeScript Interfaces

```typescript
export type ExecutionStatus = 'PASSED' | 'FAILED' | 'SKIPPED' | 'BLOCKED';
export type SignoffRecommendation = 'GO' | 'NO_GO' | 'CONDITIONAL_GO';

export interface TestExecutionResult {
  case_id: string;
  status: ExecutionStatus;
  duration_ms: number;
  error_message?: string;
  screenshot_path?: string;
  dom_snapshot_path?: string;
}

export interface QualityReport {
  report_id: string;
  total_tests: number;
  passed_count: number;
  failed_count: number;
  skipped_count: number;
  pass_rate_percentage: number;
  overall_quality_score: number;
  signoff_recommendation: SignoffRecommendation;
  results: TestExecutionResult[];
}
```
