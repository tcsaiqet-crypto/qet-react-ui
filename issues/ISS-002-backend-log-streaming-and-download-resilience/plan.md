# Architecture & Implementation Plan: ISS-002

## 1. Context-Scoped Logging Architecture

```
                 [ Backend FastAPI App ]
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
      [ Run Logger Handler ]     [ Fallback Initializer ]
               │                         │
               ├─ write to disk          ├─ check disk exists?
               ▼                         ▼
      temp/run_{run_id}.log     temp/run_{run_id}.log (synthesize if missing)
               │                         │
               └────────────┬────────────┘
                            │
                            ▼
          [ GET /api/v1/runs/{run_id}/logs/backend ]
                            │
                            ▼
            Response(content, media_type="text/plain")
```

## 2. Dynamic Log Response Algorithm
```python
@app.get("/api/v1/runs/{run_id}/logs/backend")
def get_backend_logs(run_id: str):
    log_path = Path("temp") / f"run_{run_id}.log"
    if not log_path.exists():
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        content = (
            f"[{timestamp}] [INFO] [System] === Initialized Run Log for {run_id} ===\n"
            f"[{timestamp}] [INFO] [System] Workspace intake ready. Waiting for stage triggers.\n"
        )
    else:
        content = log_path.read_text(encoding="utf-8", errors="replace")
        
    return Response(
        content=content,
        media_type="text/plain; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="run_{run_id}_backend.log"'
        }
    )
```
