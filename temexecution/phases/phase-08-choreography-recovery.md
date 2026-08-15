# Phase 08 - Choreography And Recovery

## Objective
Make every lifecycle transition understandable and recoverable in the UI.

## Steps
1. Render the active agent and upcoming agent.
2. Render ordered subagent events and live messages.
3. Animate completed agents into compact history.
4. Show failures without hiding diagnostics.
5. Retry an earlier stage and increment generation.
6. Remove downstream outputs and visuals immediately.
7. Restore state after refresh or run-history navigation.

## Exit Gate
The UI reflects persisted events and never invents progress based only on elapsed time.
