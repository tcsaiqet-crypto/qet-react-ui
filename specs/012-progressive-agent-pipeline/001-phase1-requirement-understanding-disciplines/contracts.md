# Contracts 001: Phase 1 Data Models & API Schemas

## 1. Backend Schemas (Pydantic)

```python
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

class DisciplinePreview(BaseModel):
    status: Literal["active", "coming_soon"]
    title: str
    description: str
    metrics: Dict[str, Any] = Field(default_factory=dict)
    summary_markdown: Optional[str] = None
    preview_items: List[Dict[str, Any]] = Field(default_factory=list)

class MultiDisciplineUnderstanding(BaseModel):
    run_id: str
    summary: str
    overall_quality_score: float
    requirements_count: int
    files_indexed_count: int
    disciplines: Dict[str, DisciplinePreview] = Field(
        default_factory=lambda: {
            "ui": DisciplinePreview(status="active", title="UI Testing", description="AST Component Hierarchy & User Journeys"),
            "api": DisciplinePreview(status="coming_soon", title="API Testing", description="Endpoint Contracts & Payload Stubs"),
            "accessibility": DisciplinePreview(status="coming_soon", title="Accessibility Testing", description="WCAG 2.1 AA Checklist"),
            "performance": DisciplinePreview(status="coming_soon", title="Performance Testing", description="Web Vitals & Load Targets"),
        }
    )
```

## 2. Frontend TypeScript Interfaces

```typescript
export type DisciplineId = 'ui' | 'api' | 'accessibility' | 'performance';

export interface DisciplinePreview {
  status: 'active' | 'coming_soon';
  title: string;
  description: string;
  metrics: Record<string, any>;
  summary_markdown?: string;
  preview_items: Array<Record<string, any>>;
}

export interface MultiDisciplineUnderstanding {
  run_id: string;
  summary: string;
  overall_quality_score: number;
  requirements_count: number;
  files_indexed_count: number;
  disciplines: Record<DisciplineId, DisciplinePreview>;
}
```
