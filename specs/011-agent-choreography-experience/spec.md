# Spec 011: Agent Choreography And Lifecycle Clarity

## Objective
Build a high-clarity execution screen where users can track which agent is active, what each subagent is processing, what files were uploaded and filtered, and what is invalidated when retrying previous steps.

## User Journey
1. User uploads documents and codebase inputs through two distinct upload zones.
2. User sees a large curved orchestration panel with left agent progression and right processing details.
3. Active agent appears as a hero state while next agent preview is visible.
4. Subagents progress one-by-one with live text and status transitions.
5. When an agent completes, it compresses into a compact completed badge and next agent animates into hero position.
6. User can move to previous agent and retry, which clears later-agent progress and outputs.
7. User can expand upload summaries and filter included or excluded file lists.

## Functional Scope
1. Orchestration layout and transition choreography.
2. Main-agent and subagent lifecycle rendering.
3. Upload summary interaction model.
4. Retry and reset semantics.
5. API and state contract consistency.
6. Verification and acceptance evidence.

## Out Of Scope
1. New autonomous agent types not already in lifecycle.
2. Full redesign of unrelated pages.
3. Large backend pipeline refactors beyond lifecycle event contracts.

## Success Criteria
1. Every stage change is understandable without reading logs.
2. Retry behavior never leaves stale downstream artifacts.
3. UI reflects real status events only.
4. Automated tests protect choreography and reset behavior.
