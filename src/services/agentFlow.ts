import { AppState, AgentStatus, SubagentTimelineItem, SelectedAgentContext, RailViewMode } from '../types';

export interface RailSubagent {
  id: string;
  label: string;
  description: string;
}

export interface RailStage {
  id: string;
  label: string;
  phase: string;
  description: string;
  aliases: string[];
  subagents: string[];
  childSubagents?: RailSubagent[];
}

export const canonicalAgentStages: RailStage[] = [
  {
    id: 'application_understanding',
    label: '1. Application Understanding Agent',
    phase: 'Intake & Understand',
    description: 'Parent orchestrator coordinating intake and requirement analysis',
    aliases: ['application_understanding', 'understanding', 'intake', 'requirement_intake', 'codebase_intake', 'requirement_understanding'],
    subagents: ['1a. Requirement Intake', '1b. Codebase Intake', '1c. Requirement Understanding'],
    childSubagents: [
      { id: 'subagent_1a_req_intake', label: '1a. Requirement Intake', description: 'Upload & parse requirement documents' },
      { id: 'subagent_1b_codebase_intake', label: '1b. Codebase Intake', description: 'Upload & index codebase ZIP' },
      { id: 'subagent_1c_understanding', label: '1c. Requirement Understanding', description: 'AI analysis & selector grounding' },
    ],
  },
  {
    id: 'test_case_generation',
    label: '2. Test Case Generation Agent',
    phase: 'Test Synthesis',
    description: 'Synthesize 5-category test suite mapped to requirements',
    aliases: ['test_case_generation', 'test_cases', 'Test Cases', 'generation_running'],
    subagents: ['Positive Synthesizer', 'Negative / Boundary Synthesizer'],
  },
  {
    id: 'data_generation',
    label: '3. Data Generation Agent',
    phase: 'Data Binding',
    description: 'AI synthetic data generator & custom dataset upload mapping',
    aliases: ['data_generation', 'test_data', 'Test Data', 'synthetic_data'],
    subagents: ['AI Data Synthesizer', 'Schema Validator'],
  },
  {
    id: 'test_script',
    label: '4. Test Script Agent',
    phase: 'Playwright Synthesis',
    description: 'Generate modular Python Playwright test scripts per case',
    aliases: ['test_script', 'playwright', 'Playwright', 'script_generation'],
    subagents: ['POM Builder', 'Fixture Injector', 'Script Generator'],
  },
  {
    id: 'execute',
    label: '5. Execute Agent',
    phase: 'Live Runner',
    description: 'Selective & sequential live execution with screenshot capture',
    aliases: ['execute', 'execution', 'Execution', 'playwright_execution'],
    subagents: ['Sequential Runner', 'Screenshot Capture Hook', 'SSE Streamer'],
  },
  {
    id: 'dashboard',
    label: '6. Dashboard Agent',
    phase: 'Reporting',
    description: 'Executive Allure metrics, per-case screenshots & runtime JSON',
    aliases: ['dashboard', 'report', 'Report', 'quality', 'pipeline_complete'],
    subagents: ['Allure Generator', 'PDF Exporter', 'Artifact Indexer'],
  },
];

export const agentStages = canonicalAgentStages;

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

export function resolveAgentFlow(appState: AppState | null, viewMode?: RailViewMode | string): ResolvedAgentFlow {
  const stages = canonicalAgentStages;
  const status = (appState?.status || 'idle') as string;
  const intakeManifest = appState?.intake_manifest;
  const understanding = appState?.understanding;
  const testSuite = appState?.test_suite;
  const dataset = appState?.synthetic_dataset;
  const scripts = (appState as any)?.playwright_scripts;

  const statuses: AgentStatus[] = stages.map((stage) => {
    if (!appState) return 'pending';

    if (stage.id === 'application_understanding') {
      if (understanding && (understanding.summary || understanding.components?.length > 0)) {
        return 'completed';
      }
      if (intakeManifest && (intakeManifest.doc_files?.length || intakeManifest.total_files > 0)) {
        return 'running';
      }
      return 'pending';
    }

    if (stage.id === 'test_case_generation') {
      if (testSuite && testSuite.test_cases?.length > 0) {
        return 'completed';
      }
      if (understanding && status === 'running') {
        return 'running';
      }
      return understanding ? 'pending' : 'blocked';
    }

    if (stage.id === 'data_generation') {
      if (dataset && dataset.records?.length > 0) {
        return 'completed';
      }
      return testSuite?.test_cases?.length ? 'pending' : 'blocked';
    }

    if (stage.id === 'test_script') {
      if (scripts && scripts.length > 0) {
        return 'completed';
      }
      return dataset?.records?.length ? 'pending' : 'blocked';
    }

    if (stage.id === 'execute') {
      return scripts?.length ? 'pending' : 'blocked';
    }

    if (stage.id === 'dashboard') {
      return scripts?.length ? 'pending' : 'blocked';
    }

    return 'pending';
  });

  const activeIndex = statuses.findIndex((s) => s === 'running' || s === 'pending');
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;
  const completedCount = statuses.filter((s) => s === 'completed').length;

  const runningSubagent = appState?.subagent_timeline?.find((s) => s.status === 'running') || appState?.subagent_timeline?.[appState.subagent_timeline.length - 1];

  return {
    stages,
    statuses,
    activeIndex: safeIndex,
    activeStage: stages[safeIndex],
    activeStatus: statuses[safeIndex],
    activeSubagentTimeline: appState?.subagent_timeline || [],
    activeSubagent: runningSubagent,
    activeSubagentLabel: runningSubagent?.label || stages[safeIndex]?.subagents?.[0] || 'Orchestrating Sub-Agent',
    activeProcessMessage: appState?.last_error?.error_message || runningSubagent?.message || 'Processing stage lifecycle execution',
    completedCount,
    totalCount: stages.length,
  };
}

export function resolveSelectedAgentContext(
  appState: AppState | null,
  agentId?: string | null
): SelectedAgentContext {
  const stages = canonicalAgentStages;
  const currentStage = stages.find((s) => s.id === agentId || s.aliases.includes(agentId || '')) || stages[0];
  return {
    agent_id: currentStage.id,
    label: currentStage.label,
    phase: currentStage.phase,
    step_number: 1,
    status: 'pending',
    description: currentStage.description,
    subagents: currentStage.subagents.map((name, i) => ({
      subagent_id: `sub_${i}`,
      label: name,
      status: 'pending',
    })),
    inputs_summary: {
      files: [],
      parameters: {},
    },
    artifacts_summary: {
      total_artifacts: 0,
      manifest_available: false,
    },
    execution_logs: [],
    retryable: true,
    can_clear_cache: true,
  };
}
