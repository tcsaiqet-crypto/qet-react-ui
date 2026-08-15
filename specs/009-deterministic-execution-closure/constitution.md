# Constitution 009: Deterministic Execution Rules

1. **Deterministic Test Output**: Test execution harnesses must yield repeatable results given identical input codebases.
2. **Environment Safety**: Mock fallbacks must only activate in simulated mode and never override real browser execution when configured.
3. **No Flaky Timing**: Pytest executions must enforce timeout guards and clean subprocess cleanup.
