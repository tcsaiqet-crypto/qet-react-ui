# Antigravity Next Prompt (Updated)

You are Antigravity. Execute the next implementation cycle for this project end to end.

## Project Paths
- Backend repo root: C:/Users/AkshatSinha/Documents/avd/QET agents/QET agents
- React implementation folder: C:/Users/AkshatSinha/Documents/avd/qet-react-ui
- Spec-kit root: C:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/003-next-implementation

## Read In This Order
1. C:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/003-next-implementation/README.md
2. C:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/003-next-implementation/gap-analysis.md
3. C:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/003-next-implementation/feature-01-react-app-foundation.md
4. C:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/003-next-implementation/feature-02-api-and-frontend-bridge.md
5. C:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/003-next-implementation/feature-03-understanding-ui-integration.md
6. C:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/003-next-implementation/feature-04-tests-and-verification.md

## Mission
Convert current backend groundwork into a working React-first Home plus Understanding user flow with real API integration, visible lifecycle states, and AI provenance.

## Non-Negotiable Constraints
1. Keep existing Streamlit behavior intact and non-broken.
2. Build all React UI work inside C:/Users/AkshatSinha/Documents/avd/qet-react-ui.
3. Reuse existing backend services and contracts wherever possible.
4. Preserve AI-required fail-fast behavior for Understanding generation.
5. Never fabricate success, evidence, or pass status.
6. Add tests for each implemented feature and verify real behavior.

## Required API Contracts
Implement and use these endpoints in the integrated flow:
1. POST /api/v1/runs
2. POST /api/v1/runs/{run_id}/documents
3. POST /api/v1/runs/{run_id}/codebase
4. GET /api/v1/runs/{run_id}/status
5. POST /api/v1/runs/{run_id}/understanding/start
6. GET /api/v1/runs/{run_id}/understanding

## Required State Model
Use and render these states in the UI:
- idle
- uploading
- processing_zip
- indexing
- ai_understanding_running
- understanding_ready
- error

## Understanding Failure Contract
If AI fails or output is invalid, return failed response with diagnostics. Use explicit codes:
- provider_disabled
- provider_key_missing
- model_timeout
- invalid_model_json
- schema_validation_failed

Do not substitute deterministic replacement content for AI-required generated sections in this mode.

## Execution Order
1. React app foundation and routes
2. API client and Home upload lifecycle wiring
3. Understanding page rendering with provenance and failure UX
4. Tests and end-to-end verification

## Verification Commands
Run and report outcomes from:
1. Backend tests in C:/Users/AkshatSinha/Documents/avd/QET agents/QET agents
2. Frontend tests in C:/Users/AkshatSinha/Documents/avd/qet-react-ui
3. One manual end-to-end run: create run -> upload docs -> upload zip -> process -> run understanding

## Completion Criteria
1. Home and Understanding are both functional in the React app.
2. Upload plus status transitions are visible and reliable.
3. Understanding output includes provenance and validation status.
4. Failed AI runs surface clear diagnostics and retry path.
5. Tests pass and results are reported with changed files summary.

## Required Final Report Format
Return a concise implementation report with:
1. Files changed by feature
2. API contracts delivered
3. Test commands executed and results
4. Known limitations and next recommended step

Start implementation now.
