# F03 Requirement Categorizer LLM Hardening

## Objective
Make requirement categorization provider/model behavior consistent with the shared LLM service reliability design.

## Scope
1. Route generation through LLMService methods where possible.
2. Avoid fixed-model direct HTTP branches for Gemini.
3. Preserve provider-specific diagnostics and fail-fast error codes.
4. Keep deterministic fallback path available when configured.

## Acceptance
1. Categorizer does not depend on hardcoded Gemini model endpoints.
2. Error contract remains structured (provider_key_missing, model_timeout, invalid_model_json, etc.).
3. Existing categorization tests continue passing or are updated with explicit rationale.
