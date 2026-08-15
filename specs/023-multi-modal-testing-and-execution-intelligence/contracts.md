# Data Contracts: Spec-Kit 023 — Multi-Modal Testing Interfaces

## 1. Frontend TypeScript Contracts

```typescript
export type TestingTabType = 'UI' | 'API' | 'PERFORMANCE' | 'ACCESSIBILITY';

export interface TestingTabOption {
  id: TestingTabType;
  label: string;
  badge?: string;
  isAvailable: boolean;
  comingSoon?: boolean;
}

export interface ReportDownloadPayload {
  run_id: string;
  generated_at: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  quality_score: number;
  verdict: 'GO' | 'NO_GO' | 'CONDITIONAL';
}
```

## 2. Backend Pydantic Schemas

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class ReportSummaryResponse(BaseModel):
    run_id: str
    verdict: str = Field(..., description="GO / NO_GO / CONDITIONAL")
    quality_score: float = Field(..., ge=0, le=100)
    total_requirements: int
    total_test_cases: int
    execution_pass_rate: float
    pdf_download_url: str
    html_download_url: str
```
