import { 
  AISettingsResponse,
  VerifyAISettingsResponse,
  CreateRunResponse, 
  DocumentUploadResponse, 
  CodebaseUploadResponse, 
  RunListResponse,
  StatusResponse, 
  ApplicationUnderstanding,
  ErrorPayload,
  RetryRunResponse
  , ExecutionStatusResponse
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || '/api/v1';

/** Error carrying structured backend diagnostics (error_code/diagnostics) instead of just a message. */
export class ApiError extends Error {
  error_code?: string;
  diagnostics?: Record<string, any>;

  constructor(message: string, error_code?: string, diagnostics?: Record<string, any>) {
    super(message);
    this.name = 'ApiError';
    this.error_code = error_code;
    this.diagnostics = diagnostics;
  }
}

async function throwApiError(res: Response, fallbackMessage: string): Promise<never> {
  const errorData = await res.json().catch(() => ({ detail: res.statusText }));
  const detail = errorData?.detail;
  if (detail && typeof detail === 'object') {
    throw new ApiError(detail.error_message || fallbackMessage, detail.error_code, detail.diagnostics);
  }
  throw new ApiError((typeof detail === 'string' && detail) || fallbackMessage);
}

export async function createRun(projectName = 'CFA Digital Journey'): Promise<CreateRunResponse> {
  const res = await fetch(`${API_BASE_URL}/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_name: projectName }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create run: ${res.statusText}`);
  }
  return res.json();
}

export async function uploadDocuments(runId: string, files: File[]): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const res = await fetch(`${API_BASE_URL}/runs/${runId}/documents`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    await throwApiError(res, 'Document upload failed');
  }
  return res.json();
}

export async function uploadCodebase(runId: string, file: File): Promise<CodebaseUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/runs/${runId}/codebase`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    await throwApiError(res, 'Codebase ZIP upload failed');
  }
  return res.json();
}

export async function getRunStatus(runId: string): Promise<StatusResponse> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/status`);
  if (!res.ok) {
    throw new Error(`Failed to query run status: ${res.statusText}`);
  }
  return res.json();
}

export async function getRunFullState(runId: string): Promise<CreateRunResponse> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}`);
  if (!res.ok) {
    await throwApiError(res, `Failed to load run ${runId}`);
  }
  return res.json();
}

export async function listRuns(): Promise<RunListResponse> {
  const res = await fetch(`${API_BASE_URL}/runs`);
  if (!res.ok) {
    await throwApiError(res, 'Failed to load previous runs');
  }
  return res.json();
}

export async function startUnderstanding(runId: string): Promise<{ status: string; run_id: string }> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/understanding/start`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`Failed to start understanding analysis: ${res.statusText}`);
  }
  return res.json();
}

export async function getUnderstanding(runId: string): Promise<{
  status: 'ready' | 'failed' | 'running' | string;
  understanding?: ApplicationUnderstanding;
  error_code?: string;
  error_message?: string;
  diagnostics?: Record<string, any>;
  retryable?: boolean;
  progress?: number;
}> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/understanding`);
  if (!res.ok) {
    throw new Error(`Failed to retrieve understanding result: ${res.statusText}`);
  }
  return res.json();
}

export async function startPipeline(runId: string): Promise<{ status: string; run_id: string }> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/pipeline/start`, {
    method: 'POST',
  });
  if (!res.ok) {
    await throwApiError(res, 'Failed to start downstream agents');
  }
  return res.json();
}

export async function getAISettings(): Promise<AISettingsResponse> {
  const res = await fetch(`${API_BASE_URL}/ai/settings`);
  if (!res.ok) {
    await throwApiError(res, 'Failed to load AI settings');
  }
  return res.json();
}

export async function updateAISettings(payload: {
  active_provider: 'gemini' | 'gpt';
  provider_keys: Partial<Record<'gemini' | 'gpt', string>>;
  clear_provider_keys?: Array<'gemini' | 'gpt'>;
}): Promise<AISettingsResponse> {
  const res = await fetch(`${API_BASE_URL}/ai/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    await throwApiError(res, 'Failed to save AI settings');
  }
  return res.json();
}

export async function verifyAISettings(): Promise<VerifyAISettingsResponse> {
  const res = await fetch(`${API_BASE_URL}/ai/settings/verify`, {
    method: 'POST',
  });
  if (!res.ok) {
    await throwApiError(res, 'Failed to verify provider keys');
  }
  return res.json();
}



export async function retryRun(runId: string, targetAgentId: string): Promise<RetryRunResponse> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/retry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_agent_id: targetAgentId }),
  });
  if (!res.ok) {
    await throwApiError(res, 'Failed to retry run step');
  }
  return res.json();
}

export async function launchExecution(runId: string, payload: {
  test_case_ids: string[];
  explicit_user_approval: boolean;
  is_non_production_confirmed: boolean;
  is_script_reviewed: boolean;
}): Promise<ExecutionStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/executions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to launch execution');
  return res.json();
}

export async function getExecutionStatus(runId: string, executionId: string): Promise<ExecutionStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/executions/${executionId}`);
  if (!res.ok) await throwApiError(res, 'Failed to retrieve execution status');
  return res.json();
}

export async function cancelExecution(runId: string, executionId: string): Promise<ExecutionStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/executions/${executionId}/cancel`, { method: 'POST' });
  if (!res.ok) await throwApiError(res, 'Failed to cancel execution');
  return res.json();
}

export async function getRunLogs(runId: string): Promise<{ run_id: string; backend_logs: string }> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/logs`);
  if (!res.ok) {
    throw new Error(`Failed to fetch logs: ${res.statusText}`);
  }
  return res.json();
}

export function getBackendLogsDownloadUrl(runId: string): string {
  return `${API_BASE_URL}/runs/${runId}/logs/download`;
}

export async function cancelRun(runId: string): Promise<{ status: string; run_id: string }> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/cancel`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`Failed to stop/cancel run: ${res.statusText}`);
  }
  return res.json();
}



