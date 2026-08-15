# Data Contracts & Schemas: Spec-Kit 021

## 1. Frontend Logger Props Contract

```typescript
export interface HomeUploadPageProps {
  appState: AppState | null;
  onRefreshStatus: () => void;
  onProceedToUnderstanding: () => void;
  onCreateNewRun: () => void;
  onInspectAgent?: (agentId: string) => void;
  onLogEvent?: (message: string, type?: 'info' | 'warn' | 'error') => void;
  onFetchLogsNow?: () => void;
}
```

---

## 2. Ingestion REST Endpoints & Telemetry Contract

### `POST /api/v1/runs/{run_id}/documents`
- **Request**: Multipart Form `files: List[UploadFile]`
- **Response**:
```json
{
  "uploaded_count": 3,
  "files": ["requirements.md", "agentspec.txt", "datamodel.txt"]
}
```
- **Emitted Backend Log Format**:
```text
[2026-08-15 18:10:12] [INFO] [qet_accelerator] Ingested 3 document(s) for run RUN-20260815-001: ['requirements.md', 'agentspec.txt', 'datamodel.txt']
[2026-08-15 18:10:12] [STATUS] [qet_accelerator] Intake manifest updated: 3 total requirement files active.
```

### `POST /api/v1/runs/{run_id}/codebase`
- **Request**: Multipart Form `file: UploadFile (.zip)`
- **Response**:
```json
{
  "intake_manifest": {
    "upload_id": "RUN-20260815-001",
    "zip_filename": "codebase.zip",
    "total_files": 48,
    "total_size_bytes": 524288
  },
  "state": { ... }
}
```
- **Emitted Backend Log Format**:
```text
[2026-08-15 18:10:15] [INFO] [qet_accelerator] Received codebase archive 'codebase.zip' (512.0 KB) for run RUN-20260815-001.
[2026-08-15 18:10:16] [STATUS] [qet_accelerator] Unpacked 48 source files into workspace/extracted. AST indexing ready.
```

---

## 3. Gemini Generation Config Schema

```python
generation_config = {
    "temperature": 0.2,
    "maxOutputTokens": 8192,
    "responseMimeType": "application/json"
}
```
