# Phase 01 - Shared Contracts

## Objective
Make lifecycle, readiness, dependency, output, provider, and error behavior explicit.

## Steps
1. Define canonical agent IDs and stage ordering.
2. Define `pending`, `running`, `completed`, `failed`, and `invalidated` statuses.
3. Add event IDs, timestamps, source, and generation.
4. Define persisted state required for refresh reconstruction.
5. Define retry invalidation from stage N through the final stage.
6. Add backend and frontend contract tests.

## Exit Gate
A frontend renderer can reconstruct the current run without guessing from timing or labels.
