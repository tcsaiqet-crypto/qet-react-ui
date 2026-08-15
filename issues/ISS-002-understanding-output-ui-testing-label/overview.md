# ISS-002 · Understanding Output — UI Testing Context Label

**Priority**: 🔴 High  
**Status**: Open  
**Feature Area**: Understanding Page → AI Output Display

---

## Problem Statement

The Understanding Page output currently shows AI results without any testing-type context. The user expects the output to **clearly state this is "UI Testing" analysis** and to surface a clear structure for what the AI discovered as it relates specifically to UI test generation (components, selectors, flows).

Additionally, the user wants:
1. Clear header indicating "Analysis for **UI Testing**"
2. The component section to include discoverable `data-testid` / CSS selectors
3. The flows section to show step-by-step what Playwright will automate
4. Gaps should be labeled as "UI Testability Gaps" not generic gaps
5. Testability observations should be prominently placed near the top

---

## Current vs Expected

### Current Output Structure
```
AI Output Provenance & Audit Metadata
Executive Application Summary
Architecture & Tech Stack Notes
Discovered Application Components
Discovered User Flows
Inferred Requirement Gaps
Testability Observations
```

### Expected Output Structure (UI Testing Context)
```
┌─ UI Testing Analysis ────────────────────────────────────┐
│  🖥  Analysis Scope: UI / End-to-End Testing             │
│  Source: QET CFA Digital Journey · 163 files             │
│  Documents: 8 requirement files                          │
└──────────────────────────────────────────────────────────┘

Testability Score Card   ← Move to near top
  [React data-testid: 14 selectors found]
  [Stable XPath coverage: 87%]
  [Forms with required fields: 3]

AI Output Provenance & Audit Metadata
Executive Application Summary (UI Focus)
Discovered UI Components with Selectors
Discovered User Flows → Playwright Steps
UI Testability Gaps
Testability Observations
```

---

## Functional Requirements

### FR-002-A: Context Header Strip
- Add colored strip at top of Understanding output: `"🖥 UI Testing Analysis"` with scope subtitle
- Strip shows: Testing Type, Source Archive name, Document count

### FR-002-B: Testability Score Card
- Move Testability Observations from bottom to near-top as a **score card** 
- Shows: `# selectors discovered`, `# stable data-testid`, `# forms`, `# flows`

### FR-002-C: Component Cards — Show Selectors
- Each component card in "Discovered Components" should list its `selectors[]` array if present
- Display as chips: `[data-testid="login-btn"]` `[#username]`

### FR-002-D: Gap Renaming
- "Inferred Requirement Gaps" → **"UI Testability Gaps"** when UI Testing tab is active

### FR-002-E: Flow Steps as Playwright Preview
- Each flow's steps should show as numbered steps with `>` arrows
- Label: `Playwright Automation Steps`

---

## Files to Modify

| File | Change |
| --- | --- |
| `src/components/UnderstandingPage.tsx` | Add context strip, reorder, rename sections, show selectors |
| `src/types.ts` | Ensure `ApplicationComponent.selectors[]` is surfaced in UI |
