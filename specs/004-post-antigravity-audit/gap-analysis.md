# Gap Analysis (Post-Antigravity)

## Audit Result
Implementation is partially complete. Core flow exists, but there are blocking correctness defects and integration ambiguities.

## Verified Issues

### G1: Frontend syntax error in upload flow
- File: src/components/HomeUploadPage.tsx:61
- Finding: `try:` is Python-style syntax in TypeScript.
- Impact: Frontend build/runtime fails.
- Required fix: replace with valid TypeScript `try { ... } catch { ... }` block.

### G2: Invalid TypeScript primitive usage
- File: src/types.ts:12
- File: src/types.ts:13
- Finding: uses `int | number`; `int` is not a TypeScript type.
- Impact: type-check/build failure risk.
- Required fix: use `number` only.

### G3: Hardcoded API base URL in frontend
- File: src/services/apiClient.ts:10
- Finding: fixed value `http://localhost:8000/api/v1`.
- Impact: environment inflexibility and deployment friction.
- Required fix: use Vite env variable with safe default, e.g. `import.meta.env.VITE_API_BASE_URL`.

### G4: Backend root still serves inline React/Babel page
- File: backend/src/api/fastapi_app.py:258
- Finding: inline HTML/React/Babel served at `/`.
- Impact: duplicated frontend source of truth, drift risk vs real React app.
- Required fix: choose one strategy:
  1. API-only backend and separate Vite frontend, or
  2. static-built frontend hosting from backend.

### G5: Understanding ready condition includes indexing state
- File: backend/src/api/fastapi_app.py:225
- Finding: returns understanding ready when status can still be `indexing`.
- Impact: ambiguous contract and possible premature UI state.
- Required fix: return ready only when understanding exists and status is `understanding_ready`.

### G6: Frontend tests are not using React test tooling
- File: src/__tests__/test_frontend_contracts.py
- Finding: Python file validates file existence and strings, not UI behavior.
- Impact: no real frontend behavior confidence.
- Required fix: add Vitest + Testing Library tests for tab gating, upload actions, and understanding state rendering.

### G7: Local toolchain gap in this environment
- Verification command: `npm run build`
- Result: `npm` not recognized.
- Impact: local frontend verification blocked in current shell environment.
- Required fix: ensure Node.js/npm installation path is available or document exact required setup before running frontend checks.

## Priority Order
1. Fix frontend compile blockers (G1, G2).
2. Normalize API environment config (G3).
3. Resolve backend/frontend serving ownership (G4).
4. Tighten understanding readiness contract (G5).
5. Replace pseudo-frontend tests with real UI tests (G6).
6. Resolve toolchain setup and run verification commands (G7).
