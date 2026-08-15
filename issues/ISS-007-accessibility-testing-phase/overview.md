# ISS-007 · Accessibility Testing Phase — Implementation Plan

**Priority**: 🟢 Low  
**Status**: Backlog (Coming Soon)  
**Feature Area**: Understanding Page → Testing Tabs → Accessibility Testing

---

## Overview

Accessibility Testing validates that the application meets **WCAG 2.1 AA** standards using automated tools and generated Playwright + `axe-core` test scripts.

---

## What Accessibility Testing Covers

| Checkpoint | Tool | WCAG Criteria |
| --- | --- | --- |
| Color Contrast | `axe-core` | 1.4.3 (AA) |
| Keyboard Navigation | Playwright | 2.1.1 |
| ARIA Labels | `axe-core` | 4.1.2 |
| Focus Management | Playwright | 2.4.3 |
| Error Message Association | `axe-core` | 3.3.1 |
| Form Label Presence | `axe-core` | 1.3.1 |
| Screen Reader Landmarks | `axe-core` | 1.3.6 |

---

## Backend Agent Required

### `AccessibilityAgent` (Exists — Needs Enhancement)
File: `backend/src/agents/accessibility_agent.py`

Current state: Generates heuristic accessibility notes from component analysis.

Needed: Generate executable Playwright + `axe-core` test scripts:

```python
from playwright.sync_api import sync_playwright
from axe_playwright_python import Axe

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:5173/login")
    
    axe = Axe()
    results = axe.run(page)
    assert results.violations == [], f"Found violations: {results.violations}"
```

---

## UI Changes Required

### Understanding Page — "Accessibility Testing" Tab
When `Accessibility Testing` tab is selected:
- Show WCAG audit score card (Level A, AA, AAA coverage)
- Show per-component accessibility findings
- Color-coded: Green (pass), Amber (warning), Red (violation)

### Execution Page — Accessibility Run Mode
- `axe-core` violations report per page
- Screenshot with highlighted violation areas
- WCAG criterion reference per violation

---

## Existing Agent Enhancement Plan

1. Add `axe_playwright_python` to backend dependencies
2. Update `AccessibilityAgent.run()` to generate executable test scripts
3. Add new `AccessibilityTestCase` Pydantic model
4. Surface results in UI under Accessibility tab

---

## Acceptance Criteria (for v1 release)

- [ ] `AccessibilityAgent` generates `test_a11y_*.py` scripts using `axe-core`
- [ ] Login, ApplicationForm, DocumentUpload pages tested
- [ ] UI "Accessibility Testing" tab shows WCAG compliance score
- [ ] Violations shown with WCAG criterion reference
- [ ] Report exported as HTML and JSON
