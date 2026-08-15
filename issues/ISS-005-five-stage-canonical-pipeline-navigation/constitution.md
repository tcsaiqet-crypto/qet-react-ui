# Issue Constitution: ISS-005 — 5-Stage Canonical Pipeline Navigation & Left Rail Auto-Scroll

## 1. Fundamental Invariants

### 1.1 Canonical Stage Topology
1. **5 Non-Negotiable Stages**: The entire execution pipeline must be mapped strictly to 5 canonical stages:
   - **Stage 1**: `Intake` (`DOCUMENT_CODEBASE_INTAKE`)
   - **Stage 2**: `Requirement Understanding` (`REQUIREMENT_UNDERSTANDING`)
   - **Stage 3**: `Test Generation` (`TEST_CASE_DATA_GENERATION`)
   - **Stage 4**: `Execution` (`PLAYWRIGHT_EXECUTION`)
   - **Stage 5**: `Quality Report` (`EXECUTIVE_REPORTING`)
2. **One-Button Progression Rule**: Every stage must present exactly one primary CTA button to advance to the next stage or trigger autonomous generation. Ambiguous multiple conflicting action buttons are forbidden.
3. **Stage-Gated Access Control**: Downstream stages are locked until the immediate predecessor stage completes successfully (or is explicitly bypassed in debug mode).
4. **Auto-Scroll Left Rail Tracking**: When a stage transitions or completes, the left rail navigation MUST automatically and smoothly scroll the active stage node into the center of the rail viewport.

## 2. Recovery & Re-Run Invariants
- Retrying an earlier stage must invalidate downstream outputs and prompt the user to re-run subsequent stages to preserve test artifact integrity.
