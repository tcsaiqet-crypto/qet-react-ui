# Data Contracts: ISS-002 — Log Streaming & Download Contracts

## 1. REST Endpoint Contracts

### `GET /api/v1/runs/{run_id}/logs/backend`
- **Response**: `200 OK`
- **Content-Type**: `text/plain; charset=utf-8`
- **Headers**:
  - `Content-Disposition`: `attachment; filename="run_{run_id}_backend.log"`

### `GET /api/v1/runs/{run_id}/logs/json`
```json
{
  "run_id": "run-98831b-4f92",
  "total_lines": 42,
  "lines": [
    {
      "timestamp": "2026-08-15 14:00:01",
      "level": "INFO",
      "logger": "FastAPI",
      "message": "Intake completed for 3 files"
    }
  ]
}
```

## 2. TypeScript Log Models

```typescript
export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  logger: string;
  message: string;
}

export interface RunLogsPayload {
  run_id: string;
  total_lines: number;
  lines: LogEntry[];
}
```
