# Contracts 015: Observability & Logging System Contracts

## 1. Backend REST API Endpoints & Pydantic Contracts

### 1.1 `GET /api/v1/runs/{run_id}/logs`
Retrieves formatted execution logs for a specific run ID.

#### Python Pydantic Model
```python
from pydantic import BaseModel, Field
from typing import Optional, List

class RunLogsResponse(BaseModel):
    run_id: str = Field(..., description="Unique run identifier")
    backend_logs: str = Field(..., description="Full text execution logs with timestamp, level, and component source")
    log_count: Optional[int] = Field(None, description="Total number of discrete log lines parsed")
    has_errors: bool = Field(False, description="True if any [ERROR] or Traceback entries exist in the log stream")
```

#### JSON Response Schema
```json
{
  "run_id": "RUN-20260815-113000-A1B2C3",
  "backend_logs": "[2026-08-15 11:30:01] [INFO] [qet_accelerator] Initiating Sequential QET Agent MVP Pipeline...\n[2026-08-15 11:30:02] [INFO] [Requirement Parser] Successfully indexed 4 specification documents.\n",
  "log_count": 2,
  "has_errors": false
}
```

---

### 1.2 `GET /api/v1/runs/{run_id}/logs/download`
Downloads raw execution log file as `text/plain` attachment (`backend_run_{run_id}.log`).

#### Response Headers:
```http
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Content-Disposition: attachment; filename="backend_run_RUN-20260815-113000-A1B2C3.log"
```

---

## 2. Frontend TypeScript Interfaces & Contracts

### 2.1 UI Log Entry Model (`src/types.ts` & `ConsoleLogDrawer.tsx`)
```typescript
export type LogSeverity = 'info' | 'warn' | 'error' | 'status';

export interface LogEntry {
  timestamp: string;      // Formatted local time string (e.g. "11:30:05 AM")
  message: string;        // Log message payload
  type: LogSeverity;      // Log classification level
  source?: string;        // Component or subagent tag (e.g. "Requirement Parser")
}
```

### 2.2 Console Log Drawer Props Contract
```typescript
export interface ConsoleLogDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  frontendLogs: LogEntry[];
  backendLogs: string;
  onClearFrontend: () => void;
  onDownloadFrontend: () => void;
  onDownloadBackend: () => void;
  activeProvider: string;
  activeModel: string;
}
```

### 2.3 API Client Interface (`src/services/apiClient.ts`)
```typescript
export async function getRunLogs(runId: string): Promise<{ run_id: string; backend_logs: string }>;
export function getBackendLogsDownloadUrl(runId: string): string;
```

---

## 3. Python Logging Context Invariant (`logger.py`)

```python
import contextvars
from contextlib import contextmanager

current_run_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("current_run_id", default=None)

@contextmanager
def log_run_context(run_id: str):
    """Binds the active run_id to thread/async context for automatic log file routing."""
    token = current_run_id.set(run_id)
    try:
        yield
    finally:
        current_run_id.reset(token)
```
