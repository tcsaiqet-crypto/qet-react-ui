import { AppState, AgentStatus, SubagentTimelineItem, SelectedAgentContext, RailViewMode } from '../types';

export interface RailStage {
  id: string;
  label: string;
  phase: string;
  description: string;
  aliases: string[];
  subagents: string[];
}

export const canonicalAgentStages: RailStage[] = [
  {
    id: 'intake',
    label: 'Intake Agent',
    phase: 'Intake',
    description: 'Document and codebase ZIP intake & indexing',
    aliases: ['intake', 'uploading', 'processing_zip', 'indexing'],
    subagents: ['Manifest Parser', 'Codebase Unpacker'],
  },
  {
    id: 'understanding',
    label: 'Application Understanding Agent',
    phase: 'Understand',
    description: 'Document parsing, AST analysis & categorization',
    aliases: ['understanding', 'ai_understanding_running', 'understanding_ready', 'Understanding', 'Requirement Understanding', 'Requirement Categorization', 'requirement_understanding', 'document_intake', 'application_understanding'],
    subagents: ['Doc Parser', 'Context Analyzer', 'Requirement Categorizer'],
  },
  {
    id: 'test_generation',
    label: 'Test Generation Agent',
    phase: 'Generate',
    description: '5-category test synthesis & synthetic data',
    aliases: ['test_generation', 'generation_running', 'Test Cases', 'Test Data', 'Playwright', 'test_cases', 'test_data', 'playwright', 'script_writer'],
    subagents: ['Test Case Synthesizer', 'Synthetic Data Generator', 'Playwright Code Generator'],
  },
  {
    id: 'execution',
    label: 'Execution Agent',
    phase: 'Execute',
    description: 'Live Playwright execution & evidence capture',
    aliases: ['execution', 'execution_running', 'Execution', 'playwright_execution'],
    subagents: ['Playwright Runner', 'API Runner', 'Evidence Collector'],
  },
  {
    id: 'quality',
    label: 'Quality Intelligence Agent',
    phase: 'Report',
    description: 'Diagnostics, root-cause analysis & executive report',
    aliases: ['quality', 'report', 'pipeline_complete', 'Report', 'Quality', 'reporting', 'dashboard'],
    subagents: ['Diagnostic Engine', 'Self-Correction Agent'],
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
  understandingCompletedCount?: number;
}

export function resolveAgentFlow(appState: AppState | null, viewMode?: RailViewMode | string): ResolvedAgentFlow {
  const stages = canonicalAgentStages;
  const status = (appState?.status || 'idle') as string;
  const intakeManifest = appState?.intake_manifest;
  const understanding = appState?.understanding;
  const testCases = (appState as any)?.test_cases;

  // Determine status for each of the 5 stages
  const statuses: AgentStatus[] = stages.map((stage) => {
    if (!appState) return 'pending';

    if (stage.id === 'intake') {
      if (intakeManifest && (intakeManifest.doc_files?.length || intakeManifest.total_files > 0)) {
        return 'completed';
      }
      if (['uploading', 'processing_zip', 'indexing'].includes(status)) {
        return 'running';
      }
      return 'pending';
    }

    if (stage.id === 'understanding') {
      if (understanding && ((understanding as any).discovered_endpoints?.length || (understanding as any).flows?.length || status === 'understanding_ready' || status === 'generation_running' || status === 'pipeline_complete')) {
        return 'completed';
      }
      if (status === 'ai_understanding_running') {
        return 'running';
      }
      if (status === 'error' && appState.last_error && !understanding) {
        return 'failed';
      }
      return 'pending';
    }

    if (stage.id === 'test_generation') {
      if (testCases && testCases.length > 0 && status !== 'generation_running') {
        return 'completed';
      }
      if (status === 'generation_running') {
        return 'running';
      }
      return 'pending';
    }

    if (stage.id === 'execution') {
      if (status === 'execution_running') {
        return 'running';
      }
      if (status === 'pipeline_complete') {
        return 'completed';
      }
      return 'pending';
    }

    if (stage.id === 'quality') {
      if (status === 'pipeline_complete') {
        return 'completed';
      }
      return 'pending';
    }

    return 'pending';
  });

  // Calculate active index
  let activeIndex = statuses.findIndex((s) => s === 'running');
  if (activeIndex === -1) {
    activeIndex = statuses.findIndex((s) => s === 'pending');
  }
  if (activeIndex === -1) {
    activeIndex = stages.length - 1;
  }

  const activeStage = stages[activeIndex] || stages[0];
  const activeStatus = statuses[activeIndex] || 'pending';
  const completedCount = statuses.filter((s) => s === 'completed').length;

  const runningSubagent = appState?.subagent_timeline?.find((s) => s.status === 'running') || appState?.subagent_timeline?.[(appState?.subagent_timeline?.length || 1) - 1];
  const activeSubagentLabel = runningSubagent?.label || activeStage.subagents[0];
  const activeProcessMessage = runningSubagent?.message || activeStage.description;

  return {
    stages,
    statuses,
    activeIndex,
    activeStage,
    activeStatus,
    activeSubagentTimeline: appState?.subagent_timeline || [],
    activeSubagent: runningSubagent,
    activeSubagentLabel,
    activeProcessMessage,
    completedCount,
    totalCount: stages.length,
    understandingCompletedCount: statuses[1] === 'completed' ? 1 : 0,
  };
}

export function resolveSelectedAgentContext(
  arg1: string | AppState | null | undefined,
  arg2?: string | AppState | null | undefined
): SelectedAgentContext | null {
  const selectedAgentId = typeof arg1 === 'string' || arg1 === null || arg1 === undefined ? (arg1 as string) : (arg2 as string);
  const appState = typeof arg1 === 'object' && arg1 !== null && 'status' in arg1 ? (arg1 as AppState) : (arg2 as AppState);

  const stage = canonicalAgentStages.find((s) => s.id === selectedAgentId || s.aliases.includes(selectedAgentId || '')) || canonicalAgentStages[0];
  if (!stage) return null;

  let displayLabel = stage.label;
  if (selectedAgentId === 'requirement_understanding') {
    displayLabel = 'Requirement Understanding Agent';
  } else if (selectedAgentId === 'document_intake') {
    displayLabel = 'Document Intake Agent';
  } else if (selectedAgentId === 'application_understanding') {
    displayLabel = 'Application Understanding Agent';
  }

  return {
    agent_id: selectedAgentId || stage.id,
    label: displayLabel,
    phase: stage.phase,
    step_number: canonicalAgentStages.indexOf(stage) + 1,
    status: 'pending',
    description: stage.description,
    subagents: stage.subagents.map((name, i) => ({
      subagent_id: `sub_${i}`,
      label: name,
      status: 'pending',
    })),
    inputs_summary: {
      files: (appState?.intake_manifest?.doc_files || []).map((f) => ({ name: f, extension: f.split('.').pop() || 'doc' })),
    },
    artifacts_summary: {
      total_artifacts: 0,
      manifest_available: Boolean(appState?.intake_manifest),
      checklist_evaluation: appState?.understanding?.gaps?.map((g: any, i: number) => ({
        check_id: g.gap_id || `CHK-${i + 1}`,
        title: g.title || `15-Point Checklist Item ${i + 1}`,
        status: g.severity === 'high' ? 'fail' : 'pass',
        score: g.confidence === 'high' ? 95 : 80,
        findings: g.description,
      })) || [],
    },
    execution_logs: [],
    retryable: true,
    can_clear_cache: true,
  };
}
