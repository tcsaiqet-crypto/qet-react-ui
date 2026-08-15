# Contracts: Logging and Cancellation Schemas

## 1. REST Endpoints

### A. Run Cancellation
```http
POST /api/v1/runs/{run_id}/cancel
```
* **Response**:
```json
{
  "status": "stopped",
  "run_id": "RUN-20260815-001"
}
```

### B. Run Logs Retrieval
```http
GET /api/v1/runs/{run_id}/logs
```
* **Response**:
```json
{
  "run_id": "RUN-20260815-001",
  "backend_logs": "[2026-08-15 15:45:10,123] [INFO] [qet_accelerator] Initiating Sequential QET Agent MVP Pipeline...\n"
}
```

### C. Log File Download
```http
GET /api/v1/runs/{run_id}/logs/download
```
* **Response**: Raw file stream (`text/plain; charset=utf-8`) with attachment header `backend_logs_{run_id}.txt`.

---

## 2. TypeScript Data Structures
```typescript
export interface RunLogResponse {
  run_id: string;
  backend_logs: string;
}

export interface RunCancellationResponse {
  status: 'stopped' | 'cancelled';
  run_id: string;
}
```
