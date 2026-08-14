# Antigravity Next Prompt

You are Antigravity. Continue the implementation of the next delivery in this repository.

## Source of Truth
Use the files in this folder:
- README.md
- gap-analysis.md
- feature-01-react-app-foundation.md
- feature-02-api-and-frontend-bridge.md
- feature-03-understanding-ui-integration.md
- feature-04-tests-and-verification.md

## Objective
Complete the next-stage implementation that turns the existing backend groundwork into a working React-first Home + Understanding user flow.

## Project Paths
- Backend repo root: C:/Users/AkshatSinha/Documents/avd/QET agents/QET agents
- Current implementation project: C:/Users/AkshatSinha/Documents/avd/qet-react-ui
- Spec-kit root: C:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/003-next-implementation

## Mandatory Rules
1. Keep the current Streamlit application intact and working.
2. Build the new React application in the project folder above.
3. Reuse existing backend services where possible instead of inventing a new stack.
4. Implement the FastAPI bridge fully enough to support the Home + Understanding flow.
5. Preserve AI-required fail-fast behavior for Understanding.
6. Never fabricate success when AI or backend processing fails.
7. Add focused tests for each completed feature.
8. Keep the repo stable after each implementation step.

## Delivery Priorities
1. Create the React app foundation.
2. Implement the API and frontend bridge.
3. Build the Understanding page and UI flow.
4. Add tests and end-to-end validation.

## Required Deliverables
- real React app structure and routing
- Home page with upload cards and status indicators
- API calls for run creation, file upload, and understanding execution
- understanding result rendering with provenance and failure diagnostics
- passing backend test suite and frontend validation

## Completion Criteria
1. The new React app starts cleanly in the project folder.
2. The user can create a run and upload docs and ZIP.
3. The API status flow updates in real time in the UI.
4. Understanding results render with provenance data.
5. If AI fails, the UI surfaces structured failures and retry guidance.
6. Test coverage exists for the implemented flow.

Proceed with the next implementation cycle.
