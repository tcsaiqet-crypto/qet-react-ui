# Spec 004: Phase 4 — Automation Script Agent (Playwright & POM)

## 1. Objective
Generate executable, enterprise-grade Playwright TypeScript test scripts (`.spec.ts`) and modular Page Object Model (POM) classes based on the UI Component AST, Phase 2 Test Cases, and Phase 3 Test Data. Display the generated code in an interactive multi-file code viewer with copy and download options, and provide a bottom-anchored CTA to launch execution.

## 2. Parent Agent & Sub-Agents Architecture
- **Parent Agent**: `Automation Script Agent` (or `Playwright Test Generator Agent`)
- **Sub-Agents**:
  1. **Sub-Agent 4.1: Page Object Model (POM) Synthesizer**:
     - Generates reusable TypeScript page classes (e.g. `LoginPage.ts`, `OnboardingPage.ts`, `PortfolioPage.ts`).
     - Extracts and binds robust DOM selectors (`data-testid`, `role`, placeholder, text content).
  2. **Sub-Agent 4.2: Playwright Test Generator**:
     - Writes standard `@playwright/test` executable spec files (`*.spec.ts`).
     - Implements assertions, wait conditions, and step descriptions aligned with test cases.
  3. **Sub-Agent 4.3: Data-Driven Harness Binder**:
     - Injects the active test dataset (Synthetic or Custom) into test spec parameters.
     - Produces standalone, self-contained test execution packages.

## 3. Deliverables & UI Experience
- **Interactive Multi-File Code Studio**:
  - File tree on the left (`pages/`, `specs/`, `fixtures/`, `playwright.config.ts`).
  - Syntax-highlighted code editor with copy and download `.zip` bundle.
  - Script validation status badge (`VALIDATED` / `PLAYWRIGHT READY`).

## 4. Progressive Interaction & Auto-Collapse Model
- **Auto-Expanded on Activation**: When Phase 3 completes and the user clicks `"Generate Playwright Automation Scripts →"`, Phase 4 expands and generates POMs and test specs.
- **Bottom CTA**: Once scripts are ready, a single button appears at the bottom: **`"Launch Execution Workspace →"`**.
- **Auto-Collapse**: Clicking the button collapses Phase 4 into a compact milestone badge (`[✓ Complete • 6 Playwright Spec Files Ready • POM Architecture Validated • (Expand Details ▾)]`) and auto-scrolls to Phase 5.
