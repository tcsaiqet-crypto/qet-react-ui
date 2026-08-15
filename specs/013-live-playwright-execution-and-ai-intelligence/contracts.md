# Contracts 013: Live Playwright Execution, Lifecycle & AI Intelligence

## 1. Backend Pydantic Schemas (`backend/schemas/contracts.py`)

```python
from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class ExecutionStatus(str, Enum):
    IDLE = "idle"
    QUEUED = "queued"
    RUNNING = "running"
    PAUSED = "paused"
    STOPPED = "stopped"
    PASSED = "passed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    TIMED_OUT = "timed_out"
    NOT_RUN = "not_run"


class ScreenshotEvidence(BaseModel):
    filename: str
    url: str
    test_case_id: str
    case_type: str
    caption: str
    timestamp: str
    is_failure: bool = False


class TestStepExecutionDetail(BaseModel):
    step_number: number
    description: str
    status: str
    duration_ms: float
    screenshot_path: Optional[str] = None
    error_message: Optional[str] = None


class ScriptExecutionDetail(BaseModel):
    script_id: str
    filename: str
    test_case_id: str
    title: str
    case_type: str
    feature_area: str
    status: str
    duration_ms: float
    why_passed: Optional[str] = None
    why_failed: Optional[str] = None
    failure_classification: Optional[str] = None
    root_cause_analysis: Optional[str] = None
    steps: List[TestStepExecutionDetail] = Field(default_factory=list)
    screenshots: List[ScreenshotEvidence] = Field(default_factory=list)
    execution_logs: List[str] = Field(default_factory=list)
    code_snippet: Optional[str] = None


class MultiLevelExecutionReport(BaseModel):
    run_id: str
    execution_id: str
    timestamp: str
    summary: Dict[str, Any] = Field(default_factory=dict)
    breakdown_by_case_type: Dict[str, Any] = Field(default_factory=dict)
    breakdown_by_feature_area: Dict[str, Any] = Field(default_factory=dict)
    scripts: List[ScriptExecutionDetail] = Field(default_factory=list)
    screenshots_gallery: List[ScreenshotEvidence] = Field(default_factory=list)
    overall_pass_rate_percentage: float = 0.0
    total_scripts_count: int = 0


class AITestCaseInsight(BaseModel):
    test_case_id: str
    title: str
    case_type: str
    status: str
    explanation: str
    root_cause: Optional[str] = None
    defect_category: Optional[str] = None
    recommended_fix: Optional[str] = None


class AITestAnalysisResult(BaseModel):
    analysis_id: str
    run_id: str
    timestamp: str
    overall_health_score: float
    test_success_rate: float
    executive_summary: str
    risk_level: str
    defect_distribution: Dict[str, int] = Field(default_factory=dict)
    test_case_insights: List[AITestCaseInsight] = Field(default_factory=list)
    key_recommendations: List[str] = Field(default_factory=list)


class AIScriptModificationRequest(BaseModel):
    script_filename: str
    test_case_id: str
    current_code: str
    failure_log: Optional[str] = None
    instruction: Optional[str] = None


class AIScriptModificationResponse(BaseModel):
    script_filename: str
    test_case_id: str
    original_code: str
    modified_code: str
    explanation: str
    diff_summary: str
```

---

## 2. Frontend TypeScript Contracts (`src/types.ts`)

