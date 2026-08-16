# Spec 025: LangGraph Multi-Agent Architecture & Business Alignment Pipeline

## Executive Overview
Spec 025 defines the transition of the QET Agent Accelerator from sequential one-shot agent invocations to a **Stateful, Cyclic Multi-Agent Graph orchestrated with LangGraph**. 

This feature addresses the critical requirement alignment gap where technical framework internals (e.g., SQLite locks, Streamlit session memory, generic DOM testids) were mistakenly prioritized over core business requirements (e.g., CFA Candidate Journey BR-01 through BR-18: Registration, KYC, Exam Booking, AI Tutor, Proctoring, Score Reporting, and Digital Credentialing).

---

## Directory Manifest
| File | Description |
| :--- | :--- |
| [`spec.md`](./spec.md) | Complete functional, architectural, and business alignment specification. |
| [`plan.md`](./plan.md) | Phased technical execution and migration plan. |
| [`contracts.md`](./contracts.md) | LangGraph graph state models, node signatures, and JSON schemas. |
| [`tasks.md`](./tasks.md) | Granular implementation work breakdown structure and validation checklist. |
| [`constitution.md`](./constitution.md) | Architectural guardrails, non-negotiable rules, and quality invariants. |

---

## Core Objectives
1. **LangGraph State Graph Engine**: Orchestrate the 6 agent phases (Understanding, Test Generation, Data Generation, Script Synthesis, Execution, Analytics) as a stateful directed acyclic/cyclic graph with checkpointing and state persistence.
2. **BRD Ingestion & Grounding**: Deeply parse and index the 18 CFA Business Requirements (`BR-01` to `BR-18`) and acceptance criteria from uploaded requirements documents.
3. **Leadership & Alignment Critic Node**: Enforce a programmatic evaluation node between Test Case Generation and Test Data Generation to reject technical framework leakage and verify 100% domain traceability.
4. **Contextual Synthetic Test Data Alignment**: Generate rich, domain-specific mock candidate records (passports, payment cards, exam time slots, rubric percentiles) tied 1:1 to verified business scenarios.
5. **Real-Time FastAPI Telemetry**: Stream node execution events, subagent critique logs, and state transitions to the React UI and telemetry bus.
