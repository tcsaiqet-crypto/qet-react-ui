# Understanding Execution Steps

1. Verify intake readiness.
2. Read the active provider from runtime settings.
3. Resolve only that provider's usable keys.
4. Discover/select an available Gemini model when Gemini is active; use the configured OpenAI model when OpenAI is active.
5. Build a bounded prompt from documents and source snapshot.
6. Call the selected provider without hidden cross-provider fallback.
7. Parse fenced or plain JSON with diagnostics.
8. Validate mandatory fields and output schemas.
9. Persist understanding artifacts, provenance, model, provider, and generation.
10. Emit `completed` only after persistence and validation; otherwise emit `failed` with actionable diagnostics.
