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
}

/** Single source of truth so the left rail and the top process bar never disagree. */
export const resolveAgentFlow = (appState: AppState | null): AgentFlowState => {
  const statuses = agentStages.map((stage) => statusForStage(appState, stage));

  const runningIndex = statuses.findIndex((status) => status === 'running');
  const failedIndex = statuses.findIndex((status) => status === 'failed' || status === 'blocked');
  const pendingIndex = statuses.findIndex((status) => status === 'pending');
  const resolvedIndex = runningIndex >= 0 ? runningIndex : failedIndex >= 0 ? failedIndex : pendingIndex;
  const activeIndex = resolvedIndex >= 0 ? resolvedIndex : agentStages.length - 1;

  const activeStage = agentStages[activeIndex];
  const activeStatus = statuses[activeIndex] || 'pending';
  const activeSubagentTimeline = latestSubagents(appState, activeStage.id);
  const activeSubagent =
    activeSubagentTimeline.find((item) => item.status === 'running') ||
    activeSubagentTimeline.find((item) => item.status === 'pending');

  return {
    stages: agentStages,
    statuses,
    activeIndex,
    activeStage,
    activeStatus,
    activeSubagentTimeline,
    activeSubagent,
    activeSubagentLabel: activeSubagent?.label || activeStage.subagents[0] || activeStage.description,
    activeProcessMessage: activeSubagent?.message || activeStage.description,
    completedStages: agentStages.filter((_, index) => index < activeIndex && statuses[index] === 'completed'),
    upcomingStages: agentStages.slice(Math.max(activeIndex, 0)),
    completedCount: statuses.filter((status) => status === 'completed').length,
    totalCount: agentStages.length,
  };
};
