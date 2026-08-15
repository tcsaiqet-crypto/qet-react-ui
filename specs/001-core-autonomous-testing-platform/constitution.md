# Constitution 001: Core Autonomous Platform Rules

1. **Security First**: All uploaded archives must be validated with Zip Slip path checks and size limits (50MB max, 1000 files max).
2. **Provider Fail-Fast**: AI provider keys (Gemini, OpenAI) must be validated before running agent stages.
3. **Durable Run State**: Every run must maintain its exact state on disk in `uploads/{run_id}/state.json`.
4. **Clean API Layer**: FastAPI layer must expose standard REST responses and propagate error diagnostics to the React client.
