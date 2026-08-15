import { AppState, AgentStatus, SubagentTimelineItem } from '../types';

export interface RailStage {
  id: string;
  label: string;
  phase: string;
  description: string;
  aliases: string[];
  subagents: string[];
}

export const agentStages: RailStage[] = [
  {
    id: 'requirement_understanding',
    label: 'Requirement Understanding Agent',
    phase: 'Understand',
    description: 'Documents and checklist intake',
    aliases: ['requirement_understanding', 'Requirement Understanding'],
    subagents: ['Requirement Parser'],
  },
  {
    id: 'document_intake',
    label: 'Document Intake Agent',
    phase: 'Understand',
    description: 'Codebase archive indexing',
    aliases: ['document_intake', 'Document Intake'],
    subagents: ['Codebase AST Extractor'],
  },
  {
    id: 'application_understanding',
    label: 'Application Understanding Agent',
    phase: 'Understand',
    description: 'AI application synthesis',
    aliases: ['application_understanding', 'Understanding'],
    subagents: ['UI Journey Synthesizer', 'Requirement Gap Analyzer'],
  },
  {
    id: 'requirement_categorization',
    label: 'Requirement Categorization',
    phase: 'Generate',
    description: 'Optional requirement classification',
    aliases: ['requirement_categorization', 'Requirement Categorization'],
    subagents: [],
  },
  {
    id: 'accessibility',
    label: 'Accessibility Agent',
    phase: 'Understand',
    description: 'Static WCAG source scan',
    aliases: ['accessibility', 'Accessibility'],
    subagents: [],
  },
  {
    id: 'test_cases',
    label: 'Test Case Generator Agent',
    phase: 'Generate',
    description: 'Positive and negative test suite',
    aliases: ['test_cases', 'Test Cases', 'test_case_agent'],
    subagents: [],
  },
  {
    id: 'test_data',
    label: 'Test Data Agent',
    phase: 'Generate',
    description: 'Synthetic, non-PII dataset',
    aliases: ['test_data', 'Test Data', 'test_data_agent'],
    subagents: [],
  },
  {
    id: 'script_writer',
    label: 'Script Writer Agent',
    phase: 'Generate',
    description: 'Playwright page objects and tests',
    aliases: ['script_writer', 'Playwright', 'playwright_agent'],
    subagents: [],
  },
  {
    id: 'execution',
    label: 'Execution Engine',
    phase: 'Execute',
    description: 'Playwright run and evidence capture',
    aliases: ['execution', 'execution_engine'],
    subagents: [],
  },
  {
    id: 'reporting',
    label: 'Reporting Agent',
    phase: 'Report',
    description: 'Quality report and result artifacts',
    aliases: ['reporting', 'Report', 'report_agent'],
    subagents: [],
  },
  {
    id: 'dashboard',
    label: 'Final Dashboard',
    phase: 'Report',
    description: 'Run results and downloadable evidence',
    aliases: ['dashboard', 'final_dashboard'],
    subagents: [],
  },
];

export const understandingStageIds = [
  'requirement_understanding',
  'document_intake',
  'application_understanding',
];

export const understandingStages = agentStages.filter((stage) =>
  understandingStageIds.includes(stage.id)
);

export const statusForStage = (appState: AppState | null, stage: RailStage): AgentStatus => {
  const item = [...(appState?.agent_timeline || [])]
    .reverse()
    .find((timelineItem) => stage.aliases.includes(timelineItem.agent_id));
  if (item) return item.status;

  if (stage.id === 'requirement_understanding') {
    return appState?.intake_manifest?.doc_files?.length ? 'completed' : 'pending';
  }
  if (stage.id === 'document_intake') {
    return appState?.intake_manifest?.total_files ? 'completed' : 'pending';
  }
  if (stage.id === 'application_understanding') {
    if (appState?.status === 'ai_understanding_running') return 'running';
    if (appState?.status === 'understanding_ready') return 'completed';
    if (appState?.status === 'error') return 'failed';
  }
  return 'pending';
};

export const latestSubagents = (appState: AppState | null, parentId: string): SubagentTimelineItem[] => {
  const timeline = appState?.subagent_timeline || [];
  const latestById = new Map<string, SubagentTimelineItem>();
  timeline.forEach((item) => {
    if (item.parent_agent_id === parentId) latestById.set(item.subagent_id, item);
  });
  return Array.from(latestById.values());
};

