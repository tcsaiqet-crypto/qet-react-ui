# Prompt For Antigravity (Spec-Kit 011)

You are Antigravity. Execute Spec-Kit 011 as the choreography-first implementation pass for agent lifecycle UX, deterministic progress contracts, and verification closure.

## Paths
- Project root: C:/Users/AkshatSinha/Documents/avd/qet-react-ui
- Backend root: C:/Users/AkshatSinha/Documents/avd/qet-react-ui/backend
- Spec root: C:/Users/AkshatSinha/Documents/avd/qet-react-ui/specs/011-agent-choreography-experience

## Read First
1. README.md
2. spec.md
3. constitution.md
4. data-contracts.md
5. gaps.md
6. plan.md
7. tasks.md
8. acceptance-tests.md
9. risks.md
10. launcher.md

## Scope
Implement only the gaps and objectives defined by Spec-Kit 011 for:
1. Agent choreography UX.
2. Main-agent and subagent lifecycle contract determinism.
3. Retry and downstream invalidation behavior.
4. Dual-upload summary and filtering behavior.
5. Regression-proof verification and evidence output.

## Must Fix
1. G1: Build one large curvy orchestration container with left agent progression and right live processing detail.
2. G2: Implement deterministic agent hero-to-compact transitions and next-agent bottom-to-center entry motion.
3. G3: Add visible upcoming-agent preview while active agent and subagents process.
4. G4: Implement subagent one-by-one processing stream with stateful animations and textual updates.
5. G5: Implement dual upload lanes with collapsed stats, expandable file lists, and included or excluded or reviewed filters.
6. G6: Implement previous-agent navigation and retry that clears all downstream agent outputs and progress.
7. G7: Align frontend state and backend status contracts so UI progress is event-grounded and never synthetic.
8. G8: Add automated and manual verification coverage for choreography, contracts, and reset semantics.

## Required UX Contract
1. The primary view is one large rounded orchestration surface.
2. Left side shows agent ladder and active hero agent.
3. Right side shows processing narrative for current agent context.
4. On completion of current agent:
   1. Hero shrinks and moves up as completed compact item.
   2. Next agent rises from bottom to center and becomes hero.
5. Top area always shows next agent preview if available.
6. Subagents render in sequence with individual start, running, complete, and failed visuals.
7. Live text must reflect exactly what is processing at main-agent or subagent level.
8. Two upload areas must be visible and independently summarized.
9. Upload summaries must default to collapsed stats and allow expansion to full file lists.
10. Filters must support all, included, excluded, reviewed.
11. Going to previous agent or retrying must remove downstream results and visuals immediately.

## Backend And State Contract Rules
1. Define and use explicit lifecycle events for agent and subagent state transitions.
2. Include timestamps and provenance in progress events.
3. Retry of agent N invalidates state for N+1 to terminal stage.
4. Status payloads must be sufficient for deterministic UI reconstruction after refresh.
5. Preserve existing diagnostics and error transparency.

## Constraints
1. Keep compatibility with existing app flow and run lifecycle.
2. Do not fake completion, progress, or success states.
3. Keep failures explicit, inspectable, and actionable.
4. Keep code changes scoped to Spec-Kit 011 objectives only.
5. If behavior is already correct, validate and document evidence instead of reworking.
6. Preserve mobile and desktop usability for the orchestration screen.

## Execution Method
1. Execute strictly in phase order from plan.md and tasks.md.
2. After each phase report:
   1. Files changed.
   2. Commands run.
   3. Pass or fail status.
   4. Blockers and workaround.
3. Do not skip reporting.
4. Do not move to next phase until acceptance criteria for current phase are met.

## Required Output
1. Gap closure matrix mapped to G1 through G8.
2. Change summary grouped by phase and gap.
3. Contract summary showing frontend state transitions aligned with backend payload fields.
4. Test evidence summary with command outputs and outcomes.
5. Manual verification checklist outcomes for choreography and retry or reset behavior.
6. Residual risks and follow-up actions.
7. Final readiness statement for merge.

## Verification Commands
Frontend:
1. npm install
2. npm run build
3. npm run test

Backend:
1. python -m pytest -q

Optional integration checks:
1. Run end-to-end flow with document upload plus zip upload.
2. Verify subagent stream progression during active processing.
3. Trigger previous-agent retry and confirm downstream disappearance.

Start now.
