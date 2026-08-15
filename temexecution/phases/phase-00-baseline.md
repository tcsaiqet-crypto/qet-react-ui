# Phase 00 - Baseline And Ownership

## Objective
Establish the active code paths, current behavior, and measurable gaps before changing implementation.

## Steps
1. Read the relevant Spec-Kit and agent folder.
2. Confirm `backend/` is the active backend.
3. Inspect frontend state, API client, FastAPI routes, pipeline, and run persistence.
4. Run `npm run build`, `npm run test`, and `python -m pytest -q`.
5. Record failures without masking them.

## Exit Gate
Baseline evidence exists, ownership is documented, and no implementation begins against an unverified legacy path.
