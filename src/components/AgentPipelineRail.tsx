import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Loader2, 
  ShieldAlert, 
  ChevronDown, 
  ChevronRight, 
  Lock, 
  Layers, 
  FileText, 
  FolderArchive, 
  Sparkles,
  Database,
  Code2,
  PlayCircle,
  BarChart3,
  History,
  Settings
} from 'lucide-react';
import { AppState, AgentStatus } from '../types';
import { resolveAgentFlow, RailStage } from '../services/agentFlow';

export interface AgentPipelineRailProps {
  appState: AppState | null;
  selectedAgentId?: string | null;
  onSelectAgent?: (agentId: string) => void;
  onRunStage?: (stageId: string) => void;
  viewMode?: any;
  onToggleViewMode?: any;
  onOpenSettings?: () => void;
  onOpenRunsHistory?: () => void;
  dashboardUnlocked?: boolean;
}

const statusIcon = (status: AgentStatus) => {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2D6A4F]" />;
  if (status === 'running') return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-700" />;
  if (status === 'failed') return <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />;
  if (status === 'blocked') return <Lock className="h-4 w-4 shrink-0 text-slate-400" />;
  return <Clock className="h-4 w-4 shrink-0 text-slate-400" />;
};

const getStageIcon = (id: string) => {
  switch (id) {
    case 'application_understanding':
      return <Layers className="w-4 h-4 text-purple-600 shrink-0" />;
    case 'test_case_generation':
      return <FileText className="w-4 h-4 text-[#2D6A4F] shrink-0" />;
    case 'data_generation':
      return <Database className="w-4 h-4 text-amber-600 shrink-0" />;
    case 'test_script':
      return <Code2 className="w-4 h-4 text-blue-600 shrink-0" />;
    case 'execute':
      return <PlayCircle className="w-4 h-4 text-[#2D6A4F] shrink-0" />;
    case 'dashboard':
      return <BarChart3 className="w-4 h-4 text-indigo-600 shrink-0" />;
    default:
      return <Sparkles className="w-4 h-4 text-slate-500 shrink-0" />;
  }
};

