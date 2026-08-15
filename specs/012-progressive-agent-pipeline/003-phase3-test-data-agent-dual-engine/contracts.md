# Contracts 003: Phase 3 Test Data Contracts

## 1. Backend Schemas (Pydantic)

```python
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

class TestDataRecord(BaseModel):
    record_id: str
    scenario_type: Literal["positive", "negative", "boundary"]
    fields: Dict[str, Any]
    description: Optional[str] = None
    is_valid: bool = True

class TestDataHub(BaseModel):
    active_mode: Literal["synthetic", "custom_uploaded"] = "synthetic"
    synthetic_records: List[TestDataRecord] = Field(default_factory=list)
    custom_records: List[TestDataRecord] = Field(default_factory=list)
    uploaded_filename: Optional[str] = None
    schema_mapping: Dict[str, str] = Field(default_factory=dict)
    provenance: Dict[str, Any] = Field(default_factory=dict)
```

## 2. Frontend TypeScript Interfaces

```typescript
export type TestDataMode = 'synthetic' | 'custom_uploaded';

export interface TestDataRecord {
  record_id: string;
  scenario_type: 'positive' | 'negative' | 'boundary';
  fields: Record<string, any>;
  description?: string;
  is_valid: boolean;
}

export interface TestDataHub {
  active_mode: TestDataMode;
  synthetic_records: TestDataRecord[];
  custom_records: TestDataRecord[];
  uploaded_filename?: string;
  schema_mapping: Record<string, string>;
  provenance: Record<string, any>;
}
```
