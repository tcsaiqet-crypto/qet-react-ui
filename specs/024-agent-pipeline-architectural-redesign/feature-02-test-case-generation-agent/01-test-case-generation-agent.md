# Feature 02: Test Case Generation Agent

## 1. Overview

The Test Case Generation Agent is the **second stage** in the QET pipeline. It uses AI to synthesize a comprehensive test suite from the application understanding output produced by Agent 1. Every test case is traceable to a specific requirement, component, or user flow.

**No sample data. No placeholders.** If AI fails to produce usable test cases, the agent fails with an actionable recovery message.

---

## 2. Test Case Categories

| Category | Description | Typical Count |
| :--- | :--- | :--- |
| **Positive** | Happy path — valid inputs, expected success outcomes | 3–5 |
| **Negative** | Invalid inputs, wrong credentials, rejected operations | 3–5 |
| **Boundary** | Edge values — min/max limits, character counts, thresholds | 2–3 |
| **Validation** | Required field checks, format violations, constraint errors | 2–3 |
| **Error Handling** | Network errors, session expiry, server errors, timeouts | 1–2 |
| **Total** | | **10–14 per run** |

---

## 3. User Stories

- **US-1**: As a QA engineer, I see a structured table of all generated test cases with category color badges.
- **US-2**: As a QA engineer, I can filter test cases by category using pill buttons (All / Positive / Negative / Boundary / Validation / Error-Handling).
- **US-3**: As a QA engineer, I can expand any test case row to see its full details: steps, expected result, preconditions, requirement trace, and confidence level.
- **US-4**: As a QA engineer, I can select/deselect individual test cases using checkboxes.
- **US-5**: As a QA engineer, I have `[Select All]` and `[Clear Selection]` bulk controls.
- **US-6**: As a QA engineer, the `[Proceed to Data Generation →]` button shows the count of selected cases and only activates when ≥1 case is selected.
- **US-7**: As a QA engineer, I can regenerate the test suite with `[Regenerate Test Cases]` which re-calls the AI agent.

---

## 4. Workspace UI Design

```
┌─ Test Case Generation ────────────────────────────────────────────────────┐
│                                                                           │
│  🧪 AI-Generated Test Suite  •  14 cases  •  Gemini  •  Prompt v2        │
│                                                                           │
│  [☑ Select All (14)]  [☐ Clear]  Filters: [All] [Pos] [Neg] [Bnd] [Val]  │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ ☑ TC-POS-001 [POSITIVE]  Valid Login Authentication     [High]    │   │
│  │   Steps: 1.Navigate /login 2.Enter valid creds 3.Assert dashboard  │   │
│  │   Expected: Dashboard renders with welcome banner                  │   │
│  ├────────────────────────────────────────────────────────────────────┤   │
│  │ ☑ TC-NEG-002 [NEGATIVE]  Invalid Password Rejection     [High]    │   │
│  │   Steps: 1.Navigate /login 2.Enter wrong password 3.Assert error   │   │
│  │   Expected: Error message "Invalid credentials" displayed          │   │
│  ├────────────────────────────────────────────────────────────────────┤   │
│  │ ☐ TC-BND-003 [BOUNDARY]  Minimum Income Threshold       [Medium]  │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  [🔄 Regenerate Test Cases]                                               │
│                                                                           │
│  ┌─ Bottom CTA ──────────────────────────────────────────────────────┐    │
│  │  ☑ 12 cases selected  [Proceed to Data Generation (12) →]         │    │
│  └───────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Functional Requirements

### FR-1: AI Test Case Synthesis
- Prompt includes: application summary, components list, user flows, requirement validation gaps.
- Must produce all 5 category types in a single response.
- Each case must have: `case_id`, `title`, `case_type`, `feature_area`, `requirement_id`, `description`, `priority`, `steps` (array), `expected_result`, `preconditions` (array), `confidence`.

### FR-2: Requirement Traceability
- Each test case references a `requirement_id` from the understanding output.
- Traceability matrix is saved as artifact: `test_cases_traceability_matrix.json`

### FR-3: Selection Controls
- Checkboxes on each row, individually togglable.
- `[Select All]` selects all visible (filtered) cases.
- `[Clear Selection]` deselects all cases.
- Category filter pills filter the visible list; Select All respects current filter.

### FR-4: Test Case Detail Expansion
- Click anywhere on a test case row to expand/collapse inline detail panel.
- Detail panel shows: full steps list, expected result, preconditions, requirement ID link, feature area, priority badge, confidence badge.

### FR-5: Regeneration
- `[Regenerate Test Cases]` re-runs the AI agent with a fresh prompt.
- Regeneration resets downstream agents (Data Generation, Test Script, Execute, Dashboard).
- User is warned before regenerating: "This will reset all downstream outputs. Continue?"

### FR-6: Bottom CTA
- Button label dynamically shows selection count: `[Proceed to Data Generation (12) →]`
- Button disabled when 0 cases selected.
- Clicking proceeds to Agent 3 and passes selected case IDs to it.

---

## 6. Artifacts Saved

| Artifact | Format | Path |
| :--- | :--- | :--- |
| Full test suite | JSON | `uploads/{run_id}/artifacts/test_cases.json` |
| Spreadsheet export | CSV | `uploads/{run_id}/artifacts/test_cases.csv` |
| Traceability matrix | JSON | `uploads/{run_id}/artifacts/test_cases_traceability_matrix.json` |

---

## 7. Backend API Contracts

```
POST /api/v1/runs/{run_id}/generate-test-cases
  Response: SSE stream → { event: "progress" | "completed", data: TestSuite }

GET /api/v1/runs/{run_id}/test-cases
  Response: { test_suite: TestSuite }

POST /api/v1/runs/{run_id}/generate-test-cases/retry
  Response: SSE stream (regenerates fresh)
```

---

## 8. Acceptance Criteria
- [ ] 10–14 AI-generated test cases displayed, all 5 types represented.
- [ ] Category filter pills correctly filter the visible list.
- [ ] Checkboxes, Select All, and Clear Selection work correctly.
- [ ] Expanding a test case row shows full steps, expected result, and requirement trace.
- [ ] `[Proceed to Data Generation]` button shows correct count and is disabled at 0 selections.
- [ ] Regenerate shows confirmation dialog and resets downstream outputs.
- [ ] Test case artifacts saved to correct paths.
