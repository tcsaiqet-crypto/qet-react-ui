# Feature 07: UI Navigation Redesign — Left-Rail Pipeline, Bottom CTAs & No Sample Data

## 1. Overview

The entire UI navigation model is being redesigned. The old top-navigation tab model (`home`, `understanding`, `execution`, `tools`) is replaced with a **single-page left-rail driven experience** where the active agent stage determines the workspace content.

**Key principles**:
1. Left rail = sole navigation mechanism
2. Bottom CTA = sole mechanism to proceed to next agent
3. No sample data anywhere in the system
4. No "Execution" tab in the header
5. Tools / Settings accessible via header icon only

---

## 2. Left Rail Structure

```
┌────────────────────────────────────┐
│  QET  [Run: RUN-20260816-XXXX]     │  ← Header with Run ID
│  ─────────────────────────────     │
│  ▼ Application Understanding  ●    │  ← Expandable parent, In Progress
│    ✅  1a Requirement Intake       │
│    ✅  1b Codebase Intake          │
│    ⏳  1c Requirement Understanding│
│                                    │
│  ○  Test Case Generation      ···  │  ← Pending
│  ○  Data Generation           ···  │
│  ○  Test Script               ···  │
│  ○  Execute                   ···  │
│  ○  Dashboard                 ···  │
│  ─────────────────────────────     │
│  [⚙ Settings]  [📋 Run History]   │  ← Footer controls
└────────────────────────────────────┘
```

---

## 3. Left Rail Agent Status Badges

| Status | Icon | Appearance |
| :--- | :--- | :--- |
| `Pending` | `○` | Gray, no fill |
| `In Progress` | `⏳` | Amber, pulsing dot |
| `Completed` | `✅` | Green, checkmark |
| `Failed` | `❌` | Red, X |
| `Blocked` | `🔒` | Gray, lock icon (missing upstream output) |

---

## 4. Workspace Navigation Rules

- Clicking a completed agent in the left rail navigates to its workspace (read-only view).
- Clicking a pending/blocked agent shows a "This stage requires [upstream] to complete first" message.
- Clicking the currently active agent keeps workspace focused on it.
- The workspace area scrolls independently; the left rail stays fixed.

---

## 5. Bottom CTA Specification

Every agent workspace ends with a standardized bottom progression card:

```tsx
<div className="stage-progression-card">
  <div className="stage-icon-and-text">
    <CheckCircle className="success-icon" />
    <div>
      <h3>{currentStageName} Complete</h3>
      <p>{nextStageDescription}</p>
    </div>
  </div>
  <button
    onClick={proceedToNextStage}
    disabled={!stageComplete}
    className="proceed-button"
  >
    {nextStageLabel} <ArrowRight />
  </button>
</div>
```

| Agent | CTA Label |
| :--- | :--- |
| After sub-agent 1a | `[Confirm Requirement Intake →]` |
| After sub-agent 1b | `[Confirm Codebase Intake →]` |
| After sub-agent 1c | `[Proceed to Test Case Generation →]` |
| After Agent 2 | `[Proceed to Data Generation (N) →]` |
| After Agent 3 | `[Proceed to Test Script Agent →]` |
| After Agent 4 | `[Proceed to Execute Agent →]` |
| After Agent 5 | `[View Dashboard →]` |

---

## 6. Removal of Sample Data

All of the following must be **removed completely**:

| Item to Remove | Location |
| :--- | :--- |
| "Use Sample Data" button | `HomeUploadPage.tsx` |
| Sample data API endpoint | `fastapi_app.py` |
| Static sample ZIP bundle | `backend/sample_cfa_app/` (if present) |
| Hardcoded field names in TestDataAgent | `test_data_agent.py` (lines 55–61) |
| `fallback_used = True` paths | All agents |
| Sample requirement docs preset | `HomeUploadPage.tsx` |

Any code path that previously returned hardcoded or static test data must instead:
1. Fail with `AIRequiredFailureException` with `error_code: "ai_required"` 
2. Show a clear user-facing message: "This step requires AI to be configured. Please add a valid API key."

---

## 7. Header Simplification

**Old header**: Home | Understanding | Execution | Tools tabs
**New header**: Logo + Run ID + `[⚙ Settings]` icon + `[🌙 Theme]` toggle + `[🔍 Zoom]`

No navigation tabs in the header. Navigation is exclusively through the left rail.

---

## 8. Run History Access

- `[📋 Run History]` in the left rail footer opens a `RunsDashboard` panel.
- Shows all past runs with status, date, and pass rate.
- Clicking a past run loads its state into the workspace (read-only).

---

## 9. AI Settings Panel

- Accessible via `[⚙ Settings]` icon in header.
- Opens as a right-side slide-in drawer.
- Contains: Gemini API key management, GPT key management, Model selection, Key rotation settings.

---

## 10. Acceptance Criteria
- [ ] No top-navigation tabs in the header (Home/Understanding/Execution tabs removed).
- [ ] Left rail shows all 6 agents with sub-agents nested under Agent 1.
- [ ] Clicking completed agents navigates to their workspace in read-only mode.
- [ ] Clicking blocked agents shows a "requires upstream" message.
- [ ] All "Use Sample Data" buttons, API endpoints, and code paths removed.
- [ ] Bottom CTA appears correctly after each agent stage completes.
- [ ] Settings panel accessible from header icon.
- [ ] Run history accessible from left rail footer.
- [ ] AI-required failure shows clear "add API key" message when no data fallback.
