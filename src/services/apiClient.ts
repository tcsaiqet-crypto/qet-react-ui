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
  RetryRunResponse,
  ExecutionStatusResponse,
  MultiLevelExecutionReport,
  AITestAnalysisResult,
  AIScriptModificationRequest,
  AIScriptModificationResponse,
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
  const errorText = await res.text();
  let parsed: any = null;
  try {
    parsed = JSON.parse(errorText);
  } catch {
    // not JSON
  }
  const detail = parsed?.detail;
  if (Array.isArray(detail)) {
    const errorMsg = detail
      .map((d) => (typeof d === 'string' ? d : d.msg ? `${d.loc ? d.loc.join('.') + ': ' : ''}${d.msg}` : JSON.stringify(d)))
      .join('; ');
    throw new ApiError(errorMsg || fallbackMessage, 'validation_error', { validation_errors: detail });
  }
  if (typeof detail === 'object' && detail !== null) {
    throw new ApiError(
      detail.error_message || detail.message || fallbackMessage,
      detail.error_code,
      detail.diagnostics
    );
  }
  const msg = (typeof detail === 'string' ? detail : null) || parsed?.error_message || parsed?.message || (errorText ? `${fallbackMessage} (${res.status}): ${errorText}` : `${fallbackMessage} (${res.status})`);
  throw new ApiError(msg);
}

export async function getAISettings(): Promise<AISettingsResponse> {
  const res = await fetch(`${API_BASE_URL}/settings/ai`);
  if (!res.ok) {
    await throwApiError(res, 'Failed to fetch AI settings');
  }
  return res.json();
}

export async function saveAISettings(payload: Partial<AISettingsResponse> | any): Promise<AISettingsResponse> {
  const res = await fetch(`${API_BASE_URL}/settings/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    await throwApiError(res, 'Failed to save AI settings');
  }
  return res.json();
}

export const updateAISettings = saveAISettings;

export async function verifyAISettings(payload?: AISettingsResponse): Promise<VerifyAISettingsResponse> {
  const res = await fetch(`${API_BASE_URL}/settings/ai/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  if (!res.ok) {
    await throwApiError(res, 'Failed to verify AI connection');
  }
  return res.json();
}


export async function createRun(projectName = 'CFA Digital Journey'): Promise<CreateRunResponse> {
  const res = await fetch(`${API_BASE_URL}/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_name: projectName }),
  });
  if (!res.ok) {
    await throwApiError(res, 'Failed to create run');
  }
  return res.json();
}

export async function listRuns(): Promise<RunListResponse> {
  const res = await fetch(`${API_BASE_URL}/runs`);
  if (!res.ok) {
    await throwApiError(res, 'Failed to list runs');
  }
  return res.json();
}

export async function uploadDocuments(runId: string, files: File[]): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const res = await fetch(`${API_BASE_URL}/runs/${runId}/upload/documents`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    await throwApiError(res, 'Failed to upload documents');
  }
  return res.json();
}

export async function uploadCodebase(runId: string, zipFile: File): Promise<CodebaseUploadResponse> {
  const formData = new FormData();
  formData.append('file', zipFile);

  const res = await fetch(`${API_BASE_URL}/runs/${runId}/upload/codebase`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    await throwApiError(res, 'Failed to upload codebase');
  }
  return res.json();
}

export async function startUnderstanding(runId: string): Promise<{ status: string; run_id: string }> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/understanding/start`, {
    method: 'POST',
  });
  if (!res.ok) {
    await throwApiError(res, 'Failed to start understanding');
  }
  return res.json();
}

export async function getStatus(runId: string): Promise<StatusResponse> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/status`);
  if (!res.ok) {
    await throwApiError(res, 'Failed to fetch run status');
  }
  return res.json();
}

export const getRunStatus = getStatus;

export async function getRunFullState(runId: string): Promise<CreateRunResponse> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}`);
  if (!res.ok) {
    await throwApiError(res, 'Failed to fetch run full state');
  }
  return res.json();
}


