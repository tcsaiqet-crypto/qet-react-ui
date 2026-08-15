# Contracts 001: Core Platform Contracts

## 1. Domain Models (`backend/schemas/contracts.py`)

```python
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class FileMetadata(BaseModel):
    rel_path: str
    size_bytes: int
    extension: str
    is_binary: bool = False


class IntakeManifest(BaseModel):
    upload_id: str
    zip_filename: str
    extracted_path: str
    total_files: int
    total_size_bytes: int
    files: List[FileMetadata] = Field(default_factory=list)
    doc_files: List[str] = Field(default_factory=list)
    excluded_file_count: int = 0
    created_at: str


class AppState(BaseModel):
    run_id: str
    project_name: str
    status: str = "idle"
    progress: float = 0.0
    intake_manifest: Optional[IntakeManifest] = None
    created_at: str
    updated_at: str
    errors: List[str] = Field(default_factory=list)
```

## 2. Frontend Interfaces (`src/types.ts`)

```typescript
export interface IntakeManifest {
  upload_id: string;
  zip_filename: string;
  extracted_path: string;
  total_files: number;
  total_size_bytes: number;
  files?: FileMetadata[];
  doc_files?: string[];
  excluded_file_count?: number;
  created_at: string;
}

export interface AppState {
  run_id: string;
  project_name: string;
  status: 'idle' | 'uploading' | 'processing_zip' | 'indexing' | 'ai_understanding_running' | 'understanding_ready' | 'generation_running' | 'pipeline_complete' | 'error';
  progress: number;
  intake_manifest?: IntakeManifest;
}
```
