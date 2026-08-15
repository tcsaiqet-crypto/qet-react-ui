# Contracts 010: Executive Quality Report Contracts

## 1. Backend Schemas (`backend/schemas/contracts.py`)

```python
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


class QualityReport(BaseModel):
    report_id: str
    run_id: str
    timestamp: str
    total_tests: int
    passed_count: int
    failed_count: int
    blocked_count: int
    pass_rate_percentage: float
    overall_quality_score: float
    signoff_recommendation: Literal["GO", "NO_GO", "CONDITIONAL_GO"]
    html_report_path: Optional[str] = None
    pdf_report_path: Optional[str] = None
    provenance: Dict[str, Any] = Field(default_factory=dict)
```

## 2. Frontend Interfaces (`src/types.ts`)

```typescript
export type SignoffRecommendation = 'GO' | 'NO_GO' | 'CONDITIONAL_GO';

export interface QualityReport {
  report_id: string;
  run_id: string;
  timestamp: string;
  total_tests: number;
  passed_count: number;
  failed_count: number;
  blocked_count: number;
  pass_rate_percentage: number;
  overall_quality_score: number;
  signoff_recommendation: SignoffRecommendation;
  html_report_path?: string;
  pdf_report_path?: string;
}
```
