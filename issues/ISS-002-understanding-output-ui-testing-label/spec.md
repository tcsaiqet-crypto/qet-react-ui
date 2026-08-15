# ISS-002 · Spec — Understanding Page UI Testing Context

## AI Provenance Strip Labels for UI Testing

When `UI Testing` tab is active, the provenance/audit card must say:

| Field | Current | Expected (UI Testing) |
| --- | --- | --- |
| Analysis Scope | (not shown) | `UI / End-to-End Testing` |
| Framework Detected | (in exec summary) | Shown prominently in header |
| Selectors Strategy | (not shown) | `data-testid, aria-*, CSS, XPath` |
| Coverage Estimate | (not shown) | `12 components discoverable` |

---

## Testability Score Card Layout

```
┌─ UI Testability Score ──────────────────────────────────┐
│  🟢 Selectors Coverage: 87%   🟡 Forms Found: 3         │
│  🟢 User Flows Mapped: 5      🔵 Components: 12         │
│  ⚠️  Gaps Detected: 2         ✅ Testable: 10/12        │
└─────────────────────────────────────────────────────────┘
```

Data source: `understanding.testability_observations` fields:
- `testable_component_count`
- `total_component_count`
- `stable_selector_count`
- `form_count`
- `user_flow_count`
- `gap_count`

---

## Component Card — Selectors Display

Current component card:
```
┌─ LoginForm ─────────────────────────────────────────────┐
│  Type: Form Component · React / TypeScript              │
│  File: src/pages/Login.tsx                              │
│  [← Back][Submit →]                                     │
└─────────────────────────────────────────────────────────┘
```

Required (UI Testing context):
```
┌─ LoginForm ─────────────────────────────────────────────┐
│  Type: Form Component · React / TypeScript              │
│  File: src/pages/Login.tsx                              │
│  Selectors:                                             │
│  [#username] [#password] [data-testid="login-btn"]      │
│  [← Back][Submit →]                                     │
└─────────────────────────────────────────────────────────┘
```

React implementation:
```tsx
{component.selectors && component.selectors.length > 0 && (
  <div className="flex flex-wrap gap-1 mt-2">
    {component.selectors.map(sel => (
      <code key={sel} className="px-1.5 py-0.5 rounded text-[10px] bg-sky-950 text-sky-300 font-mono border border-sky-800">
        {sel}
      </code>
    ))}
  </div>
)}
```

---

## Flow Cards — Playwright Steps Display

Current flow card shows: title + description  
Required:

```
┌─ CFA Candidate Login Flow ──────────────────────────────┐
│  Playwright Automation Steps:                           │
│  1 › Navigate to /login                                 │
│  2 › Fill #username with test email                     │
│  3 › Fill #password with test password                  │
│  4 › Click [data-testid="login-btn"]                    │
│  5 › Assert redirect to /dashboard                      │
└─────────────────────────────────────────────────────────┘
```

Data source: `flow.steps[]` array in `ApplicationFlow` type.

---

## Gaps Section — UI Testing Context

Current: "Inferred Requirement Gaps"  
When `UI Testing` active: "**UI Testability Gaps**"

Sub-label on each gap:
- `Impact: Cannot automate login without stable selectors`
- Show severity badge: `High` / `Medium` / `Low`
