# Data Contracts: ISS-006 — AI Model Interfaces & Endpoints

## 1. REST Schemas

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class AIModelOption(BaseModel):
    id: str
    name: str
    provider: str
    default_budget: int
    is_available: bool = True

class ModelListResponse(BaseModel):
    models: List[AIModelOption]
    active_model_id: str
    active_budget: int

class SetActiveModelRequest(BaseModel):
    model_id: str
    thinking_budget: Optional[int] = 4096
```

## 2. TypeScript Interfaces

```typescript
export interface AIModelOption {
  id: string;
  name: string;
  provider: 'google' | 'openai' | 'anthropic' | 'local';
  default_budget: number;
  is_available: boolean;
}

export interface ModelSwitcherProps {
  models: AIModelOption[];
  activeModelId: string;
  activeBudget: number;
  onModelChange: (modelId: string, budget: number) => void;
}
```
