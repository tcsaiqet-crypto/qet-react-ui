# Design Decisions Record — Spec 026
## All 20 architectural questions answered by product owner

**Date**: 2026-08-17  
**Status**: LOCKED — ready for implementation

---

## Agent 2 — Test Case Generation

### Q1: Alignment Critic — Rule-based vs AI Scoring
**Decision**: **AI-Only Critic, On-Demand via Button**  
- No automatic rule-based critic runs in the pipeline by default
- A "Check Alignment" button in the Test Case Workspace triggers the AI critic
- Critic suggests improvements; if engineer agrees → AI regenerates accordingly
- If AI critic call fails → allow proceeding with existing generated test cases
- **Impact on Specit C**: Remove automatic LangGraph critic node from the default pipeline. Make it an optional API endpoint triggered by a UI button.

---

### Q2: Behavior When Critic Max Iterations Reached
**Decision**: **Proceed with warning banner in UI**  
- Show the alignment score and which cases are flagged as low-quality
- QA engineer manually decides to continue or abort the pipeline
- Do NOT hard-fail the pipeline

---

### Q3: Maximum Test Case Count
**Decision**: **15 max** (aim for ≤15)  
- Coverage Planner AI must target ≤15 cases total
- Token budget recalculated: 15 cases × 5 per batch = 3 batch calls max
- This keeps the pipeline fast and within a conservative token budget

---

## Agent 3 — Data Generation

### Q4: Variant Records per Test Case
**Decision**: **1 Positive + 1 Negative variant per test case**  
- Every test case gets 2 records: one "ideal positive" and one "alternate negative" set of values
- Allows data-driven re-run with both variants from the same conftest fixture

---

### Q5: API-Only Test Cases
**Decision**: **UI-only scope — no API-only test cases**  
- All test cases in this pipeline are scoped to UI-based browser testing only
- Backend/API-only test cases are out of scope for Spec 026
- Agent 3 always generates browser-UI-appropriate field schemas

---

### Q6: Field Name Contract Validation (Schema ↔ Fixture)
**Decision**: **AI validates and auto-fixes + Manual "Validate & Fix" button in UI**  
- Agent 4b will use AI to validate that field names in the DataSchema match what's used in generated scripts
- A "Validate & Fix" button in the workspace triggers re-validation on demand
- Additionally: add a **chatbot panel** in the Test Case / Script workspace — whatever the engineer types in the chatbot updates that window's content (e.g., "rename field card_pan to card_number" → AI applies it)
- **New Feature Identified**: Workspace Chatbot (to be specced in Spec 026-I)

---

## Agent 4 — Script Synthesis

### Q7: py_compile Validation of Generated Scripts
**Decision**: **Yes — validate every script with py_compile**  
- Run `py_compile` on every generated `.py` file before saving
- If syntax error → reject and trigger AI retry (max 1 retry)
- Surface any persistent syntax error clearly in the UI

---

### Q8: Missing UI Selector Handling
**Decision**: **Raise structured error with specific missing element name**  
- Stop script generation for that specific test case
- Write `{case_id, missing_selector, remediation: "Re-run Understanding to discover this element"}` to state
- Surface clearly in the Script Synthesis Workspace as a named error card (not a generic failure)

---

### Q9: Self-Healer Post-Failure Behavior
**Decision**: **Show diff in UI, engineer clicks "Apply & Re-run"**  
- AI produces a unified diff patch
- UI shows a diff viewer (red/green lines) with "Apply & Re-run" button
- Never auto-apply without engineer confirmation

---

## Agent 5 — Execution Intelligence

### Q10: Risk Scan Timing
**Decision**: **Scan all cases on Execute Workspace load, before user selects anything**  
- Risk badges (🟢🟡🔴) appear on all test case rows immediately when the Execute Workspace opens
- Badges are informational — do not restrict selection

---

### Q11: HIGH Risk Test Cases — Block or Warn
**Decision**: **Warn only — confirm dialog before running**  
- Show: *"X test cases are HIGH risk. Continue?"*
- Never automatically block a test case from running

---

### Q12: Screenshot AI vs Playwright Result Mismatch
**Decision**: **Trust the Playwright script result**  
- If Playwright says PASSED → show PASSED
- AI screenshot evidence is shown as supplementary info only: `📷 AI Evidence: Low confidence (banner not detected)` as a secondary note
- Do not override the script result with AI opinion

---

## Agent 6 — Dashboard Intelligence

### Q13: Executive Summary Editability
**Decision**: **Yes — inline rich-text edit box before PDF export**  
- Show AI-generated summary with editable text area
- Engineer can manually refine before clicking "Export PDF"

---

### Q14: BR Risk Heatmap Interactivity
**Decision**: **Yes — each BR row expands to show individual test case details**  
- Click/expand any BR row → shows test cases under that BR, their pass/fail, and failure classification
- All 18 BRs shown, all expandable

---

### Q15: JIRA / External Tool Integration
**Decision**: **No external integrations — application is fully local**  
- Next steps stay as editable text in the report only
- No JIRA, no Slack, no external API calls for reporting

---

## Infrastructure — Multi-Key Pool & Streaming

### Q16: Key Cooldown/Restore After Rate Limit
**Decision**: **Restore exhausted keys after 2 minutes (120 seconds)**  
- After 120s, a 429-exhausted key becomes available again within the same run
- Track per-key exhaustion timestamp in `ParallelKeyPool`

---

### Q17: Live Key Health Status in UI
**Decision**: **Live key health panel in AI Settings**  
- Each key shown with 3 states:
  - 🟢 Green = Available
  - 🔴 Red = Failed (auth error — permanently disabled for this run)
  - 🟡 Yellow = Exhausted (rate limited — shows countdown timer until restore in 2 min)
- Live update during pipeline execution via WebSocket

---

### Q18: Single Key Behavior
**Decision**: **Allow with warning banner**  
- Show banner: *"Only 1 key available — parallel generation disabled. Add more keys in AI Settings for faster runs."*
- Pipeline runs sequentially with the 1 available key

---

### Q19: Token Usage Tracking
**Decision**: **Custom TokenBudgetCallback — local, no external dependencies**  
- Zero dependency on LangSmith or any external service
- Works fully offline
- Token summary written to `artifacts/provenance.json` after each run

---

### Q20: LangGraph Event Streaming Protocol
**Decision**: **WebSocket for node events + SSE for logs (both)**  
- WebSocket: LangGraph node state transitions (node_start, node_complete, critic_reject, checkpoint_saved)
- SSE: Raw log streaming from Playwright execution (existing pattern preserved)

---

## New Feature Identified During Decision Process

### Spec 026-I: Workspace Chatbot
**Trigger**: Q6 answer  
**What**: Every major workspace (Test Case, Script, Execute, Dashboard) will have an embedded AI chatbot panel. The engineer types natural language instructions, and the AI applies them to the current workspace content.  
**Examples**:
- Test Case Workspace: *"Make TC-NEG-001 more specific to the payment error flow"* → AI updates that test case
- Script Workspace: *"Fix the KYC selector in test_TC_NEG_001.py to use data-testid"* → AI patches the script
- Dashboard Workspace: *"Rewrite the executive summary in a more formal tone"* → AI regenerates that section
**Priority**: 🟡 Medium — can be specced in parallel with main implementation

---

## API Keys Required

Based on all decisions above:
- **Minimum**: 2 Gemini keys (for parallel batch generation with ≤15 cases = 3 batches max)
- **Recommended**: 4–5 Gemini keys (for faster parallel dispatch and key cooldown resilience)
- **OpenAI keys**: Optional — only used as final cross-provider fallback if all Gemini keys exhausted
