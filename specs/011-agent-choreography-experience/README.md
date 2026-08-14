# Spec-Kit 011: Agent Choreography Experience

## Goal
Deliver a choreography-first execution experience where users can clearly see agent progression, subagent work, dual upload outcomes, and deterministic retry behavior in one screen.

## Why This Kit Exists
Current staged UX partially represents agent progression but does not fully deliver subagent-level visibility, complete transition choreography, or deterministic downstream invalidation when retrying a previous agent.

## Artifacts
- spec.md
- constitution.md
- data-contracts.md
- gaps.md
- launcher.md
- plan.md
- risks.md
- acceptance-tests.md
- tasks.md
- prompt.md
- antigravity-master-prompt.md

## Definition Of Done
1. One large rounded orchestration surface presents left agent progression and right processing detail.
2. Agent hero-to-compact transition and next-agent entry animation are deterministic and test-covered.
3. Subagent stream is visible with ordered state changes and live text.
4. Dual upload cards support collapsed stats, expanded lists, and included or excluded filtering.
5. Retrying a previous agent removes downstream state and visuals deterministically.
6. Backend and frontend lifecycle contracts are aligned and reproducible.
7. Verification evidence is captured with command logs and acceptance results.
