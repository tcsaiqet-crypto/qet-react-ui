# Spec 026: Agentic AI Stack Integration — LangGraph, LangChain, Pydantic & Intelligent Agent Upgrade

## Executive Overview

Spec 026 defines the deep integration of a production-grade agentic AI stack into all 6 QET agents. The goal is to achieve **maximum intelligence output with minimum API token consumption** by introducing:

- **LangGraph** as the stateful multi-agent pipeline orchestrator (cyclic, checkpointed, crash-resumable)
- **LangChain LCEL** as the AI call layer (structured prompts, retries, output parsing)
- **Pydantic V2** as the schema enforcement layer (zero-format-retry structured JSON)
- **Hierarchical Model Routing** (Flash Lite → Flash → Pro) based on task complexity
- **AI-powered capabilities** in Agents 3, 4, 5, and 6 that are currently deterministic or absent

This spec directly follows **Spec 025** (LangGraph Architecture & Business Alignment) and is the implementation phase.

---

## Top-Level Files

| File | Description |
| :--- | :--- |
| [`plan.md`](./plan.md) | What we are building — full strategic plan across all 6 agents |
| [`execution.md`](./execution.md) | How to execute — phased implementation steps and acceptance criteria |
| [`tech-stack.md`](./tech-stack.md) | How the stack connects — layers, data flow, communication, API key routing |
| [`contracts.md`](./contracts.md) | LangGraph GraphState, node signatures, Pydantic models, prompt contracts |
| [`constitution.md`](./constitution.md) | Non-negotiable invariants, token budget rules, quality constraints |

---

## Feature Subfolders (Specit Files)

Each subfolder contains a focused `specit.md` with plan, contracts, constitution, acceptance criteria, and open questions for that specific feature.

| Subfolder | Feature | Priority | Depends On |
| :--- | :--- | :---: | :--- |
| [`a-langgraph-pipeline-engine/`](./a-langgraph-pipeline-engine/specit.md) | Core StateGraph, checkpointing, node events, WebSocket streaming | 🔴 Critical | — |
| [`b-model-router-lcel-layer/`](./b-model-router-lcel-layer/specit.md) | Hierarchical model routing, LangChain LCEL chains, Pydantic output, token budget | 🔴 Critical | A |
| [`c-agent2-test-case-generation/`](./c-agent2-test-case-generation/specit.md) | Coverage Planner (2a) + Parallel Batch Generator (2b) + Alignment Critic | 🔴 Critical | A, B |
| [`d-agent3-ai-data-generation/`](./d-agent3-ai-data-generation/specit.md) | Schema Architect (3a) + Data Populator (3b) + Boundary Inflator (3c) | 🟠 High | A, B, C |
| [`e-agent4-ai-script-synthesis/`](./e-agent4-ai-script-synthesis/specit.md) | POM Architect (4a) + Script Synthesizer (4b) + Self-Healer (4c) | 🟠 High | A, B, C, D |
| [`f-agent5-execution-intelligence/`](./f-agent5-execution-intelligence/specit.md) | Risk Scanner (5a) + Log Interpreter (5b) + Screenshot Validator (5c) + Flakiness Classifier (5d) | 🟠 High | A, B, E |
| [`g-agent6-dashboard-intelligence/`](./g-agent6-dashboard-intelligence/specit.md) | Executive Summary (6a) + Root Cause (6b) + BR Heatmap (6c) + Next Steps (6d) | 🟡 Medium | A, B, F |
| [`h-multi-key-parallel-pool/`](./h-multi-key-parallel-pool/specit.md) | ParallelKeyPool, failover chain, cross-provider fallback, token budget tracking | 🔴 Critical | B |

---

## Dependency Graph

```
          ┌─────────────────────────────────┐
          │  A: LangGraph Pipeline Engine   │
          └──────────────┬──────────────────┘
                         │
          ┌──────────────▼──────────────────┐
          │  B: Model Router + LCEL Layer   │◄────── H: Multi-Key Parallel Pool
          └──────────────┬──────────────────┘
                         │
          ┌──────────────▼──────────────────┐
          │  C: Agent 2 — Test Case Gen     │
          └──────────────┬──────────────────┘
                         │
          ┌──────────────▼──────────────────┐
          │  D: Agent 3 — Data Generation   │
          └──────────────┬──────────────────┘
                         │
          ┌──────────────▼──────────────────┐
          │  E: Agent 4 — Script Synthesis  │
          └──────────────┬──────────────────┘
                         │
          ┌──────────────▼──────────────────┐
          │  F: Agent 5 — Exec Intelligence │
          └──────────────┬──────────────────┘
                         │
          ┌──────────────▼──────────────────┐
          │  G: Agent 6 — Dashboard Intel   │
          └─────────────────────────────────┘
```

---

## Core Objectives

1. **LangGraph Pipeline**: Replace linear `agent.run(state)` chain with a `StateGraph` — checkpointed, cyclic, crash-resumable.
2. **Agent 3 — Data Intelligence**: AI-generated domain-specific schemas per `BR-XX` (payment cards, KYC docs, exam sessions).
3. **Agent 4 — Script Intelligence**: AI-written Playwright POM + test functions grounded in real UI selectors.
4. **Agent 5 — Execution Intelligence**: Pre-run risk scan, live log annotation, screenshot evidence, failure classification.
5. **Agent 6 — Dashboard Intelligence**: AI-written executive narrative, root cause clustering, BR risk heatmap, next steps.
6. **Token Economy**: ≥80% token reduction vs naive per-step calls via batching, state sharing, and model routing.

---

## Completeness Validation

- [x] LangGraph orchestration layer defined (Specit A)
- [x] Model routing and LCEL call patterns defined (Specit B)
- [x] Agent 2 subagents (2a Coverage Planner, 2b Batch Generator, Critic) fully specced (Specit C)
- [x] Agent 3 subagents (3a Schema, 3b Populate, 3c Boundary) fully specced (Specit D)
- [x] Agent 4 subagents (4a POM, 4b Script, 4c Healer) fully specced (Specit E)
- [x] Agent 5 subagents (5a Risk, 5b Log, 5c Screenshot, 5d Classify) fully specced (Specit F)
- [x] Agent 6 subagents (6a Summary, 6b Root Cause, 6c Heatmap, 6d Next Steps) fully specced (Specit G)
- [x] Multi-key parallel pool, failover chain, token budget specced (Specit H)
- [x] Dependency order established: A → B+H → C → D → E → F → G
- [x] All specit files include: open questions, acceptance criteria, missing items
