# Spec: Subagent Animation Rail and Task Drawer

## 1. Functional Requirements
1. **Left Rail Nested Subagents**:
   - Intake Agent: `Intake Manifest Parser`, `Codebase Unpacker`
   - Requirement Understanding Agent: `Document Parser`, `Context Analyzer`, `Requirement Categorizer`
   - Test Generation Agent: `Test Case Synthesizer`, `Synthetic Data Generator`, `Playwright Code Generator`
   - Execution Agent: `Playwright Runner`, `API Runner`, `Evidence Collector`
   - Quality Intelligence Agent: `Diagnostic Engine`, `Self-Correction Agent`
2. **Auto-Collapse & Scroll**:
   - Completed agents collapse automatically.
   - Active agent expands and the view scrolls to bring it into focus.
3. **One Primary Button Rule**:
   - Each agent card contains exactly one primary button. Secondary actions are accessible inside the right inspector drawer.
