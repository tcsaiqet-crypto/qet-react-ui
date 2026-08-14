export interface FileMetadata {
  rel_path: string;
  size_bytes: number;
  extension: string;
  is_binary: boolean;
}

export interface IntakeManifest {
  upload_id: string;
  zip_filename: string;
  extracted_path: string;
  total_files: int | number;
  total_size_bytes: int | number;
  files?: FileMetadata[];
  doc_files?: string[];
  created_at: string;
}

export interface RequirementGap {
  gap_id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  evidence_source: string;
  confidence: string;
}

export interface ApplicationComponent {
  component_id: string;
  name: string;
  type: string;
  file_path: string;
  description: string;
  selectors: string[];
}

export interface ApplicationFlow {
  flow_id: string;
  name: string;
  start_point: string;
  end_point: string;
  steps: string[];
  description: string;
}

export interface UIElementControl {
  control_id: string;
  control_type: string;
  name: string;
  selector: string;
  page_route: string;
}

export interface UIInventory {
  total_controls: number;
  controls: UIElementControl[];
  controls_by_type: Record<string, number>;
}

export interface APIEndpointReference {
  endpoint_id: string;
  method: string;
  path: string;
  description: string;
  source_file: string;
}

export interface APIInventory {
  total_endpoints: number;
  endpoints: APIEndpointReference[];
}

export interface ProvenanceMetadata {
  provider: string;
  model?: string;
  prompt_version?: string;
  generated_at: string;
  fallback_used: boolean;
  validation_status: string;
  [key: string]: any;
}

export interface ApplicationUnderstanding {
  summary: string;
  architecture_notes: string;
  quality_score_percentage: number;
  components: ApplicationComponent[];
  flows: ApplicationFlow[];
  entry_points: string[];
  gaps: RequirementGap[];
  ui_inventory?: UIInventory;
  api_inventory?: APIInventory;
  testability_observations: string[];
  provenance: ProvenanceMetadata;
  validation_status: string;
  fallback_used: boolean;
}

export interface ErrorPayload {
  error_code: string;
  error_message: string;
  diagnostics?: Record<string, any>;
  retryable?: boolean;
}

export interface AppState {
  run_id: string;
  project_name: string;
  status: 'idle' | 'uploading' | 'processing_zip' | 'indexing' | 'ai_understanding_running' | 'understanding_ready' | 'error';
  progress: number;
  intake_manifest?: IntakeManifest;
  understanding?: ApplicationUnderstanding;
  last_error?: ErrorPayload;
  stage_timestamps?: Record<string, string>;
}

export interface CreateRunResponse {
  run_id: string;
  state: AppState;
}

export interface DocumentUploadResponse {
  uploaded_count: number;
  files: string[];
}

export interface CodebaseUploadResponse {
  intake_manifest: IntakeManifest;
  state: AppState;
}

export interface StatusResponse {
  run_id: string;
  state: AppState['status'];
  progress: number;
  error?: ErrorPayload;
  intake_manifest?: IntakeManifest;
  stage_timestamps?: Record<string, string>;
}
