# Spec-Kit 020: Architectural Flow & State Transitions Plan

---

## 1. End-to-End Execution Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as QA Engineer / User
    participant Header as UI Top Header
    participant Rail as UI Left Rail (5 Agents)
    participant Center as Center Workspace
    participant Logs as Right Live Logs Panel
    participant Backend as FastAPI Backend (:8080)
    participant LLM as Gemini 3.7 Flash Thinking Pool

    User->>Header: Select Model (Gemini 3.7 Flash High / 8192 tokens)
    Header->>Backend: POST /api/v1/ai/settings
    Backend-->>Header: Settings Updated (Runtime Ready)

    User->>Center: Drop Specs (.md) & Codebase (.zip)
    Center->>Backend: POST /api/v1/runs/{id}/documents & /codebase
    Backend-->>Rail: Stage 1 (Intake) Status -> Completed (✓)
    Rail->>Rail: Auto-Collapse Stage 1 (48px bar with ✓)
    Rail->>Rail: Auto-Scroll to Stage 2 (Requirement Agent)

    User->>Rail: Click [ ▶ Run Stage ] on Stage 2
    Rail->>Backend: POST /api/v1/runs/{id}/understanding
    Backend->>Logs: Stream Log Events (with log_run_context)
    Backend->>LLM: Send Document & AST Context (Thinking Budget = 8192)
    LLM-->>Backend: Return Structured JSON (15-Point Checklist + Endpoints)
    Backend-->>Center: Render Requirement Intelligence Metrics Table
    Backend-->>Rail: Stage 2 Status -> Completed (✓)

    opt User Stops Pipeline
        User->>Header: Click [ ⏹ Stop Run ]
        Header->>Backend: POST /api/v1/runs/{id}/cancel
        Backend->>Backend: Set RunState.pipeline_control_state = "stopped"
        Backend-->>Logs: [STATUS] Pipeline execution cancelled by user
        Backend-->>Header: Update status -> stopped
    end
```

---

## 2. Left Rail State Progression Matrix

| Pipeline Stage | Initial State | Trigger Event | Active Subagents | Exit Transition Condition |
| :--- | :--- | :--- | :--- | :--- |
| **1. Intake Agent** | `pending` | Upload Document / ZIP | `Manifest Parser`, `Codebase Unpacker` | `intake_manifest` populated with file list |
| **2. Requirement Understanding Agent** | `pending` | Click `▶ Run Stage` | `Doc Parser`, `Context Analyzer`, `Requirement Categorizer` | `understanding_ready` emitted with 15-pt checklist |
| **3. Test Generation Agent** | `pending` | Auto/Manual Trigger | `Test Case Synthesizer`, `Synthetic Data Generator`, `Playwright Code Generator` | `test_cases` generated across 5 test types |
| **4. Execution Agent** | `pending` | Stage Trigger | `Playwright Runner`, `API Runner`, `Evidence Collector` | All Playwright tests executed with screenshots |
| **5. Quality Intelligence Agent** | `pending` | Stage Trigger | `Diagnostic Engine`, `Self-Correction Agent` | Executive report generated, PDF package ready |
