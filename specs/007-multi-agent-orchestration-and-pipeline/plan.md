# Architecture & Implementation Plan 007: Multi-Agent Orchestration

## 1. Orchestration Flow Diagram

```
[ Ingestion Complete ]
       │
       ▼
[ Stage 1: Understanding Agent ]
       │  (Extract UI Inventory & Requirements)
       ▼
[ Stage 2: Test Case Agent ]
       │  (Generate 5 Test Case Categories)
       ▼
[ Stage 3: Synthetic Data Agent ]
       │  (Dual-Engine Synthetic PII-Compliant Data)
       ▼
[ Stage 4: Playwright Agent ]
       │  (Synthesize POMs, Dedicated Tests, Package ZIP)
       ▼
[ Stage 5: Execution & Quality Report Agent ]
       │  (Headed Test Run, Multi-Level JSON, Screenshots, AI Sign-off)
       ▼
[ Final Sign-off & Run Complete ]
```

## 2. Invalidation Mechanics
- `_reset_downstream_outputs(state, target_stage)` checks index order and deletes downstream artifacts from disk and state.
- `reset_generation` is incremented to invalidate stale client caches.