```typescript
export type ExecutionStatus = 'idle' | 'queued' | 'running' | 'paused' | 'stopped' | 'passed' | 'failed' | 'cancelled' | 'timed_out' | 'not_run';

export interface ScreenshotEvidence {
  filename: string;
  url: string;
  test_case_id: string;
  case_type: string;
  caption: string;
  timestamp: string;
  is_failure: boolean;
}

export interface TestStepExecutionDetail {
  step_number: number;
  description: string;
  status: string;
  duration_ms: number;
  screenshot_path?: string | null;
  error_message?: string | null;
}

export interface ScriptExecutionDetail {
  script_id: string;
  filename: string;
  test_case_id: string;
  title: string;
  case_type: string;
  feature_area: string;
  status: string;
  duration_ms: number;
  why_passed?: string | null;
  why_failed?: string | null;
  failure_classification?: string | null;
  root_cause_analysis?: string | null;
  steps: TestStepExecutionDetail[];
  screenshots: ScreenshotEvidence[];
  execution_logs: string[];
  code_snippet?: string | null;
}

export interface MultiLevelExecutionReport {
  run_id: string;
  execution_id: string;
  timestamp: string;
  summary: {
    total_scripts: number;
    total_test_cases: number;
    passed_count: number;
    failed_count: number;
    pass_rate_percentage: number;
    duration_seconds: number;
    execution_mode: string;
    target_host: string;
    [key: string]: any;
  };
  breakdown_by_case_type: Record<string, { total: number; passed: number; failed: number; pass_rate_percentage: number }>;
  breakdown_by_feature_area: Record<string, { total: number; passed: number; failed: number; pass_rate_percentage: number }>;
  scripts: ScriptExecutionDetail[];
  screenshots_gallery: ScreenshotEvidence[];
  overall_pass_rate_percentage: number;
  total_scripts_count: number;
}

export interface AITestCaseInsight {
  test_case_id: string;
  title: string;
  case_type: string;
  status: string;
  explanation: string;
  root_cause?: string | null;
  defect_category?: string | null;
  recommended_fix?: string | null;
}

export interface AITestAnalysisResult {
  analysis_id: string;
  run_id: string;
  timestamp: string;
  overall_health_score: number;
  test_success_rate: number;
  executive_summary: string;
  risk_level: string;
  defect_distribution: Record<string, number>;
  test_case_insights: AITestCaseInsight[];
  key_recommendations: string[];
}

export interface AIScriptModificationRequest {
  script_filename: string;
  test_case_id: string;
  current_code: string;
  failure_log?: string | null;
  instruction?: string | null;
}

export interface AIScriptModificationResponse {
  script_filename: string;
  test_case_id: string;
  original_code: string;
  modified_code: string;
  explanation: string;
  diff_summary: string;
}
```

---

## 3. REST & WebSocket API Specification

| Route | Method | Request Payload | Response Body | Description |
|---|---|---|---|---|
| `/api/v1/runs/{id}/pipeline/pause` | `POST` | none | `{"status": "paused", "paused_stage": "..."}` | Pause agent pipeline |
| `/api/v1/runs/{id}/pipeline/resume` | `POST` | none | `{"status": "resumed"}` | Resume agent pipeline |
| `/api/v1/runs/{id}/pipeline/stop` | `POST` | none | `{"status": "stopped"}` | Stop agent pipeline |
| `/api/v1/runs/{id}/executions` | `POST` | `ExecutionLaunchRequest` | `ExecutionStatusResponse` | Launch Playwright tests (Headed) |
| `/api/v1/runs/{id}/executions/{eid}/pause` | `POST` | none | `ExecutionStatusResponse` | Pause test queue |
| `/api/v1/runs/{id}/executions/{eid}/resume` | `POST` | none | `ExecutionStatusResponse` | Resume test queue |
| `/api/v1/runs/{id}/executions/{eid}/stop` | `POST` | none | `ExecutionStatusResponse` | Stop test execution safely |
| `/api/v1/runs/{id}/screenshots/{file}` | `GET` | none | `image/png` or `image/svg+xml` | Serve screenshot visual evidence |
| `/api/v1/runs/{id}/execution-results` | `GET` | none | `MultiLevelExecutionReport` | Retrieve multi-level execution report |
| `/api/v1/runs/{id}/ai-analysis` | `POST` | none | `AITestAnalysisResult` | Run AI Test Suite Health Evaluation |
| `/api/v1/runs/{id}/ai-modify-script` | `POST` | `AIScriptModificationRequest` | `AIScriptModificationResponse` | Request AI script fix & code diff |
| `/api/v1/runs/{id}/apply-script-fix` | `POST` | `ApplyScriptFixRequest` | `{"status": "applied", ...}` | Apply AI script fix to disk & state |
| `/api/v1/runs/{id}/executions/{eid}/events` | `WS` | websocket | `ExecutionStatusResponse` (streaming) | Stream live pytest terminal events |
