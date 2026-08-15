# Data Contracts: ISS-008 — Modals & Selective Execution Interfaces

## 1. Modal Component Contracts

```typescript
export interface PlaywrightScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  testCaseId: string;
  testCaseTitle: string;
  scriptContent: string;
  language?: 'typescript' | 'javascript' | 'python';
}

export interface TestDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  testCaseId: string;
  testCaseTitle: string;
  testDataJson: string;
  testDataCsv?: string;
}
```

## 2. Selective Execution API Request Contract

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class SelectiveExecutionRequest(BaseModel):
    test_case_ids: List[str] = Field(..., description="List of specific test case IDs to run")
    headless: bool = Field(default=False, description="Run Playwright in headed or headless mode")
    browser: str = Field(default="chromium", description="Target browser engine")
    slow_mo_ms: int = Field(default=300, description="Slow motion delay between actions for headed observation")
```
