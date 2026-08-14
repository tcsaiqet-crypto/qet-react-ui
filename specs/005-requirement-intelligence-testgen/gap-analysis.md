# Gap Analysis: Requirement Intelligence and Test Generation

## Current Gaps

### G1: Requirement categories are not explicit artifacts
Understanding output includes gaps and component/flow insights, but does not persist a normalized requirement catalog split by requirement type.

### G2: Functional/non-functional coverage cannot be measured
No stable schema-level classification exists for requirement types such as Functional, NonFunctional, Security, Performance, Accessibility, Integration, or Compliance.

### G3: Test generation is not requirement-category first
Test case generation can operate from understanding data, but there is no dedicated categorized-requirements input contract that guarantees balanced category coverage.

### G4: Requirement-to-test traceability is incomplete
Generated test cases do not consistently include explicit source requirement category and requirement IDs for coverage reporting.

### G5: API and UI do not expose requirement coverage as a first-class view
The system lacks a dedicated response and page section showing per-category totals, covered requirements, uncovered requirements, and coverage percentage.

### G6: Pipeline lacks a dedicated requirement-categorization stage contract
There is no explicit gated stage between Understanding and Test Cases to guarantee categorized requirements before test generation.

## Required Direction
1. Add contract fields for requirement taxonomy and traceability.
2. Insert a deterministic requirement categorization stage after Understanding.
3. Generate test cases from categorized requirements with requirement linkage.
4. Expose requirement coverage in API and UI.
5. Roll out behind a feature flag for safe migration.
