# Architecture & Implementation Plan: ISS-001

## 1. Architectural Overview

```
[ Frontend: HomeUploadPage ]
      │
      ├─ POST /api/v1/runs/upload (multipart/form-data)
      │      │
      │      ▼
      │ [ FastAPI Route: upload_files ]
      │      │
      │      ├─ Extract ZIP safe (Zip Slip check)
      │      ├─ Save Docs -> workspace/{run_id}/documents/
      │      ├─ Save Code -> workspace/{run_id}/codebase/
      │      └─ Initialize run manifest (state: READY)
      │
      └─ POST /api/v1/runs/{run_id}/understanding (or alias /start-understanding)
             │
             ▼
      [ Stage 1: RequirementUnderstandingAgent ]
```

## 2. Secure Extraction Flow
```python
def safe_extract_zip(zip_file: ZipFile, target_dir: Path):
    target_dir = target_dir.resolve()
    for member in zip_file.infolist():
        target_path = (target_dir / member.filename).resolve()
        if not str(target_path).startswith(str(target_dir)):
            raise SecurityError(f"Path traversal detected: {member.filename}")
        zip_file.extract(member, target_dir)
```

## 3. FastApi Router Registration
```python
@app.post("/api/v1/runs/{run_id}/understanding")
@app.post("/api/v1/runs/{run_id}/start-understanding")
@app.post("/api/v1/runs/{run_id}/understand")
async def start_understanding_endpoint(run_id: str, background_tasks: BackgroundTasks):
    return await execute_understanding_stage(run_id, background_tasks)
```