export interface AgentFlowState {
  stages: RailStage[];
  statuses: AgentStatus[];
  activeIndex: number;
  activeStage: RailStage;
  activeStatus: AgentStatus;
  activeSubagentTimeline: SubagentTimelineItem[];
  activeSubagent?: SubagentTimelineItem;
  activeSubagentLabel: string;
  activeProcessMessage: string;
  completedStages: RailStage[];
  upcomingStages: RailStage[];
  completedCount: number;
  totalCount: number;
  understandingStagesList: RailStage[];
  understandingCompletedCount: number;
  isUnderstandingPhaseComplete: boolean;
}

/** Single source of truth so the left rail and the top process bar never disagree. */
export const resolveAgentFlow = (
  appState: AppState | null,
  viewMode: 'understanding_focus' | 'full_pipeline' = 'understanding_focus'
): AgentFlowState => {
  const allStatuses = agentStages.map((stage) => statusForStage(appState, stage));

  const targetStages = viewMode === 'understanding_focus' ? understandingStages : agentStages;
  const statuses = targetStages.map((stage) => statusForStage(appState, stage));

  const runningIndex = statuses.findIndex((status) => status === 'running');
  const failedIndex = statuses.findIndex((status) => status === 'failed' || status === 'blocked');
  const pendingIndex = statuses.findIndex((status) => status === 'pending');
  const resolvedIndex = runningIndex >= 0 ? runningIndex : failedIndex >= 0 ? failedIndex : pendingIndex;
  const activeIndex = resolvedIndex >= 0 ? resolvedIndex : targetStages.length - 1;

  const activeStage = targetStages[activeIndex] || agentStages[0];
  const activeStatus = statuses[activeIndex] || 'pending';
  const activeSubagentTimeline = latestSubagents(appState, activeStage.id);
  const activeSubagent =
    activeSubagentTimeline.find((item) => item.status === 'running') ||
    activeSubagentTimeline.find((item) => item.status === 'pending');

  const understandingCompletedCount = understandingStages.filter(
    (s) => statusForStage(appState, s) === 'completed'
  ).length;

  return {
    stages: targetStages,
    statuses,
    activeIndex,
    activeStage,
    activeStatus,
    activeSubagentTimeline,
    activeSubagent,
    activeSubagentLabel: activeSubagent?.label || activeStage.subagents[0] || activeStage.description,
    activeProcessMessage: activeSubagent?.message || activeStage.description,
    completedStages: targetStages.filter((_, index) => index < activeIndex && statuses[index] === 'completed'),
    upcomingStages: targetStages.slice(Math.max(activeIndex, 0)),
    completedCount: allStatuses.filter((status) => status === 'completed').length,
    totalCount: agentStages.length,
    understandingStagesList: understandingStages,
    understandingCompletedCount,
    isUnderstandingPhaseComplete: understandingCompletedCount === understandingStages.length,
  };
};

