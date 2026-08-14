# F04 Coverage Endpoint Contract Hardening

## Objective
Increase confidence in requirement coverage API by validating non-empty, mapped scenarios.

## Scope
1. Seed a test run state with:
   - requirements
   - requirement categories
   - generated test cases mapped by requirement_id
2. Assert coverage response fields for:
   - total_requirements
   - covered_requirements
   - coverage_percentage
   - category-level totals and percentages
   - mapped_test_cases per requirement

## Acceptance
1. Coverage endpoint tests validate both empty and non-empty paths.
2. Category and requirement mapping math is deterministic in tests.
