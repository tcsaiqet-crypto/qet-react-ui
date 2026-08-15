# Data Contracts: ISS-007 — JSON Repair & Generation Contracts

## 1. Backend Parser Interface

```python
from typing import Any, Tuple, Optional
from pydantic import BaseModel

class JSONRepairResult(BaseModel):
    is_repaired: bool
    pass_number: int
    raw_length: int
    data: Any
    warning_message: Optional[str] = None
```

## 2. LLM Service Generation Contract
```python
class LLMGenerationConfig(BaseModel):
    temperature: float = 0.2
    max_output_tokens: int = 8192
    response_mime_type: str = "application/json"
    thinking_budget: Optional[int] = 4096
```
