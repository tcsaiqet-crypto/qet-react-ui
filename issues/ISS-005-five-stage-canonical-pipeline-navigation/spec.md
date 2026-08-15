# Specification: ISS-005 — 5-Stage Canonical Pipeline Navigation & Left Rail Auto-Scroll

## 1. Problem Statement
The user navigation was previously spread across an uncoordinated 11-step list, creating cognitive overload and confusion regarding which agent was actively executing, what inputs were required, and how to proceed to the next step.

## 2. User Stories
- **US-1**: As a user, I want a clean 5-stage left navigation rail so I can easily track pipeline progress from intake to final quality report.
- **US-2**: As an operator watching automated runs, I want the active step to automatically scroll into view and pulse with live status indicators.
- **US-3**: As a tester, I want completed stages to show green checkmarks and stage statistics (e.g. 5 requirements parsed, 12 test cases generated).

## 3. Functional Requirements
1. **Canonical Stage Pipeline**:
   - Stage 1: Document & Codebase Intake
   - Stage 2: Requirement Understanding (Intent, Business Rules, Compliance)
   - Stage 3: Test Generation (Test Cases, Synthetic Data, Playwright Scripts)
   - Stage 4: Playwright Execution (Headed runner, Pause/Resume/Stop)
   - Stage 5: Executive Quality Report (Pass/Fail metrics, PDF/HTML export)
2. **Auto-Scroll Behavior**:
   - `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` called on active rail node upon stage state update.
3. **One-Button Action Banner**:
   - Floating or docked footer CTA indicating "Generate Test Cases", "Execute Playwright Tests", or "Export Quality Report".

## 4. Acceptance Criteria
- [x] Left navigation displays exactly 5 canonical stages with status icons (`PENDING`, `RUNNING`, `COMPLETED`, `FAILED`).
- [x] Progressing between stages auto-scrolls the active rail item smoothly.
- [x] Locked stages display padlock icon and tooltip explaining prerequisite stages.
