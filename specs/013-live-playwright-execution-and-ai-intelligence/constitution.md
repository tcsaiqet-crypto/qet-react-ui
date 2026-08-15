# Constitution 013: Live Execution & AI Intelligence Rules

1. **Headed Desktop Window Execution**: Live test execution must always launch in a dedicated desktop browser window (`--headed`).
2. **Proper Lifecycle State Management**: Pause, Stop, and Resume must operate idempotently and preserve all prior execution snapshots.
3. **Screenshot Evidence for Both Paths**: Screenshots must be captured for both positive passes (`_passed.png`) and negative error rejection states (`_failed.png`).
4. **3-Tier Multi-Level JSON**: Results must be persisted in `multi_level_execution_results.json` detailing run metrics, case-type breakdowns, and why-passed/why-failed reasoning.
5. **Explainable AI Healing**: AI script fixes must display code diffs and explanations before being applied to the workspace.
