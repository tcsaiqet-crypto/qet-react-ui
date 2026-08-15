# ISS-007: Gemini JSON Truncation & Schema Auto-Repair Resilience

## Overview
Introduces strict native JSON schema configuration (`response_mime_type: "application/json"`), token capacity expansion to 8,192, and a robust 5-pass auto-repair algorithm to safeguard the agent pipeline against unclosed JSON braces and truncated LLM responses.

## Specification Documents
- [`constitution.md`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/issues/ISS-007-gemini-json-truncation-and-auto-repair/constitution.md): JSON integrity invariants & 5-pass repair rules.
- [`spec.md`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/issues/ISS-007-gemini-json-truncation-and-auto-repair/spec.md): User stories & acceptance criteria.
- [`plan.md`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/issues/ISS-007-gemini-json-truncation-and-auto-repair/plan.md): 5-pass repair flow & brace balancing logic.
- [`contracts.md`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/issues/ISS-007-gemini-json-truncation-and-auto-repair/contracts.md): Repair schema and generation configs.
- [`tasks.md`](file:///c:/Users/AkshatSinha/Documents/avd/qet-react-ui/issues/ISS-007-gemini-json-truncation-and-auto-repair/tasks.md): Implementation checklist & test validations.
