# ISS-005 · API Testing Phase — Implementation Plan

**Priority**: 🟢 Low  
**Status**: Backlog (Coming Soon)  
**Feature Area**: Understanding Page → Testing Tabs → API Testing

---

## Overview

API Testing discovers REST endpoints from the codebase and generates:
1. **HTTP request test cases** (happy path, error codes, auth failures)
2. **Contract tests** (request/response schema validation)
3. **Postman collection export**
4. **Playwright APIRequestContext** scripts for API-level automation

---

## What API Testing Covers

| Scenario Type | Example |
| --- | --- |
| Happy Path | `POST /api/v1/runs → 201 Created` |
| Auth Failure | `POST /api/v1/runs (no API key) → 401` |
| Schema Validation | Response body matches `RunState` schema |
| Rate Limiting | `POST repeated 20x → 429 Too Many Requests` |
| Error Boundaries | `GET /api/v1/runs/INVALID → 404` |

---

## Backend Agent Required

### `ApiTestingAgent` (New)
- Reads OpenAPI/Swagger spec if available (`/openapi.json`)
- Falls back to scanning FastAPI routes via `app.routes`
- Generates `APITestCase` Pydantic model per endpoint per scenario
- Outputs Postman collection JSON and Playwright APIRequestContext scripts

---

## UI Changes Required

### Understanding Page — "API Testing" Tab
When `API Testing` tab is selected:
- Show discovered endpoints instead of UI components
- Show request/response schema contracts
- Show `curl` examples per endpoint

### Execution Page — API Run Mode
- HTTP response status instead of screenshot
- JSON diff viewer for response body vs expected schema
- Response time graph

---

## Acceptance Criteria (for v1 release)

- [ ] `ApiTestingAgent` discovers routes from FastAPI app
- [ ] Generates `GET`, `POST`, `PUT`, `DELETE` test cases
- [ ] Exports Postman collection `.json`
- [ ] UI shows "API Testing" tab as active with endpoint list
- [ ] Execution shows HTTP status badge per test case
