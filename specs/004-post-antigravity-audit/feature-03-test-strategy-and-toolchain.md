# Feature 03: Test Strategy and Toolchain

## Goal
Provide reliable, behavior-based test coverage and executable verification.

## Tasks
1. Add React tests using Vitest + Testing Library:
   - tab gating behavior
   - upload interaction behavior
   - understanding success/failure rendering
2. Keep backend API tests and extend where state contracts changed.
3. Document and enforce toolchain prerequisites (Node.js/npm versions).
4. Add a short verification checklist command set.

## Verification Commands
- Frontend: npm install; npm run build; npm run test
- Backend: python -m pytest -q

## Acceptance
1. Frontend tests verify behavior, not just file presence.
2. Backend tests remain green.
3. Commands are runnable from documented locations.
