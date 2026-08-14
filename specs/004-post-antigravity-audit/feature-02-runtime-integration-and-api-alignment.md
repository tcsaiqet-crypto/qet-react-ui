# Feature 02: Runtime Integration and API Alignment

## Goal
Eliminate frontend/backend contract ambiguity and finalize integration behavior.

## Tasks
1. Replace hardcoded API base URL with env-driven config.
2. Decide backend root strategy:
   - API-only mode, or
   - static React build hosting mode.
3. Tighten understanding readiness response semantics.
4. Align frontend status transitions to backend states without premature ready display.
5. Keep Streamlit compatibility unchanged.

## Acceptance
1. Frontend works against configurable API base URL.
2. Backend root behavior is documented and intentional.
3. Understanding endpoint response states are deterministic.
4. UI lifecycle states map one-to-one with backend contract.
