# Constitution: Feature 022 — Test Case & Synthetic Data Intelligence, Script Visibility, and Selective Execution

**Version:** 1.0  
**Feature Branch:** `feature/022-testcase-datagen-scriptviewer-and-selective-execution`  
**Governing Standard:** Speckit Enterprise QA Platform Standard

---

## 1. Core Principles

1. **Transparent Script Visibility**: Generated test automation scripts must never remain hidden in opaque backend directories. Every Playwright script (`test_tc_*.py`) and Page Object Model must be immediately viewable, inspectable, and copyable through an accessible code viewer modal.
2. **Dedicated Test Data Generation**: Synthetic test data must be generated and explicitly mapped per test case (e.g. valid credentials, boundary income values, negative scenarios). Data must be 100% fictional, non-PII, and non-confidential.
3. **Selective & Granular Execution**: The user must retain absolute control to select all, select by category (Positive, Negative, Boundary, Validation), or manually pick individual test cases for headed desktop browser execution.
4. **Clean & Collapsible Workspace**: Intake, understanding, and completed generation stages must automatically collapse or provide one-click collapse/expand toggles to eliminate visual clutter. Redundant action buttons are strictly prohibited.
5. **Honest Execution Telemetry**: Test execution results, durations, console logs, and screenshots are authoritative. AI must never hallucinate execution passes or alter test outcomes.
6. **Zero Silent Fallbacks**: If script or data generation fails, the system must fail-fast with actionable diagnostics rather than substituting placeholder mock stubs.

---

## 2. Non-Negotiable Engineering Rules

1. **Security & Sandbox Isolation**: Playwright execution is allowed only against configured non-production environments with explicit confirmation.
2. **Syntax Resilience**: LLM structured outputs must pass through multi-layer JSON stripping and sanitization to handle fenced markdown responses without syntax errors.
3. **Single-Trigger UI State**: Step transitions and autoscrolls must be idempotent and guarded to prevent viewport jitter.
