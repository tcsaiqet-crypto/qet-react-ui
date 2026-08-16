# Constitution: Spec 025 — Architectural & Business Invariants

## 1. Non-Negotiable Invariants

### 1.1 Business Domain Grounding (Zero Framework Leakage)
- **Invariant**: Test cases presented to users MUST describe candidate-facing and system-level business behaviors.
- **Prohibited Content**: Test case titles, descriptions, and steps MUST NOT reference underlying technology stacks (e.g. *Streamlit, SQLite, React virtual DOM, internal Python exception classes*) unless the explicit requirement under test is an infrastructure SLA requirement.

### 1.2 Mandatory 5 Test Types Distribution
- Every generated test suite MUST contain scenarios distributed across the 5 canonical types:
  1. **Positive**: Nominal workflow completion.
  2. **Negative**: Invalid inputs, fraud prevention, authorization rejections.
  3. **Boundary**: Numeric limits, cutoff timestamps, maximum study hours.
  4. **Validation**: Field regex, required attributes, calculation rubrics.
  5. **Error-Handling**: Network drops, service timeouts, recovery mechanisms.

### 1.3 100% Requirement Traceability
- Every test case MUST contain a valid `requirement_id` referencing a verified requirement from the ingested BRD (e.g. `BR-01` to `BR-18`).
- Orphan test cases without requirement lineage are rejected by the Alignment Critic Node.

### 1.4 Realistic Synthetic Test Data
- Test data generated in Stage 3 MUST provide plausible business entities (valid format email addresses, realistic names, ISO country codes, valid-length passport numbers, mock credit cards with valid Luhn checksums).
- Mock datasets MUST NOT be placeholder strings (e.g. `test1`, `foo`, `bar`).

### 1.5 LangGraph Cyclic Safety
- Any feedback loop between the Critic Node and Generator Node MUST have an explicit `max_iterations = 3` ceiling to prevent infinite token loops.
