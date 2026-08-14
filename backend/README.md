# QET Agent Accelerator — CFA Digital Journey

The Quality Engineering & Testing (QET) Agent Accelerator is a stateful multi-agent system designed for automated testing of the CFA Digital Journey application.

## Quickstart Guide

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   playwright install chromium
   ```

2. Run Streamlit UI:
   ```bash
   streamlit run app.py
   ```

3. Execute Test Suite:
   ```bash
   python -m pytest -v
   ```

## Version 1 Scope
- **Enabled**: Streamlit UI, Document & ZIP Upload, Application Understanding, Positive/Negative Test Generation, Synthetic Test Data, Playwright POM Generation, Controlled Playwright Execution, HTML & PDF Quality Reports.
- **Disabled**: Arbitrary URL execution, API testing, Performance load testing, Accessibility scanning, Security scanning.

## Source of Truth (G2 — Spec-Kit 006)

> **IMPORTANT**: There are two backend trees in this repository. Only **one** is authoritative:
>
> | Path | Status |
> |------|--------|
> | `C:/Users/AkshatSinha/Documents/avd/qet-react-ui/backend` | ✅ **ACTIVE — all changes go here** |
> | `C:/Users/AkshatSinha/Documents/avd/QET agents/QET agents` | ⚠️ Legacy copy — do NOT edit for new development |
>
> All Antigravity agent runs, pytest executions, and FastAPI server starts must use the active backend path.
> Never apply patches or run tests against the legacy `QET agents/QET agents` path unless explicitly migrating it.