export const AgentPipelineRail: React.FC<AgentPipelineRailProps> = ({
  appState,
  selectedAgentId = 'subagent_1a_req_intake',
  onSelectAgent,
  onOpenSettings,
  onOpenRunsHistory,
  dashboardUnlocked = false,
}) => {
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({
    application_understanding: true,
    test_case_generation: true,
  });
  const flow = resolveAgentFlow(appState);
  const { stages, statuses } = flow;

  const handleSelect = (id: string) => {
    if (onSelectAgent) {
      onSelectAgent(id);
    }
  };

  const toggleExpand = (stageId: string) => {
    setExpandedStages((prev) => ({
      ...prev,
      [stageId]: !prev[stageId],
    }));
  };

  const getSubagentStatus = (subId: string): AgentStatus => {
    if (!appState) return 'pending';
    if (subId === 'subagent_1a_req_intake') {
      return ((appState.intake_manifest?.doc_files?.length || 0) > 0 || !!appState.understanding || !!appState.test_suite) ? 'completed' : 'pending';
    }
    if (subId === 'subagent_1b_codebase_intake') {
      return ((appState.intake_manifest?.total_files || 0) > 0 || !!appState.understanding || !!appState.test_suite) ? 'completed' : 'pending';
    }
    if (subId === 'subagent_1c_understanding') {
      return (!!appState.understanding?.summary || (appState.test_suite?.test_cases?.length || 0) > 0) ? 'completed' : 'pending';
    }
    if (subId === 'subagent_2a_coverage_planner') {
      return (appState.test_suite?.test_cases && appState.test_suite.test_cases.length > 0) ? 'completed' : (appState.status === 'generation_running' ? 'running' : 'pending');
    }
    if (subId === 'subagent_2b_batch_generator') {
      return (appState.test_suite?.test_cases && appState.test_suite.test_cases.length > 0) ? 'completed' : (appState.status === 'generation_running' ? 'running' : 'pending');
    }
    return 'pending';
  };

  return (
    <aside className="w-80 h-full flex flex-col bg-slate-50 border-r border-slate-200 text-slate-700 select-none shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-sm">
            QET
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 tracking-tight">QET Agent</h1>
            <p className="text-[10px] text-slate-500 font-medium">Autonomous Quality Engine</p>
          </div>
        </div>
      </div>

      {/* Pipeline Stages Navigation */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
        {stages.map((stage, idx) => {
          const status = statuses[idx] || 'pending';
          const hasChildren = Boolean(stage.childSubagents && stage.childSubagents.length > 0);
          const isSelected = selectedAgentId === stage.id || (hasChildren && stage.childSubagents?.some(sub => sub.id === selectedAgentId));
          const isExpanded = Boolean(expandedStages[stage.id]);
          const isDashboard = stage.id === 'dashboard';
          const isLocked = isDashboard && !dashboardUnlocked;

          return (
            <div key={stage.id} className="space-y-1">
              {/* Main Stage Row */}
              <div
                onClick={() => {
                  if (isLocked) return;
                  if (hasChildren && stage.childSubagents && stage.childSubagents.length > 0) {
                    handleSelect(stage.childSubagents[0].id);
                  } else {
                    handleSelect(stage.id);
                  }
                }}
                className={`group flex items-center justify-between p-2.5 rounded-xl transition-all ${
                  isLocked
                    ? 'opacity-40 cursor-not-allowed text-slate-400 border border-transparent'
                    : isSelected
                    ? 'bg-white border border-slate-300 text-slate-900 shadow-sm font-semibold cursor-pointer'
                    : 'hover:bg-slate-200/60 text-slate-600 border border-transparent font-medium cursor-pointer'
                }`}
                title={isLocked ? 'Complete the Execute stage to unlock Dashboard' : undefined}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {getStageIcon(stage.id)}
                  <div className="truncate">
                    <p className="text-xs font-bold truncate leading-tight text-slate-900">{stage.label}</p>
                    <p className="text-[10px] text-slate-500 truncate leading-tight">
                      {isLocked ? 'Complete Execute stage to unlock' : stage.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isLocked ? <Lock className="h-4 w-4 shrink-0 text-slate-300" /> : statusIcon(status)}
                  {hasChildren && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(stage.id);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-Agents for Stages with Children */}
              {hasChildren && isExpanded && (
                <div className="pl-3.5 space-y-1 border-l-2 border-slate-300 ml-4 py-1">
                  {stage.childSubagents?.map((sub) => {
                    const isSubSelected = selectedAgentId === sub.id;
                    const subStatus = getSubagentStatus(sub.id);

                    return (
                      <div
                        key={sub.id}
                        onClick={() => handleSelect(sub.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                          isSubSelected
                            ? stage.id === 'application_understanding'
                              ? 'bg-purple-50 text-purple-900 border border-purple-200 font-semibold'
                              : 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold'
                            : 'hover:bg-slate-200/50 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {sub.id.includes('req_intake') && <FileText className="w-3.5 h-3.5 shrink-0 text-slate-500" />}
                          {sub.id.includes('codebase_intake') && <FolderArchive className="w-3.5 h-3.5 shrink-0 text-slate-500" />}
                          {sub.id.includes('understanding') && <Sparkles className="w-3.5 h-3.5 shrink-0 text-purple-600" />}
                          {sub.id.includes('coverage_planner') && <Layers className="w-3.5 h-3.5 shrink-0 text-emerald-600" />}
                          {sub.id.includes('batch_generator') && <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-600" />}
                          <span className="text-[11px] truncate">{sub.label}</span>
                        </div>
                        {statusIcon(subStatus)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Controls */}
      <div className="p-3 border-t border-slate-200 bg-white space-y-2">
        <div className="flex items-center justify-between gap-2">
          {onOpenRunsHistory && (
            <button
              onClick={onOpenRunsHistory}
              className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>Runs History</span>
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>AI Settings</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
