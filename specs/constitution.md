# Quantum Engineering Toolkit (QET) — Master Platform Constitution

## Article I: Product Truth & Integrity
1. **No Fabricated Data or Fallbacks**: The platform shall never manufacture synthetic UI controls, placeholder selectors, or fictitious requirements when upstream evidence is insufficient.
2. **AI-Required Discipline**: When operating in AI-Required mode, if the LLM is unconfigured or fails, the platform must fail fast with structured, actionable diagnostics rather than falling back to hardcoded samples.
3. **Deterministic State Synchronization**: UI progress, stage statuses, and telemetry must directly reflect backend state machine transitions. Fabricated timers or simulated completion delays are strictly prohibited.
4. **Single Source of Truth**: All domain models, agent outputs, and telemetry events must adhere strictly to `backend/schemas/contracts.py` on the backend and `src/types.ts` on the frontend.

---

## Article II: Multi-Agent Pipeline & Lifecycle
1. **Sequential Stage Ordering**: Execution must follow the strict 5-stage progressive flow:
   - Phase 1: Requirement & UI Understanding
   - Phase 2: Test Case Design & Category Coverage (5 Disciplines)
   - Phase 3: Synthetic Data Generation (Dual-Engine: Schema-driven + Mock-fallback)
   - Phase 4: Playwright Test Script Package Assembly (Dedicated per-case scripts)
   - Phase 5: Headed Execution, Evidence Collection & Executive Sign-off
2. **Downstream Invalidation on Upstream Retry**: Retrying an upstream agent stage (e.g., Understanding) must atomically wipe all downstream artifacts from memory, state, and disk to prevent stale data corruption.
3. **Lifecycle Controls**: The pipeline and live execution runner must support clean **Pause**, safe **Stop**, and idempotent **Resume** from the paused stage without invalidating completed upstream work.

---

## Article III: Safety, Security & Production Guardrails
1. **Production Host Blacklist**: The execution engine must strictly prohibit test execution against target domains containing production keywords (`prod`, `production`, `live`, `cfa.com`, `bankofamerica.com`, `chase.com`).
2. **Path Traversal Defense**: All archive handling (ZIP extraction, artifact storage) must enforce strict boundary checks to prevent Zip Slip vulnerabilities and directory escapes.
3. **Execution Verification Gates**: Playwright UI test execution strictly requires:
   - Explicit confirmation of a non-production target.
   - Script review verification.
   - Explicit user execution approval.
4. **Non-PII Compliance**: Synthetic test datasets must strictly use synthetic/fictitious PII-safe values (e.g. SSN `999-xx-xxxx`, test emails, dummy phone numbers).

---

## Article IV: Test Automation & Evidence Standards
1. **Dedicated Test Scripts**: In Phase 4, every test case (Positive, Negative, Boundary, Validation, Error-Handling) must be synthesized into its own dedicated standalone Python Playwright script file (`tests/test_{case_id}_{slug}.py`) with Page Object Model integration.
2. **Headed Desktop Window Execution**: Execution must always run in headed mode (`--headed`) in a dedicated desktop browser window to provide live visibility.
3. **Visual Screenshot Evidence**: Full-page screenshots must be automatically captured and stored for positive passes (`_passed.png`) and negative error rejection states (`_failed.png`).
4. **3-Tier Multi-Level JSON Reporting**: Every run must produce `multi_level_execution_results.json` detailing run summary, breakdowns by case type and feature area, and per-script diagnostics with explicit `why_passed` and `why_failed` explanations.

---

## Article V: AI Intelligence & Script Healing
1. **Explainable AI Root Cause Analysis**: When tests fail, AI test intelligence must classify failures into the 7-tier taxonomy (`selector_defect`, `timing_issue`, `application_defect`, `data_defect`, `environment_defect`, `test_defect`, `unknown`) and explain root causes.
2. **Safe Code Healing**: AI-assisted script modifications must provide side-by-side code diffs, rationale summaries, and require user confirmation before overwriting workspace files.

---

## Article VI: Dual-Pane Navigation, Drawer Inspector & Staged Understanding UX (Spec-Kit 014)
1. **Progressive Cognitive Disclosure**: During initial ingestion, the Left Rail and Center Canvas must emphasize the **3 Progressive Understanding Agents** (1. Requirement Understanding Agent, 2. Document Intake Agent, 3. Application Understanding Agent) before revealing downstream execution stages.
2. **Deterministic Stage Selection**: Clicking any completed, active, or pending agent in the Left Rail must immediately synchronize `selectedAgentId` across the application without altering scroll position or discarding transient operator input.
3. **Right-Side Collapsible Inspector Drawer**: Every selected agent must expose a dedicated 4-tab inspection drawer (`Overview & Inputs`, `Subagents & Live Activity`, `Outputs & Artifacts`, `Actions & Retry`) with responsive docking on widescreen displays ($\ge 1280\text{px}$) and slide-over overlays on smaller viewports.
4. **Staged Hero Motion Orchestration**: The main canvas must guide the user with staged hero transitions:
   - **Hero 1 (Docs Intake)**: Prominent dropzone; once indexed, smoothly shrinks upward into a top summary strip.
   - **Hero 2 (Codebase Intake)**: Becomes the active hero dropzone; upon AST extraction, collapses into an indexed code summary strip.
   - **Hero 3 (AI Application Synthesis)**: Takes center stage for live AST traversal, DOM mapping, and 15-point checklist gap scoring.
5. **Bidirectional Deep-Linking**: Clicking any subagent, AST component, or 15-point checklist matrix item anywhere in the UI must deep-link directly to that item in the Right Drawer's respective tab.
6. **Isolated Stage Retry with Cascading Safety**: Any stage-level retry triggered from the Left Rail or Drawer must clearly notify the user of downstream invalidation before clearing dependent artifacts.
