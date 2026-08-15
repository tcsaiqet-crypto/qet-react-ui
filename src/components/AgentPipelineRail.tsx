import React, { useEffect, useRef } from 'react';
import { CheckCircle2, Clock, Layers, Loader2, ShieldAlert, Play, Eye } from 'lucide-react';
import { AppState, AgentStatus } from '../types';
import { resolveAgentFlow, RailStage } from '../services/agentFlow';

interface AgentPipelineRailProps {
  appState: AppState | null;
  selectedAgentId?: string | null;
  onSelectAgent?: (agentId: string) => void;
  onRunStage?: (stageId: string) => void;
  viewMode?: any;
  onToggleViewMode?: any;
}

const statusIcon = (status: AgentStatus) => {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />;
  if (status === 'running') return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600" />;
  if (status === 'failed' || status === 'blocked') return <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />;
  return <Clock className="h-4 w-4 shrink-0 text-slate-400" />;
};

const subagentDot = (status: AgentStatus) => {
  const color =
    status === 'completed'
      ? '#059669'
      : status === 'running'
      ? '#2563EB'
      : status === 'failed' || status === 'blocked'
      ? '#DC2626'
      : '#94A3B8';
  return (
    <span
      className={`h-1.5 w-1.5 shrink-0 rounded-full ${status === 'running' ? 'animate-pulse' : ''}`}
      style={{ backgroundColor: color }}
    />
  );
};

const SubagentList: React.FC<{ names: string[]; status: AgentStatus }> = ({ names, status }) => (
  <div className="mt-2 space-y-1 pl-3 border-l-2 border-slate-200 dark:border-slate-700">
    {names.map((name) => (
      <div
        key={name}
        className="flex items-center justify-between gap-1.5 text-[11px] leading-tight text-slate-500 dark:text-slate-400 py-0.5"
      >
        <div className="flex items-center gap-1.5 truncate">
          {subagentDot(status)}
          <span className="truncate">{name}</span>
        </div>
        {status === 'completed' && <span className="text-[9px] text-emerald-600 font-semibold">✓</span>}
      </div>
    ))}
  </div>
);

export const AgentPipelineRail: React.FC<AgentPipelineRailProps> = ({
  appState,
  selectedAgentId,
  onSelectAgent,
  onRunStage,
}) => {
  const flow = resolveAgentFlow(appState);
  const { stages, statuses, activeIndex } = flow;
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-scroll into view when active index changes
  useEffect(() => {
    if (activeIndex >= 0 && cardRefs.current[activeIndex]) {
      cardRefs.current[activeIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeIndex]);

  const handleStageClick = (stage: RailStage) => {
    if (onSelectAgent) {
      onSelectAgent(stage.id);
    }
  };

  const isSelected = (stageId: string) => selectedAgentId === stageId;

  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-20 lg:w-72" aria-label="QET agent execution rail">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
        {/* Rail Header */}
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0 bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-800">
              <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">QET Agent Flow</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {flow.completedCount} of {flow.totalCount} stages completed
              </p>
            </div>
          </div>
        </div>

        {/* 5 Canonical Stages */}
        <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-0.5">
          {stages.map((stage, order) => {
            const status = statuses[order] || 'pending';
            const isActive = order === activeIndex;
            const selected = isSelected(stage.id);
            const isCompleted = status === 'completed';
            const isExpanded = isActive || selected || (!isCompleted && order === activeIndex);

            return (
              <div
                key={stage.id}
                ref={(el) => (cardRefs.current[order] = el)}
                role="button"
                tabIndex={0}
                onClick={() => handleStageClick(stage)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleStageClick(stage);
                  }
                }}
                className={`group relative rounded-xl border p-2.5 transition-all duration-300 cursor-pointer ${
                  selected
                    ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/30 shadow-sm dark:bg-blue-950/30'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                    : isActive
                    ? 'border-blue-400 bg-blue-50/60 dark:border-blue-600 dark:bg-blue-950/40'
                    : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40'
                }`}
              >
                {/* Stage Header Line */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {statusIcon(status)}
                    <span
                      className={`text-xs truncate ${
                        selected || isActive ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[9px] uppercase font-mono px-1 py-0.5 text-slate-400">
                      {order + 1}
                    </span>
                    {isActive && status === 'running' && (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase bg-blue-600 text-white">
                        Live
                      </span>
                    )}
                    {isCompleted && !isExpanded && (
                      <span className="text-[9px] text-emerald-700 font-semibold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Done
                      </span>
                    )}
                  </div>
                </div>

                {/* Subagents & Single Action Button */}
                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {stage.subagents.length > 0 && (
                      <SubagentList names={stage.subagents} status={status} />
                    )}

                    {/* Strict One Primary Action Button Rule */}
                    <div className="mt-2.5">
                      {isCompleted ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStageClick(stage);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-[11px] font-semibold transition-all border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          View Results
                        </button>
                      ) : isActive ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onRunStage) onRunStage(stage.id);
                            else handleStageClick(stage);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
                        >
                          {status === 'running' ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Running Stage...
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5 fill-current" />
                              Run Stage
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStageClick(stage);
                          }}
                          className="w-full flex items-center justify-center gap-1 rounded-lg py-1 px-2 text-[10px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          Select Stage
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
