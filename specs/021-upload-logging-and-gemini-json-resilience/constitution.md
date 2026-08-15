# Constitution: Upload Observability & LLM JSON Resilience Engine

## 1. Core Principles & Governance Rules

### Rule 1: Zero Silent Operations
Every user action that triggers backend processing (specifically document uploads, codebase ZIP uploads, archive extractions, AST parsing, and AI analysis) MUST emit structured, timestamped logs into both:
1. **Frontend Event Buffer (`uiLogs`)**: Immediately visible in the UI Live Console Logs panel.
2. **Backend Run-Scoped Log File (`temp/run_{run_id}.log`)**: Persisted contextually per run ID via `with log_run_context(run_id):`.

### Rule 2: Token Budget Allocation for Thinking Models
When using reasoning/thinking models (e.g. Gemini 3.7 Flash with dynamic thinking budgets from 1024 to 8192 tokens), `max_output_tokens` MUST be configured to at least `8192` (or higher) so thinking tokens do not prematurely exhaust the generation budget before closing valid JSON payloads.

### Rule 3: Native JSON Schema Enforcement & Safe Auto-Repair
1. **Engine-Level JSON Mode**: All LLM calls requesting structured objects MUST supply `responseMimeType: "application/json"` in `generationConfig`.
2. **Deterministic Auto-Repair**: If a response is truncated at the token boundary or has dangling commas/unclosed brackets, the parser MUST execute balanced string/bracket closure to extract valid partial structures rather than crashing with `invalid_model_json`.

### Rule 4: Accurate, Honest Error Telemetry (No Jargon)
Error surfaces MUST NOT display hardcoded buzzwords (*"No fabricated or fake deterministic fallback content returned"*). Error messages must transparently state the exact technical failure (e.g., *Backend server offline on port 8080*, *API key quota exceeded*, or *Schema validation error*) with actionable remediation steps.

### Rule 5: Non-Destructive Layout Compatibility
The Live Console Logs panel MUST remain fully collapsible and adhere to CSS theme tokens (`var(--qet-surface)`, `var(--qet-border)`, `var(--qet-text-primary)`). It must never cause horizontal layout overflow or clipping on standard screens (1024px - 1440px).
