# F01 Requirement Taxonomy and Contracts

## Objective
Define the canonical requirement taxonomy and schema fields needed for category-driven testing.

## Contract Changes
1. Add RequirementCategory model.
2. Add RequirementType enum values:
   - Functional
   - NonFunctional
   - Security
   - Performance
   - Accessibility
   - Reliability
   - Integration
   - Compliance
   - DataQuality
   - Usability
   - Uncategorized
3. Extend understanding output with requirement categories and catalogs.
4. Extend test case model with traceability fields:
   - requirement_id
   - requirement_category_id
   - requirement_type
   - source_gap_id
   - source_evidence

## Acceptance
1. Models serialize and deserialize with new fields.
2. Existing flows remain backward-compatible with optional defaults.
