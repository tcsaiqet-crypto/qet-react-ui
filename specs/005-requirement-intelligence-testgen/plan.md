# Architecture & Plan 005: Requirement Intelligence

1. `RequirementCategorizer` uses LLM classification with heuristic fallback.
2. Injects categorized requirements into `TestCaseAgent` prompt to enforce coverage across all 10 disciplines.
3. Exposes coverage stats via `/runs/{id}/requirements/coverage`.
