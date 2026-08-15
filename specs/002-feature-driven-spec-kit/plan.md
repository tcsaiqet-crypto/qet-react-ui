# Architecture & Plan 002: Feature-Driven Spec-Kit

## 1. Feature Architecture
- Connects React modern components to FastAPI endpoints via centralized `apiClient.ts`.
- Establishes `UnderstandingAgent` with two-phase discovery:
  1. Static syntax parsing of files.
  2. Model-driven behavioral synthesis via `LLMService`.
