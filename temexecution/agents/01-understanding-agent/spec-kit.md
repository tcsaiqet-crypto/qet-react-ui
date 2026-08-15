# Understanding Spec-Kit Brief

## Goal
Make AI-required application understanding reliable, provider-correct, transparent, and recoverable.

## Must Cover
- Gemini/OpenAI explicit selection.
- Model discovery and provenance.
- Strict schema validation.
- Timeout/auth/model errors.
- No fabricated deterministic fallback.
- UI diagnostics and retry.

## Acceptance
The selected provider is the provider called. A missing or rejected selected key fails the stage and never silently invokes the other provider. Valid output is generation-stamped.

## Suggested Spec Folder
`specs/013-understanding-agent-runtime`
