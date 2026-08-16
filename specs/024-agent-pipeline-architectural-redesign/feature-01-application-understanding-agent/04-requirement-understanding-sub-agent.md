# Feature 01c: Requirement Understanding Sub-Agent

## 1. Overview

The Requirement Understanding Sub-Agent is the **third and final sub-agent** under the Application Understanding Agent. It uses AI (Gemini/GPT) to analyze the uploaded requirement documents (from 1a) and the indexed codebase snapshot (from 1b) to produce a structured, grounded understanding of the application.

**Key Principle**: All output must be grounded in actual evidence from the uploaded documents and code. No hallucinated routes, selectors, or components.

---

## 2. AI Output Structure

The sub-agent produces:
1. **Application Summary**: 2–4 sentence description
2. **Architecture Notes**: Technology stack, design patterns, deployment type
3. **Components**: UI screens, pages, or feature modules discovered from code
4. **User Flows**: End-to-end journeys extracted from requirements (e.g., "User Registration → KYC Upload → Approval")
5. **Testability Gaps**: Requirements that cannot be verified from current code evidence
6. **UI Inventory**: Every interactive element (buttons, forms, inputs) with DOM selectors
7. **API Inventory**: REST endpoints discovered from codebase
8. **Requirement Validation**: 15-item checklist assessment (Present / Partial / Missing / Not Applicable)

---

## 3. Multi-Domain Testing Tabs

```
┌─ Requirement Understanding ─────────────────────────────────────────────┐
│                                                                         │
│  [🖥️ UI Testing]  [🌐 API Testing — Coming Soon]                         │
│  [📈 Performance — Coming Soon]  [♿ Accessibility — Coming Soon]         │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│  (Active: UI Testing tab content below)                                 │
│                                                                         │
│  📋 Application Summary          📐 Architecture Notes                  │
│  CFA Digital Journey candidate   React SPA + FastAPI Backend            │
│  portal with KYC, document       Deployed on cloud, JWT auth...         │
│  upload, and status tracking.                                           │
│                                                                         │
│  🧩 Discovered Components (6)                                            │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ LoginPage       src/pages/Login.tsx      [#login-form] [btn-submit]│ │
│  │ KYCUploadPage   src/pages/KYCUpload.tsx  [#file-upload] [btn-next] │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  🔄 User Flows (4)             ⚠️ Testability Gaps (3)                  │
│  Login → Dashboard             Missing: error boundary spec             │
│  Register → KYC Upload         Missing: timeout handling rules          │
│                                                                         │
│  ┌─ Bottom CTA ──────────────────────────────────────────────────────┐  │
│  │  ✅ Understanding Complete  [Proceed to Test Case Generation →]    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Functional Requirements

### FR-1: AI-Grounded Analysis
- Prompt must reference uploaded document names and codebase snapshot explicitly.
- Selectors must be grounded: `data-testid` > unique `id` > ARIA role+name > name attribute.
- Model must produce at least 1 component and 1 flow even when evidence is sparse (infer from doc names + snapshot).
- If BOTH components AND flows are empty arrays, fail with a clear user-facing message.

### FR-2: Key Rotation & Recovery
- On key exhaustion, show inline dismissible banner with input for new API key.
- After saving new key, allow immediate retry without leaving the page.
- The banner has an `[X]` dismiss button to hide it if not needed.

### FR-3: Multi-Domain Tab Display
- **UI Testing**: Full active workspace with components, flows, gaps, UI inventory, API inventory.
- **API Testing**: Visible tab, grayed workspace, "Coming Soon – API contract testing scheduled for Phase 7"
- **Performance Testing**: Visible tab, grayed workspace, "Coming Soon – Concurrency & latency benchmarking"
- **Accessibility Testing**: Visible tab, grayed workspace, "Coming Soon – WCAG 2.1 AA audit engine"

### FR-4: Requirement Validation Checklist
- Show 15-item checklist from the `RequirementValidationReport`.
- Each item: number, name, status badge (Present / Partial / Missing / Not Applicable), evidence source, confidence.
- Overall quality score percentage shown at top.

### FR-5: Retry & Re-Run
- `[Retry Analysis]` button always visible while status is Failed.
- Retrying re-runs only sub-agent 1c without affecting docs or codebase.
- On retry, clears previous understanding output and shows new analysis.

### FR-6: Bottom Progression CTA
- After successful completion, bottom banner appears:
  - ✅ "Application Understanding Complete"
  - Large `[Proceed to Test Case Generation →]` button
  - This button advances the left-rail focus to Agent 2.

---

## 5. Grounded Selector Priority Rules (Strictly Enforced)
1. `data-testid` attribute
2. Unique `id` attribute
3. ARIA role + accessible name (`getByRole('button', { name: 'Submit' })`)
4. `name` attribute on form elements
5. CSS class (only when uniquely identifying)
6. XPath (last resort, must be documented as uncertain)

---

## 6. Backend API Contracts

```
POST /api/v1/runs/{run_id}/understand
  Body: { preferred_provider: "gemini" | "gpt" }
  Response: SSE stream → { event: "progress" | "completed" | "error", data: {...} }

GET /api/v1/runs/{run_id}/understanding
  Response: ApplicationUnderstanding (full schema)

POST /api/v1/runs/{run_id}/understand/retry
  Body: { new_key?: string }
  Response: SSE stream (same as above)
```

---

## 7. Acceptance Criteria
- [ ] Analysis uses uploaded docs and code snapshot — no hallucinated content.
- [ ] At least 1 component and 1 flow returned in every successful analysis.
- [ ] UI/API/Performance/Accessibility tabs render with correct Coming Soon state.
- [ ] Key exhaustion shows dismissible inline recovery banner.
- [ ] Requirement validation checklist renders all 15 items with status badges.
- [ ] Bottom "Proceed to Test Case Generation" CTA appears on completion.
- [ ] Retry clears only understanding output, not docs or codebase.
