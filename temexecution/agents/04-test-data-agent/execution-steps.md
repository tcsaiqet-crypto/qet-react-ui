# Test Data Execution Steps

1. Require a valid non-empty test suite.
2. Extract field constraints, boundary values, relationships, and required setup.
3. Generate synthetic values with no real credentials or personal data.
4. Include valid, invalid, boundary, and empty-value variants where needed.
5. Validate records against the declared shape.
6. Link each dataset row to test cases.
7. Persist dataset, seed metadata, and provenance.
8. Emit explicit failure for impossible constraints.
9. Block Playwright when data is invalid or absent.
10. Test reproducibility, schema failure, and retry cleanup.
