# Spec 003: Phase 3 — Dual-Engine Test Data Agent (Pure AI + Custom Upload)

## 1. Objective
Provide a robust, dual-engine Test Data Hub that eliminates hardcoded mock data entirely. The agent synthesizes pure AI datasets tailored to the Phase 2 test cases, and provides a drag-and-drop intake for user-supplied CSV/JSON test datasets with AI schema alignment and an interactive dataset toggle switch.

## 2. Parent Agent & Sub-Agents Architecture
- **Parent Agent**: `Test Data Agent` (or `Synthetic & Custom Test Data Hub Agent`)
- **Sub-Agents**:
  1. **Sub-Agent 3.1: Data Schema & Fixture Extractor**:
     - Analyzes generated test cases and extracts required parameter keys (e.g. `valid_email`, `pan_number`, `investment_amount`, `invalid_phone`, `kyc_doc_name`).
     - Derives field data types, boundary constraints, and regex formats.
  2. **Sub-Agent 3.2: AI Synthetic Data Generator (Zero Hardcoded Data)**:
     - Pure AI-driven synthesis using LLM (Gemini / GPT) to generate realistic, domain-accurate data rows.
     - Generates both valid positive fixtures and invalid/boundary negative fixtures.
  3. **Sub-Agent 3.3: Custom Dataset Intake & AI Transformer**:
     - Allows user to upload `.csv` or `.json` test data files.
     - AI inspects uploaded columns and maps them to the test case parameters.
     - Provides AI data augmentation to fill missing columns and mask sensitive PII values.

## 3. Deliverables & User Experience
- **Interactive Test Data Hub UI**:
  - **Engine Mode Selector / Toggle**:
    - `[ 🤖 AI Synthetic Dataset (Generated) ]` ⇄ `[ 📁 Custom Uploaded Dataset ]`
  - **Interactive Data Table**:
    - Column headers matched to test fixture keys.
    - Editable cells, row addition, JSON preview, and CSV export.
  - **AI Data Augmentation Bar**:
    - `"AI Enrich Missing Rows"` / `"Mask PII Data"` action triggers.

## 4. Progressive Interaction & Auto-Collapse Model
- **Auto-Expanded on Activation**: When Phase 2 completes and the user clicks `"Run Test Data Agent →"`, Phase 3 expands and initiates synthetic data generation.
- **Bottom CTA**: Once data is generated/ready, a single button appears at the bottom of the card: **`"Generate Playwright Automation Scripts →"`**.
- **Auto-Collapse**: Clicking the button collapses Phase 3 into a compact milestone badge (`[✓ Complete • 12 Test Fixtures Ready • Active Engine: AI Synthetic • (Expand Details ▾)]`) and auto-scrolls to Phase 4.
