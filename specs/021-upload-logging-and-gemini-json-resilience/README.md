# Spec-Kit 021: Upload Observability & Gemini JSON Resilience Engine

## Executive Overview
Spec-Kit 021 addresses two critical platform gaps identified during live execution:
1. **Upload Logging Invisibility**: Document and codebase uploads were executing silently without emitting live frontend UI events or logging to `temp/run_{run_id}.log`.
2. **Gemini 3.7 Flash JSON Truncation (`invalid_model_json`)**: Reasoning-heavy understanding prompts exceeded the restrictive 4000 output token limit, leading to unclosed JSON structures and stage failure.

---

## Deliverables in This Spec-Kit
- 📜 **`constitution.md`**: Architectural constraints, token rules, and logging mandates.
- 📐 **`spec.md`**: Functional requirements (FR-1 through FR-6) and user stories.
- 📋 **`contracts.md`**: REST API contracts, TypeScript interfaces, and logger schemas.
- 🏗️ **`plan.md`**: Step-by-step implementation blueprint and sequence diagrams.
- 📌 **`tasks.md`**: Detailed task breakdown and validation checklist.
