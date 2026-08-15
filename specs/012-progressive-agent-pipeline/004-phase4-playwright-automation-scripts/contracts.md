# Contracts 004: Phase 4 Automation Script Contracts

## 1. Backend Schemas (Pydantic)

```python
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class PlaywrightScriptFile(BaseModel):
    file_path: str
    file_type: str  # 'page_object' | 'test_spec' | 'config' | 'fixture'
    content: str
    target_component: Optional[str] = None
    target_case_ids: List[str] = Field(default_factory=list)

class PlaywrightSuiteArtifact(BaseModel):
    suite_id: str
    files: List[PlaywrightScriptFile]
    total_specs: int
    total_loc: int
    provenance: Dict[str, Any] = Field(default_factory=dict)
```

## 2. Frontend TypeScript Interfaces

```typescript
export interface PlaywrightScriptFile {
  file_path: string;
  file_type: 'page_object' | 'test_spec' | 'config' | 'fixture';
  content: string;
  target_component?: string;
  target_case_ids: string[];
}

export interface PlaywrightSuiteArtifact {
  suite_id: string;
  files: PlaywrightScriptFile[];
  total_specs: int;
  total_loc: int;
  provenance: Record<string, any>;
}
```