export async function getUnderstanding(runId: string): Promise<ApplicationUnderstanding> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/understanding`);
  if (!res.ok) {
    await throwApiError(res, 'Failed to fetch application understanding');
  }
  return res.json();
}

export async function startPipeline(runId: string): Promise<{ status: string; run_id: string }> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/pipeline/start`, {
    method: 'POST',
  });
  if (!res.ok) {
    await throwApiError(res, 'Failed to start downstream pipeline');
  }
  return res.json();
}

export async function pausePipeline(runId: string): Promise<{ status: string; run_id: string; paused_stage?: string }> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/pipeline/pause`, {
    method: 'POST',
  });
  if (!res.ok) {
    await throwApiError(res, 'Failed to pause pipeline');
  }
  return res.json();
}

export async function resumePipeline(runId: string): Promise<{ status: string; run_id: string }> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/pipeline/resume`, {
    method: 'POST',
  });
  if (!res.ok) {
    await throwApiError(res, 'Failed to resume pipeline');
  }
  return res.json();
}

export async function stopPipeline(runId: string): Promise<{ status: string; run_id: string }> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/pipeline/stop`, {
    method: 'POST',
  });
  if (!res.ok) {
    await throwApiError(res, 'Failed to stop pipeline');
  }
  return res.json();
}

export async function cancelRun(runId: string): Promise<{ status: string; run_id: string }> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/cancel`, {
    method: 'POST',
  });
  if (!res.ok) {
    await throwApiError(res, 'Failed to cancel run');
  }
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
  test_case_ids?: string[];
  explicit_user_approval: boolean;
  is_non_production_confirmed: boolean;
  is_script_reviewed: boolean;
}): Promise<ExecutionStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/executions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to launch execution');
  return res.json();
}

export async function getExecutionStatus(runId: string, executionId: string): Promise<ExecutionStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/executions/${executionId}`);
  if (!res.ok) await throwApiError(res, 'Failed to retrieve execution status');
  return res.json();
}

export async function pauseExecution(runId: string, executionId: string): Promise<ExecutionStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/executions/${executionId}/pause`, { method: 'POST' });
  if (!res.ok) await throwApiError(res, 'Failed to pause execution');
  return res.json();
}

export async function resumeExecution(runId: string, executionId: string): Promise<ExecutionStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/executions/${executionId}/resume`, { method: 'POST' });
  if (!res.ok) await throwApiError(res, 'Failed to resume execution');
  return res.json();
}

export async function stopExecution(runId: string, executionId: string): Promise<ExecutionStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/executions/${executionId}/stop`, { method: 'POST' });
  if (!res.ok) await throwApiError(res, 'Failed to stop execution');
  return res.json();
}

export async function cancelExecution(runId: string, executionId: string): Promise<ExecutionStatusResponse> {
  return stopExecution(runId, executionId);
}

export async function getMultiLevelResults(runId: string, executionId: string): Promise<MultiLevelExecutionReport> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/executions/${executionId}/multi-level-results`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch multi-level results');
  return res.json();
}

export async function getLatestExecutionResults(runId: string): Promise<MultiLevelExecutionReport> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/execution-results`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch latest execution results');
  return res.json();
}

export async function runAITestAnalysis(runId: string): Promise<AITestAnalysisResult> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/ai-analysis`, {
    method: 'POST',
  });
  if (!res.ok) await throwApiError(res, 'Failed to run AI test analysis');
  return res.json();
}

export async function requestAIScriptModification(
  runId: string,
  payload: AIScriptModificationRequest
): Promise<AIScriptModificationResponse> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/ai-modify-script`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to request AI script modification');
  return res.json();
}

export async function applyAIScriptFix(
  runId: string,
  payload: { script_filename: string; test_case_id: string; modified_code: string }
): Promise<{ status: string; script_filename: string; test_case_id: string }> {
  const res = await fetch(`${API_BASE_URL}/runs/${runId}/apply-script-fix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, 'Failed to apply AI script fix');
  return res.json();
}

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

export async function getDiscoverableModels(): Promise<{
  active_provider: string;
  active_model: string;
  models: DiscoverableModel[];
}> {
  const res = await fetch(`${API_BASE_URL}/ai/models`);
  if (!res.ok) {
    throw new Error('Failed to fetch models');
  }
  return res.json();
}

