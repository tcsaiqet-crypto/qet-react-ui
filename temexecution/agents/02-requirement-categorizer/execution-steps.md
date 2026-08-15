# Categorizer Execution Steps

1. Check whether categorization is enabled.
2. If disabled, persist an explicit skipped decision, not completed output.
3. Require Understanding with non-empty requirements.
4. Apply taxonomy and validate category/type values.
5. Preserve requirement IDs and source evidence.
6. Record AI provenance when AI is used.
7. Update coverage mappings.
8. Persist output with the current generation.
9. Emit failed diagnostics for invalid classifications.
10. Test enabled, disabled, empty, malformed, and retry cases.
