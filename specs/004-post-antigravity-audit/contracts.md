# Contracts 004: Audit Alignment Schemas

## 1. Unified Contract Mapping
- Standardized `AppState` fields across `backend/schemas/contracts.py` and `src/types.ts`.
- Standardized Error payload format `{ error_code: str, error_message: str, diagnostics: dict, retryable: bool }`.
