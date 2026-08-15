# Test Data Agent

## Responsibility
Create valid synthetic data for the generated test suite without exposing secrets or pretending that data is production data.

## Inputs
- Valid test suite.
- Requirement constraints and input schemas.

## Outputs
- Synthetic dataset.
- Field-level provenance and validation.
- Reproducible dataset metadata.

## Code Anchors
- `backend/src/agents/test_data_agent.py`
- `backend/schemas/contracts.py`
- `backend/src/workflows/pipeline.py`
