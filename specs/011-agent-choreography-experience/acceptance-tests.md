# Acceptance Tests 011

## AT1 Unified Orchestration Surface
1. Open Home flow.
2. Confirm one dominant rounded container is rendered.
3. Confirm left agent area and right detail area are both visible.

Pass Criteria:
- Container shape and lane semantics are present on desktop and mobile layouts.

## AT2 Agent Hero Transition
1. Start with first agent active.
2. Complete first agent.
3. Observe hero compressing upward and becoming compact.
4. Observe next agent entering from bottom to center.

Pass Criteria:
- Motion sequence is deterministic and matches required contract.

## AT3 Upcoming Agent Preview
1. While one agent is running, verify next agent preview is visible.

Pass Criteria:
- Preview changes correctly when current agent changes.

## AT4 Subagent Stream
1. Trigger processing phase with subagents.
2. Verify each subagent displays pending, running, and completed or failed states in order.
3. Verify right-pane text updates match active subagent.

Pass Criteria:
- Subagent order and text updates are synchronized with lifecycle events.

## AT5 Dual Upload Summaries
1. Upload documents and codebase inputs.
2. Verify both upload cards show collapsed counts.
3. Expand each card and verify full list details.
4. Apply all, included, excluded, reviewed filters.

Pass Criteria:
- Counts and file lists are consistent across filters.

## AT6 Retry And Downstream Reset
1. Complete at least two agents.
2. Navigate to previous agent and retry.
3. Verify downstream agent outputs and visuals disappear.
4. Verify new processing appears under incremented generation.

Pass Criteria:
- No stale downstream outputs remain after retry.

## AT7 Restore Consistency
1. Reload or revisit run from run history.
2. Verify current generation and active agent states reconstruct correctly.

Pass Criteria:
- UI state is deterministic after restore.

## AT8 Diagnostics Continuity
1. Trigger an error in one agent or subagent.
2. Confirm diagnostics are visible and actionable.

Pass Criteria:
- Error details are never hidden by animation states.
