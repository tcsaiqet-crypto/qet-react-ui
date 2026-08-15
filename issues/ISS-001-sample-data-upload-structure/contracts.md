# Data Contracts: ISS-001 — Sample Data Upload & Endpoint Interfaces

## 1. Backend Pydantic Schemas

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class FileUploadResponse(BaseModel):
    run_id: str = Field(..., description="Unique UUID identifier for this test run")
    status: str = Field(default="READY", description="Run status after intake")
    document_count: int = Field(..., description="Number of specification documents saved")
    documents: List[str] = Field(default_factory=list, description="Relative filenames of uploaded docs")
    codebase_files: List[str] = Field(default_factory=list, description="Extracted codebase files list")
    message: str = Field(default="Files uploaded and verified successfully")

class UnderstandingTriggerResponse(BaseModel):
    run_id: str
    stage: str = "REQUIREMENT_UNDERSTANDING"
    status: str = "IN_PROGRESS"
    task_id: Optional[str] = None
    started_at: str
```

## 2. Frontend TypeScript Interfaces

```typescript
export interface UploadPayloadResponse {
  run_id: string;
  status: 'READY' | 'FAILED';
  document_count: number;
  documents: string[];
  codebase_files: string[];
  message: string;
}

export interface UnderstandingStartResponse {
  run_id: string;
  stage: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  task_id?: string;
  started_at: string;
}
```
