# Contracts: Feature 023 — End-to-End Playwright Automation, Evidence Capture, and Grounded Intelligence

## 1. Domain Types & Interfaces

```typescript
export interface TestCase {
  case_id: string;
  title: string;
  case_type: 'Positive' | 'Negative' | 'Boundary' | 'Validation' | 'Error-Handling';
  feature_area: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  review_status: string;
  steps?: string[];
  expected_result?: string;
  preconditions?: string[];
  synthetic_data_keys?: string[];
  requirement_id?: string;
  confidence?: string;
}

export interface PlaywrightScript {
  script_id: string;
  test_case_id: string;
  filename: string;
  code: string;
  page_objects: string[];
  selectors_used: string[];
  uncertain_selectors?: string[];
  provenance: Record<string, any>;
  validation_status: string;
  fallback_used: boolean;
}

export interface ScreenshotEvidence {
  screenshot_id: string;
  test_case_id: string;
  execution_status: 'PASSED' | 'FAILED';
  file_path: string;
  captured_at: string;
  step_index?: number;
}

export interface ExecuteCasesRequest {
  case_ids: string[];
  headed?: boolean;
  timeout_seconds?: number;
  capture_screenshots?: boolean;
}

export interface ExecuteCasesResponse {
  run_id: string;
  executed_count: number;
  passed_count: number;
  failed_count: number;
  results: {
    case_id: string;
    status: 'PASSED' | 'FAILED';
    duration_ms: number;
    screenshot_path?: string;
    error_message?: string;
  }[];
}
```

---

## 2. API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/runs/{run_id}/execute-cases` | Executes selective test cases with screenshot capture |
| `GET` | `/api/v1/runs/{run_id}/execution-stream` | SSE stream for real-time test status and console logs |
| `GET` | `/api/v1/runs/{run_id}/artifacts/quality_report.html` | Download standalone HTML quality report |
| `GET` | `/api/v1/runs/{run_id}/artifacts/quality_report.pdf` | Download ReportLab executive PDF report |
| `GET` | `/api/v1/runs/{run_id}/artifacts/allure-results.zip` | Export full Allure results bundle |
