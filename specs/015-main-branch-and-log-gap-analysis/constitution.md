# Constitution 015: Observability, Logging & Platform Integrity

## Article I: Observability as a Core System Truth
1. **Zero Silent Operations**: Every state transition, LLM interaction, subagent task execution, file ingestion, and script generation must emit structured, sanitized log events.
2. **Context-Preserved Logging**: All background processes and sequential pipeline stages must execute within an active `log_run_context(run_id)` ensuring complete log traceability to `temp/run_{run_id}.log`.

## Article II: Dual-Pane Observability Separation
1. **Frontend UI Activity Stream**: Captures user interactions, navigation state changes, dropzone events, and client API latency into a local buffer.
2. **Backend Telemetry Stream**: Captures Python logger events, model prompts/completions, error stack traces, and filesystem operations.
3. **No Cross-Pollution**: UI client logs and backend server logs must be distinctly labeled, filterable, and individually exportable as raw `.log` text files.

## Article III: Search, Filtering & Real-Time Ergonomics
1. **Real-time Keyword Highlighting**: Log search queries must highlight matching substrings dynamically without interfering with terminal output layout.
2. **Deterministic Auto-Scroll**: As new log events arrive, the viewport must auto-scroll to the latest line unless the user has actively scrolled up to inspect prior history.
3. **Multi-Level Categorization**: Log entries must support severity filtering (`All Levels`, `Info`, `Status`, `Error`).

## Article IV: Data Protection & Secret Sanitization
1. **PII & Secret Redaction**: All API keys, authorization tokens, bearer headers, and sensitive customer data must pass through `SanitizedFormatter` before writing to disk or streaming to the client.
2. **Sanitization Invariant**: No raw Gemini or OpenAI API keys may appear in plaintext in log files, terminal streams, or browser consoles.

## Article V: Backward Compatibility & Non-Regression
1. **Complete Specification Parity**: All 15 Spec-Kits (**001 to 015**) must maintain synchronized specifications, contracts, architecture plans, and verification tasks.
2. **No Regression on Pipeline Controls**: The introduction of console log streaming must never degrade pipeline lifecycle controls (Pause, Stop, Resume) or Playwright execution stability.
