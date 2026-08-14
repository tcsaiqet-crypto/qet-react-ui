# Constitution 011: Non-Negotiable Rules

## Product Truth Rules
1. Do not show fabricated progress states.
2. Do not hide backend failure diagnostics.
3. Do not keep downstream results after upstream retry.
4. Do not mark an agent complete unless backend state confirms completion.

## UX Rules
1. Keep one dominant curved orchestration container.
2. Left side is for agent progression, right side is for context details.
3. Main-agent transitions must be animated and deterministic.
4. Subagent transitions must be ordered and human-readable.
5. Upload summaries must remain accessible in collapsed and expanded form.

## Engineering Rules
1. Keep contract fields backward compatible where feasible.
2. Add tests for every new behavior branch.
3. Avoid unrelated refactors in this kit.
4. Preserve existing run restoration and diagnostics behavior.

## Validation Rules
1. Each must-fix gap must map to code changes and tests.
2. Verification commands must be repeatable and logged.
3. Final output must include a gap closure matrix.
