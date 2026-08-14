import { 
  CreateRunResponse, 
  DocumentUploadResponse, 
  CodebaseUploadResponse, 
  StatusResponse, 
  ApplicationUnderstanding,
  ErrorPayload
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

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
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Document upload failed');
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
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Codebase ZIP upload failed');
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
