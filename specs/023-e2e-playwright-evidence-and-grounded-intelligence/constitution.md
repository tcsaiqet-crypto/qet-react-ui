# Constitution: Feature 023 — Architectural Governance & Principles

## 1. Core Principles

### Principle I: Strict Codebase Grounding
- Never hallucinate DOM selectors or endpoints. All UI automation code must be rooted in actual AST definitions extracted from application source code (`data-testid`, IDs, ARIA attributes).

### Principle II: Dedicated Test Isolation
- Every generated test case must exist as an independent, executable Python Playwright file (`test_TC_xxx.py`). No massive monolithic script files.

### Principle III: Dual Evidence Integrity
- Automation runs must systematically capture full-page screenshot evidence for **both success (Passed)** and **failure (Failed/Error)** states, indexed directly by `test_case_id`.

### Principle IV: No Hardcoded Placeholder Data
- Synthetic datasets must be contextually generated for specific testing objectives (positive format verification, negative validation rejections, boundary limits).

### Principle V: In-Lane Guided Experience
- Each stage must provide a clear bottom action button ("Next Step") allowing the user to seamlessly advance through the QET pipeline without searching for navigation controls.
