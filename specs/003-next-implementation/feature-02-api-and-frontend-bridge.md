# Feature 02: API and Frontend Bridge

## Goal
Connect the React app to the backend services and run lifecycle.

## Deliverables
- API client defined for backend calls
- run creation flow
- document upload flow
- ZIP upload flow
- status polling and state timeline updates
- explicit error handling and retry UI

## Required Endpoints
- POST /api/v1/runs
- POST /api/v1/runs/{run_id}/documents
- POST /api/v1/runs/{run_id}/codebase
- GET /api/v1/runs/{run_id}/status
- POST /api/v1/runs/{run_id}/understanding/start
- GET /api/v1/runs/{run_id}/understanding

## Acceptance Criteria
1. Creating a run works from the frontend.
2. Uploading docs and ZIP works with real API calls.
3. Status updates render in UI as stage progress changes.
4. Error responses show clear retry and recovery guidance.

## Technical Notes
- Use polling for status, not full reloads.
- Use explicit state mapping between frontend steps and backend state names.
- Keep the transport contract strict and testable.
