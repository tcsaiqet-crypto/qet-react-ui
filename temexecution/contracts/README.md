# Shared Contracts

All agents use the contracts in this folder. Agent-specific files may add fields but may not redefine lifecycle semantics.

- `lifecycle-contract.md`: stages, events, statuses, timestamps, generations.
- `readiness-and-dependencies.md`: what must be true before each stage starts.
- `outputs-and-artifacts.md`: output ownership and artifact paths.
- `errors-and-provenance.md`: diagnostics, provider, model, and retry semantics.
