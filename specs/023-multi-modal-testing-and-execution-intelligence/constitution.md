# Issue Constitution: Spec-Kit 023 — Multi-Modal Testing & Execution Governance

## 1. Fundamental Invariants

### 1.1 Multi-Modal Testing Phase Separation
1. **Isolated Testing Modalities**: The platform must distinctly present 4 testing modalities:
   - **UI Testing**: Autonomous Playwright browser journey automation.
   - **API Testing**: REST endpoint assertion test suites.
   - **Performance Testing**: Latency benchmarking and token latency profiling.
   - **Accessibility Testing**: WCAG 2.1 compliance audits (ARIA tags, contrast).
2. **Selective Execution Precision**: Executing a subset of test cases must never trigger untargeted tests. State machines must filter tests strictly by `selectedCaseIds`.
3. **Download Immediacy & Resilience**: Report generation (`/api/v1/runs/{run_id}/report/pdf` and `/api/v1/runs/{run_id}/report/html`) must never return 404 or unformatted payloads; if the run has incomplete data, synthesize a structured draft executive scorecard.
4. **Zero-PII Compliance**: All synthetic test datasets mapped across testing modalities must strictly enforce fictional mock records with explicit `non_pii_disclaimer`.

## 2. Error Boundaries
- Malformed Playwright script: Log failure to `run_{run_id}.log` and display actionable error message with AI self-healing auto-fix button.
