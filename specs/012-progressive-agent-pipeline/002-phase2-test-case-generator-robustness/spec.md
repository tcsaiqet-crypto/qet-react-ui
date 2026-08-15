# Spec 002: Phase 2 — Token-Safe Test Case Generator Agent

## 1. Objective
Synthesize traceable, boundary-tested, positive, negative, validation, and error-handling test case suites from the Phase 1 Understanding Document without token limit truncation or JSON parsing failures. Display test suites under 4-discipline tabs (UI Testing active, API/A11y/Perf coming soon), provide search/filtering, and offer a bottom-anchored CTA to advance to Stage 3.

## 2. Parent Agent & Sub-Agents Architecture
- **Parent Agent**: `Test Case Generator Agent` (or `Quality Scenario Specialist Agent`)
- **Sub-Agents**:
  1. **Sub-Agent 2.1: Scenario & Boundary Synthesizer**:
     - Generates Positive, Negative, Boundary, Validation, and Error-Handling scenarios.
     - Enforces observable expected results and preconditions.
     - Operates with an expanded **8,000 token budget** to prevent JSON truncation.
  2. **Sub-Agent 2.2: Traceability & Coverage Mapper**:
     - Maps every generated test case to specific requirement IDs (`REQ-001`, `REQ-002`, etc.) and identified requirement gaps.
     - Calculates coverage percentage and risk levels (Critical, High, Medium, Low).
     - Identifies automation candidates for Playwright scripts.
  3. **Sub-Agent 2.3: Discipline Suite Formatter**:
     - Formats UI test cases into structured, searchable cards with step-by-step actions and synthetic data keys.
     - Generates Coming Soon stub suites for API, Accessibility, and Performance.

## 3. Deliverables & UI Tabs
1. 🔵 **UI Testing Test Suite Tab (Active)**:
   - Positive Flow Scenarios (e.g. valid onboarding, successful payment)
   - Negative & Boundary Scenarios (e.g. invalid KYC upload, malformed inputs, limit testing)
   - Validation & Error-Handling Scenarios (e.g. network timeout, field validation error states)
   - Search, filter by Priority/Type, and export to CSV/JSON.
2. 🟣 **API Testing Suite Tab (Coming Soon)**:
   - Preview of endpoint status code assertions (200 OK, 400 Bad Request, 401 Unauthorized, 422 Validation Error).
3. 🟠 **Accessibility Testing Suite Tab (Coming Soon)**:
   - Preview of WCAG 2.1 AA keyboard navigation, screen reader, and contrast check suites.
4. 🟢 **Performance Testing Suite Tab (Coming Soon)**:
   - Preview of Core Web Vitals threshold benchmarks and stress test scenarios.

## 4. Progressive Interaction & Auto-Collapse Model
- **Auto-Expanded on Activation**: When Phase 1 completes and the user clicks `"Run Test Case Generator Agent →"`, Phase 2 expands and immediately runs.
- **Bottom CTA**: Once test cases are generated and displayed, a single button appears at the bottom of the card: **`"Run Test Data Agent →"`**.
- **Auto-Collapse**: Clicking `"Run Test Data Agent →"` collapses Phase 2 into a compact milestone badge (`[✓ Complete • 12 Test Cases Generated • 100% Traceability • (Expand Details ▾)]`) and auto-scrolls to Phase 3.