/** Synthesize full inspection context for any selected agent */
export const resolveSelectedAgentContext = (
  appState: AppState | null,
  selectedAgentId: string | null
): import('../types').SelectedAgentContext | null => {
  if (!selectedAgentId) return null;

  const stage = agentStages.find((s) => s.id === selectedAgentId || s.aliases.includes(selectedAgentId));
  if (!stage) return null;

  const status = statusForStage(appState, stage);
  const stageIndex = agentStages.findIndex((s) => s.id === stage.id);
  const subagentTimeline = latestSubagents(appState, stage.id);

  const subagents = (stage.subagents || []).map((name, idx) => {
    const found = subagentTimeline.find((s) => s.label === name || s.subagent_id.includes(name.toLowerCase().replace(/\s+/g, '_')));
    return {
      subagent_id: found?.subagent_id || `sub_${stage.id}_${idx + 1}`,
      label: name,
      status: found?.status || (status === 'completed' ? 'completed' : status === 'running' ? 'running' : 'pending'),
      message: found?.message || `${name} stage task`,
    };
  });

  const manifest = appState?.intake_manifest;
  const understanding = appState?.understanding;

  let inputs_summary: import('../types').SelectedAgentContext['inputs_summary'] = {};
  let artifacts_summary: import('../types').SelectedAgentContext['artifacts_summary'] = {
    total_artifacts: 0,
    manifest_available: false,
  };
  const execution_logs: string[] = [];

  if (stage.id === 'requirement_understanding') {
    const docFiles = (manifest?.doc_files || []).map((df) => ({
      name: df,
      extension: df.split('.').pop() || 'md',
    }));
    inputs_summary = { files: docFiles };
    artifacts_summary = {
      total_artifacts: docFiles.length,
      manifest_available: Boolean(docFiles.length),
      data_payload: { doc_files: manifest?.doc_files || [] },
    };
    if (docFiles.length) {
      execution_logs.push(`[Requirement Parser] Successfully indexed ${docFiles.length} specification document(s).`);
    }
  } else if (stage.id === 'document_intake') {
    inputs_summary = {
      files: manifest?.zip_filename ? [{ name: manifest.zip_filename, size_bytes: manifest.total_size_bytes }] : [],
      parameters: { total_files: manifest?.total_files || 0, extracted_path: manifest?.extracted_path },
    };
    artifacts_summary = {
      total_artifacts: manifest?.total_files || 0,
      manifest_available: Boolean(manifest?.total_files),
      data_payload: {
        total_files: manifest?.total_files || 0,
        extracted_path: manifest?.extracted_path,
        zip_filename: manifest?.zip_filename,
      },
    };
    if (manifest?.total_files) {
      execution_logs.push(`[AST Extractor] Unpacked archive. ${manifest.total_files} source files mapped.`);
    }
  } else if (stage.id === 'application_understanding') {
    inputs_summary = {
      parameters: {
        doc_count: manifest?.doc_files?.length || 0,
        source_files: manifest?.total_files || 0,
      },
    };
    const checklist = understanding?.gaps?.map((gap, idx) => ({
      check_id: gap.gap_id || `GAP-${idx + 1}`,
      title: gap.title || `Checklist Item ${idx + 1}`,
      status: (gap.severity === 'high' ? 'fail' : gap.severity === 'medium' ? 'partial' : 'pass') as any,
      score: gap.severity === 'high' ? 0 : gap.severity === 'medium' ? 60 : 100,
      findings: gap.description || '',
    })) || [];

    artifacts_summary = {
      total_artifacts: (understanding?.components?.length || 0) + (understanding?.flows?.length || 0),
      manifest_available: Boolean(understanding),
      data_payload: understanding,
      checklist_evaluation: checklist,
    };
    if (understanding) {
      execution_logs.push(`[Journey Synthesizer] Discovered ${understanding.components?.length || 0} DOM components.`);
      execution_logs.push(`[Gap Analyzer] Application testability score: ${understanding.quality_score_percentage || 0}%.`);
    }
  } else if (stage.id === 'test_cases') {
    const testCases = appState?.test_suite?.test_cases || [];
    inputs_summary = { parameters: { understanding_summary: Boolean(understanding) } };
    artifacts_summary = {
      total_artifacts: testCases.length,
      manifest_available: Boolean(testCases.length),
      data_payload: { total_test_cases: testCases.length, test_cases: testCases },
    };
    if (testCases.length) {
      execution_logs.push(`[Test Case Agent] Generated ${testCases.length} multi-disciplinary test cases.`);
    }
  } else if (stage.id === 'script_writer') {
    const scripts = appState?.playwright_scripts || [];
    artifacts_summary = {
      total_artifacts: scripts.length,
      manifest_available: Boolean(scripts.length),
      data_payload: { total_scripts: scripts.length, scripts },
    };
    if (scripts.length) {
      execution_logs.push(`[Script Writer] Generated ${scripts.length} standalone Playwright test scripts.`);
    }
  } else if (stage.id === 'execution') {
    const execResult = appState?.last_execution_result;
    artifacts_summary = {
      total_artifacts: execResult?.step_results?.length || 0,
      manifest_available: Boolean(execResult),
      data_payload: execResult,
    };
    if (execResult) {
      execution_logs.push(`[Execution Engine] Status: ${execResult.status} | Passed: ${execResult.passed_count} | Failed: ${execResult.failed_count}`);
    }
  }

  return {
    agent_id: stage.id,
    label: stage.label,
    phase: stage.phase,
    step_number: stageIndex + 1,
    status,
    description: stage.description,
    subagents,
    inputs_summary,
    artifacts_summary,
    execution_logs,
    retryable: ['requirement_understanding', 'document_intake', 'application_understanding', 'test_cases', 'script_writer', 'execution'].includes(stage.id),
    can_clear_cache: true,
  };
};

