# UI Requirements Analysis & Understanding Engine Specification

## 1. Objective
Ensure the Requirement Understanding Agent parses uploaded documents and extracted application files with high fidelity to extract exact UI screens, form elements, interaction flows, and validation rules.

---

## 2. Requirement Parsing & Grounding Pipeline

```
┌─────────────────────────┐     ┌─────────────────────────┐
│ Uploaded Requirements   │     │ Extracted Source Code   │
│ (8 CFA Documents)       │     │ (.tsx, .jsx, .py, etc.) │
└────────────┬────────────┘     └────────────┬────────────┘
             │                               │
             └───────────────┬───────────────┘
                             │
                             ▼
             ┌───────────────────────────────┐
             │ UI Requirement Understanding  │
             │ AI Analysis Agent             │
             └───────────────┬───────────────┘
                             │
       ┌─────────────────────┴─────────────────────┐
       ▼                                           ▼
┌─────────────────────────────┐     ┌─────────────────────────────┐
│ UI Components & Selectors   │     │ End-to-End User Journeys    │
│ - ID, Name, data-testid     │     │ - Positive Happy Path       │
│ - Required vs Optional      │     │ - Negative Validation Loops │
│ - Validation regex / rules  │     │ - Boundary Edge Conditions  │
└─────────────────────────────┘     └─────────────────────────────┘
```

---

## 3. Grounded Selector Hierarchy
To avoid fabricated selectors, the analyzer follows strict precedence:
1. `data-testid` / `data-test` attributes
2. Unique DOM `id` attributes
3. Accessible role & name locators (e.g. `getByRole('button', { name: 'Submit' })`)
4. Unique `name` attributes (form inputs)
5. Precise CSS / XPath hierarchy derived directly from codebase AST.

---

## 4. Multi-Domain Testing Tabs Configuration

| Testing Domain | Status | UI Badge | Behavior |
| :--- | :--- | :--- | :--- |
| **🖥️ UI Testing** | **Active** | `Live / Primary` | Full component extraction, Playwright script generation & execution. |
| **🌐 API Testing** | **Planned** | `Coming Soon` | REST/GraphQL contract testing, Swagger discovery (Phase 7). |
| **📈 Performance Testing**| **Planned** | `Coming Soon` | Locust/k6 concurrency & latency benchmark suites (Phase 8). |
| **♿ Accessibility Testing**| **Planned** | `Coming Soon` | WCAG 2.1 AA automated audits with axe-core (Phase 9). |

---

## 5. Output Verification Criteria
- [ ] No generic summary; summary reflects specific application pages (e.g., CFA Candidate Portal, Document Upload, KYC Form).
- [ ] All extracted components list discovered selectors with file paths.
- [ ] Gaps are tagged as actionable UI testability risks.
