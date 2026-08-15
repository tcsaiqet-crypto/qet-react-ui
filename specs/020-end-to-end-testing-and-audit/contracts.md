# Spec-Kit 020: API & Data Contracts Constitution

---

## 1. REST API Contracts

### A. Model Discovery & Switcher
- **Endpoint**: `GET /api/v1/ai/models`
- **Response Schema**:
```json
{
  "active_provider": "gemini",
  "active_model": "gemini-3.7-flash-medium",
  "models": [
    {
      "id": "gemini-3.7-flash-medium",
      "name": "Gemini 3.7 Flash (Medium)",
      "provider": "gemini",
      "thinking_tier": "medium",
      "thinking_budget_tokens": 4096,
      "latency_estimate": "~2.9s",
      "recommended_for": "Balanced understanding, test cases, and synthetic data generation",
      "is_default": true,
      "is_available": true
    },
    {
      "id": "gemini-3.7-flash-low",
      "name": "Gemini 3.7 Flash (Low)",
      "provider": "gemini",
      "thinking_tier": "low",
      "thinking_budget_tokens": 1024,
      "latency_estimate": "~1.9s",
      "recommended_for": "Ultra-fast AST parsing and requirement categorization",
      "is_default": false,
      "is_available": true
    },
    {
      "id": "gemini-3.7-flash-high",
      "name": "Gemini 3.7 Flash (High)",
      "provider": "gemini",
      "thinking_tier": "high",
      "thinking_budget_tokens": 8192,
      "latency_estimate": "~4.7s",
      "recommended_for": "Deep reasoning, Playwright code synthesis, self-correction",
      "is_default": false,
      "is_available": true
    },
    {
      "id": "gemini-3.1-flash-lite",
      "name": "Gemini 3.1 Flash Lite",
      "provider": "gemini",
      "thinking_tier": "low",
      "latency_estimate": "~1.9s",
      "recommended_for": "Fast lightweight tasks",
      "is_default": false,
      "is_available": true
    },
    {
      "id": "gpt-4o-mini",
      "name": "OpenAI GPT-4o-mini",
      "provider": "gpt",
      "latency_estimate": "~2.5s",
      "recommended_for": "Cross-provider fallback",
      "is_default": false,
      "is_available": true
    }
  ]
}
```

---

### B. Run & Stage Execution Endpoints

| Method | Endpoint Path | Supported Aliases | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/runs` | — | Initialize a new run state. |
| `POST` | `/api/v1/runs/{run_id}/documents` | `/runs/{run_id}/upload/documents` | Upload requirement spec documents (`.md`, `.pdf`, `.docx`, `.txt`). |
| `POST` | `/api/v1/runs/{run_id}/codebase` | `/runs/{run_id}/upload/codebase` | Upload codebase `.zip` archive. |
| `POST` | `/api/v1/runs/{run_id}/understanding` | `/runs/{run_id}/understanding/start`, `/runs/{run_id}/start-understanding` | Trigger AI Requirement Understanding Agent. |
| `POST` | `/api/v1/runs/{run_id}/pipeline` | `/runs/{run_id}/start-pipeline` | Trigger full sequential pipeline (Generation, Execution, Reporting). |
| `GET` | `/api/v1/runs/{run_id}/status` | — | Poll active run progress, subagent timeline, and active agent. |
| `GET` | `/api/v1/runs/{run_id}/state` | — | Retrieve full persisted run state on disk. |
| `GET` | `/api/v1/runs/{run_id}/logs` | — | Stream backend text logs for active run. |
| `GET` | `/api/v1/runs/{run_id}/logs/download` | `/runs/{run_id}/logs/backend` | Download `backend_logs_{run_id}.txt`. |
| `POST` | `/api/v1/runs/{run_id}/cancel` | `/runs/{run_id}/stop` | Stop active pipeline execution immediately. |

---

## 2. Frontend TypeScript Contracts

```typescript
export interface DiscoverableModel {
  id: string;
  name: string;
  provider: 'gemini' | 'gpt';
  thinking_tier?: 'low' | 'medium' | 'high';
  thinking_budget_tokens?: number;
  latency_estimate?: string;
  recommended_for?: string;
  is_default?: boolean;
  is_available: boolean;
}

export interface RailStage {
  id: string;
  label: string;
  phase: string;
  description: string;
  aliases: string[];
  subagents: string[];
}

export interface ResolvedAgentFlow {
  stages: RailStage[];
  statuses: AgentStatus[];
  activeIndex: number;
  activeStage: RailStage;
  activeStatus: AgentStatus;
  activeSubagentTimeline: SubagentTimelineItem[];
  activeSubagent?: SubagentTimelineItem;
  activeSubagentLabel?: string;
  activeProcessMessage?: string;
  completedCount: number;
  totalCount: number;
}
```
