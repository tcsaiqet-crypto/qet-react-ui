# Phase 03 - Understanding

## Objective
Produce validated AI-backed application understanding with explicit provider provenance.

## Steps
1. Confirm the selected provider and usable key.
2. Build the prompt from requirements and source snapshot.
3. Run only the selected provider; do not silently fall back.
4. Parse and schema-validate the response.
5. Persist understanding artifacts and provenance.
6. Persist failure diagnostics without fabricated output.

## Exit Gate
Understanding is either valid and ready or failed with actionable diagnostics.
