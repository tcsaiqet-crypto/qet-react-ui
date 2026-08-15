# Architecture & Implementation Plan 001: Core Autonomous Platform

## 1. System Architecture

```
[ Ingestion Layer: Documents / ZIP Codebase ]
       │
       ▼
[ Security & Intake Processing (Path Traversal, Exclusions) ]
       │
       ▼
[ AI Provider Engine (Gemini / OpenAI with Candidate Fallbacks) ]
       │
       ▼
[ Autonomous Agent Pipeline (Understanding -> TestGen -> Data -> Playwright -> Execution) ]
       │
       ▼
[ Storage & Artifact Persistence (Run State, JSON Evidence, ZIP Packages) ]
       │
       ▼
[ React Modern SPA + FastAPI REST & WebSocket Runtime ]
```

## 2. Key Modules
- `src/services/zip_service.py`: Safe ZIP archive handling.
- `src/services/llm_service.py`: Provider abstraction and JSON extraction.
- `src/services/run_state_service.py`: Run creation, persistence, and state retrieval.
- `src/api/fastapi_app.py`: FastAPI endpoints and static React serving.
