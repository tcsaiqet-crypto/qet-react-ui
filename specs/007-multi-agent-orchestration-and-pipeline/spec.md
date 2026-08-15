# Spec 007: Multi-Agent Orchestration & Sequential Pipeline

## 1. Stage Flow & Dependencies
The autonomous pipeline executes across 5 strictly ordered stages:
1. **Understanding Stage** (`UnderstandingAgent`): Ingests documents and codebase; extracts component map, UI inventory, and requirement matrix.
2. **Test Cases Stage** (`TestCaseAgent`): Ingests requirements & UI controls; generates Positive, Negative, Boundary, Validation, and Error-Handling test scenarios.
3. **Synthetic Data Stage** (`SyntheticDataAgent`): Synthesizes PII-compliant test records matching exact form fields and test case parameters.
4. **Playwright Package Stage** (`PlaywrightAgent`): Synthesizes Page Object Models, fixtures, and dedicated executable test scripts.
5. **Execution & Report Stage** (`ExecutionEngine` / `ReportAgent`): Executes tests, captures evidence, and generates multi-level sign-off reports.

## 2. Invalidation & Retry Principles
- If an upstream stage (e.g. Understanding) is retried, all downstream outputs (test cases, synthetic data, Playwright scripts, execution reports) must be reset to prevent stale state propagation.
- Generation counter (`reset_generation`) increments on each retry.
- Explicit error payloads with actionable diagnostics are returned if upstream dependencies are not ready.
