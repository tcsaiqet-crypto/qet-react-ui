# F02 Requirement Categorization Stage

## Objective
Introduce a dedicated stage that derives categorized requirements from Understanding output before test generation.

## Stage Placement
Insert after Understanding and before Test Cases.

## Stage Behavior
1. Consume understanding artifacts: components, flows, gaps, notes.
2. Build normalized requirement records.
3. Classify requirement type deterministically with rules and keyword heuristics.
4. Attach provenance and confidence metadata.
5. Persist categorized requirement artifacts in run state.

## Pipeline Rules
1. Test Cases stage must require categorized requirements when feature flag is enabled.
2. Rerunning Understanding invalidates categorized requirements and downstream artifacts.

## Acceptance
1. Stage outputs are deterministic and validated.
2. Stage can be toggled via feature flag.
