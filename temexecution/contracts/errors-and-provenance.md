# Errors And Provenance

Every failure includes:

- `error_code`
- `error_message`
- `diagnostics`
- `retryable`
- `provider` and `model` when AI was involved
- `run_id` and `generation`

AI-required stages never replace a failed response with deterministic sample content. The selected provider is the source of truth. Provider fallback requires an explicit user action, not hidden runtime behavior.
