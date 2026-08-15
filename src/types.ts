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
  status?: string;
  error_code?: string;
  error_message?: string;
  diagnostics?: Record<string, any>;
  retryable?: boolean;
  understanding?: ApplicationUnderstanding;
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

export interface TestCase {
  case_id: string;
  title: string;
  case_type: string;
  feature_area: string;
  priority: string;
  description: string;
  review_status: string;
}

export interface TestSuite {
  suite_id: string;
  name: string;
  test_cases: TestCase[];
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
  upstream_case_ids?: string[];
  validation_status: string;
  selector_confidence_map?: Record<string, string>;
  fallback_used: boolean;
}

export type ExecutionStatus = 'idle' | 'queued' | 'running' | 'paused' | 'stopped' | 'passed' | 'failed' | 'cancelled' | 'timed_out' | 'not_run';

export interface TestStepResult {
  step_number: number;
  description: string;
  status: ExecutionStatus | string;
  error_message?: string | null;
  screenshot_path?: string | null;
}

export type ExecutionStepResult = TestStepResult;

export interface ExecutionResult {
  execution_id: string;
  mode?: string;
  status: ExecutionStatus | string;
  duration_seconds: number;
  passed_count: number;
  failed_count: number;
  blocked_count: number;
  step_results: TestStepResult[];
  failure_summary?: string | null;
  failure_classification?: string | null;
  execution_logs?: string[];
  evidence_paths?: string[];
  base_url?: string;
  provenance?: Record<string, any>;
}

export interface ExecutionLaunchRequest {
  test_case_ids?: string[];
  explicit_user_approval: boolean;
  is_non_production_confirmed: boolean;
  is_script_reviewed: boolean;
}

export interface ExecutionStatusResponse {
  execution_id: string;
  run_id: string;
  status: ExecutionStatus;
  selected_test_case_ids: string[];
  current_test_case_id?: string | null;
  current_step?: string | null;
  logs: string[];
  result?: ExecutionResult | null;
}

export interface AppState {
  run_id: string;
  project_name: string;
  status: 'idle' | 'uploading' | 'processing_zip' | 'indexing' | 'ai_understanding_running' | 'understanding_ready' | 'generation_running' | 'pipeline_complete' | 'error';
  progress: number;
  intake_manifest?: IntakeManifest;
  understanding?: ApplicationUnderstanding;
  test_suite?: TestSuite;
  playwright_scripts?: PlaywrightScript[];
  last_execution_result?: ExecutionResult;
  latest_multi_level_results?: Record<string, any>;
  ai_test_analysis?: AITestAnalysisResult | Record<string, any>;
  pipeline_control_state?: string;
  paused_stage?: string;
  last_error?: ErrorPayload;
  stage_timestamps?: Record<string, string>;
  agent_timeline?: AgentTimelineItem[];
  subagent_timeline?: SubagentTimelineItem[];
  active_agent?: string;
  upcoming_agent?: string;
  reset_generation?: number;
  upload_summary_left?: UploadLaneSummary;
  upload_summary_right?: UploadLaneSummary;
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
  agent_timeline?: AgentTimelineItem[];
  subagent_timeline?: SubagentTimelineItem[];
  active_agent?: string;
  upcoming_agent?: string;
  reset_generation?: number;
}

export interface AIProviderConfig {
  key_present: boolean;
  display_name: string;
}

export interface AISettingsResponse {
  active_provider: 'gemini' | 'gpt';
  llm_enabled: boolean;
  providers: Record<'gemini' | 'gpt', AIProviderConfig>;
  provider_keys?: Record<string, string>;
  runtime_state: {
    provider: string;
    enabled: boolean;
    has_key: boolean;
    state: string;
    model?: string | null;
  };
  gemini_candidate_models: string[];
  [key: string]: any;
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

export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed' | 'invalidated' | 'blocked';

export interface AgentTimelineItem {
  event_id?: string;
  event_type?: string;
  agent_id: string;
  label?: string;
  status: AgentStatus;
  message?: string;
  timestamp?: string;
  source?: string;
  started_at?: string;
  completed_at?: string;
  generation: number;
}

export interface SubagentTimelineItem {
  parent_agent_id: string;
  subagent_id: string;
  label: string;
  status: AgentStatus;
  message?: string;
  started_at?: string;
  completed_at?: string;
  generation: number;
}

export interface UploadLaneItem {
  path: string;
  name: string;
  size_bytes: number;
  decision: 'included' | 'excluded' | 'reviewed';
  reason?: string;
  source?: string;
}

export interface UploadLaneSummary {
  lane_id: 'documents' | 'codebase';
  title: string;
  total_files: number;
  included_count: number;
  excluded_count: number;
  reviewed_count: number;
  files: UploadLaneItem[];
}

export interface LifecycleEvent {
  event_id: string;
  event_type: 'agent_entered' | 'agent_completed' | 'agent_failed' | 'subagent_started' | 'subagent_completed' | 'subagent_failed' | 'agent_retry_requested' | 'downstream_invalidated';
  run_id: string;
  agent_id: string;
  subagent_id?: string | null;
  generation: number;
  message: string;
  timestamp: string;
  source: string;
}

export interface RetryRunRequest {
  target_agent_id: 'requirement_understanding' | 'document_intake' | 'application_understanding';
}

export interface RetryRunResponse {
  run_id: string;
  reset_generation: number;
  state: AppState;
}

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

// ── Spec-Kit 014 Interactive Rail & Right Drawer Contracts ────────────
export type RailViewMode = 'understanding_focus' | 'full_pipeline';

export type DrawerTabId = 'overview' | 'subagents' | 'artifacts' | 'actions';

export type StagedHeroStep =
  | 'requirement_understanding'
  | 'document_intake'
  | 'application_understanding';

export interface SelectedAgentContext {
  agent_id: string;
  label: string;
  phase: string;
  step_number: number;
  status: AgentStatus;
  description: string;
  subagents: Array<{
    subagent_id: string;
    label: string;
    status: AgentStatus | string;
    message?: string;
    elapsed_seconds?: number;
  }>;
  inputs_summary: {
    files?: Array<{ name: string; size_bytes?: number; extension?: string }>;
    parameters?: Record<string, any>;
    prompt_tokens?: number;
  };
  artifacts_summary: {
    total_artifacts: number;
    manifest_available: boolean;
    data_payload?: Record<string, any>;
    checklist_evaluation?: Array<{
      check_id: string;
      title: string;
      status: 'pass' | 'fail' | 'partial' | string;
      score: number;
      findings: string;
    }>;
  };
  execution_logs: string[];
  retryable: boolean;
  can_clear_cache: boolean;
}

export interface DrawerState {
  isOpen: boolean;
  activeTab: DrawerTabId;
  selectedAgentId: string | null;
  isDocked: boolean;
  width: number;
}

