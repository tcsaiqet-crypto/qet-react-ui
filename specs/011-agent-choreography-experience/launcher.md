# Launcher 011

## Goal
Run the application reliably so choreography behavior can be validated end-to-end.

## Startup Heuristics
1. Backend must expose run creation, upload, status, and understanding endpoints.
2. Frontend must connect to backend host configured for this workspace.
3. Active run status polling must remain enabled for running states.

## Required Runtime Checks
1. Create run succeeds.
2. Document upload succeeds.
3. Codebase upload succeeds.
4. Understanding start succeeds.
5. Status updates continue through lifecycle transitions.

## Failure Handling
1. If backend route fails, show error payload and halt stage progression.
2. If status payload misses required fields, keep previous valid render and surface diagnostics.
3. If retry invalidation fails, mark run as inconsistent and block final closure.

## Verification Commands
Frontend:
1. npm install
2. npm run build
3. npm run test

Backend:
1. python -m pytest -q
