# Spec 001: Phase 1 — Requirement Analysis & 4-Discipline Understanding

## 1. Objective
Transform uploaded specification documents (`.pdf`, `.md`, `.txt`, `.docx`) and codebase source archives (`.zip`) into a structured, multi-discipline Quality Understanding Document with live sub-agent telemetry, interactive 4-discipline tabs, bottom-anchored action triggers, and progressive auto-collapse mechanics.

## 2. Parent Agent & Sub-Agents Architecture
- **Parent Agent**: `Requirement Analysis Agent` (or `Requirement & Codebase Intelligence Agent`)
- **Sub-Agents**:
  1. **Sub-Agent 1.1: Document & Codebase Intake Agent**:
     - Fast heuristic classification of ZIP members (< 0.2s for 25k files).
     - Safe extraction with zip-slip security checks and junk directory filtering (`.venv`, `node_modules`, `.git`).
     - Extracts text from uploaded requirements documents.
  2. **Sub-Agent 1.2: Application Understanding Agent**:
     - Scans component ASTs (React, TypeScript, HTML).
     - Discovers UI routes, entry points, navigation graphs, and authentication gates.
     - Maps interactive components and form input selectors.
  3. **Sub-Agent 1.3: Requirement Intelligence & Gap Scorer**:
     - Evaluates the 15-Point Requirement Validation Checklist.
     - Categorizes requirements (Functional, Security, Boundary, UI, Integration).
     - Calculates testability score, ambiguity score, and identifies requirement gaps.

## 3. Deliverables & 4-Discipline Tabs
The final output of Phase 1 is rendered as a clean tabbed intelligence document:
1. 🔵 **UI Testing Tab (Active / Live)**:
   - Component Hierarchy Tree
   - User Journey State Flow & Routing Gateway
   - Interactive Elements & Selectors Catalog
   - 15-Point Requirement Checklist Score & Gap Matrix
2. 🟣 **API Testing Tab (Coming Soon)**:
   - Detected REST/GraphQL API endpoints
   - Request/Response Payload Contracts & Mock Stubs preview
   - Authentication header requirements
3. 🟠 **Accessibility Testing Tab (Coming Soon)**:
   - WCAG 2.1 AA Compliance Checklist
   - Color Contrast, Keyboard Navigation & ARIA attributes targets
4. 🟢 **Performance Testing Tab (Coming Soon)**:
   - Core Web Vitals targets (LCP < 2.5s, FID < 100ms, CLS < 0.1)
   - Simulated User Load & SLA thresholds

## 4. Progressive Interaction & Auto-Collapse Model
- **During Analysis**:
  - The right-hand sub-step pipeline renders live spinners on Sub-Agent 1.1, 1.2, and 1.3 with real-time status messages.
- **On Completion**:
  - The Understanding Document tabs appear.
  - At the **bottom of the card**, a prominent CTA button is displayed: **`"Run Test Case Generator Agent →"`**.
  - No other forward buttons are displayed, keeping the interface uncluttered.
- **On Action Click**:
  - Phase 1 card smoothly animates and collapses into a compact milestone badge:
    `[✓ Complete • 15 Requirements Evaluated • 124 Files Indexed • Score: 88% • (Expand Details ▾)]`
  - The page auto-scrolls down to Phase 2 (Test Case Generator Agent), which immediately unlocks and begins execution.
