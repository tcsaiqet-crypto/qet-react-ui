export interface FileMetadata {
  rel_path: string;
  size_bytes: number;
  extension: string;
  is_binary: boolean;
}

export interface ZipFileDecision {
  rel_path: string;
  extension: string;
  size_bytes: number;
  decision: string;
  reason: string;
  source: string;
}

export interface ZipProcessingSummary {
  total_members: number;
  included_count: number;
  excluded_count: number;
  reviewed_by_ai_count: number;
  current_step: string;
  decisions: ZipFileDecision[];
}

export interface IntakeManifest {
  upload_id: string;
  zip_filename: string;
  extracted_path: string;
  total_files: number;
  total_size_bytes: number;
  files?: FileMetadata[];
  doc_files?: string[];
  excluded_file_count?: number;
  created_at: string;
}

export interface RequirementValidationItem {
  item_id: number;
  item_name: string;
  status: string;
  evidence_source: string;
  confidence: string;
  observations: string;
}

export interface RequirementValidationReport {
  quality_score_percentage: number;
  evaluated_items_count: number;
  present_count: number;
  partial_count: number;
  missing_count: number;
  not_applicable_count: number;
  items: RequirementValidationItem[];
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
  validation_report?: RequirementValidationReport;
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
  launcher_state?: {
    zip_processing?: ZipProcessingSummary;
    [key: string]: any;
  };
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
  launcher_state?: AppState['launcher_state'];
}

export interface AIProviderConfig {
  key_present: boolean;
  display_name: string;
}

export interface AISettingsResponse {
  active_provider: 'gemini' | 'gpt';
  llm_enabled: boolean;
  providers: Record<'gemini' | 'gpt', AIProviderConfig>;
  runtime_state: {
    provider: string;
    enabled: boolean;
    has_key: boolean;
    state: string;
    model?: string | null;
  };
  gemini_candidate_models: string[];
}

export interface AIProviderVerificationResult {
  provider: 'gemini' | 'gpt' | string;
  configured: boolean;
  success: boolean;
  model?: string | null;
  candidates: string[];
  error_code?: string | null;
  error_message?: string | null;
  diagnostics?: Record<string, any> | null;
}

export interface VerifyAISettingsResponse {
  active_provider: 'gemini' | 'gpt';
  verified_at: string;
  results: Record<'gemini' | 'gpt', AIProviderVerificationResult>;
}

export interface RunSummary {
  run_id: string;
  project_name: string;
  status: AppState['status'] | string;
  progress: number;
  created_at?: string;
  updated_at?: string;
  total_files: number;
  doc_count: number;
  has_html_report?: boolean;
  has_pdf_report?: boolean;
  has_understanding?: boolean;
}

export interface RunListResponse {
  runs: RunSummary[];
}

