# 012 — Progressive Agent Pipeline Architecture (Master Spec-Kit)

## Overview & Vision
The **Progressive Agent Pipeline** is an enterprise-grade, sequential AI-agent orchestration system for autonomous software quality engineering. It guides the user from raw business requirements and codebase source code into structured understanding, traceable test cases, synthetic/custom test data, executable Playwright scripts, and automated verification reports.

## Core Architectural Pillars
1. **Vertical Pipeline with Integrated Sub-Step Rails**:
   - Each Parent Agent card prominently renders its name, description, and an interactive **right-hand sub-step pipeline** tracking its 3 specialized sub-agents.
2. **Sequential Auto-Collapse & Auto-Scroll Progression**:
   - When a parent agent completes, it automatically collapses into a compact milestone badge (`[✓ Complete • Summary Metrics • Expand Details ▾]`).
   - The UI smoothly scrolls down to the newly activated agent card, showing **only the single next primary action button** at the bottom of the card.
3. **Multi-Discipline Quality Intelligence**:
   - Deliverables are organized into 4 standardized testing disciplines:
     - 🔵 **UI Testing** (*Active / Fully Generated*)
     - 🟣 **API Testing** (*Coming Soon stub*)
     - 🟠 **Accessibility Testing** (*Coming Soon stub*)
     - 🟢 **Performance Testing** (*Coming Soon stub*)
4. **Pure AI Data & Custom Intake Engine (Zero Sample Data Fallback)**:
   - Eliminates hardcoded mock data entirely in favor of dynamic LLM synthesis (Gemini 3.7 / 2.5 / GPT-4o) + user CSV/JSON dataset upload with AI schema alignment and toggle switching.
5. **Deterministic Execution & Token-Safe Synthesis**:
   - Expands LLM output token budgets to 8,000 tokens with automated JSON syntax recovery to eliminate test generation truncation failures.

---

## Phase Roadmap & Folder Structure

| Phase Folder | Phase Name | Parent Agent | Key Deliverables |
| :--- | :--- | :--- | :--- |
| **[`001-phase1-requirement-understanding-disciplines/`](./001-phase1-requirement-understanding-disciplines/)** | Phase 1: Intake & 4-Discipline Understanding | Requirement Analysis Agent | 3 Sub-Agents, AST extraction, 4 Discipline Tabs (UI, API, A11y, Perf), Bottom CTA (`Run Test Case Generator`), Auto-Collapse Card. |
| **[`002-phase2-test-case-generator-robustness/`](./002-phase2-test-case-generator-robustness/)** | Phase 2: Token-Safe Test Case Generator | Test Case Generator Agent | 3 Sub-Agents, 8k Token Ceiling, UI Test Suite, Discipline Tabs, Bottom CTA (`Run Test Data Agent`), Auto-Collapse Card. |
| **[`003-phase3-test-data-agent-dual-engine/`](./003-phase3-test-data-agent-dual-engine/)** | Phase 3: Dual-Engine Test Data Hub | Test Data Agent | 3 Sub-Agents, Pure AI Synthetic Data + Custom CSV/JSON Upload, AI Data Masking & Toggle Switch, Bottom CTA (`Generate Playwright Scripts`). |
| **[`004-phase4-playwright-automation-scripts/`](./004-phase4-playwright-automation-scripts/)** | Phase 4: Page Object & Playwright Script Engine | Automation Script Agent | 3 Sub-Agents, Page Object Models (`.ts`), `@playwright/test` Spec Generation, Data Binder, Code Viewer, Bottom CTA (`Launch Execution`). |
| **[`005-phase5-execution-and-quality-reporting/`](./005-phase5-execution-and-quality-reporting/)** | Phase 5: Test Execution & Executive Reporting | Execution & Quality Report Agent | 3 Sub-Agents, Live Playwright Runner, Visual Screenshots/Traces, Defect Severity Classifier, Executive Quality Report. |

---

## Overall Agent Pipeline Flow Diagram

```mermaid
graph TD
    subgraph P1["Phase 001: Requirement Analysis & Understanding Agent"]
        P1_1["1.1 Intake & Extraction Agent"] --> P1_2["1.2 Application Understanding Agent"]
        P1_2 --> P1_3["1.3 Requirement Intelligence & Gap Scorer"]
        P1_3 --> DocOut["Understanding Document<br/>• UI Testing (Active)<br/>• API Testing (Coming Soon)<br/>• Accessibility (Coming Soon)<br/>• Performance (Coming Soon)"]
    end

    DocOut -->|"Click: Run Test Case Generator" (Phase 1 Auto-Collapses)| P2

    subgraph P2["Phase 002: Test Case Generator Agent"]
        P2_1["2.1 Scenario & Boundary Synthesizer"] --> P2_2["2.2 Traceability & Coverage Mapper"]
        P2_2 --> P2_3["2.3 Discipline Suite Formatter"]
        P2_3 --> TCOut["Test Case Suites<br/>• UI Test Suite (Active)<br/>• API, A11y, Perf (Coming Soon)"]
    end

    TCOut -->|"Click: Run Test Data Agent" (Phase 2 Auto-Collapses)| P3

    subgraph P3["Phase 003: Test Data Agent"]
        P3_1["3.1 Data Schema & Fixture Extractor"] --> P3_2["3.2 AI Synthetic Data Generator"]
        P3_1 --> P3_3["3.3 Custom Dataset Intake & AI Transformer"]
        P3_2 --> DataOut["Test Data Hub (AI Synthetic + Custom Upload + AI Toggle)"]
        P3_3 --> DataOut
    end

    DataOut -->|"Click: Generate Playwright Scripts" (Phase 3 Auto-Collapses)| P4

    subgraph P4["Phase 004: Automation Script Agent (Playwright)"]
        P4_1["4.1 POM Synthesizer"] --> P4_2["4.2 Playwright Spec Generator"]
        P4_2 --> ScriptOut["Playwright Test Scripts (.spec.ts)"]
    end

    ScriptOut -->|"Click: Launch Execution" (Phase 4 Auto-Collapses)| P5

    subgraph P5["Phase 005: Execution & Quality Report Agent"]
        P5_1["5.1 Playwright Test Runner"] --> P5_2["5.2 Defect & Evidence Collector"]
        P5_2 --> P5_3["5.3 Executive Summary & Quality Scorer"]
    end
```
